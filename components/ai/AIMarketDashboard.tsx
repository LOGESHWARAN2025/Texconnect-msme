import React, { useState } from 'react';
import { TrendingUp, DollarSign, Award, Sparkles, BarChart3, Brain } from 'lucide-react';
import EnhancedMarketAnalysisAI from './EnhancedMarketAnalysisAI';
import PriceForecastingAI from './PriceForecastingAI';
import ProductRecommendationAI from './ProductRecommendationAI';

interface AIMarketDashboardProps {
    userId: string;
    userRole: 'msme' | 'buyer';
    products?: any[];
    userHistory?: any[];
}

type AIView = 'overview' | 'insights' | 'forecast' | 'recommendations';

export default function AIMarketDashboard({
    userId,
    userRole,
    products = [],
    userHistory = []
}: AIMarketDashboardProps) {
    const [currentView, setCurrentView] = useState<AIView>('overview');

    const aiModules = [
        {
            id: 'insights' as AIView,
            title: 'Market Insights',
            description: 'LLM-powered market intelligence',
            icon: Sparkles,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            tech: 'Google Gemini AI'
        },
        {
            id: 'forecast' as AIView,
            title: 'Price Forecasting',
            description: 'Time series predictions',
            icon: TrendingUp,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            tech: 'Regression + Moving Avg'
        },
        {
            id: 'recommendations' as AIView,
            title: 'Smart Recommendations',
            description: 'Personalized product matches',
            icon: Award,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600',
            tech: 'Hybrid Filtering AI'
        }
    ];

    const renderContent = () => {
        switch (currentView) {
            case 'insights':
                return (
                    <EnhancedMarketAnalysisAI
                        productName="Cotton Yarn"
                        userRole={userRole}
                        historicalData={[]}
                    />
                );

            case 'forecast':
                return (
                    <PriceForecastingAI
                        productName="Cotton Yarn"
                        forecastDays={30}
                    />
                );

            case 'recommendations':
                return (
                    <ProductRecommendationAI
                        userId={userId}
                        userRole={userRole}
                        availableProducts={products}
                        userHistory={userHistory}
                    />
                );

            case 'overview':
            default:
                return (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Brain className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-black uppercase tracking-tight">
                                                TexConnect AI Suite
                                            </h1>
                                            <p className="text-indigo-100 text-sm font-medium">
                                                Advanced Market Intelligence Platform
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-indigo-100 max-w-2xl leading-relaxed">
                                        Leverage cutting-edge artificial intelligence for real-time market analysis,
                                        predictive insights, and personalized recommendations tailored
                                        for the Indian textile industry.
                                    </p>
                                </div>
                                <div className="hidden md:block">
                                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                                            User Role
                                        </p>
                                        <p className="text-xl font-black uppercase mt-1">
                                            {userRole}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Modules Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {aiModules.map((module) => (
                                <button
                                    key={module.id}
                                    onClick={() => setCurrentView(module.id)}
                                    className="text-left bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-xl transition-all group"
                                >
                                    <div className={`w-14 h-14 rounded-xl ${module.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <module.icon className={`h-7 w-7 ${module.textColor}`} />
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {module.title}
                                    </h3>

                                    <p className="text-sm text-gray-600 mb-4">
                                        {module.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {module.tech}
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                            <svg className="w-4 h-4 text-indigo-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Feature Comparison */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <BarChart3 className="h-6 w-6 text-indigo-600" />
                                AI Capabilities Comparison
                            </h2>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-3 px-4 font-bold text-gray-700">Feature</th>
                                            <th className="text-center py-3 px-4 font-bold text-purple-600">Market Insights</th>
                                            <th className="text-center py-3 px-4 font-bold text-blue-600">Price Forecast</th>
                                            <th className="text-center py-3 px-4 font-bold text-green-600">Recommendations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        <tr className="border-b border-gray-100">
                                            <td className="py-3 px-4 font-medium text-gray-700">AI Type</td>
                                            <td className="py-3 px-4 text-center text-gray-600">LLM (Generative)</td>
                                            <td className="py-3 px-4 text-center text-gray-600">Time Series ML</td>
                                            <td className="py-3 px-4 text-center text-gray-600">Collaborative Filtering</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-3 px-4 font-medium text-gray-700">Real-time Updates</td>
                                            <td className="py-3 px-4 text-center">✅</td>
                                            <td className="py-3 px-4 text-center">⏱️ Periodic</td>
                                            <td className="py-3 px-4 text-center">✅</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-3 px-4 font-medium text-gray-700">Accuracy</td>
                                            <td className="py-3 px-4 text-center font-semibold text-purple-600">85-90%</td>
                                            <td className="py-3 px-4 text-center font-semibold text-blue-600">75-85%</td>
                                            <td className="py-3 px-4 text-center font-semibold text-green-600">80-90%</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-3 px-4 font-medium text-gray-700">Best For</td>
                                            <td className="py-3 px-4 text-center text-xs text-gray-600">Trend Analysis</td>
                                            <td className="py-3 px-4 text-center text-xs text-gray-600">Price Planning</td>
                                            <td className="py-3 px-4 text-center text-xs text-gray-600">Product Discovery</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-4 font-medium text-gray-700">Response Time</td>
                                            <td className="py-3 px-4 text-center text-xs text-gray-600">2-3 sec</td>
                                            <td className="py-3 px-4 text-center text-xs text-gray-600">1-2 sec</td>
                                            <td className="py-3 px-4 text-center text-xs text-gray-600">\u003c1 sec</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-indigo-400" />
                                    AI Technologies Used
                                </h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                                        Google Gemini 1.5 Flash (LLM)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        Linear Regression + Moving Average
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                        Collaborative & Content-Based Filtering
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                        React + TypeScript + Recharts
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                                <h3 className="text-lg font-bold mb-4 text-gray-900">
                                    🚀 Coming Soon
                                </h3>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                        Sentiment Analysis (News & Reviews)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                        Anomaly Detection (Price Spikes)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                        Deep Learning LSTM Models
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                        Computer Vision (Product Quality)
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            {/* Navigation Breadcrumb */}
            {currentView !== 'overview' && (
                <div className="mb-6">
                    <button
                        onClick={() => setCurrentView('overview')}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to AI Dashboard
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {renderContent()}
            </div>
        </div>
    );
}
