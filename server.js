
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Simple file "database"
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ dogs: [], likes: [], matches: [] }, null, 2));
}

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// API: list dogs
app.get('/api/dogs', (req, res) => {
  const db = loadDB();
  res.json(db.dogs);
});

// API: get dog by id
app.get('/api/dogs/:id', (req, res) => {
  const db = loadDB();
  const dog = db.dogs.find(d => d.id === req.params.id);
  if (!dog) return res.status(404).json({ error: 'Dog not found' });
  res.json(dog);
});

// API: create dog
app.post('/api/dogs', (req, res) => {
  const { name, breed, age, gender, bio, photo } = req.body || {};
  if (!name || !breed) {
    return res.status(400).json({ error: 'name and breed are required' });
  }
  const dog = {
    id: nanoid(8),
    name,
    breed,
    age: Number(age) || null,
    gender: gender || 'Unknown',
    bio: bio || '',
    photo: photo || `https://placehold.co/600x400?text=${encodeURIComponent(name)}`,
    createdAt: Date.now()
  };
  const db = loadDB();
  db.dogs.push(dog);
  saveDB(db);
  res.status(201).json(dog);
});

// API: like a dog
// body: { fromId, toId }
app.post('/api/like', (req, res) => {
  const { fromId, toId } = req.body || {};
  if (!fromId || !toId) return res.status(400).json({ error: 'fromId and toId are required' });
  if (fromId === toId) return res.status(400).json({ error: 'Cannot like yourself' });

  const db = loadDB();
  const fromDog = db.dogs.find(d => d.id === fromId);
  const toDog = db.dogs.find(d => d.id === toId);
  if (!fromDog || !toDog) return res.status(404).json({ error: 'Dog(s) not found' });

  // prevent duplicate likes
  const existing = db.likes.find(l => l.fromId === fromId && l.toId === toId);
  if (!existing) {
    db.likes.push({ id: nanoid(10), fromId, toId, createdAt: Date.now() });
  }

  // Check for match (reciprocal like)
  const reciprocal = db.likes.find(l => l.fromId === toId && l.toId === fromId);
  let matched = false;
  if (reciprocal) {
    // if a match doesn't exist yet, create one
    const already = db.matches.find(m =>
      (m.aId === fromId && m.bId === toId) || (m.aId === toId && m.bId === fromId)
    );
    if (!already) {
      db.matches.push({ id: nanoid(10), aId: fromId, bId: toId, createdAt: Date.now() });
    }
    matched = true;
  }

  saveDB(db);
  res.json({ ok: true, matched });
});

// API: list matches for a dog
app.get('/api/matches/:dogId', (req, res) => {
  const dogId = req.params.dogId;
  const db = loadDB();
  const matches = db.matches
    .filter(m => m.aId === dogId || m.bId === dogId)
    .map(m => {
      const otherId = m.aId === dogId ? m.bId : m.aId;
      const other = db.dogs.find(d => d.id === otherId);
      return { id: m.id, with: other, createdAt: m.createdAt };
    });
  res.json(matches);
});

// Demo seed route (optional)
app.post('/api/seed', (req, res) => {
  const db = loadDB();
  if (db.dogs.length > 0) return res.json({ ok: true, note: 'Already seeded or has data' });
  const seed = [
    { name: 'Buddy', breed: 'Labrador', age: 3, gender: 'Male', bio: 'Ball chaser. Treat enthusiast.', photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=1200&auto=format&fit=crop' },
    { name: 'Luna', breed: 'Husky', age: 2, gender: 'Female', bio: 'Howls at the moon. Loves snow.', photo: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?q=80&w=1200&auto=format&fit=crop' },
    { name: 'Max', breed: 'Beagle', age: 4, gender: 'Male', bio: 'Sniffer-in-chief.', photo: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop' },
    { name: 'Daisy', breed: 'Corgi', age: 1, gender: 'Female', bio: 'Short legs, big heart.', photo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop' }
  ];
  seed.forEach(s => db.dogs.push({ id: nanoid(8), ...s, createdAt: Date.now() }));
  saveDB(db);
  res.json({ ok: true, added: seed.length });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Dogs Dating server running at http://localhost:${PORT}`);
});
