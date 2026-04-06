// ═══════════════════════════════════════════════════════════
// js/firebase.js — Firebase App Initialization
// ═══════════════════════════════════════════════════════════
//
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project named "bike-rental" (or anything you like)
// 3. Click the </> Web icon to register a web app
// 4. Copy YOUR firebaseConfig object and paste it below
// 5. Enable Authentication → Sign-in method → Email/Password
// 6. Enable Firestore Database (start in test mode first)
// 7. (Optional) Enable Storage for bike images
// ═══════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ▼▼▼ REPLACE THIS WITH YOUR FIREBASE PROJECT CONFIG ▼▼▼
const firebaseConfig = {
  apiKey:            "AIzaSyDpz67_yFretacVDBH3bNWgYp_hsUD4zXs",
  authDomain:        "bike-rental-7daca.firebaseapp.com",
  projectId:         "bike-rental-7daca",
  storageBucket:     "bike-rental-7daca.firebasestorage.app",
  messagingSenderId: "526558898443",
  appId:             "1:526558898443:web:5544a6609a2bef1ffada0e"
};
// ▲▲▲ END OF CONFIG ▲▲▲

// Initialize Firebase
const app       = initializeApp(firebaseConfig);
const auth      = getAuth(app);
const db        = getFirestore(app);
const storage   = getStorage(app);

// Export instances so other JS files can import them
export { app, auth, db, storage };
