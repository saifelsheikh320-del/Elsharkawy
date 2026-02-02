// js/firebase-config.js

const firebaseConfig = {
    apiKey: "AIzaSyDb4OAKr-uCDTQv8mrvKpDmN23c61HmX1Y",
    authDomain: "elsherkay-85800.firebaseapp.com",
    databaseURL: "https://elsherkay-85800-default-rtdb.firebaseio.com",
    projectId: "elsherkay-85800",
    storageBucket: "elsherkay-85800.firebasestorage.app",
    messagingSenderId: "978822217170",
    appId: "1:978822217170:web:83fa6cac34e9374d665c0b",
    measurementId: "G-0B2LHGCV4K"
};

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
// Make database globally available
window.database = firebase.database();

// Safe Analytics Initialization
const analytics = typeof firebase.analytics === 'function' ? firebase.analytics() : null;

