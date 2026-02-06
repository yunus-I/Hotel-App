// Firebase Configuration - FIXED VERSION
const firebaseConfig = {
    apiKey: "AIzaSyAtA5qHijKHAK8xKA4OxoQUIoTctFw5BsQ",
    authDomain: "telegram-hotel-app.firebaseapp.com",
    projectId: "telegram-hotel-app",
    storageBucket: "telegram-hotel-app.firebasestorage.app",
    messagingSenderId: "30546993827",
    appId: "1:30546993827:web:14c5d829211af4085d5516"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firestore and Auth
const db = firebase.firestore();
const auth = firebase.auth();

// Enable offline persistence (better UX)
db.enablePersistence()
    .catch((err) => {
        console.warn("Offline persistence not supported:", err);
    });

// Export only what we need
export { db, auth };

// DO NOT export firebase - it's a global