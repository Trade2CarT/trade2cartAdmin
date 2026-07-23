import nodemailer from 'nodemailer';

// Single email endpoint for lifecycle events. Both the User app (on scheduling)
// and the Vendor app (on completion) POST here with { type, ...details }.
// Reuses the same GoDaddy SMTP creds already configured for cron-job.js.
export default async function handler(req, res) {
    // CORS — the User and Vendor apps live on different origins.
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

    try {
        // req.body is already parsed on Vercel, but guard for string bodies.
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const { type, customerName, customerPhone, address, items, total, vendorName } = body;

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER, // trade2cart@gmail.com
                pass: process.env.EMAIL_PASS, // Gmail App Password (set in Vercel env)
            },
        });

        let subject;
        let text;

        if (type === 'completed') {
            subject = `✅ Order Completed — ${customerName || 'Customer'}`;
            text =
                `An order has just been completed.\n\n` +
                `Customer: ${customerName || 'N/A'}\n` +
                `Phone: ${customerPhone || 'N/A'}\n` +
                `Vendor: ${vendorName || 'N/A'}\n` +
                `Total Paid: ₹${total != null ? total : 'N/A'}\n` +
                (items ? `Items: ${items}\n` : '') +
                `\nView Dashboard: https://trade2cartadmin.vercel.app`;
        } else {
            // Default: a new pickup was scheduled by a user.
            subject = `🗓️ New Pickup Scheduled — ${customerName || 'Customer'}`;
            text =
                `A customer just scheduled a pickup.\n\n` +
                `Customer: ${customerName || 'N/A'}\n` +
                `Phone: ${customerPhone || 'N/A'}\n` +
                (address ? `Address: ${address}\n` : '') +
                (items ? `Items: ${items}\n` : '') +
                `\nAssign a vendor: https://trade2cartadmin.vercel.app`;
        }

        await transporter.sendMail({
            from: `"Trade2Cart" <${process.env.EMAIL_USER}>`,
            to: 'imran023786@gmail.com, trade2cart@gmail.com',
            subject,
            text,
        });

        return res.status(200).json({ message: 'Notification sent.' });
    } catch (error) {
        console.error('Notify error:', error);
        return res.status(500).json({ error: 'Failed to send notification.' });
    }
}
