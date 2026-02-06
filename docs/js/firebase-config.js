// Firebase Configuration
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

const db = firebase.firestore();
const auth = firebase.auth();

// Export for other modules
export { db, auth, firebase };