// ═══════════════════════════════════════════════════════════
// js/bikes.js — Load & Render Bikes from Firestore
// ═══════════════════════════════════════════════════════════
//
// Firestore collection: "bikes"
// Each document has: { name, category, pricePerDay, imageURL, available, specs }
//
// This file:
//   - Seeds demo bikes if the DB is empty (for quick setup)
//   - Renders bike cards on index.html (featured) and bikes.html (all)
//   - Handles filtering and sorting on bikes.html
// ═══════════════════════════════════════════════════════════

import { db } from "./firebase.js";
import {
  collection, getDocs, doc, setDoc, query, orderBy, limit, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── Demo seed data (runs only if 'bikes' collection is empty) ─
const DEMO_BIKES = [
  {
    id: 'bike001',
    name: 'Urban Glide X1',
    category: 'city',
    pricePerDay: 299,
    available: true,
    imageURL: '',
    emoji: '🚲',
    specs: { gears: '7-Speed', weight: '12kg', frame: 'Aluminium' },
    description: 'Perfect city commuter with lightweight frame and smooth gear shifts.'
  },
  {
    id: 'bike002',
    name: 'Trail Blazer MTB',
    category: 'mountain',
    pricePerDay: 599,
    available: true,
    imageURL: '',
    emoji: '🏔️',
    specs: { gears: '21-Speed', weight: '14kg', frame: 'Steel' },
    description: 'Conquer any trail with full suspension and grippy tires.'
  },
  {
    id: 'bike003',
    name: 'Volt E-Cruiser',
    category: 'electric',
    pricePerDay: 999,
    available: true,
    imageURL: '',
    emoji: '⚡',
    specs: { gears: 'Auto', weight: '22kg', range: '80km' },
    description: 'Go further with pedal assist. 80km range on a single charge.'
  },
  {
    id: 'bike004',
    name: 'City Sport Pro',
    category: 'hybrid',
    pricePerDay: 449,
    available: true,
    imageURL: '',
    emoji: '🚴',
    specs: { gears: '21-Speed', weight: '11kg', frame: 'Carbon Mix' },
    description: 'Hybrid efficiency for mixed terrain — city roads to light trails.'
  },
  {
    id: 'bike005',
    name: 'Heritage Classic',
    category: 'city',
    pricePerDay: 199,
    available: true,
    imageURL: '',
    emoji: '🎩',
    specs: { gears: '3-Speed', weight: '13kg', frame: 'Steel' },
    description: 'Timeless retro design with a comfortable upright riding position.'
  },
  {
    id: 'bike006',
    name: 'Summit King 29',
    category: 'mountain',
    pricePerDay: 799,
    available: false,
    imageURL: '',
    emoji: '🏁',
    specs: { gears: '27-Speed', weight: '13kg', frame: 'Aluminium' },
    description: 'Pro-grade mountain bike with hydraulic disc brakes and 29" wheels.'
  },
];

// ─── Seed DB if empty ─────────────────────────────────────────
async function seedBikesIfEmpty() {
  const snap = await getDocs(query(collection(db, 'bikes'), limit(1)));
  if (!snap.empty) return; // Already has data

  console.log('🌱 Seeding demo bikes into Firestore...');
  for (const bike of DEMO_BIKES) {
    const { id, ...data } = bike;
    await setDoc(doc(db, 'bikes', id), data);
  }
  console.log('✅ Demo bikes seeded!');
}

// ─── Build a bike card HTML string ───────────────────────────
function buildBikeCard(bikeId, bike) {
  const available = bike.available !== false;
  const statusBadge = available
    ? `<span class="bike-status-badge badge-available">Available</span>`
    : `<span class="bike-status-badge badge-unavailable">Unavailable</span>`;

  // Image or emoji placeholder
  const imgContent = bike.imageURL
    ? `<img src="${bike.imageURL}" alt="${bike.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
       <div class="bike-card-img-placeholder" style="display:none;">${bike.emoji || '🚲'}</div>`
    : `<div class="bike-card-img-placeholder">${bike.emoji || '🚲'}</div>`;

  // Specs tags
  const specs = bike.specs || {};
  const specTags = Object.entries(specs)
    .map(([k, v]) => `<span class="bike-spec">• ${v} ${k}</span>`)
    .join('');

  const rentDisabled = !available ? 'disabled title="Currently unavailable"' : '';

  return `
    <div class="bike-card" data-id="${bikeId}" data-category="${bike.category || ''}" data-price="${bike.pricePerDay}">
      <div class="bike-card-img">
        ${imgContent}
        ${statusBadge}
      </div>
      <div class="bike-card-body">
        <p class="bike-category">${bike.category || 'Bike'}</p>
        <h3 class="bike-name">${bike.name}</h3>
        <div class="bike-specs">${specTags}</div>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem; line-height:1.5;">
          ${bike.description || ''}
        </p>
        <div class="bike-card-footer">
          <div class="bike-price">
            <span class="bike-price-val">₹${bike.pricePerDay}</span>
            <span class="bike-price-label">/day</span>
          </div>
          <button
            class="btn btn-accent rent-btn"
            data-id="${bikeId}"
            data-name="${bike.name}"
            data-price="${bike.pricePerDay}"
            data-available="${available}"
            onclick="window.openBookingModal && window.openBookingModal('${bikeId}', '${bike.name}', ${bike.pricePerDay}, ${available})"
            ${rentDisabled}
          >
            ${available ? '→ Rent Now' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── Load Featured Bikes (homepage — max 3) ───────────────────
async function loadFeaturedBikes() {
  const container = document.getElementById('featuredBikes');
  if (!container) return;

  try {
    await seedBikesIfEmpty();
    const snap = await getDocs(
      query(collection(db, 'bikes'), where('available', '==', true), limit(3))
    );

    if (snap.empty) {
      container.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding:2rem;">No bikes available right now.</p>`;
      return;
    }

    let html = '';
    snap.forEach(d => { html += buildBikeCard(d.id, d.data()); });
    container.innerHTML = html;

    // Stagger animation
    container.querySelectorAll('.bike-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 0.1}s`;
    });

  } catch (err) {
    console.error('Featured bikes error:', err);
    container.innerHTML = `<p style="color:var(--danger); grid-column:1/-1; text-align:center;">Failed to load bikes. Check your Firebase config.</p>`;
  }
}

// ─── Load All Bikes (bikes.html with filtering) ───────────────
let allBikes = []; // Cache for client-side filtering

async function loadAllBikes() {
  const container = document.getElementById('bikesGrid');
  if (!container) return;

  try {
    await seedBikesIfEmpty();
    const snap = await getDocs(query(collection(db, 'bikes'), orderBy('name')));

    allBikes = [];
    snap.forEach(d => allBikes.push({ id: d.id, ...d.data() }));

    renderFilteredBikes(allBikes);
    setupFilters();

  } catch (err) {
    console.error('Bikes load error:', err);
    container.innerHTML = `<p style="color:var(--danger); grid-column:1/-1; text-align:center; padding:2rem;">Failed to load bikes. Check your Firebase config.</p>`;
  }
}

// ─── Render bikes array into the grid ────────────────────────
function renderFilteredBikes(bikes) {
  const container = document.getElementById('bikesGrid');
  const count     = document.getElementById('bikesCount');
  const noResults = document.getElementById('noResults');
  if (!container) return;

  if (bikes.length === 0) {
    container.innerHTML = '';
    if (noResults) noResults.style.display = 'block';
    if (count) count.textContent = '0 bikes found';
    return;
  }

  if (noResults) noResults.style.display = 'none';
  if (count) count.textContent = `${bikes.length} bike${bikes.length !== 1 ? 's' : ''} found`;

  container.innerHTML = bikes.map(b => buildBikeCard(b.id, b)).join('');

  // Stagger animation
  container.querySelectorAll('.bike-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.07}s`;
  });
}

// ─── Setup filter event listeners ────────────────────────────
function setupFilters() {
  const searchInput    = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const priceFilter    = document.getElementById('priceFilter');
  const sortFilter     = document.getElementById('sortFilter');

  function applyFilters() {
    let filtered = [...allBikes];
    const search   = searchInput?.value.toLowerCase()  || '';
    const category = categoryFilter?.value || 'all';
    const maxPrice = priceFilter?.value    || 'all';
    const sort     = sortFilter?.value     || 'default';

    // Search
    if (search) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(search) ||
        (b.category || '').toLowerCase().includes(search) ||
        (b.description || '').toLowerCase().includes(search)
      );
    }

    // Category
    if (category !== 'all') {
      filtered = filtered.filter(b => b.category === category);
    }

    // Max price
    if (maxPrice !== 'all') {
      filtered = filtered.filter(b => b.pricePerDay <= parseInt(maxPrice));
    }

    // Sort
    if (sort === 'price-asc')  filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sort === 'price-desc') filtered.sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (sort === 'name')       filtered.sort((a, b) => a.name.localeCompare(b.name));

    renderFilteredBikes(filtered);
  }

  searchInput?.addEventListener('input',  applyFilters);
  categoryFilter?.addEventListener('change', applyFilters);
  priceFilter?.addEventListener('change',    applyFilters);
  sortFilter?.addEventListener('change',     applyFilters);
}

// ─── Initialise based on current page ────────────────────────
const page = window.location.pathname;
if (page.includes('index.html') || page === '/' || page.endsWith('/')) {
  loadFeaturedBikes();
}
if (page.includes('bikes.html')) {
  loadAllBikes();
}

export { loadFeaturedBikes, loadAllBikes };
