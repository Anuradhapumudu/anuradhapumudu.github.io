// Cloudflare Worker for Contact Form -> Email
// Deploy this to your Cloudflare Workers dashboard
// Replace 'hello@pumudu.online' with your actual email

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

            // Send email via MailChannels (free for Cloudflare Workers)
            const emailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalizations: [
                        {
                            to: [{ email: 'hello@pumudu.online', name: 'Pumudu Anuradha' }]
                        }
                    ],
                    from: {
                        email: 'noreply@pumudu.online',
                        name: 'Portfolio Contact Form'
                    },
                    reply_to: {
                        email: email,
                        name: name
                    },
                    subject: `New Contact from ${name}`,
                    content: [
                        {
                            type: 'text/plain',
                            value: `You have a new contact form submission!\n\n` +
                                `Name: ${name}\n` +
                                `Email: ${email}\n\n` +
                                `Message:\n${message}\n\n` +
                                `---\nSent from your portfolio contact form`
                        },
                        {
                            type: 'text/html',
                            value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #3b82f6;">New Contact Form Submission</h2>
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                  </div>
                  <div style="background: #fff; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px;">
                    <h3 style="margin-top: 0;">Message:</h3>
                    <p style="white-space: pre-wrap;">${message}</p>
                  </div>
                  <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    Sent from your portfolio contact form
                  </p>
                </div>
              `
                        }
                    ]
                })
            });

            if (emailResponse.ok || emailResponse.status === 202) {
                return new Response(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else {
                const errorText = await emailResponse.text();
                console.error('MailChannels error:', errorText);
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
