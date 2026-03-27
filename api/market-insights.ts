import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

type UserRole = 'msme' | 'buyer';

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

const getGeminiModelName = () => {
  const envModel = process.env.GEMINI_MODEL;
  if (envModel && String(envModel).trim()) return String(envModel).trim();

  return 'gemini-1.5-flash';
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

const fetchLiveCottonMarketData = async (baseCurrency: string) => {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST;

  if (!key || !host) {
    return null;
  }

  const url = `https://${host}/rates?base_currency=${encodeURIComponent(baseCurrency)}&symbols=COTTON`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': host
      }
    },
    8000
  );

  if (!res.ok) {
    return null;
  }

  const contentType = res.headers.get('content-type') || '';
  const raw = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!raw || typeof raw === 'string') {
    return null;
  }

  const data = raw as RapidApiCommoditiesMarketDataResponse;
  if (!data.success || !data.rates) {
    return null;
  }

  return {
    base_currency: data.base_currency || baseCurrency,
    cotton: data.rates?.COTTON || null,
    provider: 'rapidapi'
  };
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
      url: a?.url,
      title: a?.title,
      sourceCountry: a?.sourceCountry,
      sourceCollection: a?.sourceCollection,
      language: a?.language,
      seendate: a?.seendate
    }))
    .filter((d) => d.url && d.title)
    .slice(0, params.maxRecords);

  return { provider: 'gdelt', query: params.query, docs };
};

const readBody = async (req: VercelRequest): Promise<any> => {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks: Uint8Array[] = [];
  for await (const chunk of req as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const extractJsonArray = (text: string): MarketInsight[] | null => {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing GEMINI_API_KEY on server' });
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
  try {
    liveCotton = await fetchLiveCottonMarketData(baseCurrency);
  } catch (e) {
    liveCotton = null;
  }

  let alphaVantageCotton: any = null;
  try {
    alphaVantageCotton = await fetchAlphaVantageCottonSignal();
  } catch {
    alphaVantageCotton = null;
  }

  let gdeltNews: any = null;
  try {
    const q = `(${String(productName)} OR cotton OR yarn OR fabric OR textile) (India OR global)`;
    gdeltNews = await fetchGdeltTextileNews({ query: q, maxRecords: 8 });
  } catch {
    gdeltNews = null;
  }

  const liveDataAvailable = Boolean(liveCotton || alphaVantageCotton || gdeltNews);
  const meta = {
    liveDataAvailable,
    used: {
      rapidapiCotton: Boolean(liveCotton),
      alphaVantageCotton: Boolean(alphaVantageCotton),
      gdeltNews: Boolean(gdeltNews)
    },
    generatedAt: new Date().toISOString()
  };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const preferredModelName = getGeminiModelName();
    const fallbackModelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    const modelNames = [preferredModelName, ...fallbackModelNames].filter(
      (v, i, a) => Boolean(v) && a.indexOf(v) === i
    );

    const tryGenerate = async (prompt: string) => {
      let lastErr: any;
      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        } catch (e: any) {
          lastErr = e;
          const msg = String(e?.message || e);
          const notFound = msg.includes('404') || msg.toLowerCase().includes('not found');
          if (!notFound) throw e;
        }
      }
      throw lastErr;
    };

    if (mode === 'chat') {
      const prompt = `You are TexConnect AI Market Assistant.
User role: ${String(userRole)}
Location Context:\n${locationContext}
Current timestamp (ISO): ${new Date().toISOString()}
Live commodity data (if available):\n${liveCotton ? JSON.stringify(liveCotton) : 'Not available'}
Additional commodity signal (if available):\n${alphaVantageCotton ? JSON.stringify(alphaVantageCotton) : 'Not available'}
Latest textile news (if available):\n${gdeltNews ? JSON.stringify(gdeltNews) : 'Not available'}
Task: Provide market insights for this query: ${String(userMsg)}
Rules:
- Be concise and actionable
- Use bullet points when helpful
- If you mention pricing, include units (e.g. ₹/kg)
- If you do not have reliable live data, explicitly say "estimate" and provide ranges instead of exact numbers.
- If you cite news, include the headline + date and paste the source URL.
- Do NOT invent exact numbers or exact percentage changes unless they appear in the live data or news text above.
- If live data is NOT available, do NOT claim specific facts about specific cities/regions (e.g. "Tiruppur exports are up 5% this week"). Only provide general guidance and explain that live feed is unavailable.`;

      const text = await tryGenerate(prompt);
      res.status(200).json({ text, meta });
      return;
    }

    const prompt = `You are an expert textile market analyst.

Product: ${productName}
User Type: ${String(userRole)}
Location Context: ${locationContext}
Current timestamp (ISO): ${new Date().toISOString()}
Live commodity data (if available):\n${liveCotton ? JSON.stringify(liveCotton) : 'Not available'}
Additional commodity signal (if available):\n${alphaVantageCotton ? JSON.stringify(alphaVantageCotton) : 'Not available'}
Latest textile news (if available):\n${gdeltNews ? JSON.stringify(gdeltNews) : 'Not available'}

Provide a comprehensive market analysis in JSON format with these insights tailored to the selected region/location:
1. Price Trends - pricing and forecast for this region
2. Demand Analysis - demand patterns
3. Supply Chain - availability and lead times
4. Competitive Landscape

Format your response as a JSON array:
[
  {
    "type": "price",
    "title": "Price Trend",
    "description": "Include pricing info with units (e.g. ₹265/kg)",
    "confidence": 85,
    "impact": "high"
  }
]

Include 4-5 specific insights relevant to ${String(userRole) === 'buyer' ? 'purchasing decisions' : 'selling strategies'}.
If you are unsure about real-time prices, clearly label them as estimates and provide ranges.
If you cite news, include headline + date + URL in the description.
Do NOT invent exact prices or exact percentages unless present in the live data or news above.`;

    const text = await tryGenerate(prompt);

    const parsed = extractJsonArray(text);
    if (!parsed) {
      res.status(200).json({ insights: [], raw: text, meta });
      return;
    }

    res.status(200).json({ insights: parsed, meta });
  } catch (err: any) {
    res.status(500).json({ error: 'Market insights generation failed', details: err?.message || String(err) });
  }
}
