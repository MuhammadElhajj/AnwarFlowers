// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ أضفنا هذا السطر

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlEJLATBa_RaFYrcEFFHOxZsb32fyoyyQ",
  authDomain: "anwar-flowers.firebaseapp.com",
  projectId: "anwar-flowers",
  storageBucket: "anwar-flowers.firebasestorage.app",
  messagingSenderId: "200331466367",
  appId: "1:200331466367:web:c206677aac5e012579114a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ أضفنا هذا التصدير
export default app;