import type { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

const extractJsonArray = (text: string): MarketInsight[] | null => {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing GEMINI_API_KEY on server' })
    };
  }

  const body = event.body ? JSON.parse(event.body) : {};
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
  } catch {
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
- If you do not have reliable live data, explicitly say "estimate" and provide ranges instead of exact numbers.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;

      return {
        statusCode: 200,
        body: JSON.stringify({ text: response.text(), meta: { liveDataAvailable } })
      };
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

    return {
      statusCode: 200,
      body: JSON.stringify(parsed ? { insights: parsed } : { insights: [], raw: text })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Market insights generation failed', details: err?.message || String(err) })
    };
  }
};
