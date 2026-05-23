'use strict';

const STORAGE_KEY = 'car_listing_session';

let listingId = null;
let editToken = null;

// ── Storage ──────────────────────────────────────────────────────

function loadSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch { return null; }
}

function saveSession(id, token) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, token }));
}

// ── Init ─────────────────────────────────────────────────────────

async function init() {
  const session = loadSession();
  const urlId = new URLSearchParams(window.location.search).get('id');

  if (urlId && session && session.id === urlId) {
    await openListing(urlId, session.token);
    return;
  }

  if (session) {
    document.getElementById('resume-section').classList.remove('hidden');
    document.getElementById('resume-desc').textContent = session.id;
    document.getElementById('resume-btn').onclick = () => openListing(session.id, session.token);
  }

  document.getElementById('create-btn').onclick = createListing;
}

// ── Create ────────────────────────────────────────────────────────

async function createListing() {
  const btn = document.getElementById('create-btn');
  btn.disabled = true;
  btn.textContent = 'Creating…';

  try {
    const res = await fetch('/api/car/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error();
    const { id, editToken: token } = await res.json();
    saveSession(id, token);
    history.replaceState({}, '', `/carlisting.html?id=${id}`);
    await openListing(id, token);
  } catch {
    btn.disabled = false;
    btn.textContent = 'Create New Listing';
    showWelcomeError('Failed to create listing. Please try again.');
  }
}

// ── Open ──────────────────────────────────────────────────────────

async function openListing(id, token) {
  listingId = id;
  editToken = token;

  try {
    const res = await fetch(`/api/car/listings/${id}`);
    if (!res.ok) throw new Error();
    const listing = await res.json();

    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('manager').classList.remove('hidden');

    fillForm(listing);
    renderPhotos(listing.photos);
    setupQR(id);
    bindEvents();
  } catch {
    showWelcomeError('Listing not found. It may have been removed.');
  }
}

// ── Form ──────────────────────────────────────────────────────────

const TEXT_FIELDS = [
  'year', 'make', 'model', 'trim', 'mileage', 'color',
  'condition', 'transmission', 'fuelType', 'drivetrain',
  'vin', 'location', 'price', 'description',
  'contactName', 'contactPhone', 'contactEmail'
];

function fillForm(listing) {
  document.getElementById('listing-id-display').textContent = listing.id;
  for (const f of TEXT_FIELDS) {
    const el = document.getElementById(`f-${f}`);
    if (el) el.value = listing[f] ?? '';
  }
  document.getElementById('f-negotiable').checked = !!listing.negotiable;
  updateDescCount();

  const publicUrl = `${window.location.origin}/car/${listing.id}`;
  document.getElementById('public-url').value = publicUrl;
  document.getElementById('view-public-link').href = publicUrl;
}

function getFormData() {
  const data = {};
  for (const f of TEXT_FIELDS) {
    const el = document.getElementById(`f-${f}`);
    if (!el) continue;
    data[f] = (el.type === 'number' && el.value !== '') ? Number(el.value) : el.value;
  }
  data.negotiable = document.getElementById('f-negotiable').checked;
  return data;
}

// ── Save ──────────────────────────────────────────────────────────

async function save() {
  const saveBtns = [document.getElementById('save-btn'), document.getElementById('save-btn-2')];
  const status = document.getElementById('save-status');

  saveBtns.forEach(b => { b.disabled = true; });
  document.getElementById('save-btn').textContent = 'Saving…';
  status.className = 'save-status';
  status.textContent = '';

  try {
    const res = await fetch(`/api/car/listings/${listingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-edit-token': editToken },
      body: JSON.stringify(getFormData())
    });
    if (!res.ok) throw new Error();
    status.textContent = 'Saved successfully.';
    status.className = 'save-status save-ok';
    setTimeout(() => { status.textContent = ''; status.className = 'save-status'; }, 3000);
  } catch {
    status.textContent = 'Save failed. Please try again.';
    status.className = 'save-status save-err';
  } finally {
    document.getElementById('save-btn').textContent = 'Save Changes';
    saveBtns.forEach(b => { b.disabled = false; });
  }
}

// ── Photos ────────────────────────────────────────────────────────

function photoUrl(filename) {
  return `/api/car/photos/${listingId}/${filename}`;
}

function renderPhotos(photos) {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  photos.forEach((filename, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'photo-thumb' + (i === 0 ? ' photo-cover' : '');

    const img = document.createElement('img');
    img.src = photoUrl(filename);
    img.alt = `Photo ${i + 1}`;

    const del = document.createElement('button');
    del.className = 'photo-delete';
    del.textContent = '×';
    del.title = 'Remove photo';
    del.onclick = () => deletePhoto(filename);

    if (i === 0) {
      const badge = document.createElement('span');
      badge.className = 'cover-badge';
      badge.textContent = 'Cover';
      wrap.appendChild(badge);
    }

    wrap.appendChild(img);
    wrap.appendChild(del);
    grid.appendChild(wrap);
  });
}

async function deletePhoto(filename) {
  if (!confirm('Remove this photo?')) return;
  const res = await fetch(
    `/api/car/listings/${listingId}/photos/${encodeURIComponent(filename)}`,
    { method: 'DELETE', headers: { 'x-edit-token': editToken } }
  );
  if (res.ok) { const { photos } = await res.json(); renderPhotos(photos); }
}

// Compress a File to a base64 JPEG via canvas
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const MAX = 1280;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = reject;
    img.src = objUrl;
  });
}

async function uploadPhotos(files) {
  if (!files.length) return;

  const progress = document.getElementById('upload-progress');
  const bar = document.getElementById('upload-bar');
  const statusText = document.getElementById('upload-status-text');

  progress.classList.remove('hidden');
  bar.style.width = '10%';
  statusText.textContent = `Compressing ${files.length} photo${files.length > 1 ? 's' : ''}…`;

  try {
    const compressed = await Promise.all(files.map(compressImage));
    bar.style.width = '50%';
    statusText.textContent = 'Uploading…';

    const res = await fetch(
      `/api/car/listings/${listingId}/photos?token=${encodeURIComponent(editToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: compressed })
      }
    );

    bar.style.width = '100%';

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Upload failed' }));
      statusText.textContent = `Error: ${error}`;
      setTimeout(() => progress.classList.add('hidden'), 3000);
      return;
    }

    const { photos } = await res.json();
    renderPhotos(photos);
    statusText.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} uploaded!`;
    setTimeout(() => { progress.classList.add('hidden'); bar.style.width = '0%'; }, 2000);
  } catch (err) {
    statusText.textContent = 'Upload failed. Please try again.';
    setTimeout(() => progress.classList.add('hidden'), 3000);
  }
}

// ── QR Code ───────────────────────────────────────────────────────

function setupQR(id) {
  const container = document.getElementById('qr-code');
  container.innerHTML = '';
  new QRCode(container, {
    text: `${window.location.origin}/car/${id}`,
    width: 200, height: 200,
    colorDark: '#000000', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

function downloadQR() {
  const canvas = document.querySelector('#qr-code canvas');
  const img = document.querySelector('#qr-code img');
  let dataUrl;

  if (canvas) {
    dataUrl = canvas.toDataURL('image/png');
  } else if (img) {
    const tmp = document.createElement('canvas');
    tmp.width = 200; tmp.height = 200;
    tmp.getContext('2d').drawImage(img, 0, 0, 200, 200);
    dataUrl = tmp.toDataURL('image/png');
  } else { return; }

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `listing-qr-${listingId.slice(0, 8)}.png`;
  a.click();
}

// ── Events ────────────────────────────────────────────────────────

function bindEvents() {
  document.getElementById('save-btn').onclick = save;
  document.getElementById('save-btn-2').onclick = save;
  document.getElementById('qr-download-btn').onclick = downloadQR;

  document.getElementById('copy-url-btn').onclick = () => {
    const val = document.getElementById('public-url').value;
    navigator.clipboard.writeText(val).catch(() => {
      document.getElementById('public-url').select();
      document.execCommand('copy');
    });
    const btn = document.getElementById('copy-url-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
  };

  document.getElementById('f-description').oninput = updateDescCount;

  const photoInput = document.getElementById('photo-input');
  const uploadZone = document.getElementById('upload-zone');

  photoInput.onchange = e => {
    uploadPhotos([...e.target.files]);
    e.target.value = '';
  };

  uploadZone.ondragover = e => { e.preventDefault(); uploadZone.classList.add('drag-over'); };
  uploadZone.ondragleave = () => uploadZone.classList.remove('drag-over');
  uploadZone.ondrop = e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (files.length) uploadPhotos(files);
  };
}

function updateDescCount() {
  document.getElementById('desc-count').textContent =
    document.getElementById('f-description').value.length.toLocaleString();
}

function showWelcomeError(msg) {
  const card = document.querySelector('.welcome-card');
  let el = card.querySelector('.error-msg');
  if (!el) { el = document.createElement('p'); el.className = 'error-msg'; card.appendChild(el); }
  el.textContent = msg;
}

init();
