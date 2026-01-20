import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Package, Heart, User, Search, Filter, Grid, List,
    Star, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
    Download, Eye, ShoppingCart, Bell, LogOut, Globe, Menu, X, ChevronRight
} from 'lucide-react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import { ProductBrowseView } from './ProductBrowseView';
import BuyerOrdersView from './BuyerOrdersView';
import BuyerProfileView from './BuyerProfileView';
import BuyerIssuesView from './BuyerIssuesView';
import { TranslatedText } from '../common/TranslatedText';

type BuyerView = 'browse' | 'orders' | 'issues' | 'profile' | 'dashboard';

export default function ModernBuyerDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { language, setLanguage, t } = useLocalization();
    const [currentView, setCurrentView] = useState<BuyerView>(() => {
        const saved = localStorage.getItem('buyer-current-view');
        return (saved as BuyerView) || 'dashboard';
    });
    const { currentUser, logout, orders } = useAppContext();
    const [buyerStats, setBuyerStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalSpent: 0
    });

    // Save current view to localStorage
    useEffect(() => {
        localStorage.setItem('buyer-current-view', currentView);
    }, [currentView]);

    // Calculate buyer stats
    useEffect(() => {
        if (orders && currentUser) {
            const buyerOrders = orders.filter(o => o.buyerId === currentUser.id);
            const pending = buyerOrders.filter(o => o.status === 'Pending' || o.status === 'Accepted').length;
            const completed = buyerOrders.filter(o => o.status === 'Delivered').length;
            const totalSpent = buyerOrders
                .filter(o => o.status === 'Delivered')
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            setBuyerStats({
                totalOrders: buyerOrders.length,
                pendingOrders: pending,
                completedOrders: completed,
                totalSpent
            });
        }
    }, [orders, currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            setSidebarOpen(false);
            setCurrentView('dashboard');
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    };

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value}`;
    };

    const stats = [
        {
            icon: ShoppingBag,
            label: t('total_orders_stat'),
            value: buyerStats.totalOrders.toString(),
            subtext: t('all_time_orders'),
            color: 'from-blue-500 to-blue-600',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            icon: Clock,
            label: t('pending_orders_stat'),
            value: buyerStats.pendingOrders.toString(),
            subtext: t('awaiting_delivery'),
            color: 'from-yellow-500 to-yellow-600',
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600'
        },
        {
            icon: CheckCircle,
            label: t('completed_orders_stat'),
            value: buyerStats.completedOrders.toString(),
            subtext: t('successfully_delivered'),
            color: 'from-green-500 to-green-600',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            icon: TrendingUp,
            label: t('total_spent'),
            value: formatCurrency(buyerStats.totalSpent),
            subtext: t('lifetime_spending'),
            color: 'from-indigo-500 to-indigo-600',
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600'
        },
    ];

    const quickActions = [
        { icon: ShoppingBag, label: t('browse_products_title'), color: 'bg-indigo-600 hover:bg-indigo-700', onClick: () => setCurrentView('browse') },
        { icon: Package, label: t('my_orders_title'), color: 'bg-green-600 hover:bg-green-700', onClick: () => setCurrentView('orders') },
        { icon: AlertCircle, label: t('report_issue_title'), color: 'bg-orange-600 hover:bg-orange-700', onClick: () => setCurrentView('issues') },
        { icon: User, label: t('my_profile_title'), color: 'bg-blue-600 hover:bg-blue-700', onClick: () => setCurrentView('profile') },
    ];

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
            case 'dashboard':
            default:
                return (
                    <div className="space-y-6">
                        {/* Quick Actions Bar */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action, idx) => (
                                <button key={idx} onClick={action.onClick} className={`${action.color} text-white rounded-xl p-4 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
                                    <action.icon className="h-5 w-5" />
                                    <span className="font-semibold text-sm">{action.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all transform hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -mr-16 -mt-16" style={{ background: stat.color }}></div>
                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${stat.iconBg} shadow-md`}>
                                                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                            </div>
                                        </div>
                                        <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
                                        <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                                        <p className="text-xs text-gray-500">{stat.subtext}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Welcome Section */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                            <h2 className="text-3xl font-bold mb-2">{t('welcome_back')}, {currentUser?.firstname}! 👋</h2>
                            <p className="text-indigo-100 mb-6">{t('discover_quality_products')}</p>
                            <button onClick={() => setCurrentView('browse')} className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-lg">
                                {t('start_shopping')}
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#a5b4fc #f3f4f6'
        }}>
            {/* Top Navigation Bar */}
            <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
                                    </svg>
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">{t('texconnect')}</span>
                                <p className="text-xs text-gray-500">{t('buyer_portal')}</p>
                            </div>
                        </div>
                        <span className="text-lg font-semibold text-gray-700">{t('dashboard')}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-gray-500" />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-white px-3 py-1.5 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="en">English</option>
                                <option value="ta">தமிழ்</option>
                            </select>
                        </div>

                        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Bell className="h-5 w-5 text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900"><TranslatedText text={currentUser?.firstname || 'User'} /></p>
                                <p className="text-xs text-gray-500">{t('buyer')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                                {currentUser?.firstname?.charAt(0) || 'U'}
                            </div>
                            <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
                                <LogOut className="h-5 w-5 text-red-600 hover:text-red-700" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 border-r border-gray-200`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-200"></div>

                    {/* User Profile */}
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <span className="text-2xl text-white">{currentUser?.firstname?.charAt(0) || '👤'}</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm leading-tight">{currentUser?.firstname || 'Buyer'}</p>
                                <p className="text-xs text-indigo-600 font-medium">{currentUser?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        <button onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'dashboard' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
                            <Grid className="h-5 w-5" />
                            <span className="font-semibold">{t('dashboard')}</span>
                            {currentView === 'dashboard' && <ChevronRight className="h-4 w-4 ml-auto" />}
                        </button>
                        <button onClick={() => { setCurrentView('browse'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'browse' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'browse' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
                            <ShoppingBag className="h-5 w-5" />
                            <span className="font-medium">{t('browse_products_title')}</span>
                        </button>
                        <button onClick={() => { setCurrentView('orders'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'orders' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'orders' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
                            <Package className="h-5 w-5" />
                            <span className="font-medium">{t('my_orders_title')}</span>
                        </button>
                        <button onClick={() => { setCurrentView('issues'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'issues' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'issues' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">{t('issues')}</span>
                        </button>
                    </nav>

                    {/* Profile Link */}
                    <div className="p-4 border-t border-gray-200">
                        <button onClick={() => { setCurrentView('profile'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'profile' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'profile' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
                            <User className="h-5 w-5" />
                            <span className="font-medium">{t('profile')}</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-72">
                <main className="p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
