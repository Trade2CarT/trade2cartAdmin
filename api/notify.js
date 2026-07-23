import nodemailer from 'nodemailer';

// Single email endpoint for lifecycle events. Both the User app (on scheduling)
// and the Vendor app (on completion) POST here with { type, ...details }.
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
        const { type, customerName, customerPhone, address, items, total, vendorName } = body;

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
        if (type === 'completed') {
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
        } else {
            template = {
                emoji: '🗓️',
                title: 'New Pickup Scheduled',
                accent: '#16a34a',
                intro: 'A customer just scheduled a scrap pickup. Assign a vendor to get it moving.',
                cta: 'Assign a Vendor',
                rows: [
                    ['Customer', customerName],
                    ['Phone', customerPhone],
                    ['Address', address],
                    ['Items', items],
                ],
            };
        }

        const subject = `${template.emoji} ${template.title} — ${customerName || 'Customer'}`;

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
