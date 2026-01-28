/**
 * Quick Integration Example
 * 
 * This file shows how to integrate the AI Market Analysis components
 * into your existing Buyer and MSME dashboards
 */

// ========================================
// EXAMPLE 1: Integration into Buyer Dashboard
// ========================================
/*
File: components/buyer/ModernBuyerDashboard.tsx

Step 1: Add import at the top
*/
import AIMarketDashboard from '../ai/AIMarketDashboard';

/*
Step 2: Update the BuyerView type to include 'ai-market'
*/
type BuyerView = 'browse' | 'orders' | 'issues' | 'profile' | 'dashboard' | 'market' | 'ai-market';

/*
Step 3: Update the renderContent() function to handle the new view
Replace the existing 'market' case or add 'ai-market' case:
*/
const renderContent = () => {
    switch (currentView) {
        // ... existing cases ...

        case 'ai-market':
            return (
                <AIMarketDashboard
                    userId={currentUser?.id || ''}
                    userRole="buyer"
                    products={products || []}
                    userHistory={orders || []}
                />
            );

        // ... rest of cases ...
    }
};

/*
Step 4: Add menu item in the sidebar navigation (around line 271-292)
*/
<button
    onClick={() => { setCurrentView('ai-market'); setSidebarOpen(false); }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'ai-market' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
    style={currentView === 'ai-market' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}
>
    <Brain className="h-5 w-5" />
    <span className="font-medium">AI Market Intelligence</span>
</button>

/*
Step 5: Update quick actions (around line 115-120) to include AI option
*/
const quickActions = [
    { icon: ShoppingBag, label: 'Browse Products', color: 'bg-indigo-600 hover:bg-indigo-700', onClick: () => setCurrentView('browse') },
    { icon: Brain, label: 'AI Insights', color: 'bg-purple-600 hover:bg-purple-700', onClick: () => setCurrentView('ai-market') },
    { icon: Package, label: 'My Orders', color: 'bg-green-600 hover:bg-green-700', onClick: () => setCurrentView('orders') },
    { icon: AlertCircle, label: 'Report Issue', color: 'bg-orange-600 hover:bg-orange-700', onClick: () => setCurrentView('issues') },
];

// ========================================
// EXAMPLE 2: Integration into MSME Dashboard
// ========================================
/*
File: components/msme/ModernMSMEDashboard.tsx

Step 1: Add import
*/
import AIMarketDashboard from '../ai/AIMarketDashboard';
import { Brain } from 'lucide-react';

/*
Step 2: Update View type (around line 6)
*/
export type View = 'dashboard' | 'inventory' | 'orders' | 'profile' | 'products' | 'inventory-dashboard' | 'issues' | 'resolved' | 'market' | 'ai-market';

/*
Step 3: Add case in renderMainContent() (around line 224)
*/
const renderMainContent = () => {
    switch (currentView) {
        // ... existing cases ...

        case 'ai-market':
            return (
                <AIMarketDashboard
                    userId={currentUser?.id || ''}
                    userRole="msme"
                    products={inventory || []}
                    userHistory={orders || []}
                />
            );

        // ... rest of cases ...
    }
};

/*
Step 4: Add to sidebar navigation (around line 397-421)
*/
{
    [
        { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
        { id: 'ai-market', icon: Brain, label: 'AI Market Intelligence' },  // <-- Add this
        { id: 'market', icon: TrendingUp, label: 'Market Trends' },
        { id: 'inventory', icon: Box, label: t('inventory'), badge: inventory.filter(i => i.stock <= i.minStockLevel).length },
        // ... rest of items
    ].map((item) => {
        // ... existing code
    })
}

// ========================================
// EXAMPLE 3: Using Individual AI Components
// ========================================
/*
If you want to use AI components separately instead of the full dashboard:
*/

// Price Forecasting only
import PriceForecastingAI from '../ai/PriceForecastingAI';

function MyComponent() {
    return (
        <div>
            <h1>Price Analysis</h1>
            <PriceForecastingAI
                productName="Cotton Yarn"
                forecastDays={30}
            />
        </div>
    );
}

// Market Insights only
import EnhancedMarketAnalysisAI from '../ai/EnhancedMarketAnalysisAI';

function MarketInsightsPage() {
    return (
        <EnhancedMarketAnalysisAI
            productName="Cotton Yarn"
            userRole="buyer"
        />
    );
}

// Product Recommendations only
import ProductRecommendationAI from '../ai/ProductRecommendationAI';

function RecommendationsSection() {
    const { currentUser, orders, products } = useAppContext();

    return (
        <ProductRecommendationAI
            userId={currentUser.id}
            userRole="buyer"
            availableProducts={products}
            userHistory={orders}
        />
    );
}

// ========================================
// EXAMPLE 4: Adding to Homepage/Dashboard
// ========================================
/*
To show AI insights on the main dashboard view:
*/

function MSMEDashboardOverview() {
    return (
        <div className="space-y-6">
            {/* Existing stats cards */}
            <div className="grid grid-cols-4 gap-4">
                {/* ... your existing stats ... */}
            </div>

            {/* Add AI Market Insights Section */}
            <EnhancedMarketAnalysisAI
                productName="Cotton Yarn"
                userRole="msme"
            />

            {/* Add Price Forecasting */}
            <PriceForecastingAI
                productName="Cotton Yarn"
                forecastDays={14}
            />
        </div>
    );
}

// ========================================
// EXAMPLE 5: Environment Setup
// ========================================
/*
Create or update .env.local file in your project root:
*/

// .env.local
VITE_GEMINI_API_KEY = your_actual_api_key_here

/*
Get your API key from: https://ai.google.dev/
Then restart your dev server: npm run dev
*/

// ========================================
// EXAMPLE 6: Complete Modified Buyer Dashboard (Partial)
// ========================================
/*
Here's a complete example showing the modified sections:
*/

import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Package, User, TrendingUp,
    AlertCircle, Brain  // <-- Add Brain icon
} from 'lucide-react';
import AIMarketDashboard from '../ai/AIMarketDashboard';  // <-- Add import

type BuyerView = 'browse' | 'orders' | 'issues' | 'profile' | 'dashboard' | 'market' | 'ai-market'; // <-- Updated

export default function ModernBuyerDashboard() {
    const [currentView, setCurrentView] = useState<BuyerView>('dashboard');
    const { currentUser, orders } = useAppContext();

    const quickActions = [
        { icon: ShoppingBag, label: 'Browse Products', onClick: () => setCurrentView('browse') },
        { icon: Brain, label: 'AI Insights', onClick: () => setCurrentView('ai-market') },  // <-- New
        { icon: Package, label: 'My Orders', onClick: () => setCurrentView('orders') },
        { icon: AlertCircle, label: 'Report Issue', onClick: () => setCurrentView('issues') },
    ];

    const renderContent = () => {
        switch (currentView) {
            case 'browse':
                return <ProductBrowseView />;
            case 'orders':
                return <BuyerOrdersView />;
            case 'ai-market':  // <-- New case
                return (
                    <AIMarketDashboard
                        userId={currentUser?.id || ''}
                        userRole="buyer"
                        products={[]}
                        userHistory={orders || []}
                    />
                );
            case 'dashboard':
            default:
                return (
                    <div>
                        {/* Your existing dashboard content */}
                    </div>
                );
        }
    };

    return (
        <div>
            {/* Your existing layout */}
            {renderContent()}
        </div>
    );
}

// ========================================
// TESTING CHECKLIST
// ========================================
/*
✅ 1. Verify API key is set in .env.local
✅ 2. Restart dev server after adding API key
✅ 3. Test Market Insights component loads
✅ 4. Test Price Forecasting shows chart
✅ 5. Test Recommendations display products
✅ 6. Test navigation between AI modules
✅ 7. Test back button to overview
✅ 8. Check mobile responsiveness
✅ 9. Verify error handling (invalid API key)
✅ 10. Test with real user data
*/

export { };
