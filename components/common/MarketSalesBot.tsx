import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Bot, Sparkles, MapPin, TrendingUp, Search, Globe, X } from 'lucide-react';
import { TranslatedText } from '../common/TranslatedText';
import { fetchMarketChatReply } from '../../src/services/market/marketInsightsService';

interface MarketData {
    state: string;
    product: string;
    trend: 'up' | 'down' | 'stable';
    change: string;
    volume: string;
}

export default function MarketSalesBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([
        { role: 'bot', content: "Hello! I'm your TexConnect AI Market Assistant, powered by TexPro API. I can provide live insights into textile market sales and trends across India. How can I help you today?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [marketTrends, setMarketTrends] = useState<MarketData[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Simulating data fetch from TexPro API
        setMarketTrends([
            { state: 'Tamil Nadu', product: 'Cotton Yarn', trend: 'up', change: '+2.4%', volume: 'High' },
            { state: 'Gujarat', product: 'Polyester Blend', trend: 'stable', change: '0%', volume: 'Medium' },
            { state: 'Maharashtra', product: 'Denim', trend: 'down', change: '-1.2%', volume: 'Low' }
        ]);
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const result = await fetchMarketChatReply({
                userRole: 'buyer',
                filters: { country: 'India', state: 'All', district: 'All' },
                userMsg
            });

            if (result?.error) {
                setMessages(prev => [...prev, { role: 'bot', content: `${result.error}${result.details ? ` (${result.details})` : ''}` }]);
                return;
            }

            setMessages(prev => [...prev, { role: 'bot', content: result?.text || 'No response' }]);
        } catch (error) {
            console.error("AI Assistant Error:", error);
            setMessages(prev => [...prev, { role: 'bot', content: error instanceof Error ? error.message : 'Unexpected error' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">TexConnect Market AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-indigo-100 font-medium uppercase tracking-wider">Powered by TexPro API</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-200" />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden lg:flex-row flex-col">
                {/* Live Trends Sidebar */}
                <div className="lg:w-64 bg-gray-50 border-r border-gray-100 p-4 overflow-y-auto hidden lg:block">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-4">State-wise Trends</h4>
                    <div className="space-y-3">
                        {marketTrends.map((trend, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 group hover:border-indigo-300 transition-all cursor-default">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-gray-700">{trend.state}</span>
                                    {trend.trend === 'up' ? (
                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 mb-2">{trend.product}</p>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[10px] font-black ${trend.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                        {trend.change}
                                    </span>
                                    <span className="text-[9px] font-medium text-gray-400">{trend.volume}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-h-[400px]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-4" style={{ scrollbarWidth: 'none' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {msg.role === 'bot' && <Sparkles className="h-3 w-3 text-indigo-500" />}
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                            {msg.role === 'user' ? 'You' : 'TexConnect AI'}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">Fetching insights from TexPro API...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about product prices, state levels, or trends..."
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-200"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mt-3 px-1">
                            <button className="text-[10px] font-bold text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                                <Search className="h-3 w-3" />
                                Surat Cotton Prices
                            </button>
                            <button className="text-[10px] font-bold text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Tiruppur Export Trend
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
