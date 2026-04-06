// ═══════════════════════════════════════════════════════════
// js/booking.js — Booking Modal + Firestore Booking Logic + Dashboard
// ═══════════════════════════════════════════════════════════
//
// Firestore collection: "bookings"
// Each document: { userId, bikeId, bikeName, startDate, endDate,
//                  totalDays, totalPrice, status, createdAt }
//
// Status flow: 'confirmed' → 'active' → 'completed'
// ═══════════════════════════════════════════════════════════

import { db, auth } from "./firebase.js";
import {
  collection, addDoc, getDocs, query, where,
  orderBy, serverTimestamp, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─── Current booking state ────────────────────────────────────
let currentBike = { id: '', name: '', price: 0 };

// ═══ BOOKING MODAL ═══════════════════════════════════════════

// Open the booking modal (called from bikes.js rent button via window.openBookingModal)
window.openBookingModal = function(bikeId, bikeName, pricePerDay, available) {
  if (!available) return;

  // Check if user is logged in
  const user = auth.currentUser;
  if (!user) {
    alert('Please log in to book a bike.');
    window.location.href = 'login.html';
    return;
  }

  // Store current bike data
  currentBike = { id: bikeId, name: bikeName, price: pricePerDay };

  // Populate modal header
  const modalBikeInfo = document.getElementById('modalBikeInfo');
  if (modalBikeInfo) {
    modalBikeInfo.innerHTML = `
      <p class="bike-category">Book This Bike</p>
      <h3 class="modal-bike-name">${bikeName}</h3>
      <p class="modal-bike-price">Price: <span>₹${pricePerDay}</span> per day</p>
    `;
  }

  // Reset form
  const form = document.getElementById('bookingForm');
  if (form) form.reset();
  hideSummary();
  hideMessage('bookingMessage');

  // Show modal
  const modal = document.getElementById('bookingModal');
  if (modal) modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

// Close modal
function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Close on overlay click or X button
document.getElementById('modalClose')?.addEventListener('click', closeBookingModal);
document.getElementById('bookingModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeBookingModal();
});

// ─── Date change → calculate cost summary ─────────────────────
function updateSummary() {
  const startVal = document.getElementById('startDate')?.value;
  const endVal   = document.getElementById('endDate')?.value;

  if (!startVal || !endVal) { hideSummary(); return; }

  const start = new Date(startVal);
  const end   = new Date(endVal);
  const days  = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    hideSummary();
    showBookingMessage('End date must be after start date.', 'error');
    return;
  }

  hideMessage('bookingMessage');
  const total = days * currentBike.price;

  document.getElementById('summaryDays').textContent  = `${days} day${days > 1 ? 's' : ''}`;
  document.getElementById('summaryPrice').textContent = `₹${currentBike.price}`;
  document.getElementById('summaryTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
  document.getElementById('bookingSummary').style.display = 'block';
}

document.getElementById('startDate')?.addEventListener('change', () => {
  // Ensure end date >= start date
  const start = document.getElementById('startDate')?.value;
  const endInput = document.getElementById('endDate');
  if (endInput && start) endInput.min = start;
  updateSummary();
});
document.getElementById('endDate')?.addEventListener('change', updateSummary);

function hideSummary() {
  const el = document.getElementById('bookingSummary');
  if (el) el.style.display = 'none';
}

// ─── Submit Booking ───────────────────────────────────────────
document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    showBookingMessage('You must be logged in to book.', 'error');
    return;
  }

  const startVal = document.getElementById('startDate')?.value;
  const endVal   = document.getElementById('endDate')?.value;

  if (!startVal || !endVal) {
    showBookingMessage('Please select both start and end dates.', 'error');
    return;
  }

  const start = new Date(startVal);
  const end   = new Date(endVal);
  const days  = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    showBookingMessage('End date must be after start date.', 'error');
    return;
  }

  // Loading state
  const btn     = document.getElementById('bookingBtn');
  const btnText = document.getElementById('bookingBtnText');
  const spinner = document.getElementById('bookingSpinner');
  if (btn) btn.disabled = true;
  if (btnText)  btnText.style.display  = 'none';
  if (spinner)  spinner.style.display  = 'inline-block';

  try {
    // Create booking document in Firestore
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      userId:     user.uid,
      userEmail:  user.email,
      userName:   user.displayName || user.email,
      bikeId:     currentBike.id,
      bikeName:   currentBike.name,
      startDate:  startVal,              // ISO date string "YYYY-MM-DD"
      endDate:    endVal,
      totalDays:  days,
      pricePerDay: currentBike.price,
      totalPrice: days * currentBike.price,
      status:     'confirmed',           // confirmed → active → completed
      createdAt:  serverTimestamp()
    });

    console.log('✅ Booking created:', bookingRef.id);

    showBookingMessage(`🎉 Booking confirmed! Booking ID: ${bookingRef.id.slice(0,8).toUpperCase()}`, 'success');

    // Close modal & redirect after short delay
    setTimeout(() => {
      closeBookingModal();
      window.location.href = 'dashboard.html';
    }, 2000);

  } catch (err) {
    console.error('Booking error:', err);
    showBookingMessage('Booking failed: ' + err.message, 'error');
    if (btn) btn.disabled = false;
    if (btnText)  btnText.style.display  = 'inline';
    if (spinner)  spinner.style.display  = 'none';
  }
});

// ─── Booking message helpers ──────────────────────────────────
function showBookingMessage(text, type) {
  const el = document.getElementById('bookingMessage');
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${type}`;
  el.style.display = 'block';
}
function hideMessage(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ═══ DASHBOARD — LOAD USER'S BOOKINGS ════════════════════════
async function loadUserBookings(userId) {
  const listEl        = document.getElementById('bookingsList');
  const noBookingsEl  = document.getElementById('noBookings');
  if (!listEl) return;

  try {
    const snap = await getDocs(
      query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
    );

    if (snap.empty) {
      listEl.innerHTML = '';
      if (noBookingsEl) noBookingsEl.style.display = 'block';
      updateDashStats({ total: 0, active: 0, upcoming: 0, completed: 0 });
      return;
    }

    if (noBookingsEl) noBookingsEl.style.display = 'none';

    let html = '';
    const stats = { total: 0, active: 0, upcoming: 0, completed: 0 };
    const today = new Date().toISOString().split('T')[0];

    snap.forEach(d => {
      const b = d.data();
      stats.total++;

      // Derive status from dates if still 'confirmed'
      let displayStatus = b.status;
      if (b.status === 'confirmed') {
        if (b.startDate <= today && b.endDate >= today) {
          displayStatus = 'active';
          stats.active++;
        } else if (b.startDate > today) {
          stats.upcoming++;
        }
      } else if (b.status === 'completed') {
        stats.completed++;
      }

      const statusClass = `status-${displayStatus}`;
      const icon = {
        active: '🟢', confirmed: '✅', completed: '🏁', cancelled: '❌', pending: '⏳'
      }[displayStatus] || '📋';

      html += `
        <div class="booking-item">
          <div class="booking-icon">${icon}</div>
          <div class="booking-main">
            <div class="booking-bike-name">${b.bikeName || 'Unknown Bike'}</div>
            <div class="booking-dates">
              📅 ${formatDate(b.startDate)} → ${formatDate(b.endDate)}
              &nbsp;·&nbsp; ${b.totalDays} day${b.totalDays !== 1 ? 's' : ''}
            </div>
          </div>
          <div class="booking-right">
            <div class="booking-status ${statusClass}">${displayStatus}</div>
            <div class="booking-price">₹${(b.totalPrice || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
    updateDashStats(stats);

  } catch (err) {
    console.error('Load bookings error:', err);
    if (listEl) listEl.innerHTML = `<p style="color:var(--danger); padding:1rem;">Failed to load bookings.</p>`;
  }
}

// ─── Update dashboard stat numbers ───────────────────────────
function updateDashStats(stats) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set('totalBookings',     stats.total);
  set('activeBookings',    stats.active);
  set('upcomingBookings',  stats.upcoming);
  set('completedBookings', stats.completed);
}

// ─── Format date "2025-07-15" → "15 Jul 2025" ────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Listen for auth on dashboard page ───────────────────────
const isDashboard = window.location.pathname.includes('dashboard.html');
if (isDashboard) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadUserBookings(user.uid);
    }
  });
}
