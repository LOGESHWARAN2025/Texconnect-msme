# Integration Examples - Step-by-Step Guide

This document provides complete, copy-paste ready code examples for integrating AI Market Analysis components into your TexConnect dashboards.

---

## 📋 Table of Contents

1. [Buyer Dashboard Integration](#buyer-dashboard-integration)
2. [MSME Dashboard Integration](#msme-dashboard-integration)
3. [Individual Component Usage](#individual-component-usage)
4. [Environment Setup](#environment-setup)
5. [Testing Checklist](#testing-checklist)

---

## 🛍️ Buyer Dashboard Integration

### File: `components/buyer/ModernBuyerDashboard.tsx`

### Step 1: Add Imports

Add these imports at the **top** of your file (around line 15):

```tsx
// Add these new imports
import AIMarketDashboard from '../ai/AIMarketDashboard';
import { Brain } from 'lucide-react';  // Add Brain to existing lucide imports
```

**Complete import section should look like:**

```tsx
import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Package, Heart, User, Search, Filter, Grid, List,
    Star, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
    Download, Eye, ShoppingCart, Bell, LogOut, Globe, Menu, X, ChevronRight,
    Brain  // <-- Add this
} from 'lucide-react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import { ProductBrowseView } from './ProductBrowseView';
import BuyerOrdersView from './BuyerOrdersView';
import BuyerProfileView from './BuyerProfileView';
import BuyerIssuesView from './BuyerIssuesView';
import { TranslatedText } from '../common/TranslatedText';
import BuyerInsights from './BuyerInsights';
import MarketSalesBot from '../common/MarketSalesBot';
import AIMarketDashboard from '../ai/AIMarketDashboard';  // <-- Add this
```

---

### Step 2: Update Type Definition

Find the `BuyerView` type (around line 17) and update it:

```tsx
// BEFORE:
type BuyerView = 'browse' | 'orders' | 'issues' | 'profile' | 'dashboard' | 'market';

// AFTER:
type BuyerView = 'browse' | 'orders' | 'issues' | 'profile' | 'dashboard' | 'market' | 'ai-market';
//                                                                                    ↑↑↑↑↑↑↑↑↑↑
//                                                                              Add this!
```

---

### Step 3: Add AI Case to renderContent()

Find the `renderContent()` function (around line 122) and add the new case:

```tsx
const renderContent = () => {
    switch (currentView) {
        case 'browse':
            return <ProductBrowseView />;
        case 'orders':
            return <BuyerOrdersView />;
        case 'issues':
            return <BuyerIssuesView />;
        case 'profile':
            return <BuyerProfileView />;
        case 'market':
            return <MarketSalesBot />;
        
        // ADD THIS NEW CASE:
        case 'ai-market':
            return (
                <AIMarketDashboard 
                    userId={currentUser?.id || ''}
                    userRole="buyer"
                    products={[]}  // Pass real products array if available
                    userHistory={orders || []}
                />
            );
        
        case 'dashboard':
        default:
            const buyerOrders = orders ? orders.filter(o => o.buyerId === currentUser?.id) : [];
            return (
                // ... existing dashboard code
            );
    }
};
```

---

### Step 4: Add to Quick Actions

Update the `quickActions` array (around line 115):

```tsx
// BEFORE:
const quickActions = [
    { icon: ShoppingBag, label: t('browse_products_title'), color: 'bg-indigo-600 hover:bg-indigo-700', onClick: () => setCurrentView('browse') },
    { icon: TrendingUp, label: 'Market Insights', color: 'bg-purple-600 hover:bg-purple-700', onClick: () => setCurrentView('market') },
    { icon: Package, label: t('my_orders_title'), color: 'bg-green-600 hover:bg-green-700', onClick: () => setCurrentView('orders') },
    { icon: AlertCircle, label: t('report_issue_title'), color: 'bg-orange-600 hover:bg-orange-700', onClick: () => setCurrentView('issues') },
];

// AFTER (add AI button):
const quickActions = [
    { icon: ShoppingBag, label: t('browse_products_title'), color: 'bg-indigo-600 hover:bg-indigo-700', onClick: () => setCurrentView('browse') },
    { icon: Brain, label: 'AI Intelligence', color: 'bg-purple-600 hover:bg-purple-700', onClick: () => setCurrentView('ai-market') },  // <-- NEW
    { icon: Package, label: t('my_orders_title'), color: 'bg-green-600 hover:bg-green-700', onClick: () => setCurrentView('orders') },
    { icon: AlertCircle, label: t('report_issue_title'), color: 'bg-orange-600 hover:bg-orange-700', onClick: () => setCurrentView('issues') },
];
```

---

### Step 5: Add to Sidebar Navigation

Find the sidebar navigation buttons (around line 271-292) and add this button:

```tsx
{/* Add this button to your navigation list */}
<button 
    onClick={() => { setCurrentView('ai-market'); setSidebarOpen(false); }} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        currentView === 'ai-market' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
    }`} 
    style={currentView === 'ai-market' ? { 
        background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' 
    } : {}}
>
    <Brain className="h-5 w-5" />
    <span className="font-medium">AI Market Intelligence</span>
</button>
```

**Complete navigation section should include:**

```tsx
<nav className="flex-1 p-4 space-y-1 overflow-y-auto">
    {/* Dashboard */}
    <button onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} /* ... */>
        <Grid className="h-5 w-5" />
        <span className="font-semibold">{t('dashboard')}</span>
    </button>
    
    {/* Browse Products */}
    <button onClick={() => { setCurrentView('browse'); setSidebarOpen(false); }} /* ... */>
        <ShoppingBag className="h-5 w-5" />
        <span className="font-medium">{t('browse_products_title')}</span>
    </button>
    
    {/* Market Trends (existing) */}
    <button onClick={() => { setCurrentView('market'); setSidebarOpen(false); }} /* ... */>
        <TrendingUp className="h-5 w-5" />
        <span className="font-medium">Market Trends</span>
    </button>
    
    {/* AI Market Intelligence (NEW) */}
    <button onClick={() => { setCurrentView('ai-market'); setSidebarOpen(false); }} /* ... */>
        <Brain className="h-5 w-5" />
        <span className="font-medium">AI Market Intelligence</span>
    </button>
    
    {/* Orders */}
    <button onClick={() => { setCurrentView('orders'); setSidebarOpen(false); }} /* ... */>
        <Package className="h-5 w-5" />
        <span className="font-medium">{t('my_orders_title')}</span>
    </button>
    
    {/* Issues */}
    <button onClick={() => { setCurrentView('issues'); setSidebarOpen(false); }} /* ... */>
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{t('issues')}</span>
    </button>
</nav>
```

---

## 🏭 MSME Dashboard Integration

### File: `components/msme/ModernMSMEDashboard.tsx`

### Step 1: Add Imports

Add at the top (around line 14):

```tsx
import AIMarketDashboard from '../ai/AIMarketDashboard';
// Brain should already be imported from lucide-react
```

---

### Step 2: Update View Type

Update the `View` type export (around line 6):

```tsx
// BEFORE:
export type View = 'dashboard' | 'inventory' | 'orders' | 'profile' | 'products' | 'inventory-dashboard' | 'issues' | 'resolved' | 'market';

// AFTER:
export type View = 'dashboard' | 'inventory' | 'orders' | 'profile' | 'products' | 'inventory-dashboard' | 'issues' | 'resolved' | 'market' | 'ai-market';
//                                                                                                                                        ↑↑↑↑↑↑↑↑↑↑
```

---

### Step 3: Add Case to renderMainContent()

Find `renderMainContent()` function (around line 224) and add:

```tsx
const renderMainContent = () => {
    switch (currentView) {
        case 'inventory': 
            return <InventoryPage onBack={() => setCurrentView('dashboard')} />;
        case 'orders': 
            return <OrdersPage onBack={() => setCurrentView('dashboard')} />;
        case 'products': 
            return <ProductsPage onBack={() => setCurrentView('dashboard')} />;
        case 'issues': 
            return <IssuesPage onBack={() => setCurrentView('dashboard')} />;
        case 'profile':
            return <ProfileView />;
        case 'market':
            return <MarketSalesBot />;
        
        // ADD THIS NEW CASE:
        case 'ai-market':
            return (
                <AIMarketDashboard 
                    userId={currentUser?.id || ''}
                    userRole="msme"
                    products={inventory || []}
                    userHistory={orders || []}
                />
            );
        
        default:
            // ... existing dashboard code
    }
};
```

---

### Step 4: Add to Sidebar Navigation

Find the sidebar navigation array (around line 397-421) and add AI option:

```tsx
{[
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'ai-market', icon: Brain, label: 'AI Market Intelligence' },  // <-- ADD THIS
    { id: 'market', icon: TrendingUp, label: 'Market Trends' },
    { id: 'inventory', icon: Box, label: t('inventory'), badge: inventory.filter(i => i.stock <= i.minStockLevel).length },
    { id: 'orders', icon: ShoppingCart, label: t('orders'), badge: orders.filter(o => o.status === 'Pending').length },
    { id: 'products', icon: Layers, label: t('products') },
    { id: 'profile', icon: Users, label: t('profile') },
    { id: 'issues', icon: AlertCircle, label: t('issues') },
].map((item) => {
    const isActive = currentView === item.id;
    return (
        <button
            key={item.id}
            onClick={() => { setCurrentView(item.id as View); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all relative group ${
                isActive ? 'bg-slate-900 text-white shadow-2xl translate-x-3' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
            }`}
        >
            <item.icon className="h-5 w-5" />
            <span className="font-black text-[10px] uppercase tracking-widest">{item.label}</span>
            {item.badge ? (
                <span className="ml-auto bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-lg">{item.badge}</span>
            ) : (isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />)}
        </button>
    );
})}
```

---

## 🎯 Individual Component Usage

If you want to use AI components separately (not the full dashboard):

### Using Price Forecasting Only

```tsx
import PriceForecastingAI from '../ai/PriceForecastingAI';

function PriceAnalysisPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Price Analysis</h1>
            <PriceForecastingAI 
                productName="Cotton Yarn"
                forecastDays={30}
                historicalPrices={[
                    { date: '2026-01-01', price: 250 },
                    { date: '2026-01-15', price: 265 },
                    // ... more data
                ]}
            />
        </div>
    );
}
```

---

### Using Market Insights Only

```tsx
import EnhancedMarketAnalysisAI from '../ai/EnhancedMarketAnalysisAI';

function MarketInsightsSection() {
    return (
        <div className="space-y-6">
            <EnhancedMarketAnalysisAI 
                productName="Cotton Yarn"
                userRole="buyer"  // or "msme"
                historicalData={[]}
            />
        </div>
    );
}
```

---

### Using Product Recommendations Only

```tsx
import ProductRecommendationAI from '../ai/ProductRecommendationAI';
import { useAppContext } from '../../context/SupabaseContext';

function RecommendationsSection() {
    const { currentUser, orders, products } = useAppContext();
    
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Recommended for You</h2>
            <ProductRecommendationAI 
                userId={currentUser?.id || ''}
                userRole="buyer"
                availableProducts={products || []}
                userHistory={orders || []}
            />
        </div>
    );
}
```

---

### Embedding in Dashboard Overview

Add AI insights directly to your main dashboard view:

```tsx
function MSMEDashboardOverview() {
    return (
        <div className="space-y-6">
            {/* Existing stats cards */}
            <div className="grid grid-cols-4 gap-4">
                {/* Your existing stats */}
            </div>
            
            {/* Add AI Insights */}
            <EnhancedMarketAnalysisAI 
                productName="Cotton Yarn"
                userRole="msme"
            />
            
            {/* Add Price Forecast */}
            <PriceForecastingAI 
                productName="Cotton Yarn"
                forecastDays={14}
            />
            
            {/* Your other dashboard content */}
        </div>
    );
}
```

---

## ⚙️ Environment Setup

### Step 1: Create/Update `.env.local`

In your project root, create or update `.env.local`:

```env
# Google Gemini API Key for AI Market Analysis
VITE_GEMINI_API_KEY=your_actual_api_key_here

# Your other environment variables...
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Step 2: Get Google Gemini API Key

1. Visit: https://ai.google.dev/
2. Click "Get API Key"
3. Sign in with Google account
4. Create a new project or select existing
5. Click "Create API Key"
6. Copy the key and paste it in `.env.local`

### Step 3: Restart Development Server

**Important:** You MUST restart the server after adding the API key!

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ Testing Checklist

After integration, test these items:

### Basic Functionality
- [ ] AI Market Dashboard loads without errors
- [ ] Navigation to AI dashboard works
- [ ] Back button returns to previous view
- [ ] All three AI modules are accessible

### Market Insights (LLM)
- [ ] "Analyze Market" button works
- [ ] Insights display with confidence scores
- [ ] Impact levels show correctly (High/Medium/Low)
- [ ] Loading state appears during analysis
- [ ] Fallback data shows if API fails

### Price Forecasting
- [ ] Chart displays with historical and predicted data
- [ ] Confidence bands visible
- [ ] Summary cards show correct values
- [ ] Trend detection works (Rising/Falling/Stable)
- [ ] AI recommendation appears

### Product Recommendations
- [ ] Products display in cards
- [ ] Match scores show percentage
- [ ] Reasons for recommendations display
- [ ] Algorithm selector works (Hybrid/Collaborative/Content)
- [ ] Products are ranked correctly

### UI/UX
- [ ] Mobile responsive (test on small screen)
- [ ] Colors and styling match your theme
- [ ] Loading animations work smoothly
- [ ] Icons display correctly
- [ ] Buttons and interactions feel responsive

### Error Handling
- [ ] Works without API key (shows fallback)
- [ ] Works with empty data arrays
- [ ] Error messages are user-friendly
- [ ] No console errors

### Performance
- [ ] Page loads quickly
- [ ] No lag when switching between AI modules
- [ ] Charts render smoothly
- [ ] API calls don't block UI

---

## 🎨 Customization Examples

### Change Colors

All components use Tailwind classes. To customize:

```tsx
// In AIMarketDashboard.tsx or individual components
// Find color classes and replace:

// From:
className="bg-indigo-600 text-white"

// To:
className="bg-purple-600 text-white"
```

### Change Time Periods

```tsx
// Default: 30 days
<PriceForecastingAI forecastDays={30} />

// Change to 60 days
<PriceForecastingAI forecastDays={60} />

// Change to 2 weeks
<PriceForecastingAI forecastDays={14} />
```

### Change Products

```tsx
// Default: Cotton Yarn
<EnhancedMarketAnalysisAI productName="Cotton Yarn" />

// Custom product
<EnhancedMarketAnalysisAI productName="Silk Fabric" />
<EnhancedMarketAnalysisAI productName="Denim Rolls" />
```

### Use Different Algorithms

```tsx
// Hybrid (default - 60% content, 40% collaborative)
<ProductRecommendationAI algorithm="hybrid" />

// Collaborative filtering only
<ProductRecommendationAI algorithm="collaborative" />

// Content-based filtering only
<ProductRecommendationAI algorithm="content" />
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "API Key Error"
**Symptom:** LLM insights show fallback data  
**Solution:** 
- Verify `VITE_GEMINI_API_KEY` in `.env.local`
- Restart dev server
- Check for typos in the key

### Issue 2: "Component Not Found"
**Symptom:** Import errors  
**Solution:**
- Verify all files in `components/ai/` exist
- Check import paths are correct
- Clear cache: `npm run dev`

### Issue 3: "No Recommendations Showing"
**Symptom:** Empty recommendations section  
**Solution:**
- Ensure `availableProducts` array is not empty
- Check products have required fields (id, name, price)
- Component uses sample data if no products provided

### Issue 4: "Chart Not Displaying"
**Symptom:** Blank area where chart should be  
**Solution:**
- Verify `recharts` is installed
- Check browser console for errors
- Ensure data format is correct

### Issue 5: TypeScript Errors
**Symptom:** Type errors in IDE  
**Solution:**
- Check props match interfaces
- Use TypeScript's `as` for type assertions if needed
- Ensure all required props are provided

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Quick Start**: See `QUICKSTART.md`
- **Summary**: See `SUMMARY.md`
- **Architecture Diagram**: See generated image in artifacts

---

## 💡 Tips for Best Results

1. **API Key**: Get a production API key for live deployment
2. **Real Data**: Components work better with actual user data
3. **Mobile**: Test on mobile devices for responsive design
4. **Performance**: Monitor API quotas if using LLM frequently
5. **Customization**: Adjust colors to match your brand
6. **User Feedback**: Collect feedback on AI accuracy

---

**Last Updated**: January 28, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
