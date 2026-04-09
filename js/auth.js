// ═══════════════════════════════════════════════════════════
// js/auth.js — Authentication: Register, Login, Logout, Session
// ═══════════════════════════════════════════════════════════

import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── Utility: show message in form ──────────────────────────
function showMessage(id, text, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${type}`;
  el.style.display = 'block';
  // Auto-hide success after 4s
  if (type === 'success') setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ─── Utility: toggle loading state on button ────────────────
function setLoading(btnId, textId, spinnerId, loading) {
  const btn = document.getElementById(btnId);
  const txt = document.getElementById(textId);
  const spin = document.getElementById(spinnerId);
  if (!btn) return;
  btn.disabled = loading;
  if (txt)  txt.style.display  = loading ? 'none' : 'inline';
  if (spin) spin.style.display = loading ? 'inline-block' : 'none';
}

// ─── Update Navbar based on auth state ──────────────────────
function updateNavbar(user) {
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  if (user) {
    // Show user name + logout button
    const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
    navAuth.innerHTML = `
      <span class="nav-user-badge">${initial}</span>
      <a href="dashboard.html" class="btn btn-ghost">Dashboard</a>
      <button class="btn btn-outline" id="logoutBtn">Logout</button>
    `;
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  } else {
    navAuth.innerHTML = `
      <a href="login.html" class="btn btn-ghost">Login</a>
      <a href="register.html" class="btn btn-accent">Get Started</a>
    `;
  }
}

// ─── Handle Logout ───────────────────────────────────────────
async function handleLogout() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// ═══ REGISTER FORM ══════════════════════════════════════════
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name     = document.getElementById('name')?.value.trim();
    const phone    = document.getElementById('phone')?.value.trim();
    const email    = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirm  = document.getElementById('confirmPassword')?.value;
    const terms    = document.getElementById('agreeTerms')?.checked;

    // Client-side validation
    if (!name)           return showMessage('formMessage', 'Please enter your full name.');
    if (!email)          return showMessage('formMessage', 'Please enter a valid email.');
    if (password.length < 6) return showMessage('formMessage', 'Password must be at least 6 characters.');
    if (password !== confirm) return showMessage('formMessage', 'Passwords do not match.');
    if (!terms)          return showMessage('formMessage', 'Please agree to our Terms of Service.');

    setLoading('registerBtn', 'registerBtnText', 'registerSpinner', true);

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Set display name in Auth
      await updateProfile(user, { displayName: name });

      // 3. Create user document in Firestore (collection: "users")
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        phone: phone || '',
        uid: user.uid,
        role: 'user',        // 'admin' for admins
        createdAt: serverTimestamp()
      });

      showMessage('formMessage', '✅ Account created! Redirecting...', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);

    } catch (err) {
      console.error('Register error:', err);
      const messages = {
        'auth/email-already-in-use': 'This email is already registered. Try logging in.',
        'auth/invalid-email':        'Invalid email address.',
        'auth/weak-password':        'Password is too weak. Use at least 6 characters.',
      };
      showMessage('formMessage', messages[err.code] || err.message);
      setLoading('registerBtn', 'registerBtnText', 'registerSpinner', false);
    }
  });
}

// ═══ LOGIN FORM ══════════════════════════════════════════════
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!email || !password) return showMessage('formMessage', 'Please fill in all fields.');

    setLoading('loginBtn', 'loginBtnText', 'loginSpinner', true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage('formMessage', '✅ Login successful! Redirecting...', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);

    } catch (err) {
      console.error('Login error:', err);
      const messages = {
        'auth/user-not-found':    'No account found with this email.',
        'auth/wrong-password':    'Incorrect password. Please try again.',
        'auth/invalid-email':     'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/invalid-credential':'Incorrect email or password.',
      };
      showMessage('formMessage', messages[err.code] || 'Login failed. Please try again.');
      setLoading('loginBtn', 'loginBtnText', 'loginSpinner', false);
    }
  });
}

// ═══ DASHBOARD AUTH GUARD + PROFILE ══════════════════════════
const dashboardContent = document.getElementById('dashboardContent');
const authGuard        = document.getElementById('authGuard');

// ─── Listen to auth state changes (runs on every page) ───────
onAuthStateChanged(auth, async (user) => {
  // 1. Update navbar
  updateNavbar(user);

  // 2. Dashboard-specific logic
  if (dashboardContent && authGuard) {
    if (!user) {
      // Not logged in → show guard
      authGuard.style.display        = 'flex';
      dashboardContent.style.display = 'none';
      return;
    }

    // Logged in → show dashboard
    authGuard.style.display        = 'none';
    dashboardContent.style.display = 'block';

    // Populate welcome section
    const displayName = user.displayName || user.email;
    const nameEl = document.getElementById('welcomeName');
    const emailEl = document.getElementById('welcomeEmail');
    if (nameEl)  nameEl.textContent  = `Hey, ${displayName.split(' ')[0]}! 👋`;
    if (emailEl) emailEl.textContent = user.email;

    // Load Firestore user profile
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        const profileName  = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');
        const profileAvatar = document.getElementById('profileAvatar');
        const profileSince  = document.getElementById('profileSince');

        if (profileName)  profileName.textContent  = data.name  || user.displayName;
        if (profileEmail) profileEmail.textContent = data.email || user.email;
        if (profilePhone) profilePhone.textContent = data.phone || 'No phone added';
        if (profileAvatar) profileAvatar.textContent = (data.name || 'U')[0].toUpperCase();
        if (profileSince && data.createdAt) {
          const d = data.createdAt.toDate();
          profileSince.textContent = `Member since ${d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
        }
      }
    } catch (err) {
      console.error('Profile load error:', err);
    }
  }

  // 3. Redirect logged-in users away from auth pages
  const page = window.location.pathname;
  if (user && (page.includes('login.html') || page.includes('register.html'))) {
    window.location.href = 'dashboard.html';
  }
});

// Dashboard logout button
document.getElementById('logoutBtnDash')?.addEventListener('click', handleLogout);

// Export user helper for other modules
export { auth, onAuthStateChanged };
