export async function sendContactEmail({ senderName, senderEmail, subject, message, ownerEmail }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#fff1f5,#f5f3ff);padding:32px 40px;border-bottom:2px solid #fce7f3">
            <div style="font-size:11px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">New portfolio message</div>
            <div style="font-family:Georgia,serif;font-size:22px;color:#111827;margin-bottom:4px">${senderName}</div>
            <a href="mailto:${senderEmail}" style="font-size:13px;color:#f4547e;text-decoration:none">${senderEmail}</a>
          </td>
        </tr>

        <!-- Subject -->
        <tr>
          <td style="padding:28px 40px 0">
            <div style="font-size:10px;font-weight:700;color:#f4547e;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">Subject</div>
            <div style="font-size:14px;color:#1f2937;font-weight:600">${subject}</div>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="padding:20px 40px 0">
            <div style="font-size:10px;font-weight:700;color:#f4547e;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Message</div>
            <div style="font-size:13px;color:#374151;line-height:1.75;white-space:pre-wrap">${message}</div>
          </td>
        </tr>

        <!-- Reply CTA -->
        <tr>
          <td style="padding:28px 40px">
            <a href="mailto:${senderEmail}?subject=Re%3A ${encodeURIComponent(subject)}"
               style="background:#f4547e;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:11px 26px;border-radius:24px;display:inline-block">
              Reply to ${senderName} &rarr;
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #f3f4f6;text-align:center">
            <div style="font-size:11px;color:#d1d5db">
              Sent via your <a href="https://findyana.com" style="color:#f4547e;text-decoration:none">Yana</a> portfolio
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Yana Portfolio <${import.meta.env.VITE_RESEND_FROM}>`,
      reply_to: [senderEmail],
      to: [ownerEmail],
      subject: `New message: ${subject}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Resend error ${res.status}`);
  }
  return res.json();
}
