const API = {
  dogs: '/api/dogs',
  like: '/api/like',
  matches: id => `/api/matches/${id}`,
  seed: '/api/seed'
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const currentDogSelect = $('#currentDogSelect');
const dogsGrid = $('#dogsGrid');
const matchesEl = $('#matches');
const form = $('#dogForm');
const seedBtn = $('#seedBtn');
const searchInput = $('#search');

let dogs = [];
let currentDogId = localStorage.getItem('currentDogId') || '';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s/60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h/24);
  return `${d}d ago`;
}

async function api(url, options={}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

function renderDogOptions() {
  currentDogSelect.innerHTML = `<option value="">Select your profile…</option>` +
    dogs.map(d => `<option value="${d.id}" ${d.id===currentDogId?'selected':''}>${d.name} (${d.breed})</option>`).join('');
}

function renderDogs(filter='') {
  const term = filter.trim().toLowerCase();
  const list = term ? dogs.filter(d => d.name.toLowerCase().includes(term) || d.breed.toLowerCase().includes(term)) : dogs;
  dogsGrid.innerHTML = list.map(d => `
    <article class="card" data-id="${d.id}">
      <img src="${d.photo}" alt="${d.name} the ${d.breed}" />
      <div class="card-body">
        <div class="card-title">
          <h3>${d.name}</h3>
          <span class="badge">${d.breed}${d.age ? ' · ' + d.age + 'y' : ''}</span>
        </div>
        <p>${d.bio ? d.bio : ''}</p>
        <div class="card-actions">
          <button class="pass">Pass</button>
          <button class="like">Like ❤️</button>
        </div>
      </div>
    </article>
  `).join('');

  // attach actions
  $$('#dogsGrid .card').forEach(card => {
    const id = card.getAttribute('data-id');
    card.querySelector('.pass').addEventListener('click', () => card.remove());
    card.querySelector('.like').addEventListener('click', async () => {
      if (!currentDogId) return alert('Select your profile (top-right) first.');
      if (currentDogId === id) return alert("Nice try 😅 — you can't like yourself!");
      try {
        const result = await api(API.like, { method: 'POST', body: JSON.stringify({ fromId: currentDogId, toId: id }) });
        if (result.matched) {
          alert('🎉 It\'s a match! Check your Matches panel.');
          loadMatches();
        }
      } catch (e) {
        alert(e.message);
      }
    });
  });
}

function renderMatches(items=[]) {
  if (!currentDogId) { matchesEl.innerHTML = `<p class="hint">Select your profile to see matches.</p>`; return; }
  if (!items.length) { matchesEl.innerHTML = `<p class="hint">No matches yet. Start liking some dogs!</p>`; return; }
  matchesEl.innerHTML = items.map(m => `
    <div class="match">
      <img src="${m.with?.photo || ''}" alt="${m.with?.name || 'Dog'}" />
      <div>
        <div><strong>${m.with?.name || 'Unknown'}</strong> · <span class="badge">${m.with?.breed || ''}</span></div>
        <div class="time">Matched ${timeAgo(m.createdAt)}</div>
      </div>
      <a href="#chat" class="secondary button">Open Chat (todo)</a>
    </div>
  `).join('');
}

async function loadDogs() {
  dogs = await api(API.dogs);
  renderDogOptions();
  renderDogs(searchInput.value);
}
async function loadMatches() {
  if (!currentDogId) { renderMatches([]); return; }
  const matches = await api(API.matches(currentDogId));
  renderMatches(matches);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: $('#name').value.trim(),
    breed: $('#breed').value.trim(),
    age: $('#age').value.trim(),
    gender: $('#gender').value,
    photo: $('#photo').value.trim(),
    bio: $('#bio').value.trim(),
  };
  try {
    const dog = await api(API.dogs, { method: 'POST', body: JSON.stringify(payload) });
    currentDogId = dog.id;
    localStorage.setItem('currentDogId', currentDogId);
    form.reset();
    await loadDogs();
    await loadMatches();
    currentDogSelect.value = currentDogId;
    alert('Profile saved! You are now logged in as ' + dog.name + '.');
  } catch (err) {
    alert(err.message);
  }
});

currentDogSelect.addEventListener('change', () => {
  currentDogId = currentDogSelect.value;
  if (currentDogId) localStorage.setItem('currentDogId', currentDogId);
  loadMatches();
});

seedBtn.addEventListener('click', async () => {
  try {
    await api(API.seed, { method: 'POST' });
    await loadDogs();
  } catch (e) { alert(e.message); }
});

searchInput.addEventListener('input', () => renderDogs(searchInput.value));

// Initial load
loadDogs().then(loadMatches).catch(err => console.error(err));
