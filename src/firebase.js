import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// --- 1. Import App Check and the ReCaptchaV3Provider ---
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9BAhvioLdoZsbWGvgPwfh20Punjz4c5o",
    authDomain: "trade2cart-prod.firebaseapp.com",
    projectId: "trade2cart-prod",
    storageBucket: "trade2cart-prod.firebasestorage.app", // <--- CORRECTED BUCKET URL
    messagingSenderId: "210178439049",
    appId: "1:210178439049:web:20a56da817b14c61da5358",
    measurementId: "G-LC5XQP9JPE",
    databaseURL: "https://trade2cart-prod-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// --- 2. Initialize App Check ---
// This connects your app to your reCAPTCHA v3 site key.
// Make sure you have the key in your .env.local file.
initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Lewip0rAAAAAEzYExHo2ICd1jNBOsRMkoYJ0NLy'),
    isTokenAutoRefreshEnabled: true
});

// Initialize Realtime Database and Auth
const db = getDatabase(app);
const auth = getAuth(app);

// Export db and auth for use in other files
export { db, auth, storage };