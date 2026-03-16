const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const RATINGS_FILE = path.join(__dirname, '../db/ratings.json');

function loadRatings() {
  if (!fs.existsSync(RATINGS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(RATINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveRatings(data) {
  fs.writeFileSync(RATINGS_FILE, JSON.stringify(data, null, 2));
}

// GET /api/ratings/:userId
router.get('/ratings/:userId', (req, res) => {
  const all = loadRatings();
  res.json(all[req.params.userId] || {});
});

// POST /api/ratings/:userId
// Body: { pokemonId, battleAbility, appeal, iconicness }
router.post('/ratings/:userId', (req, res) => {
  const { pokemonId, battleAbility, appeal, iconicness } = req.body;

  if (!pokemonId || [battleAbility, appeal, iconicness].some(v => v === undefined)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const clamp = v => Math.min(10, Math.max(0, Math.round(Number(v) * 2) / 2));
  const rating = {
    battleAbility: clamp(battleAbility),
    appeal: clamp(appeal),
    iconicness: clamp(iconicness),
  };

  const all = loadRatings();
  if (!all[req.params.userId]) all[req.params.userId] = {};
  all[req.params.userId][pokemonId] = rating;
  saveRatings(all);

  res.json({ success: true, rating });
});

// GET /api/averages
router.get('/averages', (req, res) => {
  const all = loadRatings();
  const totals = {};
  const counts = {};

  for (const userRatings of Object.values(all)) {
    for (const [pokemonId, rating] of Object.entries(userRatings)) {
      if (!totals[pokemonId]) {
        totals[pokemonId] = { battleAbility: 0, appeal: 0, iconicness: 0 };
        counts[pokemonId] = 0;
      }
      totals[pokemonId].battleAbility += rating.battleAbility;
      totals[pokemonId].appeal += rating.appeal;
      totals[pokemonId].iconicness += rating.iconicness;
      counts[pokemonId]++;
    }
  }

  const averages = {};
  for (const [pokemonId, total] of Object.entries(totals)) {
    const count = counts[pokemonId];
    averages[pokemonId] = {
      battleAbility: +(total.battleAbility / count).toFixed(2),
      appeal: +(total.appeal / count).toFixed(2),
      iconicness: +(total.iconicness / count).toFixed(2),
      count,
    };
  }

  res.json(averages);
});

module.exports = router;
