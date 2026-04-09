# 🚲 VeloRent — Premium Bike Rental Platform

A production-ready bike rental web app built with **Vanilla HTML/CSS/JS + Firebase**.

---

## 📁 Folder Structure

```
bike-rental/
├── index.html          ← Homepage (hero, featured bikes, how it works)
├── login.html          ← Login page
├── register.html       ← Registration page
├── bikes.html          ← Full bike listing with filters
├── dashboard.html      ← User dashboard (bookings, profile)
├── css/
│   └── style.css       ← Complete stylesheet (dark premium UI)
├── js/
│   ├── firebase.js     ← Firebase initialization ⬅ PUT YOUR CONFIG HERE
│   ├── auth.js         ← Register, Login, Logout, session persistence
│   ├── bikes.js        ← Load & render bikes from Firestore
│   └── booking.js      ← Booking modal, Firestore writes, dashboard
├── images/             ← Place bike images here (optional)
├── firestore.rules     ← Firestore security rules
├── firebase.json       ← Firebase Hosting configuration
└── README.md
```

---

## 🚀 Quick Setup (Step by Step)

### Step 1 — Create Firebase Project

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Click **"Add Project"** → Name it `bike-rental` → Continue
3. Disable Google Analytics if not needed → **Create Project**

### Step 2 — Register a Web App

1. On the project dashboard, click the **`</>`** (Web) icon
2. Register app as `bike-rental-web`
3. Copy the `firebaseConfig` object shown

### Step 3 — Paste Config into firebase.js

Open `js/firebase.js` and replace the placeholder config:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_REAL_API_KEY",
  authDomain:        "your-project-id.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

### Step 4 — Enable Authentication

1. Firebase Console → **Authentication** → **Get Started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** → Save

### Step 5 — Create Firestore Database

1. Firebase Console → **Firestore Database** → **Create Database**
2. Choose **"Start in test mode"** (for development)
3. Select a region close to your users → Enable

> **For production**, deploy the security rules (Step 8).

### Step 6 — (Optional) Enable Firebase Storage

1. Firebase Console → **Storage** → **Get Started**
2. Accept default rules → Done
3. Upload bike images and use the download URLs in Firestore bike documents

### Step 7 — Run Locally

Open with **VS Code Live Server** extension:
- Install "Live Server" by Ritwick Dey in VS Code Extensions
- Right-click `index.html` → **"Open with Live Server"**

Or use any static file server:
```bash
npx serve .
# or
python3 -m http.server 8080
```

### Step 8 — Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (in the bike-rental/ folder)
firebase init
# Select: Hosting, Firestore
# Public directory: . (dot)
# Single-page app: No
# Overwrite index.html: No

# Deploy security rules + hosting
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

---

## 🗄️ Firestore Data Structure

### `users` collection
```
users/
  {uid}/
    name:       "John Doe"
    email:      "john@example.com"
    phone:      "+91 98765 43210"
    uid:        "firebase_user_uid"
    role:       "user"  // or "admin"
    createdAt:  Timestamp
```

### `bikes` collection
```
bikes/
  {bikeId}/
    name:        "Urban Glide X1"
    category:    "city"  // city | mountain | electric | hybrid
    pricePerDay: 299
    available:   true
    imageURL:    "https://..."  // from Firebase Storage
    emoji:       "🚲"
    description: "Perfect city commuter..."
    specs: {
      gears:  "7-Speed"
      weight: "12kg"
      frame:  "Aluminium"
    }
```

### `bookings` collection
```
bookings/
  {bookingId}/
    userId:      "firebase_user_uid"
    userEmail:   "john@example.com"
    userName:    "John Doe"
    bikeId:      "bike001"
    bikeName:    "Urban Glide X1"
    startDate:   "2025-07-15"
    endDate:     "2025-07-18"
    totalDays:   3
    pricePerDay: 299
    totalPrice:  897
    status:      "confirmed"  // confirmed | active | completed | cancelled
    createdAt:   Timestamp
```

---

## 🔐 Firestore Security Rules

Deploy `firestore.rules` which enforces:
- **Bikes**: Public read, admin-only write
- **Users**: Own profile read/write, admin reads all
- **Bookings**: Create own bookings, read own bookings, admin reads all

```bash
firebase deploy --only firestore:rules
```

---

## 👑 Making a User an Admin

In Firestore Console, find the user document under `users/{uid}` and change:
```
role: "user"  →  role: "admin"
```

Admins can then add/edit bikes directly in the Firestore Console.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary BG | `#0A0A0B` |
| Surface | `#111114` |
| Card | `#16161A` |
| Accent | `#FF4D00` (orange-red) |
| Text Primary | `#F0F0F2` |
| Text Secondary | `#A0A0AA` |
| Display Font | Bebas Neue |
| Body Font | DM Sans |
| Mono Font | Space Mono |

---

## 📱 Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Grid/Flexbox), Vanilla ES6+ JavaScript
- **Auth**: Firebase Authentication (Email/Password)
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Firebase Storage (images)
- **Hosting**: Firebase Hosting
- **Fonts**: Google Fonts (Bebas Neue, DM Sans, Space Mono)
