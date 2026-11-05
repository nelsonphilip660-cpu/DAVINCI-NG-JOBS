import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCg6v0BnQZJz5wK0CZYlC6Q19I3M8yNf6I",
  authDomain: "davincijobs-8682f.firebaseapp.com",
  projectId: "davincijobs-8682f",
  storageBucket: "davincijobs-8682f.firebasestorage.app",
  messagingSenderId: "418089530599",
  appId: "1:418089530599:web:2bba9464d7a9819e84de42",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("DAVINCIJOBS Firebase connected successfully!");