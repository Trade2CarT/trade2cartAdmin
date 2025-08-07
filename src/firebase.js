import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// --- 1. Import getAuth ---
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9BAhvioLdoZsbWGvgPwfh20Punjz4c5o",
    authDomain: "trade2cart-prod.firebaseapp.com",
    projectId: "trade2cart-prod",
    storageBucket: "trade2cart-prod.appspot.com",
    messagingSenderId: "210178439049",
    appId: "1:210178439049:web:20a56da817b14c61da5358",
    measurementId: "G-LC5XQP9JPE",
    databaseURL: "https://trade2cart-prod-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and Auth
const db = getDatabase(app);
// --- 2. Initialize auth ---
const auth = getAuth(app);

// --- 3. Export both db and auth ---
// This makes them available for other files to import.
export { db, auth };
