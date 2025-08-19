# DoggoMatch — Dogs Dating (Full-Stack)

A tiny, production-style demo of a dogs dating app built with:

- **Backend:** Node.js + Express, file-based JSON storage (no database required).
- **Frontend:** HTML, CSS, vanilla JavaScript using Fetch API.
- **Features:** Create profiles, browse dogs, like dogs, and get matches on mutual likes. Demo seed data included.

## Quick Start

1. **Download** this project zip or clone the folder.
2. Open a terminal in the project folder and run:
   ```bash
   npm install
   npm start
   ```
3. Visit **http://localhost:3000** in your browser.
4. (Optional) Click **"Load Demo Dogs"** to seed starter profiles.

## Project Structure

```
dogs-dating/
├── data/
│   └── db.json          # File-based storage
├── public/
│   ├── index.html       # UI
│   ├── styles.css       # Styles
│   └── app.js           # Frontend logic
├── package.json
└── server.js            # Express server + API
```

## API Overview

- `GET /api/dogs` — list all dog profiles.
- `POST /api/dogs` — create a dog profile.
  - body: `{ name, breed, age?, gender?, bio?, photo? }`
- `POST /api/like` — like a dog, returns `{ ok: true, matched: boolean }`.
  - body: `{ fromId, toId }`
- `GET /api/matches/:dogId` — list matches for a given dog.
- `POST /api/seed` — loads demo dogs (safe to call once).

## Notes

- This demo stores data in a local JSON file for simplicity. For real production, swap in a database (e.g., MongoDB, Postgres) and authentication.
- CORS is enabled but the server also serves the static frontend from `/public`.
- The UI is intentionally minimal but responsive and modern.
