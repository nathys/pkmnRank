# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start the development server
node server.js

# Fetch/refresh Pokémon data from PokéAPI
node scripts/fetchPokemon.js
node scripts/fetchForms.js

# Rebuild Wolfe's rankings JSON from markdown source
node scripts/buildWolfeData.js
```

There are no build, lint, or test scripts — this is a vanilla Node.js + Express project with no transpilation step.

## Architecture

**Stack:** Node.js + Express (backend) / vanilla HTML+CSS+JS (frontend) / JSON flat files (storage).

**Server** (`server.js`) mounts two route files and serves `public/` as static files. Routes live in `routes/pokemon.js` (Pokémon data) and `routes/ratings.js` (user ratings + global averages).

**Data flow:**
- `data/pokemon.json` is the master Pokémon list (populated by fetch scripts); a copy lives at `public/data/pokemon.json` served to the frontend.
- `db/ratings.json` stores all user ratings: `{ [userId]: { [pokemonId]: { battleAbility, appeal, iconicness } } }`.
- User identity is anonymous UUID stored in a cookie (`pkmnrank_uid`).

**Frontend pages** (`public/`):
- `rate.html` — one-at-a-time rating interface with sliders
- `index.html` — user's personal ratings grid with filters/search
- `global.html` — community averages with pyramid visualization
- `wolfe.html` — special guest (Wolfe) rankings view

**Shared frontend code** (`public/shared.js`) handles: cookie/UUID management, name formatting, and the stat triangle canvas visualization (used on multiple pages).

**Deployment:** Configured for Cloudflare Pages via `wrangler.toml`. A `schema.sql` exists for a planned migration from flat-file JSON to Cloudflare D1 (SQLite).

## Key details

- Ratings are stored on a 0–10 scale, clamped to 0.5 increments server-side.
- Alternate Pokémon forms (Mega Evolutions, regional variants) have `isForm: true` and a `baseId` field in the Pokémon data.
- `wolfe-ranked-list.md` is the human-readable source for Wolfe's rankings; `scripts/buildWolfeData.js` converts it to `public/data/wolfe-rankings.json`.
- `public/shared.js` exports a `drawStatTriangle(canvas, stats)` function used by multiple pages for the canvas-based stat visualization.
- Be direct and concise with your language, no pleasantries
- Your code will be reviewed by Github Copilot, make sure it is commented and has minimal code reuse
- When inferring information, cite sources or ask for clarification before proceeding
