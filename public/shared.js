// ── Cookies & User ID ────────────────────────────────────────────────────────
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getUserId() {
  const key = 'pkmnrank_uid';
  let id = getCookie(key);
  if (!id) {
    id = crypto.randomUUID();
    setCookie(key, id, 365);
  }
  return id;
}

// ── Name helpers ──────────────────────────────────────────────────────────────
function parseName(p, allPokemon) {
  if (!p.isForm) return { base: p.name, form: null };
  const base = allPokemon.find(b => b.id === p.baseId);
  const baseName = base ? base.name : '';
  const formPart = p.name.startsWith(baseName)
    ? p.name.slice(baseName.length).replace(/^-/, '').replace(/-/g, ' ')
    : p.name.replace(/-/g, ' ');
  return { base: baseName || p.name, form: formPart || null };
}

function nameHTML(p, allPokemon, small = false) {
  const { base, form } = parseName(p, allPokemon);
  if (!form) return `<span class="poke-name${small ? ' poke-name-sm' : ''}">${base}</span>`;
  return `<span class="poke-name${small ? ' poke-name-sm' : ''}">${base} <span class="form-label">(${form})</span></span>`;
}

// ── Stat triangle ─────────────────────────────────────────────────────────────
const _TRI_ANGLES = [
  -Math.PI / 2,
  -Math.PI / 2 + (2 * Math.PI / 3),
  -Math.PI / 2 + (4 * Math.PI / 3),
];

// rowAlign: true shifts cy so equal padding appears above/below the triangle in a fixed-height row.
// false keeps centroid at canvas center (use when sprite fills the canvas area).
function drawStatTriangle(canvas, vals, rowAlign = true) {
  const size = canvas.width;
  const cx = size / 2;
  const r = size * 0.44;
  const cy = rowAlign ? size / 2 + r / 4 : size / 2;
  const verts = _TRI_ANGLES.map(a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  // Grid lines for each value 1–10
  for (let v = 1; v <= 10; v++) {
    const t = v / 10;
    const pts = verts.map(v => ({ x: cx + (v.x - cx) * t, y: cy + (v.y - cy) * t }));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.strokeStyle = v === 10 ? 'rgba(232,149,42,0.5)' : 'rgba(232,149,42,0.15)';
    ctx.lineWidth = v === 10 ? 1.5 : 1;
    ctx.stroke();
  }

  // Filled stat shape
  if (vals && vals.every(v => v != null)) {
    const pts = verts.map((v, i) => {
      const t = vals[i] / 10;
      return { x: cx + (v.x - cx) * t, y: cy + (v.y - cy) * t };
    });
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(232,149,42,0.30)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,149,42,0.90)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ── Sidebar nav ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const toggle   = document.getElementById('sidebar-toggle');
  const close    = document.getElementById('sidebar-close');

  function open()  { sidebar.classList.add('open');  overlay.classList.add('open'); }
  function shut()  { sidebar.classList.remove('open'); overlay.classList.remove('open'); }

  toggle.addEventListener('click', open);
  close.addEventListener('click', shut);
  overlay.addEventListener('click', shut);

  // Mark active link
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
});
