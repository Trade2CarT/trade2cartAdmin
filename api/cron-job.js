import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.VITE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.VITE_DATABASE_URL
    });
}

const db = admin.database();

export default async function handler(req, res) {
    // ==========================================
    // 🚨 NEW: CORS HEADERS (Crucial for cross-site fetch)
    // ==========================================
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allows your user app to call this
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle browser preflight checks
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // ==========================================

    try {
        const assignmentsRef = db.ref('assignments');
        const snapshot = await assignmentsRef.orderByChild('status').equalTo('assigned').once('value');
        const orders = snapshot.val();

        if (!orders) return res.status(200).json({ message: 'No pending orders.' });

        // Looks for orders placed in the last 5 minutes
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        const newOrders = Object.entries(orders).filter(([key, order]) => {
            const orderTime = new Date(order.assignedAt || order.timestamp || Date.now()).getTime();
            return orderTime >= fiveMinutesAgo;
        });

        if (newOrders.length === 0) return res.status(200).json({ message: 'No new orders.' });

        const transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const orderDetails = newOrders.map(([key, order]) =>
            `• Order ID: ${key.substring(0, 8)}\n  Customer: ${order.userName || 'N/A'}\n  Phone: ${order.userMobile || order.mobile}\n`
        ).join('\n');

        await transporter.sendMail({
            from: `"Trade2Cart Admin" <${process.env.EMAIL_USER}>`,
            to: 'imran023786@gmail.com, trade2cart@gmail.com',
            subject: `🚨 ${newOrders.length} New Scrap Order Alert(s)!`,
            text: `New order(s) received just now:\n\n${orderDetails}\n\nView Dashboard: https://trade2cartadmin.vercel.app`
        });

        return res.status(200).json({ message: 'Alerts sent successfully.' });
    } catch (error) {
        console.error("Alert processing error:", error);
        return res.status(500).json({ error: 'Failed to process alerts.' });
    }
}

