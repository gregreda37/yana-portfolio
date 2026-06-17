import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

// ── PDF text extraction ───────────────────────────────────────────────────────
async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
    pages.push(text);
  }
  return pages.join('\n\n');
}

// ── AI backend resolution (Azure > standard OpenAI) ──────────────────────────
function resolveConfig(manualKey) {
  const azureKey    = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const azureEndpt  = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
  const azureVer    = import.meta.env.VITE_AZURE_OPENAI_API_VERSION ?? '2024-12-01-preview';
  const azureDeploy = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT ?? 'gpt-35-turbo';

  if (azureKey && azureEndpt) {
    const base = azureEndpt.replace(/\/$/, '');
    return {
      type: 'azure',
      url: `${base}/openai/deployments/${azureDeploy}/chat/completions?api-version=${azureVer}`,
      headers: { 'api-key': azureKey, 'Content-Type': 'application/json' },
    };
  }

  const openaiKey = manualKey || import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiKey) {
    return {
      type: 'openai',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    };
  }

  return null;
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

// ── ID normalization ──────────────────────────────────────────────────────────
function normalizeIds(parsed) {
  const now = Date.now();
  if (parsed.metrics?.items) {
    parsed.metrics.items = parsed.metrics.items.map((m, i) => ({ ...m, id: m.id ?? now + i }));
  }
  if (parsed.experience?.jobs) {
    parsed.experience.jobs = parsed.experience.jobs.map((j, i) => ({ ...j, id: j.id ?? now + 100 + i }));
  }
  if (parsed.experience?.education) {
    parsed.experience.education = parsed.experience.education.map((e, i) => ({ ...e, id: e.id ?? now + 200 + i }));
  }
  return parsed;
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

const MESSAGES = (text) => [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: `Parse this resume:\n\n${text.slice(0, 14000)}` },
];

// ── Streaming parser (primary) ────────────────────────────────────────────────
// Calls onSection(name, data) as each JSON section completes in the stream.
// Calls onComplete(parsedData) when the full response is done.
export async function parseResumeStreaming(file, manualApiKey, { onProgress, onSection, onError, onComplete } = {}) {
  try {
    onProgress?.('reading');
    const text = await extractPdfText(file);
    if (!text.trim()) throw new Error('Could not extract text from this PDF. It may be a scanned image — try a text-based PDF.');

    const config = resolveConfig(manualApiKey);
    if (!config) throw new Error('No AI API key configured. Add VITE_AZURE_OPENAI_API_KEY or VITE_OPENAI_API_KEY to your .env.local');

    onProgress?.('streaming');

    const body = {
      messages: MESSAGES(text),
      temperature: 0.2,
      response_format: { type: 'json_object' },
      stream: true,
    };
    if (config.type === 'openai') body.model = 'gpt-4o';

    const res = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message ?? `API error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    const found = new Set();

    try {
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break outer;
          try {
            const evt = JSON.parse(raw);
            const delta = evt.choices?.[0]?.delta?.content ?? '';
            if (!delta) continue;
            accumulated += delta;

            // Check if each section has just completed
            for (const name of ['profile', 'metrics', 'experience']) {
              if (!found.has(name)) {
                const extracted = extractSection(accumulated, name);
                if (extracted) {
                  found.add(name);
                  onSection?.(name, extracted);
                }
              }
            }
          } catch { /* skip malformed SSE lines */ }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onProgress?.('parsing');

    let parsed;
    try {
      parsed = JSON.parse(accumulated);
    } catch {
      // Try to salvage partial JSON by closing open brackets
      throw new Error('AI response was incomplete. Please try again.');
    }

    parsed = normalizeIds(parsed);
    onComplete?.(parsed);
    return parsed;

  } catch (err) {
    onError?.(err.message ?? String(err));
    throw err;
  }
}

// ── Non-streaming fallback (kept for programmatic use) ────────────────────────
export async function parseResumeWithAI(file, manualApiKey, onProgress) {
  onProgress?.('reading');
  const text = await extractPdfText(file);
  if (!text.trim()) throw new Error('Could not extract text from this PDF.');

  const config = resolveConfig(manualApiKey);
  if (!config) throw new Error('No AI API key configured.');

  onProgress?.('analyzing');

  const body = {
    messages: MESSAGES(text),
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };
  if (config.type === 'openai') body.model = 'gpt-4o';

  const res = await fetch(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `API error ${res.status}`);
  }

  const result = await res.json();
  const content = result.choices?.[0]?.message?.content;

  let parsed;
  try { parsed = JSON.parse(content); }
  catch { throw new Error('AI returned invalid JSON — please try again.'); }

  onProgress?.('done');
  return normalizeIds(parsed);
}

export const hasAIConfig = !!(
  import.meta.env.VITE_AZURE_OPENAI_API_KEY ||
  import.meta.env.VITE_OPENAI_API_KEY
);
