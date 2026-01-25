// Cloudflare Worker for Contact Form -> Email via Resend
// Enhanced with full visitor tracking

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
            // RESEND API KEY:
            const RESEND_API_KEY = 're_BBZuC5gK_2Ve819e7V4dxPnokPGeJfGBv';
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
                postalCode: cf.postalCode || 'Unknown',
                latitude: cf.latitude || 'Unknown',
                longitude: cf.longitude || 'Unknown',
                colo: cf.colo || 'Unknown',
                asn: cf.asn || 'Unknown',
                asOrganization: cf.asOrganization || 'Unknown',
                userAgent: headers.get('User-Agent') || 'Unknown',
                referer: headers.get('Referer') || 'Direct',
                timestamp: new Date().toISOString(),
            };

            // Send email via Resend
            const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Portfolio Contact <onboarding@resend.dev>',
                    to: 'pumudu820@gmail.com',
                    reply_to: email,
                    subject: `🆕 New message from ${name}`,
                    html: `
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
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
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
              <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 16px; font-weight: 600;">
                👤 Contact Details
              </h2>
              <table width="100%" style="background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #e5e5e5; font-size: 14px;">
                      <span style="color: #888;">•</span> <strong style="color: #fff;">Name:</strong> ${name}
                    </p>
                    <p style="margin: 0 0 12px 0; color: #e5e5e5; font-size: 14px;">
                      <span style="color: #888;">•</span> <strong style="color: #fff;">Email:</strong> 
                      <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a>
                    </p>
                    <p style="margin: 0; color: #e5e5e5; font-size: 14px;">
                      <span style="color: #888;">•</span> <strong style="color: #fff;">Phone:</strong> ${phone || 'Not provided'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 16px; font-weight: 600;">
                💬 Message
              </h2>
              <div style="background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); padding: 24px;">
                <p style="margin: 0; color: #e5e5e5; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
              </div>
            </td>
          </tr>
          
          <!-- Client Information -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 16px; font-weight: 600;">
                🌍 Client Information
              </h2>
              <table width="100%" style="background: rgba(59,130,246,0.05); border-radius: 12px; border: 1px solid rgba(59,130,246,0.2);">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">
                      <span style="color: #666;">•</span> <strong style="color: #888;">IP Address:</strong> ${visitorInfo.ip}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">
                      <span style="color: #666;">•</span> <strong style="color: #888;">Location:</strong> ${visitorInfo.city}, ${visitorInfo.region}, ${visitorInfo.country}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">
                      <span style="color: #666;">•</span> <strong style="color: #888;">Coordinates:</strong> ${visitorInfo.latitude}, ${visitorInfo.longitude}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">
                      <span style="color: #666;">•</span> <strong style="color: #888;">Timezone:</strong> ${visitorInfo.timezone}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">
                      <span style="color: #666;">•</span> <strong style="color: #888;">ISP/ASN:</strong> ${visitorInfo.asOrganization} (AS${visitorInfo.asn})
                    </p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">
                      <span style="color: #666;">•</span> <strong style="color: #888;">Cloudflare Colo:</strong> ${visitorInfo.colo}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #a5a5a5; font-size: 13px;">
                      <span style="color: #666;">•</span> <strong style="color: #888;">User Agent:</strong> <span style="word-break: break-all;">${visitorInfo.userAgent}</span>
                    </p>
                    <p style="margin: 0; color: #a5a5a5; font-size: 13px;">
                      <span style="color: #666;">•</span> <strong style="color: #888;">Referer:</strong> ${visitorInfo.referer}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Timestamp -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <p style="margin: 0; color: #666; font-size: 13px;">
                📅 <strong>Timestamp:</strong> ${visitorInfo.timestamp}
              </p>
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
                Sent from your portfolio at <a href="https://pumudu.online" style="color: #3b82f6; text-decoration: none;">pumudu.online</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `
                })
            });

            if (emailResponse.ok) {
                return new Response(JSON.stringify({ success: true }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else {
                const errorData = await emailResponse.json();
                console.error('Resend error:', errorData);
                throw new Error('Email delivery failed');
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
