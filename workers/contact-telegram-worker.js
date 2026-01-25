// Cloudflare Worker for Contact Form -> Telegram
// Sends contact form submissions to your Telegram

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
            const { name, email, message } = await request.json();

            // Validate inputs
            if (!name || !email || !message) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }

            // ========================================
            // CONFIGURE THESE VALUES:
            // ========================================
            const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';  // Get from @BotFather
            const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID_HERE';       // Your Telegram user/chat ID
            // ========================================

            // Format message for Telegram
            const telegramMessage = `
📩 *New Contact Form Submission*

👤 *Name:* ${name}
📧 *Email:* ${email}

💬 *Message:*
${message}

---
_Sent from your portfolio website_
      `.trim();

            // Send to Telegram
            const telegramResponse = await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: telegramMessage,
                        parse_mode: 'Markdown'
                    })
                }
            );

            if (telegramResponse.ok) {
                return new Response(JSON.stringify({ success: true }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else {
                const error = await telegramResponse.text();
                console.error('Telegram error:', error);
                throw new Error('Failed to send to Telegram');
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
