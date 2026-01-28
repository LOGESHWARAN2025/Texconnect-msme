import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Package, Users, Shield, Award } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    rating?: number;
    supplier?: string;
    stock?: number;
}

interface RecommendationScore {
    product: Product;
    score: number;
    reasons: string[];
}

interface ProductRecommendationProps {
    userId: string;
    userRole: 'buyer' | 'msme';
    userHistory?: any[];
    availableProducts: Product[];
}

export default function ProductRecommendationAI({
    userId,
    userRole,
    userHistory = [],
    availableProducts = []
}: ProductRecommendationProps) {
    const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [algorithm, setAlgorithm] = useState<'collaborative' | 'content' | 'hybrid'>('hybrid');

    /**
     * Content-Based Filtering
     * Recommends products similar to what user has purchased before
     */
    const contentBasedFiltering = (products: Product[], history: any[]) => {
        if (history.length === 0) return [];

        // Extract categories from user history
        const preferredCategories = history.map(h => h.category || 'General');
        const categoryFrequency: Record<string, number> = {};

        preferredCategories.forEach(cat => {
            categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
        });

        // Score products based on category match
        return products.map(product => {
            const categoryScore = (categoryFrequency[product.category] || 0) * 30;
            const priceScore = product.price < 500 ? 20 : 10; // Prefer affordable items
            const stockScore = (product.stock || 0) > 50 ? 15 : 5;
            const ratingScore = (product.rating || 3) * 10;

            const totalScore = categoryScore + priceScore + stockScore + ratingScore;

            const reasons: string[] = [];
            if (categoryScore > 0) reasons.push(`Matches your ${product.category} preference`);
            if (ratingScore > 40) reasons.push(`Highly rated (${product.rating}★)`);
            if (stockScore === 15) reasons.push('Good stock availability');

            return {
                product,
                score: totalScore,
                reasons
            };
        });
    };

    /**
     * Collaborative Filtering (Simplified)
     * Recommends products that similar users purchased
     */
    const collaborativeFiltering = (products: Product[]) => {
        // In production, this would query similar users from database
        // For now, using popularity-based approach

        return products.map(product => {
            // Simulate popularity score
            const popularityScore = Math.random() * 50;
            const priceCompetitiveness = 500 / (product.price || 500) * 30;
            const ratingBonus = (product.rating || 3) * 10;

            const totalScore = popularityScore + priceCompetitiveness + ratingBonus;

            const reasons: string[] = [];
            if (popularityScore > 35) reasons.push('Popular among buyers like you');
            if (priceCompetitiveness > 20) reasons.push('Competitively priced');
            if (product.rating && product.rating >= 4) reasons.push('Excellent reviews');

            return {
                product,
                score: totalScore,
                reasons
            };
        });
    };

    /**
     * Hybrid Approach
     * Combines content-based and collaborative filtering
     */
    const hybridFiltering = (products: Product[], history: any[]) => {
        const contentScores = contentBasedFiltering(products, history);
        const collaborativeScores = collaborativeFiltering(products);

        // Merge scores (weighted average)
        return products.map((product, idx) => {
            const contentScore = contentScores[idx]?.score || 0;
            const collabScore = collaborativeScores[idx]?.score || 0;

            const hybridScore = (contentScore * 0.6) + (collabScore * 0.4);

            const reasons = [
                ...(contentScores[idx]?.reasons || []),
                ...(collaborativeScores[idx]?.reasons || [])
            ];

            return {
                product,
                score: hybridScore,
                reasons: [...new Set(reasons)].slice(0, 3) // Remove duplicates, max 3
            };
        });
    };

    /**
     * Generate AI Recommendations
     */
    const generateRecommendations = async () => {
        setIsAnalyzing(true);

        try {
            // Simulate ML processing time
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate sample products if none provided
            let products = availableProducts;
            if (products.length === 0) {
                products = [
                    { id: '1', name: 'Premium Cotton Yarn 40s', price: 280, category: 'Yarn', rating: 4.5, stock: 150, supplier: 'TN Mills' },
                    { id: '2', name: 'Silk Blend Fabric Roll', price: 450, category: 'Fabric', rating: 4.8, stock: 80, supplier: 'Gujarat Silk' },
                    { id: '3', name: 'Denim Blue Heavy Duty', price: 520, category: 'Denim', rating: 4.3, stock: 200, supplier: 'Surat Denim' },
                    { id: '4', name: 'Organic Linen Natural', price: 380, category: 'Fabric', rating: 4.7, stock: 60, supplier: 'Eco Textiles' },
                    { id: '5', name: 'Polyester Blend 65/35', price: 220, category: 'Yarn', rating: 4.2, stock: 300, supplier: 'Modern Mills' },
                    { id: '6', name: 'Pure Cotton Combed 60s', price: 320, category: 'Yarn', rating: 4.6, stock: 120, supplier: 'Coimbatore Co' },
                ];
            }

            // Run selected algorithm
            let scored: RecommendationScore[] = [];

            switch (algorithm) {
                case 'collaborative':
                    scored = collaborativeFiltering(products);
                    break;
                case 'content':
                    scored = contentBasedFiltering(products, userHistory);
                    break;
                case 'hybrid':
                default:
                    scored = hybridFiltering(products, userHistory);
                    break;
            }

            // Sort by score and take top 6
            const topRecommendations = scored
                .sort((a, b) => b.score - a.score)
                .slice(0, 6);

            setRecommendations(topRecommendations);

        } catch (error) {
            console.error('Recommendation error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        generateRecommendations();
    }, [algorithm, availableProducts.length]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-blue-600 bg-blue-50';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Award className="h-6 w-6 text-indigo-600" />
                        Product Recommendations AI
                    </h2>
                    <p className="text-sm text-gray-500">Personalized for your business needs</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value as any)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="hybrid">Hybrid AI</option>
                        <option value="collaborative">Collaborative</option>
                        <option value="content">Content-Based</option>
                    </select>

                    <button
                        onClick={generateRecommendations}
                        disabled={isAnalyzing}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {isAnalyzing ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-600 font-medium">Analyzing preferences...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((rec, idx) => (
                        <div
                            key={rec.product.id}
                            className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-indigo-200 transition-all group"
                        >
                            {/* Rank Badge */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {idx === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                                    <span className="text-xs font-black text-gray-400 uppercase">
                                        #{idx + 1} Match
                                    </span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(rec.score)}`}>
                                    {Math.round(rec.score)}%
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="mb-3">
                                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                    {rec.product.name}
                                </h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl font-black text-indigo-600">
                                        ₹{rec.product.price}
                                    </span>
                                    <span className="text-xs text-gray-500">/unit</span>
                                </div>

                                {rec.product.rating && (
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        <span className="text-sm font-semibold text-gray-700">
                                            {rec.product.rating}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Reasons */}
                            <div className="space-y-2 mb-4">
                                {rec.reasons.slice(0, 2).map((reason, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                        <p className="text-xs text-gray-600 leading-relaxed">{reason}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-1">
                                    <Package className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-500">{rec.product.stock} units</span>
                                </div>
                                {rec.product.supplier && (
                                    <div className="flex items-center gap-1">
                                        <Shield className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-500">{rec.product.supplier}</span>
                                    </div>
                                )}
                            </div>

                            <button className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all">
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Algorithm Info */}
            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-indigo-900 text-sm mb-1">
                            {algorithm === 'hybrid' ? '🤖 Hybrid AI Algorithm' :
                                algorithm === 'collaborative' ? '👥 Collaborative Filtering' :
                                    '📊 Content-Based Filtering'}
                        </h4>
                        <p className="text-xs text-indigo-700 leading-relaxed">
                            {algorithm === 'hybrid'
                                ? 'Combines your purchase history with similar buyer patterns for optimal recommendations.'
                                : algorithm === 'collaborative'
                                    ? 'Recommends products based on what similar buyers purchased.'
                                    : 'Recommends products similar to your past purchases and preferences.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
