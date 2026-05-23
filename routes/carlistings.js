const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH    = path.join(__dirname, '../db/carlistings.json');
const PHOTOS_DIR = path.join(__dirname, '../db/car_photos');

// ── Helpers ──────────────────────────────────────────────────────

function loadListings() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { listings: {} }; }
}

function saveListings(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function photosDir(id) {
  const dir = path.join(PHOTOS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ── Routes ───────────────────────────────────────────────────────

// POST /api/car/listings — create
router.post('/listings', (req, res) => {
  const data = loadListings();
  const id = crypto.randomUUID();
  const editToken = crypto.randomUUID();
  const now = new Date().toISOString();

  data.listings[id] = {
    id, editToken, createdAt: now, updatedAt: now,
    year: '', make: '', model: '', trim: '',
    mileage: '', color: '', condition: '',
    transmission: '', fuelType: '', drivetrain: '',
    vin: '', location: '', price: '', negotiable: false,
    description: '',
    contactName: '', contactPhone: '', contactEmail: '',
    photos: [], active: true
  };

  saveListings(data);
  res.status(201).json({ id, editToken });
});

// GET /api/car/listings/:id — public view
router.get('/listings/:id', (req, res) => {
  const data = loadListings();
  const listing = data.listings[req.params.id];
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  const { editToken, ...pub } = listing;
  res.json(pub);
});

// PUT /api/car/listings/:id — update
router.put('/listings/:id', (req, res) => {
  const data = loadListings();
  const listing = data.listings[req.params.id];
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  if (req.headers['x-edit-token'] !== listing.editToken)
    return res.status(403).json({ error: 'Unauthorized' });

  const allowed = [
    'year', 'make', 'model', 'trim', 'mileage', 'color', 'condition',
    'transmission', 'fuelType', 'drivetrain', 'vin', 'location',
    'price', 'negotiable', 'description',
    'contactName', 'contactPhone', 'contactEmail', 'active'
  ];
  for (const f of allowed) { if (f in req.body) listing[f] = req.body[f]; }
  listing.updatedAt = new Date().toISOString();

  saveListings(data);
  const { editToken, ...pub } = listing;
  res.json(pub);
});

// POST /api/car/listings/:id/photos?token=xxx — upload photos as base64 JSON
// Body: { photos: [{ data: "<base64>", mimeType: "image/jpeg" }] }
router.post('/listings/:id/photos', express.json({ limit: '25mb' }), (req, res) => {
  const data = loadListings();
  const listing = data.listings[req.params.id];
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  if (req.query.token !== listing.editToken)
    return res.status(403).json({ error: 'Unauthorized' });

  if (listing.photos.length >= 20)
    return res.status(400).json({ error: 'Maximum 20 photos per listing' });

  const incoming = (req.body.photos || []).slice(0, 20 - listing.photos.length);
  if (!incoming.length) return res.status(400).json({ error: 'No photos provided' });

  const dir = photosDir(req.params.id);

  for (const photo of incoming) {
    if (!photo.data) continue;
    const ext = photo.mimeType === 'image/png' ? '.png' : '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    fs.writeFileSync(path.join(dir, filename), photo.data, 'base64');
    listing.photos.push(filename);
  }

  listing.updatedAt = new Date().toISOString();
  saveListings(data);
  res.json({ photos: listing.photos });
});

// DELETE /api/car/listings/:id/photos/:filename — remove a photo
router.delete('/listings/:id/photos/:filename', (req, res) => {
  const data = loadListings();
  const listing = data.listings[req.params.id];
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  if (req.headers['x-edit-token'] !== listing.editToken)
    return res.status(403).json({ error: 'Unauthorized' });

  const safe = path.basename(req.params.filename);
  listing.photos = listing.photos.filter(p => p !== safe);
  listing.updatedAt = new Date().toISOString();

  try { fs.unlinkSync(path.join(PHOTOS_DIR, req.params.id, safe)); } catch { /* ok */ }

  saveListings(data);
  res.json({ photos: listing.photos });
});

// GET /api/car/photos/:listingId/:filename — serve a photo
router.get('/photos/:listingId/:filename', (req, res) => {
  const safe = path.basename(req.params.filename);
  const filePath = path.join(PHOTOS_DIR, req.params.listingId, safe);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');

  const ext = path.extname(safe).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  res.set('Content-Type', mime);
  res.set('Cache-Control', 'public, max-age=31536000');
  res.send(fs.readFileSync(filePath));
});

module.exports = router;
