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

  const liveDataAvailable = Boolean(liveCotton);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    if (mode === 'chat') {
      const prompt = `You are TexConnect AI Market Assistant.
User role: ${String(userRole)}
Location Context:\n${locationContext}
Live commodity data (if available):\n${liveCotton ? JSON.stringify(liveCotton) : 'Not available'}
Task: Provide market insights for this query: ${String(userMsg)}
Rules:
- Be concise and actionable
- Use bullet points when helpful
- If you mention pricing, include units (e.g. ₹/kg)
- If you do not have reliable live data, explicitly say "estimate" and provide ranges instead of exact numbers.
- If live commodity data is NOT available, do NOT claim specific facts about specific cities/regions (e.g. "Tiruppur exports are up 5% this week"). Only provide general guidance and explain that live feed is unavailable.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.status(200).json({ text: response.text(), meta: { liveDataAvailable } });
      return;
    }

    const prompt = `You are an expert textile market analyst.

Product: ${productName}
User Type: ${String(userRole)}
Location Context: ${locationContext}
Current Date: ${new Date().toLocaleDateString('en-IN')}
Live commodity data (if available):\n${liveCotton ? JSON.stringify(liveCotton) : 'Not available'}

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
If you are unsure about real-time prices, clearly label them as estimates and provide ranges.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = extractJsonArray(text);
    if (!parsed) {
      res.status(200).json({ insights: [], raw: text });
      return;
    }

    res.status(200).json({ insights: parsed });
  } catch (err: any) {
    res.status(500).json({ error: 'Market insights generation failed', details: err?.message || String(err) });
  }
}
