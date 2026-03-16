// Fetches alternate forms (regional variants, megas, gmax, etc.) and appends
// them to data/pokemon.json. Safe to re-run — existing entries are not duplicated.
// Usage: node scripts/fetchForms.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const POKEMON_FILE = path.join(__dirname, '../data/pokemon.json');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function formatName(raw) {
  return raw
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

async function fetchForms() {
  const pokemon = JSON.parse(fs.readFileSync(POKEMON_FILE, 'utf8'));
  const existingIds = new Set(pokemon.map(p => p.id));

  let added = 0;
  let i = 1;

  for (const base of pokemon.slice()) { // iterate over original list only
    process.stdout.write(`\rChecking ${i}/${pokemon.length}: ${base.name}    `);
    i++;

    let species;
    try {
      species = await get(`https://pokeapi.co/api/v2/pokemon-species/${base.id}`);
    } catch {
      continue;
    }

    const nonDefault = species.varieties.filter(v => !v.is_default);

    for (const variety of nonDefault) {
      let data;
      try {
        data = await get(variety.pokemon.url);
      } catch {
        continue;
      }

      if (existingIds.has(data.id)) continue;

      existingIds.add(data.id);
      pokemon.push({
        id: data.id,
        name: formatName(data.name),
        sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        types: data.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)),
        generation: base.generation,
        baseId: base.id,
        isForm: true,
        moves: [],
      });
      added++;
    }
  }

  // Sort: base Pokémon by id, forms after their base
  pokemon.sort((a, b) => {
    const aBase = a.baseId ?? a.id;
    const bBase = b.baseId ?? b.id;
    if (aBase !== bBase) return aBase - bBase;
    // base form first (no baseId), then forms by id
    if (!a.baseId && b.baseId) return -1;
    if (a.baseId && !b.baseId) return 1;
    return a.id - b.id;
  });

  fs.writeFileSync(POKEMON_FILE, JSON.stringify(pokemon, null, 2));
  console.log(`\nDone! Added ${added} forms. Total: ${pokemon.length} entries.`);
}

fetchForms();
