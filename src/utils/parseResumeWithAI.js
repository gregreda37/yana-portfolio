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
function resolveConfig(manualKey) {
  const key = manualKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return null;
  return {
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
  };
}

function buildBody(text) {
  return {
    model: import.meta.env.VITE_ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `I am building my professional portfolio on Yana and have uploaded my own resume. Please extract and structure my professional information from it so I can showcase my career.\n\nMy resume:\n\n${text.slice(0, 14000)}`,
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
const SYSTEM_PROMPT = `You are an expert resume parser for a professional portfolio platform called Yana. Extract all information from the resume text and return a single valid JSON object. Output ONLY the JSON — no markdown, no explanation.

Return this exact structure:
{
  "profile": {
    "firstName": "",
    "lastName": "",
    "title": "Professional title or tagline (e.g. Enterprise Sales Director | SaaS)",
    "bio1": "Compelling 2-3 sentence professional summary in first person based on their background",
    "bio2": "Second paragraph highlighting their approach, specialty, or values",
    "location": "City, State",
    "email": "",
    "linkedin": "full URL e.g. https://linkedin.com/in/handle — empty if not found",
    "instagram": "",
    "twitter": "",
    "facebook": "",
    "tiktok": "",
    "youtube": "",
    "availabilityNote": "e.g. Open to enterprise SaaS sales leadership roles"
  },
  "metrics": {
    "items": [
      {
        "id": 1,
        "value": 0,
        "prefix": "$ or empty string",
        "suffix": "%, M, K, x, + or empty string",
        "label": "Short name e.g. Revenue Generated",
        "description": "One-line context e.g. FY2023 enterprise book",
        "icon": "one of: target, dollar, users, heart"
      }
    ]
  },
  "experience": {
    "jobs": [
      {
        "id": 1,
        "role": "",
        "company": "",
        "period": "e.g. Jan 2020 – Present",
        "location": "",
        "highlights": ["bullet text without dash or bullet character", "another bullet"]
      }
    ],
    "education": [
      {
        "id": 1,
        "degree": "e.g. B.S. Marketing",
        "school": "",
        "year": "graduation year"
      }
    ],
    "skills": ["skill1", "skill2"]
  }
}

Rules:
- Output profile first, then metrics, then experience — in that exact order
- bio1/bio2: Write original professional copy based on the resume
- metrics: 3-6 quantifiable achievements. icon: dollar=revenue/money, target=quota/goals, users=team/clients, heart=other
- jobs: newest first. 2-4 highlights per job as plain strings (no leading dash or bullet)
- skills: 6-15 skill strings as a flat array
- Empty missing fields with empty string or empty array`;


// ── Primary parser — sequential section reveal ────────────────────────────────
// Calls onSection(name, data) for each section with staggered delays so the
// UI can animate each one in as if it arrived from a stream.
export async function parseResumeStreaming(file, manualApiKey, { onProgress, onSection, onError, onComplete } = {}) {
  try {
    onProgress?.('reading');
    const text = await extractPdfText(file);
    if (!text.trim()) throw new Error('Could not extract text from this PDF. It may be a scanned image — try a text-based PDF.');

    const config = resolveConfig(manualApiKey);
    if (!config) throw new Error('No API key configured. Add VITE_ANTHROPIC_API_KEY to your .env.local');

    onProgress?.('streaming');

    const res = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(buildBody(text)),
    });

    if (!res.ok) throw new Error(await extractError(res));

    const result = await res.json();

    if (result.stop_reason === 'refusal' || (Array.isArray(result.content) && result.content.length === 0)) {
      throw new Error('Claude declined to process this document. Try a different PDF or paste your resume text.');
    }

    const content = extractContent(result);

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
export async function parseResumeWithAI(file, manualApiKey, onProgress) {
  onProgress?.('reading');
  const text = await extractPdfText(file);
  if (!text.trim()) throw new Error('Could not extract text from this PDF.');

  const config = resolveConfig(manualApiKey);
  if (!config) throw new Error('No API key configured.');

  onProgress?.('analyzing');

  const res = await fetch(config.url, {
    method: 'POST',
    headers: config.headers,
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

export const hasAIConfig = !!import.meta.env.VITE_ANTHROPIC_API_KEY;
