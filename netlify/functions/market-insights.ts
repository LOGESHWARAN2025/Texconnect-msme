import type { Handler } from '@netlify/functions';

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
  rates?: Record<string, { open?: number; high?: number; low?: number; prev?: number; current?: number }>;
};

type GdeltDoc = {
  url?: string; title?: string; sourceCountry?: string; language?: string; seendate?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRateLimitError = (e: any) => {
  const msg = String(e?.message || e);
  return msg.includes('429') || msg.toLowerCase().includes('resource_exhausted') ||
    msg.toLowerCase().includes('too many requests') || msg.toLowerCase().includes('quota');
};

const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
};

const fetchLiveCottonMarketData = async (baseCurrency: string) => {
  const key = process.env.RAPIDAPI_KEY, host = process.env.RAPIDAPI_HOST;
  if (!key || !host) return null;
  const res = await fetchWithTimeout(
    `https://${host}/rates?base_currency=${encodeURIComponent(baseCurrency)}&symbols=COTTON`,
    { method: 'GET', headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host } }, 8000
  );
  if (!res.ok) return null;
  const raw = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  const data = raw as RapidApiCommoditiesMarketDataResponse;
  if (!data?.success || !data?.rates) return null;
  return { base_currency: data.base_currency || baseCurrency, cotton: data.rates?.COTTON || null, provider: 'rapidapi' };
};

const fetchAlphaVantageCottonSignal = async () => {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;
  const res = await fetchWithTimeout(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=COTTON&apikey=${encodeURIComponent(key)}`,
    { method: 'GET' }, 8000
  );
  if (!res.ok) return null;
  const raw = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  return raw ? { provider: 'alphavantage', raw } : null;
};

const fetchGdeltTextileNews = async (q: string, maxRecords: number) => {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&format=json&maxrecords=${maxRecords}&sort=datedesc`;
  const res = await fetchWithTimeout(url, { method: 'GET' }, 8000);
  if (!res.ok) return null;
  const raw = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!raw) return null;
  const docs: GdeltDoc[] = ((raw?.articles || raw?.documents || []) as any[])
    .map((a: any) => ({ url: a?.url, title: a?.title, sourceCountry: a?.sourceCountry, language: a?.language, seendate: a?.seendate }))
    .filter((d) => d.url && d.title).slice(0, maxRecords);
  return { provider: 'gdelt', query: q, docs };
};

const extractJsonArray = (text: string): MarketInsight[] | null => {
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
};

// ─── BUILT-IN TEXTILE KNOWLEDGE BASE ─────────────────────────────────────────

const TEXTILE_KNOWLEDGE: Record<string, { priceRange: string; priceUnit: string; demand: string; supply: string; trend: string; risk: string; hubs: string }> = {
  'cotton yarn': {
    priceRange: '₹220–₹320', priceUnit: 'per kg',
    demand: 'High year-round; peaks Oct–Feb (winter apparel) and Apr–Jun (export season)',
    supply: 'Coimbatore, Tiruppur and Erode spinning mills (Tamil Nadu); Surat mills (Gujarat)',
    trend: 'Prices correlate with MSP of raw cotton (₹6,620/quintal); softened ~5% from 2024 peak due to global oversupply',
    risk: 'Raw cotton crop shortfall from monsoon failures can spike prices 15–25% in 4–6 weeks',
    hubs: 'Tiruppur, Coimbatore, Erode (TN); Surat, Amreli (GJ)'
  },
  'polyester blend': {
    priceRange: '₹80–₹160', priceUnit: 'per kg',
    demand: 'Steady; driven by readymade garments and domestic fast-fashion exports',
    supply: 'Reliance Industries (feedstock), Surat weavers, Bhiwandi processors',
    trend: 'Prices track crude oil (PTA/MEG feedstock); stable at current oil prices (~$75/bbl)',
    risk: 'Crude oil spike above $90/bbl lifts polyester prices by 8–12%',
    hubs: 'Surat (GJ), Bhiwandi (MH), Ludhiana (PB)'
  },
  'denim': {
    priceRange: '₹160–₹280', priceUnit: 'per meter',
    demand: 'Moderate; casualwear growing 6–8% YoY; EU and US export demand stable',
    supply: 'Arvind, Aarvee mills (Ahmedabad); Anand (GJ); Kolkata (WB)',
    trend: 'Premium stretch-denim ₹240–₹280; basic denim softened ~3% from 2024',
    risk: 'Power cost increases and water scarcity in Ahmedabad affect finishing costs',
    hubs: 'Ahmedabad, Anand (GJ); Kolkata (WB)'
  },
  'silk': {
    priceRange: '₹2,500–₹6,000', priceUnit: 'per kg (raw reeled)',
    demand: 'Seasonal; peaks Oct–Feb (wedding season); export demand to China and UAE',
    supply: 'Karnataka (Mysuru, Ramanagara) ~50% of India\'s raw silk; Assam (Muga, Eri)',
    trend: 'Mulberry silk prices rose ~8% in 2024 due to Chinese demand rebound',
    risk: 'Pebrine disease in silkworms; unseasonal rainfall in Karnataka affects cocoon yields',
    hubs: 'Ramanagara, Mysuru (KA); Sualkuchi (AS); Varanasi (UP)'
  },
  'linen': {
    priceRange: '₹350–₹700', priceUnit: 'per meter',
    demand: 'Growing 10–12% YoY; premium summer apparel and home-textile exports',
    supply: 'Imported flax from Belgium/France; processing in Kolkata and Bengaluru',
    trend: 'Natural fibre premium demand driving prices up 5–8% annually',
    risk: 'Import dependency on Europe; shipping delays and EUR/INR fluctuation spike lead times',
    hubs: 'Kolkata (WB), Bengaluru (KA), Mumbai (MH)'
  },
  'wool': {
    priceRange: '₹400–₹900', priceUnit: 'per kg',
    demand: 'Seasonal; Oct–Mar peak; hosiery and shawl segment growing',
    supply: 'Bikaner, Jodhpur (RJ) for domestic; Australian Merino imported for fine grades',
    trend: 'Prices softened 4–6% due to global wool surplus; Indian handloom wool stable',
    risk: 'Over 70% of fine wool is imported; AUD-INR fluctuations directly affect margins',
    hubs: 'Bikaner, Jodhpur (RJ); Amritsar, Ludhiana (PB)'
  },
  'khadi': {
    priceRange: '₹150–₹400', priceUnit: 'per meter',
    demand: 'Growing steadily; high demand for sustainable, breathable summer wear',
    supply: 'Widespread decentralized spinning/weaving clusters across rural India',
    trend: 'Premium organic Khadi commands 20-30% higher prices; strong govt push',
    risk: 'Handspun production capacity constraints during sudden high demand',
    hubs: 'Ahmedabad (GJ); Varanasi (UP); Murshidabad (WB)'
  },
  'pashmina': {
    priceRange: '₹8,000–₹25,000', priceUnit: 'per piece',
    demand: 'High luxury demand globally, peaks during winter (Nov-Feb)',
    supply: 'Sourced from Changthangi goats in Ladakh, handwoven strictly in Kashmir',
    trend: 'GI-tagged authentic Pashmina prices rising 8-10% YoY due to limited supply',
    risk: 'High risk of counterfeits; strict GI certification required',
    hubs: 'Srinagar (JK); Leh (Ladakh)'
  },
  'banarasi silk': {
    priceRange: '₹5,000–₹40,000+', priceUnit: 'per saree',
    demand: 'Extremely high during wedding seasons; staple for bridal wear',
    supply: 'Handwoven in Varanasi using pure silk and zari (gold/silver thread)',
    trend: 'Authentic handloom pieces appreciating in value; powerloom imitations drive volume',
    risk: 'Intense competition from cheaper powerloom duplicates from Surat',
    hubs: 'Varanasi (UP)'
  },
  'kanchipuram silk': {
    priceRange: '₹8,000–₹50,000+', priceUnit: 'per saree',
    demand: 'Peak during South Indian wedding and festival seasons (Diwali, Pongal)',
    supply: 'Handloom weaver clusters in Kanchipuram, pure mulberry silk with gold/silver zari',
    trend: 'GI tagged; prices stable but premium for intricate pure zari rising 5-7% annually',
    risk: 'Zari material (silver/gold) price volatility impacts final cost significantly',
    hubs: 'Kanchipuram (TN)'
  },
  'ikkat': {
    priceRange: '₹400–₹1,200', priceUnit: 'per meter',
    demand: 'Strong demand in contemporary ethnic wear and home decor',
    supply: 'Telangana (Pochampally), Odisha (Sambalpuri), and Gujarat (Patola)',
    trend: 'Pochampally Ikkat highly sought after; growing fusion-wear adoption',
    risk: 'Intensive manual resist-dyeing limits rapid scaling of authentic production',
    hubs: 'Pochampally (TG); Sambalpur (OD); Patan (GJ)'
  },
  'jamdani': {
    priceRange: '₹800–₹3,000', priceUnit: 'per meter',
    demand: 'High demand for premium summer sarees and high-end boutique fashion',
    supply: 'Woven in West Bengal (Navadvip, Shantipur) and Bangladesh',
    trend: 'Muslin Jamdani prices increasing due to shortage of highly skilled weavers',
    risk: 'Labor-intensive supplementary weft technique makes it hard to scale',
    hubs: 'Kolkata, Shantipur, Phulia (WB)'
  },
  'kalamkari': {
    priceRange: '₹250–₹800', priceUnit: 'per meter',
    demand: 'Stable demand in ethnic fashion seeking natural dyes',
    supply: 'Srikalahasti (hand-painted) and Machilipatnam (block-printed) styles in AP',
    trend: 'Natural dye authenticity is a major selling point but limits scalable production',
    risk: 'Dependent on flowing river water for color fixing; vulnerable to monsoons',
    hubs: 'Srikalahasti, Machilipatnam (AP)'
  },
  'bandhani': {
    priceRange: '₹300–₹1,500', priceUnit: 'per meter',
    demand: 'Consistent demand for festive wear, dupattas, and sarees',
    supply: 'Traditional tie-dye craft centered in Kutch/Jamnagar (GJ) and Rajasthan',
    trend: 'Artisan (hand-tied) pieces face price pressure from cheaper printed variants',
    risk: 'Manual tying process requires skilled artisans; labor shortages pushing up costs',
    hubs: 'Jamnagar, Bhuj (GJ); Jaipur, Jodhpur (RJ)'
  }
};

const getKnowledge = (product: string) => {
  const key = product.toLowerCase().trim();
  return TEXTILE_KNOWLEDGE[key] ||
    Object.entries(TEXTILE_KNOWLEDGE).find(([k]) => key.includes(k) || k.includes(key))?.[1] ||
    null;
};

const getStateTip = (state: string): string => {
  const s = (state || '').toLowerCase();
  if (s.includes('tamil') || s === 'tn') return 'Tamil Nadu is India\'s top textile hub — Tiruppur drives hosiery exports worth ₹35,000 Cr/year; Coimbatore leads yarn production.';
  if (s.includes('gujarat') || s === 'gj') return 'Gujarat accounts for ~40% of India\'s synthetic textile production; Surat is the polyester/silk weaving capital.';
  if (s.includes('maharashtra') || s === 'mh') return 'Maharashtra hosts Bhiwandi, Asia\'s largest powerloom hub, and Mumbai\'s key textile trading market.';
  if (s.includes('karnataka') || s === 'ka') return 'Karnataka is India\'s silk capital (Ramanagara) and hosts major garment export clusters in Bengaluru.';
  if (s.includes('punjab') || s === 'pb') return 'Punjab leads in hosiery (Ludhiana) and wool products; strong domestic and export demand.';
  if (s.includes('rajasthan') || s === 'rj') return 'Rajasthan excels in handicraft textiles, wool, and block-printed fabrics from Jaipur and Jodhpur.';
  if (s.includes('west bengal') || s === 'wb') return 'West Bengal is known for jute, silk (Murshidabad), and Dhaniakhali cotton sarees; Kolkata is a key trading hub.';
  return 'India\'s textile industry is the 2nd largest employer; major hubs span TN, GJ, MH, KA, PB, and WB.';
};

const buildOfflineChatReply = (userMsg: string, defaultProduct: string, state: string, userRole: string): string => {
  const msg = userMsg.toLowerCase();
  let detectedProduct = defaultProduct;
  if (/banarasi/i.test(msg)) detectedProduct = 'Banarasi Silk';
  else if (/kanchipuram|kanjeevaram/i.test(msg)) detectedProduct = 'Kanchipuram Silk';
  else if (/silk/i.test(msg)) detectedProduct = 'Silk'; // fallback for generic silk
  else if (/pashmina/i.test(msg)) detectedProduct = 'Pashmina';
  else if (/khadi/i.test(msg)) detectedProduct = 'Khadi';
  else if (/ikkat|ikat/i.test(msg)) detectedProduct = 'Ikkat';
  else if (/jamdani/i.test(msg)) detectedProduct = 'Jamdani';
  else if (/kalamkari/i.test(msg)) detectedProduct = 'Kalamkari';
  else if (/bandhani|bandhej/i.test(msg)) detectedProduct = 'Bandhani';
  else if (/polyester/i.test(msg)) detectedProduct = 'Polyester Blend';
  else if (/denim/i.test(msg)) detectedProduct = 'Denim';
  else if (/linen/i.test(msg)) detectedProduct = 'Linen';
  else if (/wool/i.test(msg)) detectedProduct = 'Wool';
  else if (/cotton/i.test(msg)) detectedProduct = 'Cotton Yarn';

  const kb = getKnowledge(detectedProduct);
  const stateTip = getStateTip(state);
  const prod = detectedProduct || 'textile products';
  const roleLabel = userRole === 'msme' ? 'seller' : 'buyer';

  if (msg.includes('price') || msg.includes('rate') || msg.includes('cost') || msg.includes('kg') || msg.includes('range')) {
    if (kb) {
      return `📊 **${prod} — Price Estimate (${state !== 'All' ? state : 'India'})**\n*(Knowledge-based estimate — no live API connected)*\n\n` +
        `• **Price range:** ${kb.priceRange} ${kb.priceUnit}\n` +
        `• **Demand:** ${kb.demand}\n• **Risk:** ${kb.risk}\n• **Key hubs:** ${kb.hubs}\n\n` +
        `💡 ${stateTip}\n\n_Prices vary ±10–15% by grade, quantity, and season. For live rates, check local mandi or ATEXPO._`;
    }
  }
  if (msg.includes('demand') || msg.includes('trend') || msg.includes('market')) {
    if (kb) {
      return `📈 **${prod} — Market Overview**\n\n• **Demand:** ${kb.demand}\n• **Supply:** ${kb.supply}\n• **Trend:** ${kb.trend}\n• **Risk:** ${kb.risk}\n\n💡 ${stateTip}`;
    }
  }
  if (msg.includes('supply') || msg.includes('availab') || msg.includes('stock')) {
    if (kb) {
      return `🏭 **${prod} — Supply Chain**\n\n• ${kb.supply}\n• Lead time: 3–7 days within state, 7–14 days cross-state\n• **Risk:** ${kb.risk}\n• ${stateTip}`;
    }
  }
  if (roleLabel === 'buyer' && (msg.includes('tip') || msg.includes('buy') || msg.includes('purchase') || msg.includes('advice'))) {
    if (kb) {
      return `🛒 **Buying Tips — ${prod}**\n\n• **Best price window:** Buy during Oct–Dec (cotton harvest) for lowest prices\n• **Target price:** ${kb.priceRange} ${kb.priceUnit}\n• **Preferred hubs:** ${kb.hubs}\n• **Negotiate on:** Payment terms, bulk discount (>500 kg), packaging\n• **Risk:** ${kb.risk}`;
    }
  }
  if (roleLabel === 'seller' && (msg.includes('tip') || msg.includes('sell') || msg.includes('advice'))) {
    if (kb) {
      return `💼 **Selling Strategy — ${prod}**\n\n• **Peak season:** ${kb.demand.split(';')[0]}\n• **Target price:** ${kb.priceRange} ${kb.priceUnit}\n• **Key buyers:** Export houses, garment manufacturers, IndiaMART, TradeIndia\n• **Risk to manage:** ${kb.risk}\n• ${stateTip}`;
    }
  }
  return kb
    ? `🤖 **TexConnect AI — ${prod}**\n\n• **Price estimate:** ${kb.priceRange} ${kb.priceUnit}\n• **Demand:** ${kb.demand}\n• **Trend:** ${kb.trend}\n• ${stateTip}\n\n_Add GROQ_API_KEY (free at console.groq.com) to Vercel for live AI responses._`
    : `🤖 **TexConnect Market Assistant**\n\n• ${stateTip}\n• For "${prod}" — check local mandi rates or ATEXPO for live pricing\n• India's textile exports target: $100 billion by 2030\n\n_Ask about Cotton Yarn, Polyester Blend, Silk, Denim, Linen, or Wool for detailed estimates._`;
};

const buildOfflineInsights = (product: string, state: string, userRole: string): MarketInsight[] => {
  const kb = getKnowledge(product);
  const stateTip = getStateTip(state);
  if (!kb) {
    return [
      { type: 'trend', title: 'India Textile Overview', description: stateTip, confidence: 80, impact: 'medium' },
      { type: 'demand', title: 'Market Demand', description: 'Indian textile demand growing at 6–8% CAGR; export target $100B by 2030.', confidence: 75, impact: 'high' },
      { type: 'supply', title: 'Supply Chain', description: 'Lead times: 3–7 days within state, 7–14 days cross-state. Cluster sourcing from TN, GJ, MH reduces cost.', confidence: 70, impact: 'medium' },
      { type: 'price', title: 'Pricing Guidance', description: 'Verify current rates through State Textile Corporation, IndiaMART, or local mandi.', confidence: 60, impact: 'high' }
    ];
  }
  const isBuyer = userRole !== 'msme';
  return [
    { type: 'price', title: `${product} Price Estimate`, description: `Estimated range: ${kb.priceRange} ${kb.priceUnit} (knowledge-based). ${isBuyer ? 'Negotiate 5–10% off for orders >500 kg.' : 'Premium grade commands top-end pricing.'}`, confidence: 70, impact: 'high' },
    { type: 'demand', title: 'Demand Pattern', description: kb.demand, confidence: 78, impact: 'high' },
    { type: 'supply', title: 'Supply Chain', description: `${kb.supply}. Key hubs: ${kb.hubs}. ${stateTip}`, confidence: 75, impact: 'medium' },
    { type: 'trend', title: 'Market Trend', description: kb.trend, confidence: 72, impact: 'medium' },
    { type: 'trend', title: 'Key Risk', description: kb.risk, confidence: 80, impact: 'high' }
  ];
};

// ─── LLM PROVIDERS ────────────────────────────────────────────────────────────

const tryGroq = async (prompt: string): Promise<string | null> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 1024, temperature: 0.7 })
        }, 25000);
        const data = await res.json() as any;
        if (!res.ok) {
          if (res.status === 429 && attempt === 0) { await sleep(3000); continue; }
          if (res.status === 404 || res.status === 400) break;
          throw new Error(`Groq ${res.status}: ${data?.error?.message}`);
        }
        const text = data?.choices?.[0]?.message?.content;
        if (typeof text === 'string' && text.trim()) return text;
      } catch (e: any) {
        if (isRateLimitError(e) && attempt === 0) { await sleep(3000); continue; }
        break;
      }
    }
  }
  return null;
};

const tryGemini = async (prompt: string): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'].filter((v, i, a) => a.indexOf(v) === i);
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }) },
          25000
        );
        const data = await res.json() as any;
        if (!res.ok) {
          const errMsg = data?.error?.message || '';
          if ((res.status === 429 || errMsg.toLowerCase().includes('quota')) && attempt < 2) { await sleep(4000 * Math.pow(2, attempt)); continue; }
          if (res.status === 404) break;
          throw new Error(`Gemini ${res.status}: ${errMsg}`);
        }
        const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('') || '';
        if (text.trim()) return text;
      } catch (e: any) {
        if (isRateLimitError(e) && attempt < 2) { await sleep(4000 * Math.pow(2, attempt)); continue; }
        break;
      }
    }
  }
  return null;
};

const tryGenerate = async (prompt: string): Promise<string | null> => {
  return await tryGroq(prompt) ?? await tryGemini(prompt) ?? null;
};

// ─── NETLIFY HANDLER ──────────────────────────────────────────────────────────

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const {
    productName = 'Cotton Yarn', userRole = 'buyer',
    filters = { country: 'India', state: 'All', district: 'All' },
    mode = 'insights', userMsg = ''
  } = body || {};

  const state: string = filters?.state || 'All';
  const locationContext =
    `Country: ${filters?.country || 'India'}\n` +
    `State: ${state !== 'All' ? state : 'Across India'}\n` +
    `District: ${filters?.district !== 'All' ? filters?.district : 'Major textile hubs'}`;

  const baseCurrency = (filters?.country || 'India') === 'India' ? 'INR' : 'USD';
  let liveCommodity: any = null, alphaVantageCommodity: any = null, recentNews: any = null;
  const isCotton = productName.toLowerCase().includes('cotton');

  if (isCotton) {
    try { liveCommodity = await fetchLiveCottonMarketData(baseCurrency); } catch { }
    try { alphaVantageCommodity = await fetchAlphaVantageCottonSignal(); } catch { }
  }

  try {
    const q = `"${String(productName)}" (price OR market OR export OR demand OR textile) (India OR global)`;
    recentNews = await fetchGdeltTextileNews(q, 8);
  } catch { }

  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasAI = hasGroq || hasGemini;

  const meta = {
    liveDataAvailable: Boolean(liveCommodity || alphaVantageCommodity || recentNews),
    provider: hasGroq ? 'groq' : hasGemini ? 'gemini' : 'offline-knowledge',
    used: { rapidapiCommodity: Boolean(liveCommodity), alphaVantageCommodity: Boolean(alphaVantageCommodity), gdeltNews: Boolean(recentNews) },
    generatedAt: new Date().toISOString()
  };

  if (mode === 'chat') {
    if (hasAI) {
      const prompt =
        `You are TexConnect AI Market Assistant for the Indian textile industry.\n` +
        `User role: ${String(userRole)}\nLocation:\n${locationContext}\nTimestamp: ${new Date().toISOString()}\n` +
        `Live data: ${liveCommodity ? JSON.stringify(liveCommodity) : 'Not available'}\n` +
        `Alpha Vantage: ${alphaVantageCommodity ? JSON.stringify(alphaVantageCommodity) : 'Not available'}\n` +
        `Recent news for ${productName}: ${recentNews ? JSON.stringify(recentNews) : 'Not available'}\n` +
        `Question: ${String(userMsg)}\nRules: concise (3-5 bullets), units (₹/kg), say "estimate" if no live data, don't invent facts.`;
      try {
        const text = await tryGenerate(prompt);
        if (text) return { statusCode: 200, body: JSON.stringify({ text, meta }) };
      } catch (e: any) {
        if (isRateLimitError(e)) return { statusCode: 503, body: JSON.stringify({ error: 'AI service temporarily busy.', rateLimited: true, meta }) };
      }
    }
    const text = buildOfflineChatReply(String(userMsg), String(productName), state, String(userRole));
    return { statusCode: 200, body: JSON.stringify({ text, meta, offline: !hasAI }) };
  }

  // insights mode
  if (hasAI) {
    const prompt =
      `Textile market analyst for India. Product: ${productName} | Role: ${String(userRole)} | ${locationContext}\n` +
      `Live data: ${liveCommodity ? JSON.stringify(liveCommodity) : 'Not available'}\n` +
      `Recent news for ${productName}: ${recentNews ? JSON.stringify(recentNews) : 'Not available'}\n` +
      `Return ONLY valid JSON array (no markdown): [{"type":"price|demand|supply|trend","title":"...","description":"...","confidence":75,"impact":"high|medium|low"}]\n` +
      `Tailor to ${String(userRole) === 'buyer' ? 'purchasing decisions' : 'selling strategies'}. Label estimates clearly.`;
    try {
      const text = await tryGenerate(prompt);
      if (text) {
        const parsed = extractJsonArray(text);
        return { statusCode: 200, body: JSON.stringify(parsed ? { insights: parsed, meta } : { insights: [], raw: text, meta }) };
      }
    } catch (e: any) {
      if (isRateLimitError(e)) return { statusCode: 503, body: JSON.stringify({ error: 'AI service temporarily busy.', rateLimited: true, meta }) };
    }
  }

  const insights = buildOfflineInsights(String(productName), state, String(userRole));
  return { statusCode: 200, body: JSON.stringify({ insights, meta, offline: !hasAI }) };
};
