import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration uses environment variables defined in vite.config.ts
const firebaseConfig = {
  apiKey: "AIzaSyD7zI-wYCzo8vjvmXYBvpHjiFOhEdf_bGE",
  authDomain: "qisaque-ea6cb.firebaseapp.com",
  databaseURL: "https://qisaque-ea6cb-default-rtdb.firebaseio.com",
  projectId: "qisaque-ea6cb",
  storageBucket: "qisaque-ea6cb.firebasestorage.app",
  messagingSenderId: "844065251736",
  appId: "1:844065251736:web:b53072999eb1e614558bed",
  measurementId: "G-088SBGNVPT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();