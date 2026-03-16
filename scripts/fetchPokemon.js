// Run once to populate data/pokemon.json from PokéAPI
// Usage: node scripts/fetchPokemon.js

const fs = require('fs');
const path = require('path');
const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchAll() {
  console.log('Fetching Pokémon list...');
  const list = await get('https://pokeapi.co/api/v2/pokemon?limit=1025');

  const pokemon = [];
  let i = 1;

  for (const entry of list.results) {
    process.stdout.write(`\rFetching ${i}/${list.results.length}: ${entry.name}    `);
    try {
      const data = await get(entry.url);
      const speciesData = await get(data.species.url);

      pokemon.push({
        id: data.id,
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        types: data.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)),
        generation: speciesData.generation.name,
        moves: [], // populate later if needed
      });
    } catch (err) {
      console.error(`\nFailed to fetch ${entry.name}: ${err.message}`);
    }
    i++;
  }

  const outPath = path.join(__dirname, '../data/pokemon.json');
  fs.writeFileSync(outPath, JSON.stringify(pokemon, null, 2));
  console.log(`\nDone! Saved ${pokemon.length} Pokémon to data/pokemon.json`);
}

fetchAll();
