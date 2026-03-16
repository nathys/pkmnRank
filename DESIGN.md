# pkmnRank — Design Document

## Overview
A publicly available web app where users rate every Pokémon across three criteria. Ratings are persisted via cookies so users can return and continue rating across sessions. Users can see their own ratings and global community averages, but not individual ratings from other users.

---

## Rating System
Each Pokémon is rated on a scale of **1–10** across three criteria:
- **Battle Ability** — How strong/viable the Pokémon is in battle
- **Appeal** — How visually or personality-wise appealing the Pokémon is
- **Iconicness** — How iconic or recognisable the Pokémon is in popular culture

---

## Pokémon List
- Maintained manually in a backend config/data file (e.g. `data/pokemon.json`)
- Currently populated with all Pokémon
- Designed to be easily edited to include a custom subset
- Each entry supports extensible metadata fields:
  - `id` — National Pokédex number
  - `name` — Pokémon name
  - `sprite` — URL to official sprite/image
  - `types` — Array of types (e.g. `["Fire", "Flying"]`)
  - `moves` — Array of learnable moves (optional, for future use)
  - Additional fields can be added without breaking existing functionality

---

## Frontend
- Single-page or multi-page web app served by Node.js
- Displays Pokémon one at a time or in a list with:
  - Official sprite image
  - Name
  - Type badges (displayed, more info expandable in future)
  - Three sliders or buttons for rating 1–10 on each criterion
- Users can rate Pokémon in any order
- Unrated Pokémon are clearly distinguished from rated ones
- Users can see their own submitted ratings and edit them
- A **global average** score for each criterion is displayed alongside personal ratings

---

## Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Data storage**:
  - Pokémon list: `data/pokemon.json` (manually maintained)
  - User ratings: stored server-side, keyed by a unique anonymous user ID
  - Global averages: computed from all stored ratings
- **API Endpoints**:
  - `GET /api/pokemon` — Returns the full Pokémon list with metadata
  - `GET /api/ratings/:userId` — Returns all ratings for a given user
  - `POST /api/ratings/:userId` — Submit or update a rating for a Pokémon
  - `GET /api/averages` — Returns global average scores per Pokémon

---

## User Identity & Persistence
- No accounts or login
- On first visit, a **UUID** is generated client-side and stored in a cookie
- That UUID is used as the user's anonymous identifier for all API calls
- Ratings are stored server-side against the UUID
- Returning users with the same cookie resume where they left off
- Cookie expiry: long-lived (e.g. 1 year)

---

## Project Structure
```
pkmnRank/
├── server.js           # Express server entry point
├── package.json
├── data/
│   └── pokemon.json    # Manually maintained Pokémon list
├── db/
│   └── ratings.json    # Persisted user ratings (flat file or SQLite)
├── routes/
│   ├── pokemon.js      # /api/pokemon route
│   └── ratings.js      # /api/ratings and /api/averages routes
└── public/
    ├── index.html      # Main page
    ├── app.js          # Frontend logic
    └── style.css       # Styling
```

---

## Tech Stack
| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Server framework | Express.js |
| Data storage | JSON flat file (MVP), migratable to SQLite |
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| Identity | UUID cookie (no auth) |
| Pokémon data | PokéAPI or pre-fetched JSON |

---

## Future Considerations
- Expand Pokémon metadata (moves, abilities, stats)
- Filter/sort by type, generation, or rating
- Leaderboard view sorted by global average per criterion
- Admin panel for managing the Pokémon list
- Migrate from flat-file storage to SQLite or PostgreSQL
