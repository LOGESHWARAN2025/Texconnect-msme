import type { VercelRequest, VercelResponse } from '@vercel/node';

type MarketInsight = {
  type: 'price' | 'demand' | 'supply' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
};

type RapidApiCommoditiesMarketDataResponse = {
  success: boolean;
  errors?: unknown[];
  base_currency?: string;
  rates?: Record<
    string,
    {
      open?: number;
      high?: number;
      low?: number;
      prev?: number;
      current?: number;
    }
  >;
};

type GdeltDoc = {
  url?: string;
  title?: string;
  sourceCountry?: string;
  sourceCollection?: string;
  language?: string;
  seendate?: string;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRateLimitError = (e: any): boolean => {
  const msg = String(e?.message || e);
  return (
    msg.includes('429') ||
    msg.toLowerCase().includes('resource_exhausted') ||
    msg.toLowerCase().includes('too many requests') ||
    msg.toLowerCase().includes('quota')
  );
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
};

// ─── live market data fetchers ─────────────────────────────────────────────────

const fetchLiveCottonMarketData = async (baseCurrency: string) => {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST;
  if (!key || !host) return null;

  const url = `https://${host}/rates?base_currency=${encodeURIComponent(baseCurrency)}&symbols=COTTON`;
  const res = await fetchWithTimeout(url, {
    method: 'GET',
    headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host }
  }, 8000);
  if (!res.ok) return null;

  const contentType = res.headers.get('content-type') || '';
  const raw = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!raw || typeof raw === 'string') return null;

  const data = raw as RapidApiCommoditiesMarketDataResponse;
  if (!data.success || !data.rates) return null;

  return { base_currency: data.base_currency || baseCurrency, cotton: data.rates?.COTTON || null, provider: 'rapidapi' };
};

const fetchAlphaVantageCottonSignal = async () => {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=COTTON&apikey=${encodeURIComponent(key)}`;
  const res = await fetchWithTimeout(url, { method: 'GET' }, 8000);
  if (!res.ok) return null;

  const contentType = res.headers.get('content-type') || '';
  const raw = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!raw || typeof raw === 'string') return null;

  return { provider: 'alphavantage', raw };
};

const fetchGdeltTextileNews = async (params: { query: string; maxRecords: number }) => {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(params.query)}&mode=artlist&format=json&maxrecords=${encodeURIComponent(String(params.maxRecords))}&sort=datedesc`;
  const res = await fetchWithTimeout(url, { method: 'GET' }, 8000);
  if (!res.ok) return null;

  const contentType = res.headers.get('content-type') || '';
  const raw = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!raw || typeof raw === 'string') return null;

  const articles = (raw?.articles || raw?.documents || []) as any[];
  const docs: GdeltDoc[] = articles
    .map((a) => ({
      url: a?.url, title: a?.title, sourceCountry: a?.sourceCountry,
      sourceCollection: a?.sourceCollection, language: a?.language, seendate: a?.seendate
    }))
    .filter((d) => d.url && d.title)
    .slice(0, params.maxRecords);

  return { provider: 'gdelt', query: params.query, docs };
};

// ─── body reader ──────────────────────────────────────────────────────────────

const readBody = async (req: VercelRequest): Promise<any> => {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks: Uint8Array[] = [];
  for await (const chunk of req as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};

const extractJsonArray = (text: string): MarketInsight[] | null => {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try { return JSON.parse(jsonMatch[0]); } catch { return null; }
};

// ─── LLM providers ────────────────────────────────────────────────────────────

/**
 * Groq – FREE tier, no billing required.
 * Free limits: 30 req/min, 14,400 req/day on llama-3.3-70b-versatile
 * Sign up at https://console.groq.com and copy the key to GROQ_API_KEY env var.
 */
const tryGroq = async (prompt: string): Promise<string | null> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // Model priority list: fast & free models first
  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
  ];

  let lastErr: any;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetchWithTimeout(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 1024,
              temperature: 0.7
            })
          },
          25000
        );

        const data = await res.json() as any;

        if (!res.ok) {
          const errMsg = data?.error?.message || res.statusText;
          if (res.status === 429 && attempt === 0) {
            await sleep(3000);
            continue;
          }
          if (res.status === 404 || res.status === 400) break; // try next model
          throw new Error(`Groq ${res.status}: ${errMsg}`);
        }

        const text = data?.choices?.[0]?.message?.content;
        if (typeof text === 'string' && text.trim()) return text;
        throw new Error('Empty Groq response');

      } catch (e: any) {
        lastErr = e;
        if (isRateLimitError(e) && attempt === 0) {
          await sleep(3000);
          continue;
        }
        break;
      }
    }
  }

  console.warn('Groq failed:', lastErr?.message || lastErr);
  return null;
};

/**
 * Gemini – falls back to this only if GEMINI_API_KEY is set.
 * The FREE tier at ai.google.dev gives 15 RPM on gemini-1.5-flash (no billing needed).
 */
const tryGemini = async (prompt: string): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const models = [
    process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash'
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let lastErr: any;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
        }, 25000);

        const data = await res.json() as any;

        if (!res.ok) {
          const errMsg = data?.error?.message || res.statusText;
          if ((res.status === 429 || errMsg.toLowerCase().includes('quota')) && attempt < 2) {
            await sleep(4000 * Math.pow(2, attempt));
            continue;
          }
          if (res.status === 404) break;
          throw new Error(`Gemini ${res.status}: ${errMsg}`);
        }

        const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('') || '';
        if (text.trim()) return text;
        throw new Error('Empty Gemini response');

      } catch (e: any) {
        lastErr = e;
        if (isRateLimitError(e) && attempt < 2) {
          await sleep(4000 * Math.pow(2, attempt));
          continue;
        }
        break;
      }
    }
  }

  console.warn('Gemini failed:', lastErr?.message || lastErr);
  return null;
};

/** Tries Groq first (free), then Gemini. Throws if both fail. */
const generate = async (prompt: string): Promise<string> => {
  const groqResult = await tryGroq(prompt);
  if (groqResult) return groqResult;

  const geminiResult = await tryGemini(prompt);
  if (geminiResult) return geminiResult;

  throw new Error(
    'Both AI providers failed. Please set GROQ_API_KEY (free at console.groq.com) or GEMINI_API_KEY in your Vercel environment variables.'
  );
};

// ─── main handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  if (!hasGroq && !hasGemini) {
    res.status(500).json({
      error: 'No AI provider configured. Add GROQ_API_KEY (free) or GEMINI_API_KEY to your environment variables.',
      setup: 'Get a free Groq key at https://console.groq.com'
    });
    return;
  }

  const body = await readBody(req);

  const {
    productName = 'Cotton Yarn',
    userRole = 'buyer',
    filters = { country: 'India', state: 'All', district: 'All' },
    mode = 'insights',
    userMsg = ''
  } = body || {};

  const locationContext = `Country: ${filters.country}\nState: ${filters.state !== 'All' ? filters.state : 'Across ' + filters.country}\nDistrict: ${filters.district !== 'All' ? filters.district : 'Major textile hubs'}`;

  const baseCurrency = filters?.country === 'India' ? 'INR' : 'USD';
  let liveCotton: any = null;
  let alphaVantageCotton: any = null;
  let gdeltNews: any = null;

  try { liveCotton = await fetchLiveCottonMarketData(baseCurrency); } catch { liveCotton = null; }
  try { alphaVantageCotton = await fetchAlphaVantageCottonSignal(); } catch { alphaVantageCotton = null; }
  try {
    const q = `(${String(productName)} OR cotton OR yarn OR fabric OR textile) (India OR global)`;
    gdeltNews = await fetchGdeltTextileNews({ query: q, maxRecords: 8 });
  } catch { gdeltNews = null; }

  const liveDataAvailable = Boolean(liveCotton || alphaVantageCotton || gdeltNews);
  const meta = {
    liveDataAvailable,
    provider: hasGroq ? 'groq' : 'gemini',
    used: {
      rapidapiCotton: Boolean(liveCotton),
      alphaVantageCotton: Boolean(alphaVantageCotton),
      gdeltNews: Boolean(gdeltNews)
    },
    generatedAt: new Date().toISOString()
  };

  try {
    if (mode === 'chat') {
      const prompt = `You are TexConnect AI Market Assistant for the Indian textile industry.
User role: ${String(userRole)}
Location Context:\n${locationContext}
Current timestamp (ISO): ${new Date().toISOString()}
Live commodity data (if available):\n${liveCotton ? JSON.stringify(liveCotton) : 'Not available'}
Additional commodity signal (if available):\n${alphaVantageCotton ? JSON.stringify(alphaVantageCotton) : 'Not available'}
Latest textile news (if available):\n${gdeltNews ? JSON.stringify(gdeltNews) : 'Not available'}
Task: Answer this question: ${String(userMsg)}
Rules:
- Be concise and actionable (3-5 bullet points max)
- If you mention pricing, include units (e.g. ₹/kg)
- If live data is unavailable, say "estimate" and give ranges instead of exact numbers
- Do NOT invent specific facts about cities/regions unless they appear in the live data above
- If live data IS available, cite it explicitly`;

      const text = await generate(prompt);
      res.status(200).json({ text, meta });
      return;
    }

    const prompt = `You are an expert textile market analyst for India.

Product: ${productName}
User Type: ${String(userRole)}
Location Context: ${locationContext}
Current timestamp (ISO): ${new Date().toISOString()}
Live commodity data (if available):\n${liveCotton ? JSON.stringify(liveCotton) : 'Not available'}
Additional commodity signal (if available):\n${alphaVantageCotton ? JSON.stringify(alphaVantageCotton) : 'Not available'}
Latest textile news (if available):\n${gdeltNews ? JSON.stringify(gdeltNews) : 'Not available'}

Provide a market analysis as a JSON array with 4-5 insights:
[
  {
    "type": "price",
    "title": "Price Trend",
    "description": "Include pricing info with units (e.g. ₹265/kg). If unsure, label as 'estimate' and give a range.",
    "confidence": 75,
    "impact": "high"
  }
]

Types: "price", "demand", "supply", "trend"
Impact: "high", "medium", "low"
Tailor insights to ${String(userRole) === 'buyer' ? 'purchasing decisions' : 'selling strategies'}.
Respond with ONLY valid JSON array, no markdown fences.`;

    const text = await generate(prompt);
    const parsed = extractJsonArray(text);
    if (!parsed) {
      res.status(200).json({ insights: [], raw: text, meta });
      return;
    }
    res.status(200).json({ insights: parsed, meta });

  } catch (err: any) {
    const errMsg = String(err?.message || err);
    const isQuota = isRateLimitError(err);
    const statusCode = isQuota ? 503 : 500;
    const userFriendly = isQuota
      ? 'The AI service is temporarily busy. Please wait a moment and try again.'
      : errMsg;
    res.status(statusCode).json({ error: userFriendly, details: errMsg, rateLimited: isQuota });
  }
}
