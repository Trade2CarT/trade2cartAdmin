import nodemailer from 'nodemailer';

// Single email endpoint for lifecycle events. The User and Vendor apps POST here
// with { type, ...details } via their utils/notify.js helper. Types:
// user_signup, profile_updated, city_request, scheduled (User app);
// vendor_signup, pickup_started, completed (Vendor app); concern (both).
// Recipients come from NOTIFY_TO (comma-separated); SMTP creds from EMAIL_USER/PASS.

const DASHBOARD_URL = 'https://trade2cart.trade.admin.trade2cart.in';

// Escape user-supplied values so a name/address can't break the HTML.
const esc = (v) =>
    String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

// Build the branded HTML email from a title, accent colour, intro line, and
// a list of [label, value] rows (blank values are skipped).
function renderHtml({ emoji, title, accent, intro, rows, cta }) {
    const rowsHtml = rows
        .filter(([, value]) => value != null && String(value).trim() !== '')
        .map(
            ([label, value]) => `
              <tr>
                <td style="padding:9px 0;color:#6b7280;font-size:13px;width:120px;vertical-align:top;">${esc(label)}</td>
                <td style="padding:9px 0;color:#111827;font-size:14px;font-weight:600;">${esc(value)}</td>
              </tr>`
        )
        .join('');

    return `
    <div style="background:#f4f5f7;padding:24px;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${accent};padding:24px 28px;">
            <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:bold;">Trade2Cart</div>
            <div style="font-size:22px;line-height:1.3;color:#ffffff;font-weight:800;margin-top:6px;">${esc(emoji)} ${esc(title)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">${esc(intro)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${rowsHtml}
            </table>
            <div style="margin-top:26px;">
              <a href="${DASHBOARD_URL}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;font-size:14px;">${esc(cta)}</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:#fafafa;border-top:1px solid #eeeeee;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">Automated notification from Trade2Cart · Please do not reply.</p>
          </td>
        </tr>
      </table>
    </div>`;
}

// Plain-text fallback for clients that don't render HTML.
const renderText = ({ title, intro, rows, cta }) =>
    `${title}\n\n${intro}\n\n` +
    rows
        .filter(([, value]) => value != null && String(value).trim() !== '')
        .map(([label, value]) => `${label}: ${value}`)
        .join('\n') +
    `\n\n${cta}: ${DASHBOARD_URL}`;

export default async function handler(req, res) {
    // CORS — the User and Vendor apps live on different origins.
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const {
            type, customerName, customerPhone, address, items, total, vendorName, role, message,
            city, source, distanceKm, email, newCity,
        } = body;

        // Recipients: comma-separated NOTIFY_TO, else the original defaults.
        const to = process.env.NOTIFY_TO || 'imran023786@gmail.com, trade2cart@gmail.com';

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER, // trade2cart@gmail.com
                pass: process.env.EMAIL_PASS, // Gmail App Password (set in Vercel env)
            },
        });

        let template;
        if (type === 'concern') {
            const who = role === 'vendor' ? 'Vendor' : 'Customer';
            template = {
                emoji: '📩',
                title: 'New Support Concern',
                accent: '#dc2626',
                intro: `A ${who.toLowerCase()} raised a concern from the app. Open the Support desk to respond and resolve it.`,
                cta: 'Open Support Desk',
                rows: [
                    ['From', who],
                    ['Name', customerName],
                    ['Phone', customerPhone],
                    ['Message', message],
                ],
            };
        } else if (type === 'completed') {
            template = {
                emoji: '✅',
                title: 'Order Completed',
                accent: '#2563eb',
                intro: 'An order has just been completed by a vendor.',
                cta: 'View Dashboard',
                rows: [
                    ['Customer', customerName],
                    ['Phone', customerPhone],
                    ['Vendor', vendorName],
                    ['Total Paid', total != null ? `₹${total}` : ''],
                    ['Items', items],
                ],
            };
        } else if (type === 'user_signup') {
            template = {
                emoji: '👋',
                title: 'New Customer Signed Up',
                accent: '#7c3aed',
                intro: 'A new customer just created a Trade2Cart account.',
                cta: 'View Users',
                rows: [
                    ['Name', customerName],
                    ['Phone', customerPhone],
                    ['City', city],
                ],
            };
        } else if (type === 'vendor_signup') {
            template = {
                emoji: '🧑‍🔧',
                title: 'New Vendor Registration',
                accent: '#ea580c',
                intro: newCity
                    ? `A vendor registered from ${city || 'a city'}, which you don't serve yet. Review their documents and consider adding a price list for that city.`
                    : 'A vendor submitted their registration and documents. Review and approve them in the dashboard.',
                cta: 'Review Vendor',
                rows: [
                    ['Name', customerName],
                    ['Phone', customerPhone],
                    ['City', newCity && city ? `${city} (new city)` : city],
                    ['Address', address],
                ],
            };
        } else if (type === 'city_request') {
            const fromBooking = source === 'booking';
            template = {
                emoji: '📍',
                title: 'New City Request',
                accent: '#0891b2',
                intro: fromBooking
                    ? 'A customer tried to book a pickup outside your service area and asked you to launch there.'
                    : "A visitor searched for an area you don't serve yet and asked to be notified.",
                cta: 'View City Requests',
                subjectName: city,
                rows: [
                    ['Area', city],
                    ['Source', fromBooking ? `Booking blocked${distanceKm != null ? ` (~${distanceKm} km away)` : ''}` : 'Location search'],
                    ['Name', customerName],
                    ['Phone', customerPhone],
                    ['Address', address],
                ],
            };
        } else if (type === 'pickup_started') {
            template = {
                emoji: '🚚',
                title: 'Pickup Started',
                accent: '#0d9488',
                intro: "A vendor verified the customer's OTP and started weighing the scrap.",
                cta: 'View Ongoing Orders',
                rows: [
                    ['Customer', customerName],
                    ['Phone', customerPhone],
                    ['Vendor', vendorName],
                    ['Address', address],
                ],
            };
        } else if (type === 'profile_updated') {
            template = {
                emoji: '✏️',
                title: 'Customer Profile Updated',
                accent: '#4b5563',
                intro: 'A customer updated their profile details.',
                cta: 'View Users',
                rows: [
                    ['Name', customerName],
                    ['Phone', customerPhone],
                    ['Email', email],
                    ['Address', address],
                ],
            };
        } else if (type === 'scheduled' || !type) {
            template = {
                emoji: '🗓️',
                title: 'New Pickup Scheduled',
                accent: '#16a34a',
                intro: 'A customer just scheduled a scrap pickup. Assign a vendor to get it moving.',
                cta: 'Assign a Vendor',
                rows: [
                    ['Customer', customerName],
                    ['Phone', customerPhone],
                    ['City', city],
                    ['Address', address],
                    ['Items', items],
                ],
            };
        } else {
            // Never mislabel an event as a scheduled pickup.
            return res.status(400).json({ error: `Unknown notification type: ${type}` });
        }

        const subject = `${template.emoji} ${template.title} — ${template.subjectName || customerName || 'Customer'}`;

        await transporter.sendMail({
            from: `"Trade2Cart" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: renderText(template),
            html: renderHtml(template),
        });

        return res.status(200).json({ message: 'Notification sent.' });
    } catch (error) {
        console.error('Notify error:', error);
        return res.status(500).json({ error: 'Failed to send notification.' });
    }
}
