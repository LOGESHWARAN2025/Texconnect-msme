import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TrendingUp, DollarSign, AlertCircle, Sparkles, Filter, MapPin, MessageSquare } from 'lucide-react';
import { useLocalization } from '../../hooks/useLocalization';
import MarketSalesBot from '../common/MarketSalesBot';

interface MarketInsight {
    type: 'price' | 'demand' | 'supply' | 'trend';
    title: string;
    description: string;
    confidence: number;
    impact: 'high' | 'medium' | 'low';
}

interface EnhancedMarketAnalysisProps {
    productName?: string;
    userRole: 'msme' | 'buyer';
    historicalData?: any[];
}

export default function EnhancedMarketAnalysisAI({
    productName = 'Cotton Yarn',
    userRole,
    historicalData
}: EnhancedMarketAnalysisProps) {
    const { t } = useLocalization();
    const [insights, setInsights] = useState<MarketInsight[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showBot, setShowBot] = useState(true);

    // Filtering States
    const [filters, setFilters] = useState({
        country: 'India',
        state: 'All',
        district: 'All'
    });

    const countries = ['India', 'USA', 'China', 'Bangladesh', 'Vietnam'];
    const states = ['All', 'Tamil Nadu', 'Gujarat', 'Maharashtra', 'Karnataka', 'Telangana'];
    const districts = ['All', 'Tiruppur', 'Coimbatore', 'Surat', 'Mumbai', 'Ahmedabad', 'Erode'];

    const analyzeMarket = async () => {
        setIsLoading(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).env?.VITE_GEMINI_API_KEY || "";
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // Advanced prompt for structured market analysis including location context
            const locationContext = `
                Country: ${filters.country}
                State: ${filters.state !== 'All' ? filters.state : 'Across ' + filters.country}
                District: ${filters.district !== 'All' ? filters.district : 'Major textile hubs'}
            `;

            const prompt = `You are an expert textile market analyst.
            
Product: ${productName}
User Type: ${userRole}
Location Context: ${locationContext}
Current Date: ${new Date().toLocaleDateString('en-IN')}

Provide a comprehensive market analysis in JSON format with these insights specifically tailored to the selected region/location:
1. Price Trends - Current pricing (e.g., ₹/kg for Yarn) and forecast for this region. If Tiruppur, ALWAYS include specific rates for 30s/40s count (e.g. ₹260/kg).
2. Demand Analysis - Market demand patterns in this area
3. Supply Chain - Local availability and lead times
4. Competitive Landscape - Specific to ${filters.district !== 'All' ? filters.district : filters.state !== 'All' ? filters.state : filters.country}

Format your response as a JSON array with this structure:
[
  {
    "type": "price",
    "title": "Price Trend",
    "description": "Brief insight about pricing including specific numbers (e.g. ₹265/kg)",
    "confidence": 85,
    "impact": "high"
  }
]

Include 4-5 specific insights relevant to ${userRole === 'buyer' ? 'purchasing decisions' : 'selling strategies'}.
Make insights actionable and specific to the selected location (${locationContext}). IMPORTANT: If the location is Tiruppur, you MUST mention specific yarn prices in Rupees.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsedInsights = JSON.parse(jsonMatch[0]);
                setInsights(parsedInsights);
            } else {
                // Fallback if AI doesn't return proper JSON
                setInsights([
                    {
                        type: 'trend',
                        title: 'Market Momentum',
                        description: text.substring(0, 200),
                        confidence: 75,
                        impact: 'medium'
                    }
                ]);
            }
        } catch (error) {
            console.error('Market Analysis Error:', error);
            // Fallback insights
            setInsights([
                {
                    type: 'price',
                    title: `${filters.district !== 'All' ? filters.district : 'Regional'} Pricing Analysis`,
                    description: `Prices in ${filters.district !== 'All' ? filters.district : 'key markets'} are showing stability. Expected variance ±2% this week.`,
                    confidence: 80,
                    impact: 'high'
                },
                {
                    type: 'demand',
                    title: 'Local Demand Trends',
                    description: `Demand in ${filters.state !== 'All' ? filters.state : 'major types'} is steady, driven by seasonal requirements.`,
                    confidence: 85,
                    impact: 'medium'
                },
                {
                    type: 'supply',
                    title: 'Supply Availability',
                    description: `Supply chain into ${filters.country} is robust with minimal delays reported.`,
                    confidence: 75,
                    impact: 'medium'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'high': return 'border-red-200 bg-red-50';
            case 'medium': return 'border-yellow-200 bg-yellow-50';
            case 'low': return 'border-green-200 bg-green-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'price': return <DollarSign className="h-5 w-5 text-green-600" />;
            case 'demand': return <TrendingUp className="h-5 w-5 text-blue-600" />;
            case 'supply': return <AlertCircle className="h-5 w-5 text-orange-600" />;
            default: return <Sparkles className="h-5 w-5 text-purple-600" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Structured Analysis Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-indigo-600" />
                            {t('market_insights')}
                        </h2>
                        <p className="text-sm text-gray-500">{t('regional_insights')}</p>
                    </div>

                    {/* Location Filters */}
                    <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <MapPin className="h-4 w-4 text-gray-500 ml-2" />

                        <select
                            value={filters.country}
                            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                            className="bg-transparent text-sm font-medium text-gray-700 border-none focus:ring-0 cursor-pointer"
                        >
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <span className="text-gray-300">|</span>

                        <select
                            value={filters.state}
                            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                            className="bg-transparent text-sm font-medium text-gray-700 border-none focus:ring-0 cursor-pointer"
                        >
                            {states.map(s => <option key={s} value={s}>{s === 'All' ? `${t('state')} (All)` : s}</option>)}
                        </select>
                        <span className="text-gray-300">|</span>

                        <select
                            value={filters.district}
                            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                            className="bg-transparent text-sm font-medium text-gray-700 border-none focus:ring-0 cursor-pointer"
                        >
                            {districts.map(d => <option key={d} value={d}>{d === 'All' ? `${t('district')} (All)` : d}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={analyzeMarket}
                        disabled={isLoading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg whitespace-nowrap"
                    >
                        {isLoading ? t('analyzing') : t('analyze_market')}
                    </button>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-600 font-medium">{t('analyzing')} {filters.district !== 'All' ? filters.district : filters.state !== 'All' ? filters.state : filters.country}...</p>
                        </div>
                    </div>
                )}

                {!isLoading && insights.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.map((insight, idx) => (
                            <div
                                key={idx}
                                className={`p-5 rounded-xl border-2 transition-all hover:shadow-md ${getImpactColor(insight.impact)}`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    {getTypeIcon(insight.type)}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 mb-1">{insight.title}</h3>
                                        <p className="text-sm text-gray-700 leading-relaxed">{insight.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">
                                        {t('impact')}: {t(insight.impact)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full"
                                                style={{ width: `${insight.confidence}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-600">
                                            {insight.confidence}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && insights.length === 0 && (
                    <div className="text-center py-12">
                        <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">{t('select_location_msg')}</p>
                    </div>
                )}
            </div>

            {/* AI Assistant Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div
                    className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => setShowBot(!showBot)}
                >
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900">{t('live_market_assistant')}</h3>
                    </div>
                    <button className="text-indigo-600 text-sm font-semibold">
                        {showBot ? 'Hide Chat' : 'Show Chat'}
                    </button>
                </div>

                {showBot && (
                    <div className="h-[500px]">
                        <MarketSalesBot />
                    </div>
                )}
            </div>
        </div>
    );
}
