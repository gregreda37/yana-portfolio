import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Bundled worker — no CDN dependency, no version-mismatch silently hanging
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// ── PDF text extraction ───────────────────────────────────────────────────────
async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableStream: true,
    disableAutoFetch: true,
  });

  // Race against a timeout so a broken worker never hangs the UI forever
  let pdf;
  try {
    pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('PDF reading timed out. Try a text-based PDF, or paste your resume text below.')),
          20000
        )
      ),
    ]);
  } catch (err) {
    loadingTask.destroy?.();
    throw err;
  }

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
    pages.push(text);
  }
  return pages.join('\n\n');
}

// ── Claude API config ─────────────────────────────────────────────────────────
const CLAUDE_CONFIG = {
  url: 'https://api.anthropic.com/v1/messages',
  headers: {
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
    'content-type': 'application/json',
  },
};

function buildBody(text) {
  return {
    model: import.meta.env.VITE_ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Fill in the JSON template using the document text below. Follow all template instructions exactly.\n\n<document>\n${text.slice(0, 14000)}\n</document>`,
    }],
  };
}

function extractContent(result) {
  const block = result.content?.find(b => b.type === 'text');
  return block?.text ?? '';
}

// ── Robustly extract a JSON object from a model response string ───────────────
// Handles: bare JSON, ```json fences, prose before/after the object
function parseJsonFromResponse(text) {
  if (!text) return null;

  // 1. Direct parse
  try { return JSON.parse(text); } catch {}

  // 2. Strip markdown code fences then parse
  const fenceStripped = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try { return JSON.parse(fenceStripped); } catch {}

  // 3. Extract the outermost {...} block (handles prose before/after JSON)
  const first = text.indexOf('{');
  const last  = text.lastIndexOf('}');
  if (first !== -1 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }

  return null;
}

// ── Extract error message from a non-OK response ──────────────────────────────
async function extractError(res) {
  const data = await res.json().catch(() => ({}));
  return data.error?.message ?? `API error ${res.status}`;
}

// ── Partial-JSON section extractor ────────────────────────────────────────────
// Returns the parsed value of `"sectionName": { ... }` if the closing brace has
// arrived in the accumulated string, otherwise null.
export function extractSection(accumulated, sectionName) {
  const marker = `"${sectionName}":`;
  const markerIdx = accumulated.indexOf(marker);
  if (markerIdx === -1) return null;

  let i = markerIdx + marker.length;
  while (i < accumulated.length && /\s/.test(accumulated[i])) i++;
  if (i >= accumulated.length) return null;
  const opener = accumulated[i];
  if (opener !== '{' && opener !== '[') return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let j = i; j < accumulated.length; j++) {
    const c = accumulated[j];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inString) { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(accumulated.slice(i, j + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

// ── Response normalization ────────────────────────────────────────────────────
// Ensures the AI's output always has the exact shape the UI expects, regardless
// of minor model variations (null sections, wrapped objects, missing keys, etc.)
function normalizeResponse(raw) {
  if (!raw || typeof raw !== 'object') return null;

  // Some models wrap everything in a single outer key, e.g. { "resume": { ... } }
  const keys = Object.keys(raw);
  if (!raw.profile && !raw.metrics && !raw.experience && keys.length === 1) {
    const inner = raw[keys[0]];
    if (inner && typeof inner === 'object' && (inner.profile || inner.metrics || inner.experience)) {
      raw = inner;
    }
  }

  const now = Date.now();

  const profile = typeof raw.profile === 'object' && raw.profile ? raw.profile : {};

  const rawItems = Array.isArray(raw.metrics?.items) ? raw.metrics.items : [];
  const items = rawItems.map((m, i) => ({ ...m, id: m.id ?? now + i }));

  const rawJobs = Array.isArray(raw.experience?.jobs) ? raw.experience.jobs : [];
  const rawEdu  = Array.isArray(raw.experience?.education) ? raw.experience.education : [];
  const rawSkills = Array.isArray(raw.experience?.skills) ? raw.experience.skills : [];

  return {
    profile: {
      firstName: '', lastName: '', title: '', bio1: '', bio2: '',
      location: '', email: '', linkedin: '', instagram: '', twitter: '',
      facebook: '', tiktok: '', youtube: '', availabilityNote: '',
      ...profile,
      // The model outputs summary1/summary2 to avoid triggering safety filters on "bio" key names
      bio1: profile.bio1 || profile.summary1 || '',
      bio2: profile.bio2 || profile.summary2 || '',
    },
    metrics: { items },
    experience: {
      jobs:      rawJobs.map((j, i) => ({ ...j, id: j.id ?? now + 100 + i })),
      education: rawEdu.map((e, i) => ({ ...e, id: e.id ?? now + 200 + i })),
      skills:    rawSkills,
    },
  };
}

// ── Shared extraction prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a JSON template filler. You receive a document and a JSON template. Populate every field in the template using only information found in the document. Output ONLY the completed JSON — no markdown, no explanation.

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


// ── Primary parser — sequential section reveal ────────────────────────────────
// Calls onSection(name, data) for each section with staggered delays so the
// UI can animate each one in as if it arrived from a stream.
export async function parseResumeStreaming(file, { onProgress, onSection, onError, onComplete } = {}) {
  try {
    onProgress?.('reading');
    const text = await extractPdfText(file);
    if (!text.trim()) throw new Error('Could not extract text from this PDF. It may be a scanned image — try a text-based PDF.');

    onProgress?.('streaming');

    const res = await fetch(CLAUDE_CONFIG.url, {
      method: 'POST',
      headers: CLAUDE_CONFIG.headers,
      body: JSON.stringify(buildBody(text)),
    });

    if (!res.ok) {
      const msg = await extractError(res);
      console.error('[Yana] API error:', msg);
      throw new Error(msg);
    }

    const result = await res.json();
    console.log('[Yana] stop_reason:', result.stop_reason, '| content blocks:', result.content?.length);

    if (Array.isArray(result.content) && result.content.length === 0) {
      const reason = result.stop_reason ?? 'unknown';
      throw new Error(`No response from Claude (stop_reason: ${reason}). Please try again.`);
    }

    const content = extractContent(result);
    console.log('[Yana] content preview:', content.slice(0, 200));

    const raw = parseJsonFromResponse(content);
    if (!raw) {
      console.error('[Yana] could not parse JSON from:', content.slice(0, 600));
      throw new Error('AI returned invalid JSON — please try again.');
    }

    const parsed = normalizeResponse(raw);
    if (!parsed) throw new Error('AI response had no usable data — please try again.');

    // Reveal each section with a short delay so the UI can animate them in
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    if (parsed.profile) {
      onSection?.('profile', parsed.profile);
      await wait(900);
    }
    if (parsed.metrics) {
      onSection?.('metrics', parsed.metrics);
      await wait(900);
    }
    if (parsed.experience) {
      onSection?.('experience', parsed.experience);
      await wait(900);
    }

    onComplete?.(parsed);
    return parsed;

  } catch (err) {
    onError?.(err.message ?? String(err));
    // Don't re-throw — onError owns the UI reset
  }
}

// ── Non-streaming fallback (kept for programmatic use) ────────────────────────
export async function parseResumeWithAI(file, onProgress) {
  onProgress?.('reading');
  const text = await extractPdfText(file);
  if (!text.trim()) throw new Error('Could not extract text from this PDF.');

  onProgress?.('analyzing');

  const res = await fetch(CLAUDE_CONFIG.url, {
    method: 'POST',
    headers: CLAUDE_CONFIG.headers,
    body: JSON.stringify(buildBody(text)),
  });

  if (!res.ok) throw new Error(await extractError(res));

  const result = await res.json();
  const content = extractContent(result);

  const raw = parseJsonFromResponse(content);
  if (!raw) throw new Error('AI returned invalid JSON — please try again.');

  onProgress?.('done');
  return normalizeResponse(raw);
}

export const hasAIConfig = true;
