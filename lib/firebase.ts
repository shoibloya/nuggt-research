// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-rloy5mH7b7dYXOw-OVX0HlGxpDrVq4k",
  authDomain: "nuggt-research.firebaseapp.com",
  projectId: "nuggt-research",
  storageBucket: "nuggt-research.firebasestorage.app",
  messagingSenderId: "63008997915",
  appId: "1:63008997915:web:4c79caaac85bb479322ebe",
  measurementId: "G-G4M9L745JM"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);

// Export both Firestore and Auth
export { db, auth };
