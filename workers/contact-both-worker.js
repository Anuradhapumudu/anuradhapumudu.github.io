// Cloudflare Worker for Contact Form -> Email + Telegram
// Sends to both your email and Telegram simultaneously

export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        try {
            const { name, email, phone, message } = await request.json();

            // Validate inputs
            if (!name || !email || !message) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }

            // ========================================
            // CONFIGURATION - UPDATE THESE:
            const RESEND_API_KEY = 're_BBZuC5gK_2Ve819e7V4dxPnokPGeJfGBv';
            const TELEGRAM_BOT_TOKEN = '7598354368:AAHgb-tz4tNs_EJbC-LBvzkAwmBaU4t_plE';
            const TELEGRAM_CHAT_ID = '-4870773780';
            const YOUR_EMAIL = 'pumudu820@gmail.com';
            // ========================================

            // Get Cloudflare headers for visitor info
            const cf = request.cf || {};
            const headers = request.headers;

            const visitorInfo = {
                ip: headers.get('CF-Connecting-IP') || 'Unknown',
                country: cf.country || 'Unknown',
                city: cf.city || 'Unknown',
                region: cf.region || 'Unknown',
                timezone: cf.timezone || 'Unknown',
                colo: cf.colo || 'Unknown',
                asn: cf.asn || 'Unknown',
                asOrganization: cf.asOrganization || 'Unknown',
                userAgent: headers.get('User-Agent') || 'Unknown',
                referer: headers.get('Referer') || 'Direct',
                timestamp: new Date().toISOString(),
            };

            // Send both in parallel
            const [emailResult, telegramResult] = await Promise.allSettled([
                // Send Email via Resend
                fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Portfolio Contact <onboarding@resend.dev>',
                        to: YOUR_EMAIL,
                        reply_to: email,
                        subject: `🆕 New message from ${name}`,
                        html: generateEmailHTML(name, email, phone, message, visitorInfo)
                    })
                }),

                // Send Telegram Message
                fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: generateTelegramMessage(name, email, phone, message, visitorInfo),
                        parse_mode: 'HTML'
                    })
                })
            ]);

            // Check results
            const emailSuccess = emailResult.status === 'fulfilled' && emailResult.value.ok;
            const telegramSuccess = telegramResult.status === 'fulfilled' && telegramResult.value.ok;

            if (emailSuccess || telegramSuccess) {
                return new Response(JSON.stringify({
                    success: true,
                    email: emailSuccess,
                    telegram: telegramSuccess
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else {
                throw new Error('Both email and telegram failed');
            }
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ error: 'Failed to send message' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};

// Generate Telegram Message
function generateTelegramMessage(name, email, phone, message, info) {
    return `
🆕 <b>New Contact Form Submission</b>

👤 <b>Contact Details:</b>
• Name: ${name}
• Email: ${email}
• Phone: ${phone || 'Not provided'}

💬 <b>Message:</b>
${message}

🌍 <b>Client Information:</b>
• IP: ${info.ip}
• Location: ${info.city}, ${info.country}
• Timezone: ${info.timezone}
• ISP: ${info.asOrganization}
• Colo: ${info.colo}
• User Agent: ${info.userAgent}
• Referer: ${info.referer}

📅 ${info.timestamp}
    `.trim();
}

// Generate Email HTML
function generateEmailHTML(name, email, phone, message, info) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background: linear-gradient(145deg, #141414 0%, #1a1a1a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">
                🆕 New Contact Form Submission
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
                Someone wants to connect with you!
              </p>
            </td>
          </tr>
          
          <!-- Contact Details -->
          <tr>
            <td style="padding: 32px 40px 24px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 16px;">👤 Contact Details</h2>
              <table width="100%" style="background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #e5e5e5; font-size: 14px;">
                      • <strong style="color: #fff;">Name:</strong> ${name}
                    </p>
                    <p style="margin: 0 0 12px 0; color: #e5e5e5; font-size: 14px;">
                      • <strong style="color: #fff;">Email:</strong> 
                      <a href="mailto:${email}" style="color: #3b82f6;">${email}</a>
                    </p>
                    <p style="margin: 0; color: #e5e5e5; font-size: 14px;">
                      • <strong style="color: #fff;">Phone:</strong> ${phone || 'Not provided'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 16px;">💬 Message</h2>
              <div style="background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); padding: 24px;">
                <p style="margin: 0; color: #e5e5e5; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
              </div>
            </td>
          </tr>
          
          <!-- Client Information -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 16px;">🌍 Client Information</h2>
              <table width="100%" style="background: rgba(59,130,246,0.05); border-radius: 12px; border: 1px solid rgba(59,130,246,0.2);">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">• <strong>IP:</strong> ${info.ip}</p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">• <strong>Location:</strong> ${info.city}, ${info.region}, ${info.country}</p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">• <strong>Timezone:</strong> ${info.timezone}</p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">• <strong>ISP:</strong> ${info.asOrganization} (AS${info.asn})</p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">• <strong>Colo:</strong> ${info.colo}</p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">• <strong>User Agent:</strong> <span style="word-break: break-all;">${info.userAgent}</span></p>
                    <p style="margin: 0; color: #a5a5a5; font-size: 13px;">• <strong>Referer:</strong> ${info.referer}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Timestamp -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <p style="margin: 0; color: #666; font-size: 13px;">📅 <strong>Timestamp:</strong> ${info.timestamp}</p>
            </td>
          </tr>
          
          <!-- Reply Button -->
          <tr>
            <td style="padding: 0 40px 32px 40px;" align="center">
              <a href="mailto:${email}?subject=Re: Your message on pumudu.online" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Reply to ${name} →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
              <p style="margin: 0; color: #555; font-size: 12px;">
                Sent from <a href="https://pumudu.online" style="color: #3b82f6;">pumudu.online</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
}
