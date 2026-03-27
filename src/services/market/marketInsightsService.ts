export type UserRole = 'msme' | 'buyer';

export type MarketInsight = {
  type: 'price' | 'demand' | 'supply' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
};

export type MarketFilters = {
  country: string;
  state: string;
  district: string;
};

type InsightsResponse =
  | { insights: MarketInsight[]; raw?: never; error?: never }
  | { insights: []; raw: string; error?: never }
  | { insights: []; raw?: never; error: string; details?: string };

type ChatResponse = { text?: string; error?: string; details?: string };

const getBaseUrl = () => {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocal) return 'http://localhost:8888/.netlify/functions';
  return '/.netlify/functions';
};

const buildEndpoints = () => {
  const netlifyBase = getBaseUrl();

  return {
    vercel: '/api/market-insights',
    netlify: `${netlifyBase}/market-insights`
  };
};

const postJson = async <T>(url: string, payload: any): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof data === 'string' ? data : data?.error || res.statusText;
    const details = typeof data === 'string' ? undefined : data?.details;
    throw new Error(details ? `${message}: ${details}` : message);
  }

  return data as T;
};

export const fetchMarketInsights = async (params: {
  productName: string;
  userRole: UserRole;
  filters: MarketFilters;
}): Promise<InsightsResponse> => {
  const endpoints = buildEndpoints();
  const payload = { ...params, mode: 'insights' };

  try {
    return await postJson<InsightsResponse>(endpoints.vercel, payload);
  } catch {
    try {
      return await postJson<InsightsResponse>(endpoints.netlify, payload);
    } catch (e: any) {
      return {
        insights: [],
        error: 'Market insights API unavailable',
        details: e?.message || String(e)
      };
    }
  }
};

export const fetchMarketChatReply = async (params: {
  userRole: UserRole;
  filters: MarketFilters;
  userMsg: string;
}): Promise<ChatResponse> => {
  const endpoints = buildEndpoints();
  const payload = { ...params, mode: 'chat' };

  try {
    return await postJson<ChatResponse>(endpoints.vercel, payload);
  } catch {
    try {
      return await postJson<ChatResponse>(endpoints.netlify, payload);
    } catch (e: any) {
      return { error: 'Market chat API unavailable', details: e?.message || String(e) };
    }
  }
};
