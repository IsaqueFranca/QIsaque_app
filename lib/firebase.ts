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
  appId: "1:844065251736:web:8da15ecc0a096767558bed",
  measurementId: "G-4GL39PYKBQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);