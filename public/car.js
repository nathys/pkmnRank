'use strict';

let photos = [];
let currentPhotoIndex = 0;
let listingId = null;

async function init() {
  listingId = window.location.pathname.split('/').filter(Boolean).pop();
  if (!listingId) return showError();

  try {
    const res = await fetch(`/api/car/listings/${listingId}`);
    if (!res.ok) return showError();
    renderListing(await res.json());
  } catch {
    showError();
  }
}

function renderListing(listing) {
  const titleParts = [listing.year, listing.make, listing.model, listing.trim].filter(Boolean);
  const title = titleParts.join(' ');

  document.title = title ? `${title} – For Sale` : 'Car For Sale';

  photos = listing.photos || [];

  // Gallery
  if (photos.length > 0) {
    renderGallery();
  } else {
    document.getElementById('gallery-wrap').style.display = 'none';
  }

  // Title
  document.getElementById('listing-title').textContent = title || 'Car For Sale';

  // Condition badge
  const condEl = document.getElementById('listing-condition');
  if (listing.condition) {
    condEl.textContent = listing.condition;
    condEl.className = `badge-condition badge-${listing.condition.toLowerCase()}`;
  }

  // Location
  if (listing.location) {
    document.getElementById('listing-location').textContent = '📍 ' + listing.location;
  }

  // Price
  const priceEl = document.getElementById('listing-price');
  if (listing.price) {
    priceEl.textContent = '$' + Number(listing.price).toLocaleString();
  } else {
    priceEl.textContent = 'Price on Request';
    priceEl.classList.add('price-tbd');
  }

  if (listing.negotiable) {
    document.getElementById('negotiable-badge').classList.remove('hidden');
  }

  // Specs
  renderSpecs(listing);

  // Description
  if (listing.description && listing.description.trim()) {
    document.getElementById('desc-section').classList.remove('hidden');
    document.getElementById('desc-text').textContent = listing.description;
  }

  // Contact
  if (listing.contactName || listing.contactPhone || listing.contactEmail) {
    document.getElementById('contact-section').classList.remove('hidden');
    renderContact(listing);
  }

  // Share QR
  const shareUrl = window.location.href;
  document.getElementById('share-url').value = shareUrl;
  new QRCode(document.getElementById('share-qr'), {
    text: shareUrl,
    width: 160,
    height: 160,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  document.getElementById('share-copy-btn').onclick = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    const btn = document.getElementById('share-copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000);
  };

  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('listing-view').classList.remove('hidden');
}

function renderGallery() {
  const mainImg    = document.getElementById('gallery-main-img');
  const thumbsEl   = document.getElementById('gallery-thumbs');
  const prevBtn    = document.getElementById('gallery-prev');
  const nextBtn    = document.getElementById('gallery-next');
  const totalEl    = document.getElementById('photo-total');
  const currentEl  = document.getElementById('photo-current');

  totalEl.textContent = photos.length;

  function showPhoto(i) {
    currentPhotoIndex = i;
    mainImg.src = `/api/car/photos/${listingId}/${photos[i]}`;
    currentEl.textContent = i + 1;
    document.querySelectorAll('.gallery-thumb').forEach((t, idx) => {
      t.classList.toggle('active', idx === i);
    });
    prevBtn.style.opacity = i === 0 ? '0.3' : '1';
    nextBtn.style.opacity = i === photos.length - 1 ? '0.3' : '1';
  }

  photos.forEach((filename, i) => {
    const thumb = document.createElement('img');
    thumb.className = 'gallery-thumb';
    thumb.src = `/api/car/photos/${listingId}/${filename}`;
    thumb.alt = `Photo ${i + 1}`;
    thumb.onclick = () => showPhoto(i);
    thumbsEl.appendChild(thumb);
  });

  prevBtn.onclick = () => { if (currentPhotoIndex > 0) showPhoto(currentPhotoIndex - 1); };
  nextBtn.onclick = () => { if (currentPhotoIndex < photos.length - 1) showPhoto(currentPhotoIndex + 1); };

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'  && currentPhotoIndex > 0)              showPhoto(currentPhotoIndex - 1);
    if (e.key === 'ArrowRight' && currentPhotoIndex < photos.length - 1) showPhoto(currentPhotoIndex + 1);
  });

  if (photos.length <= 1) {
    thumbsEl.style.display = 'none';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    document.querySelector('.gallery-counter').style.display = 'none';
  }

  showPhoto(0);
}

function renderSpecs(listing) {
  const grid = document.getElementById('specs-grid');
  const specs = [
    { label: 'Mileage',      value: listing.mileage      ? Number(listing.mileage).toLocaleString() + ' mi' : null },
    { label: 'Color',        value: listing.color        || null },
    { label: 'Transmission', value: listing.transmission || null },
    { label: 'Fuel Type',    value: listing.fuelType     || null },
    { label: 'Drivetrain',   value: listing.drivetrain   || null },
    { label: 'VIN',          value: listing.vin          || null },
  ].filter(s => s.value);

  specs.forEach(({ label, value }) => {
    const item = document.createElement('div');
    item.className = 'spec-item';
    item.innerHTML = `<span class="spec-label">${label}</span><span class="spec-value">${value}</span>`;
    grid.appendChild(item);
  });
}

function renderContact(listing) {
  if (listing.contactName) {
    document.getElementById('contact-name').textContent = listing.contactName;
    document.getElementById('contact-avatar').textContent = listing.contactName.charAt(0).toUpperCase();
  }

  const actions = document.getElementById('contact-actions');
  const subject = encodeURIComponent(
    'Inquiry: ' + [listing.year, listing.make, listing.model].filter(Boolean).join(' ')
  );

  if (listing.contactPhone) {
    const call = document.createElement('a');
    call.href = `tel:${listing.contactPhone}`;
    call.className = 'contact-btn contact-call';
    call.textContent = '📞 Call';
    actions.appendChild(call);

    const sms = document.createElement('a');
    sms.href = `sms:${listing.contactPhone}`;
    sms.className = 'contact-btn contact-text';
    sms.textContent = '💬 Text';
    actions.appendChild(sms);
  }

  if (listing.contactEmail) {
    const email = document.createElement('a');
    email.href = `mailto:${listing.contactEmail}?subject=${subject}`;
    email.className = 'contact-btn contact-email';
    email.textContent = '✉️ Email';
    actions.appendChild(email);
  }
}

function showError() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('error-screen').classList.remove('hidden');
}

init();
