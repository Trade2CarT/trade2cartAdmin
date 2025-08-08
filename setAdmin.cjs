// This script gives a specific user admin privileges.

const admin = require('firebase-admin');

// --- 1. UPDATE THESE TWO LINES ---
const serviceAccount = require('./trade2cart-prod-firebase-adminsdk-fbsvc-e15dc9ba32.json'); // <-- Path to your downloaded JSON file
const adminUid = 'jmfjkEL5sZc7EfY3wAoS2mErrdi2'; // <-- Paste the UID you copied from Firebase
// ---------------------------------

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://trade2cart-prod-default-rtdb.firebaseio.com/" // Add your database URL
});

admin.auth().setCustomUserClaims(adminUid, { admin: true })
    .then(() => {
        console.log(`✅ Successfully set admin claim for user ${adminUid}`);
        console.log('Log out and log back into your app to see the changes.');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error setting custom claim:', error);
        process.exit(1);
    });