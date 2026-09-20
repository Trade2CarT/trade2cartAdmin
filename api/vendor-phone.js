import admin from 'firebase-admin';

// Change a vendor's phone number.
//
// The number lives in three places that must stay in sync: Firebase Auth (the
// credential they actually log in with), `vendors/{uid}.phone`, and the
// `vendorPhone` stamped on every assignment they have ever been given. Only the
// Admin SDK can rewrite an Auth phone number, so this cannot run in the browser
// — and rewriting only the database would silently break the vendor's app
// (their Account page looks itself up by Auth phone, and Dashboard/History list
// orders by matching vendorPhone).
//
// Because this endpoint can move an account onto a different phone number, it is
// locked down harder than api/notify.js: admin origin only, POST only, and a
// verified Firebase ID token carrying the `admin` custom claim.

const ADMIN_ORIGIN = 'https://trade2cart.trade.admin.trade2cart.in';

// Initialise lazily inside the request. Doing this at module scope means a
// missing or malformed service-account env var crashes the whole function with
// an opaque FUNCTION_INVOCATION_FAILED, with no way to tell what is wrong.
const CREDENTIAL_VARS = ['VITE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'VITE_DATABASE_URL'];

function getDb() {
    if (!admin.apps.length) {
        const missing = CREDENTIAL_VARS.filter(v => !process.env[v]);
        if (missing.length) {
            const err = new Error(`Missing server config: ${missing.join(', ')}`);
            err.configError = true;
            throw err;
        }
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.VITE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.VITE_DATABASE_URL,
        });
    }
    return admin.database();
}

// E.164, as Firebase Auth requires it: + then 8-15 digits, no leading zero.
const E164 = /^\+[1-9]\d{7,14}$/;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', ADMIN_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

    let db;
    try {
        db = getDb();
    } catch (error) {
        if (error.configError) {
            console.error('vendor-phone config:', error.message);
            return res.status(503).json({ error: `Server not configured: ${error.message}. Set these in Vercel and redeploy.` });
        }
        throw error;
    }

    // The caller must be a signed-in admin, proved by their ID token — not by
    // origin, which a non-browser client can set freely.
    const token = (req.headers.authorization || '').replace(/^Bearer /i, '').trim();
    if (!token) return res.status(401).json({ error: 'Not signed in.' });
    let caller;
    try {
        caller = await admin.auth().verifyIdToken(token);
    } catch {
        return res.status(401).json({ error: 'Session expired. Sign in again.' });
    }
    if (caller.admin !== true) return res.status(403).json({ error: 'Admins only.' });

    // Same defensive parse as api/notify.js — the body arrives as a string
    // depending on how the request was sent.
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { vendorId, phone } = parsed;
    if (!vendorId || typeof vendorId !== 'string') {
        return res.status(400).json({ error: 'vendorId is required.' });
    }
    if (!E164.test(String(phone || ''))) {
        return res.status(400).json({ error: 'Enter the number with country code, e.g. +919876543210.' });
    }

    try {
        const snap = await db.ref(`vendors/${vendorId}`).once('value');
        if (!snap.exists()) return res.status(404).json({ error: 'Vendor not found.' });

        const oldPhone = snap.val().phone || '';
        if (oldPhone === phone) {
            return res.status(200).json({ ok: true, unchanged: true, assignmentsUpdated: 0 });
        }

        // Auth first. If the number already belongs to someone else this throws
        // before anything in the database has been touched.
        await admin.auth().updateUser(vendorId, { phoneNumber: phone });

        const updates = { [`vendors/${vendorId}/phone`]: phone };
        if (oldPhone) {
            const assignments = await db.ref('assignments')
                .orderByChild('vendorPhone').equalTo(oldPhone).once('value');
            assignments.forEach(child => {
                updates[`assignments/${child.key}/vendorPhone`] = phone;
            });
        }
        // One atomic write, so the vendor never sees a half-migrated order list.
        await db.ref().update(updates);

        return res.status(200).json({
            ok: true,
            previousPhone: oldPhone,
            assignmentsUpdated: Object.keys(updates).length - 1,
        });
    } catch (error) {
        const code = error?.errorInfo?.code || error?.code || '';
        if (code === 'auth/phone-number-already-exists') {
            return res.status(409).json({ error: 'That number already belongs to another account.' });
        }
        if (code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'This vendor has no login record to update.' });
        }
        if (code === 'auth/invalid-phone-number') {
            return res.status(400).json({ error: 'Firebase rejected that number. Check the country code.' });
        }
        if (code === 'auth/invalid-credential' || /private key|PEM|DECODER/i.test(error?.message || '')) {
            return res.status(503).json({ error: 'The server\'s Firebase key is invalid or expired. Regenerate it and update the Vercel env vars.' });
        }
        console.error('vendor-phone failed:', error);
        return res.status(500).json({ error: 'Could not update the number. Please try again.' });
    }
}
