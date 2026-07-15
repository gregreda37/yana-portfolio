export const SECTION_LABELS = {
  profile:      'Profile',
  metrics:      'Key Metrics',
  experience:   'Experience',
  healthcare:   'Specialty',
  testimonials: 'Testimonials',
  blog:         'Blog',
  books:        'Reading List',
};

// ── Azure OpenAI config ───────────────────────────────────────────────────────
// Endpoint format: {base}/openai/deployments/{deployment}/chat/completions?api-version={version}
function azureEndpoint() {
  const base       = (import.meta.env.VITE_AZURE_OPENAI_ENDPOINT ?? '').replace(/\/$/, '');
  const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT ?? 'gpt-35-turbo';
  const version    = import.meta.env.VITE_AZURE_OPENAI_API_VERSION ?? '2024-12-01-preview';
  return `${base}/openai/deployments/${deployment}/chat/completions?api-version=${version}`;
}

function apiKey() { return import.meta.env.VITE_AZURE_OPENAI_API_KEY ?? ''; }

function isConfigured() {
  return !!(import.meta.env.VITE_AZURE_OPENAI_API_KEY && import.meta.env.VITE_AZURE_OPENAI_ENDPOINT);
}

// Azure uses `api-key` header, NOT `Authorization: Bearer`
function headers() {
  return { 'api-key': apiKey(), 'Content-Type': 'application/json' };
}

const SYSTEM = `You are Yana AI, a warm and expert portfolio coach for Yana, a high-performing sales professional building her personal portfolio at findyana.com.

Analyze her portfolio sections and give specific, actionable feedback. Be encouraging, concise, and always provide exact replacement text when suggesting improvements — never vague advice.`;

function extractJson(text) {
  try { return JSON.parse(text); } catch {}
  const fence = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fence) try { return JSON.parse(fence[1]); } catch {}
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a !== -1 && b > a) try { return JSON.parse(text.slice(a, b + 1)); } catch {}
  return null;
}

// ── One-shot analysis call ────────────────────────────────────────────────────
export async function analyzeSection(section, sectionData) {
  if (!isConfigured()) throw new Error('Azure OpenAI is not configured. Add VITE_AZURE_OPENAI_API_KEY and VITE_AZURE_OPENAI_ENDPOINT to your .env.local file.');

  const label = SECTION_LABELS[section] ?? section;

  const res = await fetch(azureEndpoint(), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      // Azure deployments don't need a `model` field — the deployment name handles it
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content:
`Analyze Yana's ${label} section and suggest specific improvements.

Current data:
${JSON.stringify(sectionData, null, 2)}

Respond ONLY with valid JSON — no markdown, no text outside the JSON object:
{
  "analysis": "2–3 warm, specific sentences: what is working and what could improve",
  "suggestions": [
    {
      "id": "s1",
      "emoji": "✍️",
      "title": "Action title (5 words max)",
      "reason": "Why this helps her stand out (1–2 sentences)",
      "field": "bio1",
      "newValue": "Exact replacement text, or null for structural advice"
    }
  ]
}

Keep suggestions to 3–4 max. Provide ready-to-use text for newValue whenever possible.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Azure OpenAI error ${res.status}`);
  }

  const result = await res.json();
  const text = result.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson(text);
  if (!parsed) throw new Error('Could not parse AI response — please try again.');
  return parsed;
}

// ── Single-field refine call ──────────────────────────────────────────────────
export async function refineField(fieldLabel, currentValue, instruction) {
  if (!isConfigured()) throw new Error('AI assistant is not configured. Add your Azure OpenAI keys to .env.local.');

  const res = await fetch(azureEndpoint(), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      temperature: 0.75,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `Improve this specific portfolio field for a high-performing sales professional.

Field: "${fieldLabel}"
Current text: "${currentValue || '(empty)'}"
${instruction ? `Instruction: ${instruction}` : 'Make it more compelling, specific, and professional.'}

Return ONLY the improved text — no explanation, no quotes, no preamble. Just the improved text itself.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `AI error ${res.status}`);
  }

  const result = await res.json();
  return (result.choices?.[0]?.message?.content ?? '').trim();
}

// ── Streaming follow-up chat ──────────────────────────────────────────────────
export async function streamChat({ messages, sectionLabel, sectionData, onChunk, onComplete, onError }) {
  if (!isConfigured()) { onError?.('Azure OpenAI is not configured.'); return; }

  try {
    const systemWithContext = `${SYSTEM}

The user is currently editing their ${sectionLabel} section. Here is the current section data for context:
${JSON.stringify(sectionData)}

Be concise. When suggesting text changes, provide the exact new text.`;

    const res = await fetch(azureEndpoint(), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        temperature: 0.7,
        stream: true,
        messages: [{ role: 'system', content: systemWithContext }, ...messages],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message ?? `Azure OpenAI error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value, { stream: true }).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6);
        if (raw === '[DONE]') continue;
        try {
          const delta = JSON.parse(raw).choices?.[0]?.delta?.content;
          if (delta) { acc += delta; onChunk?.(acc); }
        } catch {}
      }
    }
    onComplete?.(acc);
  } catch (err) {
    onError?.(err.message);
  }
}
