import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

const callSendEmail = httpsCallable(functions, 'sendEmail');

function buildResumeEmailHtml({ profile, metrics, experience, healthcare, settings, portfolioUrl }) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

  const socialLinks = ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook', 'youtube']
    .filter(k => profile[k])
    .map(k => `<a href="${profile[k]}" style="color:#f4547e;text-decoration:none">${profile[k].replace('https://', '').replace('www.', '')}</a>`)
    .join(' &nbsp;&middot;&nbsp; ');

  const metricCards = (metrics?.items ?? []).map(m => `
    <td style="text-align:center;padding:12px 20px">
      <div style="font-size:26px;font-weight:700;color:#f4547e;font-family:Georgia,serif">${m.prefix ?? ''}${m.value}${m.suffix ?? ''}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:3px;font-family:Arial,sans-serif">${m.label}</div>
    </td>`).join('');

  const jobs = (experience?.jobs ?? []).map(j => `
    <tr><td style="padding:0 0 18px 0">
      <div style="display:flex;justify-content:space-between">
        <strong style="font-size:14px;color:#1f2937;font-family:Arial,sans-serif">${j.role ?? ''}</strong>
        <span style="font-size:12px;color:#9ca3af;font-family:Arial,sans-serif">${j.period ?? ''}</span>
      </div>
      <div style="font-size:13px;color:#6b7280;margin:2px 0 6px;font-family:Arial,sans-serif">${j.company ?? ''}${j.location ? ' &middot; ' + j.location : ''}</div>
      ${(j.highlights ?? []).length ? `<ul style="margin:0;padding-left:16px">${j.highlights.map(b => `<li style="font-size:12px;color:#4b5563;margin-bottom:3px;font-family:Arial,sans-serif">${b}</li>`).join('')}</ul>` : ''}
    </td></tr>`).join('');

  const skills = (experience?.skills ?? []).map(s =>
    `<span style="background:#fff1f5;border:1px solid #fecdd3;color:#be185d;font-size:11px;padding:4px 10px;border-radius:20px;display:inline-block;margin:3px;font-family:Arial,sans-serif">${s}</span>`
  ).join('');

  const showSpecialty = settings?.visible?.specialty !== false && healthcare?.summary;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${fullName} — Resume</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#fff1f5,#f5f3ff);padding:40px 40px 32px;border-bottom:2px solid #fce7f3">
            <div style="font-family:Georgia,serif;font-size:32px;font-weight:400;color:#111827;margin-bottom:4px">${fullName}</div>
            <div style="font-size:15px;color:#f4547e;margin-bottom:14px;font-family:Arial,sans-serif">${profile.title ?? ''}</div>
            <div style="font-size:12px;color:#6b7280">
              ${profile.email ? `<span>&#9993; <a href="mailto:${profile.email}" style="color:#6b7280;text-decoration:none">${profile.email}</a></span>` : ''}
              ${profile.location ? `&nbsp;&middot;&nbsp;<span>&#128205; ${profile.location}</span>` : ''}
            </div>
            ${socialLinks ? `<div style="font-size:11px;margin-top:8px;color:#9ca3af">${socialLinks}</div>` : ''}
          </td>
        </tr>

        ${profile.bio1 || profile.bio2 ? `
        <!-- Bio -->
        <tr><td style="padding:28px 40px 0">
          <div style="font-size:11px;font-weight:700;color:#f4547e;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;font-family:Arial,sans-serif">Summary</div>
          ${profile.bio1 ? `<p style="font-size:13px;color:#374151;line-height:1.75;margin:0 0 8px">${profile.bio1}</p>` : ''}
          ${profile.bio2 ? `<p style="font-size:13px;color:#374151;line-height:1.75;margin:0">${profile.bio2}</p>` : ''}
        </td></tr>` : ''}

        ${metricCards ? `
        <!-- Key Results -->
        <tr><td style="padding:28px 40px 0">
          <div style="font-size:11px;font-weight:700;color:#f4547e;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:14px">Key Results</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f5;border-radius:12px">
            <tr>${metricCards}</tr>
          </table>
        </td></tr>` : ''}

        ${jobs ? `
        <!-- Experience -->
        <tr><td style="padding:28px 40px 0">
          <div style="font-size:11px;font-weight:700;color:#f4547e;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:14px">Experience</div>
          <table width="100%" cellpadding="0" cellspacing="0">${jobs}</table>
        </td></tr>` : ''}

        ${skills ? `
        <!-- Skills -->
        <tr><td style="padding:20px 40px 0">
          <div style="font-size:11px;font-weight:700;color:#f4547e;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px">Skills</div>
          <div>${skills}</div>
        </td></tr>` : ''}

        ${showSpecialty ? `
        <!-- Specialty -->
        <tr><td style="padding:20px 40px 0">
          <div style="font-size:11px;font-weight:700;color:#f4547e;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px">${healthcare.label || 'Specialty'}</div>
          <p style="font-size:13px;color:#374151;line-height:1.75;margin:0 0 10px">${healthcare.summary}</p>
          ${(healthcare.highlights ?? []).length ? `<ul style="margin:0;padding-left:16px">${healthcare.highlights.map(h => `<li style="font-size:12px;color:#4b5563;margin-bottom:4px">${h}</li>`).join('')}</ul>` : ''}
        </td></tr>` : ''}

        <!-- View full portfolio CTA -->
        ${portfolioUrl ? `
        <tr><td style="padding:28px 40px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff1f5,#f5f3ff);border-radius:12px">
            <tr><td style="padding:20px;text-align:center">
              <div style="font-size:13px;color:#6b7280;margin-bottom:12px">View the full interactive portfolio including testimonials, blog posts, and more.</div>
              <a href="${portfolioUrl}" style="background:#f4547e;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 24px;border-radius:24px;display:inline-block">View Full Portfolio &rarr;</a>
            </td></tr>
          </table>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center">
            <div style="font-size:11px;color:#d1d5db">Sent via <a href="https://findyana.com" style="color:#f4547e;text-decoration:none">Yana</a> &mdash; the modern portfolio for women</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendResumeEmail({ requesterEmail, requesterName, portfolioData, username }) {
  const { profile } = portfolioData;
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const portfolioUrl = username ? `https://findyana.com/${username}` : null;

  const html = buildResumeEmailHtml({ ...portfolioData, portfolioUrl });

  const result = await callSendEmail({
    from: `${fullName} via Yana <noreply@findyana.com>`,
    to: requesterEmail,
    replyTo: profile.email || undefined,
    subject: `${fullName} shared their resume with you`,
    html,
  });

  return result.data;
}
