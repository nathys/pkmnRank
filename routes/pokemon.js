const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const POKEMON_FILE = path.join(__dirname, '../data/pokemon.json');

router.get('/', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(POKEMON_FILE, 'utf8'));
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to load Pokémon data' });
  }
});

module.exports = router;
