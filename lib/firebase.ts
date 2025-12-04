// @ts-ignore
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration uses environment variables defined in vite.config.ts
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyD7zI-wYCzo8vjvmXYBvpHjiFOhEdf_bGE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "qisaque-ea6cb.firebaseapp.com",
  databaseURL: "https://qisaque-ea6cb-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "qisaque-ea6cb",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "qisaque-ea6cb.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "844065251736",
  appId: process.env.FIREBASE_APP_ID || "1:844065251736:web:b53072999eb1e614558bed",
  measurementId: "G-088SBGNVPT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();