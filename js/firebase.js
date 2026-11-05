// =====================================
// DAVINCIJOBS FIREBASE CONFIGURATION
// =====================================

import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// FIREBASE PROJECT DETAILS
const firebaseConfig = {
    apiKey: "AIzaSyCg6v0BnQZJz5wK0CZYlC6Q19I3M8yNf6I",
    authDomain: "davincijobs-8682f.firebaseapp.com",
    projectId: "davincijobs-8682f",
    storageBucket: "davincijobs-8682f.firebasestorage.app",
    messagingSenderId: "418089530599",
    appId: "1:418089530599:web:2bba9464d7a9819e84de42",
    measurementId: "G-VKSXCSMMF4"
};


// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);


// AUTHENTICATION
export const auth = getAuth(app);


// FIRESTORE DATABASE
export const db = getFirestore(app);


console.log("DavinciJobs Firebase connected successfully.");