const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { https: httpsV1 } = require('firebase-functions/v1');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ── OG / link-preview function ────────────────────────────────────────────────

const CRAWLER_RE = /bot|crawl|spider|facebookexternalhit|twitterbot|whatsapp|slackbot|linkedinbot|discordbot|telegrambot|applebot|iMessage|preview|Slack|Telegram/i;
const BASE_URL = 'https://findyana.com';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildOGTags({ name, jobTitle, description, image, url }) {
  return [
    `<title>${esc(name)}</title>`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="Yana" />`,
    `<meta property="og:title" content="${esc(name)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    image ? `<meta property="og:image" content="${esc(image)}" />` : '',
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(name)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    image ? `<meta name="twitter:image" content="${esc(image)}" />` : '',
  ].filter(Boolean).join('\n    ');
}

exports.portfolioPreview = httpsV1.onRequest(async (req, res) => {
  const username = (req.path || '/').replace(/^\//, '').split('/')[0];

  // Let admin routes and empty paths fall through to index.html
  if (!username || username === 'admin') {
    res.set('Cache-Control', 'public, max-age=60');
    const indexHtml = readIndex();
    return indexHtml
      ? res.set('Content-Type', 'text/html').send(indexHtml)
      : res.redirect(302, '/');
  }

  const ua = req.headers['user-agent'] || '';
  const isCrawler = CRAWLER_RE.test(ua);
  const indexHtml = readIndex();

  let profileData = {};
  try {
    const usernameSnap = await db.collection('usernames').doc(username).get();
    if (usernameSnap.exists) {
      const uid = usernameSnap.data().uid;
      const profileSnap = await db.doc(`users/${uid}/portfolio/profile`).get();
      if (profileSnap.exists) profileData = profileSnap.data();
    }
  } catch (e) {
    console.error('portfolioPreview Firestore error:', e.message);
  }

  const firstName = profileData.firstName ?? '';
  const lastName  = profileData.lastName  ?? '';
  const name      = [firstName, lastName].filter(Boolean).join(' ') || username;
  const jobTitle  = profileData.title ?? '';
  const ogTitle   = jobTitle ? `${name} | ${jobTitle}` : name;
  const description = profileData.bio1
    ? profileData.bio1.slice(0, 200)
    : `${name}'s professional portfolio.`;
  const image = profileData.photo ?? '';
  const url   = `${BASE_URL}/${username}`;

  const ogTags = buildOGTags({ name: ogTitle, jobTitle, description, image, url });

  res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.set('Content-Type', 'text/html');

  if (isCrawler || !indexHtml) {
    // Minimal HTML — crawlers don't need the React bundle
    return res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${ogTags}
</head>
<body>
  <p><a href="${esc(url)}">${esc(name)}'s portfolio</a></p>
</body>
</html>`);
  }

  // Full SPA with OG tags injected — browsers get the complete React app
  const html = indexHtml.replace(
    /(<title>)[^<]*(<\/title>)/,
    ogTags
  );
  return res.send(html);
});

function readIndex() {
  try {
    return fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  } catch {
    return null;
  }
}

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

// ── Resume AI parser ──────────────────────────────────────────────────────────
// Proxies the Anthropic API so the key never reaches the browser bundle.
const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

const RESUME_SYSTEM_PROMPT = `You are a JSON template filler. You receive a document and a JSON template. Populate every field in the template using only information found in the document. Output ONLY the completed JSON — no markdown, no explanation.

JSON template to fill:
{
  "profile": {
    "firstName": "",
    "lastName": "",
    "title": "Primary title or role descriptor found in the document header",
    "summary1": "2-3 sentences from the document's summary or objective section, first person",
    "summary2": "Additional context paragraph from the document if present, otherwise empty string",
    "location": "City, State from the document header",
    "email": "Email address if present",
    "linkedin": "LinkedIn URL if present, e.g. https://linkedin.com/in/handle",
    "instagram": "Instagram URL if present",
    "twitter": "Twitter URL if present",
    "facebook": "Facebook URL if present",
    "tiktok": "TikTok URL if present",
    "youtube": "YouTube URL if present",
    "availabilityNote": "Any open-to or availability statement if present"
  },
  "metrics": {
    "items": [
      {
        "value": 0,
        "prefix": "$ if currency, else empty string",
        "suffix": "M, K, %, x, or + as appropriate, else empty string",
        "label": "2-4 word metric name e.g. Revenue Generated",
        "description": "One line of context",
        "icon": "dollar, target, users, or heart"
      }
    ]
  },
  "experience": {
    "jobs": [
      {
        "role": "Job title",
        "company": "Company name",
        "period": "Date range e.g. Jan 2020 – Present",
        "location": "City, State or Remote",
        "highlights": ["Plain text accomplishment or responsibility, no leading dash or bullet"]
      }
    ],
    "education": [
      {
        "degree": "Degree and field e.g. B.S. Marketing",
        "school": "Institution name",
        "year": "Year as string"
      }
    ],
    "skills": ["skill name"]
  }
}

Rules:
- metrics.items: Find 3–6 specific numbers or percentages in the document and create one item per achievement. icon choices: dollar=revenue/money, target=quota/goals, users=team/clients/accounts, heart=all other
- jobs: reverse chronological order, 2–5 highlights each as plain strings with no leading punctuation
- skills: 8–15 specific tools, platforms, or methodologies named in the document
- Empty string for missing text fields, empty array for missing list fields`;

exports.parseResume = onCall(
  { region: 'us-central1', secrets: [anthropicKey], timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    const { text } = request.data ?? {};
    if (!text || typeof text !== 'string') {
      throw new HttpsError('invalid-argument', 'text is required');
    }

    const apiKey = anthropicKey.value();
    if (!apiKey) {
      throw new HttpsError('internal', 'ANTHROPIC_API_KEY is not configured on the server.');
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: RESUME_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Fill in the JSON template using the document text below. Follow all template instructions exactly.\n\n<document>\n${text.slice(0, 14000)}\n</document>`,
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new HttpsError('internal', err.error?.message ?? `Anthropic error ${res.status}`);
    }

    const result = await res.json();
    const block = result.content?.find(b => b.type === 'text');
    return { text: block?.text ?? '', stop_reason: result.stop_reason };
  }
);
