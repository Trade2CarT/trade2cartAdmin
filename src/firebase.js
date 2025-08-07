import { initializeApp } from "firebase/app";
// *** Ensure you are importing from "firebase/database" ***
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9BAhvioLdoZsbWGvgPwfh20Punjz4c5o",
    authDomain: "trade2cart-prod.firebaseapp.com",
    projectId: "trade2cart-prod",
    storageBucket: "trade2cart-prod.appspot.com",
    messagingSenderId: "210178439049",
    appId: "1:210178439049:web:20a56da817b14c61da5358",
    measurementId: "G-LC5XQP9JPE",
    // This URL is crucial for connecting to your Realtime Database
    databaseURL: "https://trade2cart-prod-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// *** Initialize Realtime Database and export it ***
const db = getDatabase(app);

// Export the database instance to be used in other parts of your app
export { db };