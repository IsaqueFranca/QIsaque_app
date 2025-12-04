// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);