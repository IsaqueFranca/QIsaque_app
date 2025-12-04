import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ------------------------------------------------------------------
// INSTRUÇÕES DE CONFIGURAÇÃO DO FIREBASE:
// 1. Vá para console.firebase.google.com
// 2. Crie um projeto e adicione um app Web (ícone </>).
// 3. Copie o objeto 'firebaseConfig' que aparece e substitua abaixo.
// 4. No menu lateral, vá em 'Criação' -> 'Firestore Database' e crie o banco.
// 5. No menu lateral, vá em 'Criação' -> 'Authentication' e ative Google e Email/Senha.
// ------------------------------------------------------------------

const firebaseConfig = {
  // Substitua as strings abaixo pelas suas chaves do Firebase Console
  // Se estiver rodando localmente, você pode colar as chaves diretamente aqui.
  // Se for fazer deploy (GitHub Pages/Vercel), use variáveis de ambiente (.env).
  
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
export const auth = getAuth(app);
// Atenção: O código usa Firestore, NÃO Realtime Database.
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();