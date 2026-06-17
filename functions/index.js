const { onCall, HttpsError } = require('firebase-functions/v2/https');

// Proxy email sending through this function so the Resend API key never
// reaches the browser and browser CORS restrictions are bypassed.
exports.sendEmail = onCall({ region: 'us-central1' }, async (request) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new HttpsError('internal', 'RESEND_API_KEY is not configured on the server.');
  }

  const { from, to, replyTo, subject, html } = request.data ?? {};
  if (!to || !subject || !html) {
    throw new HttpsError('invalid-argument', 'Missing required fields: to, subject, html.');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from ?? `Yana Portfolio <noreply@findyana.com>`,
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo ? (Array.isArray(replyTo) ? replyTo : [replyTo]) : undefined,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new HttpsError('internal', err.message ?? `Resend error ${res.status}`);
  }

  return { success: true };
});
