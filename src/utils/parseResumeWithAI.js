import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

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

// ── Cloud Function callable (lazy singleton) ──────────────────────────────────
let _parseResumeFn = null;
function getParseResumeFn() {
  if (!_parseResumeFn) {
    _parseResumeFn = httpsCallable(functions, 'parseResume', { timeout: 120000 });
  }
  return _parseResumeFn;
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

  const VALID_ICONS = new Set(['target', 'dollar', 'users', 'heart']);
  const rawItems = Array.isArray(raw.metrics?.items) ? raw.metrics.items : [];
  const items = rawItems.map((m, i) => ({
    ...m,
    id: m.id ?? now + i,
    icon: VALID_ICONS.has(m.icon) ? m.icon : 'target',
    value: typeof m.value === 'number' ? m.value : parseFloat(m.value) || 0,
  }));

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
      jobs: rawJobs.map((j, i) => ({
        ...j,
        id: j.id ?? now + 100 + i,
        highlights: Array.isArray(j.highlights) ? j.highlights : [],
      })),
      education: rawEdu.map((e, i) => ({ ...e, id: e.id ?? now + 200 + i })),
      skills: rawSkills,
    },
  };
}

// ── Primary parser — sequential section reveal ────────────────────────────────
export async function parseResumeStreaming(file, { onProgress, onSection, onError, onComplete } = {}) {
  try {
    onProgress?.('reading');
    const text = await extractPdfText(file);
    if (!text.trim()) throw new Error('Could not extract text from this PDF. It may be a scanned image — try a text-based PDF.');

    onProgress?.('streaming');

    const { data } = await getParseResumeFn()({ text });
    console.log('[Yana] stop_reason:', data.stop_reason, '| content length:', data.text?.length);

    if (!data.text) {
      const reason = data.stop_reason ?? 'unknown';
      throw new Error(`No response from AI (stop_reason: ${reason}). Please try again.`);
    }

    const raw = parseJsonFromResponse(data.text);
    if (!raw) {
      console.error('[Yana] could not parse JSON from:', data.text?.slice(0, 600));
      throw new Error('AI returned invalid JSON — please try again.');
    }

    const parsed = normalizeResponse(raw);
    if (!parsed) throw new Error('AI response had no usable data — please try again.');

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    if (parsed.profile)    { onSection?.('profile',    parsed.profile);    await wait(900); }
    if (parsed.metrics)    { onSection?.('metrics',    parsed.metrics);    await wait(900); }
    if (parsed.experience) { onSection?.('experience', parsed.experience); await wait(900); }

    onComplete?.(parsed);
    return parsed;

  } catch (err) {
    onError?.(err.message ?? String(err));
  }
}

// ── Non-streaming fallback (kept for programmatic use) ────────────────────────
export async function parseResumeWithAI(file, onProgress) {
  onProgress?.('reading');
  const text = await extractPdfText(file);
  if (!text.trim()) throw new Error('Could not extract text from this PDF.');

  onProgress?.('analyzing');
  const { data } = await getParseResumeFn()({ text });
  const raw = parseJsonFromResponse(data.text);
  if (!raw) throw new Error('AI returned invalid JSON — please try again.');

  onProgress?.('done');
  return normalizeResponse(raw);
}

export const hasAIConfig = true;
