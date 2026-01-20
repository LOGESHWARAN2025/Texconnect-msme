import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, Users, BarChart3, ShoppingCart, Layers, Bell, Settings, Search, Menu, X, Filter, Download, Plus, Shirt, Clock, DollarSign, LogOut, Globe, Lock, ClipboardList, Box, FileText, ChevronRight, Zap, Activity, LayoutDashboard } from 'lucide-react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import { supabase } from '../../src/lib/supabase';
import type { View, MSMEDomain } from '../../types';
import Modal from '../common/Modal';
import { TranslatedText } from '../common/TranslatedText';
import InventoryPage from './InventoryPage';
import OrdersPage from './OrdersPage';
import ProductsPage from './ProductsPage';
import IssuesPage from './IssuesPage';
import ProfileView from './ProfileView';

export default function ModernMSMEDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language, setLanguage, t, formatDate } = useLocalization();
  const [currentView, setCurrentView] = useState<View>(() => {
    const saved = localStorage.getItem('msme-current-view');
    return (saved as View) || 'dashboard';
  });
  const { currentUser, logout, inventory, orders, requestProfileUpdate } = useAppContext();
  const [salesView, setSalesView] = useState<'week' | 'month' | 'market'>('market');
  const [isAddInventoryModalOpen, setIsAddInventoryModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [liveStats, setLiveStats] = useState({
    totalStockValue: 0,
    pendingOrders: 0,
    itemsInStock: 0,
    monthlyRevenue: 0
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dashboard states
  const [inventoryFormData, setInventoryFormData] = useState({
    name: '',
    category: '',
    description: '',
    stock: 0,
    price: 0,
    unitOfMeasure: '',
    minStockLevel: 0
  });

  useEffect(() => {
    localStorage.setItem('msme-current-view', currentView);
  }, [currentView]);

  useEffect(() => {
    if (inventory && orders) {
      const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.price), 0);
      const pending = orders.filter(o => o.status === 'Pending').length;
      const totalItems = inventory.reduce((sum, item) => sum + item.stock, 0);
      const monthlyRev = orders
        .filter(o => {
          if (!o.createdAt) return false;
          const orderDate = new Date(o.createdAt);
          const now = new Date();
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setLiveStats({
        totalStockValue: totalValue,
        pendingOrders: pending,
        itemsInStock: totalItems,
        monthlyRevenue: monthlyRev
      });
    }
  }, [inventory, orders]);

  // Handle external scan from Google Lens
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scan') === '1' && params.get('orderId')) {
      setCurrentView('orders');
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleAddInventory = () => setIsAddInventoryModalOpen(true);
  const handleNewOrder = () => setCurrentView('orders');
  const handleExportReport = () => {
    const headers = ['Name', 'Category', 'Stock', 'Price', 'Value'];
    const rows = inventory.map(item => [
      item.name,
      item.category,
      item.stock,
      item.price,
      item.stock * item.price
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  const handleViewAlerts = () => setIsAlertsModalOpen(true);

  const handleInventoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInventoryFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('inventory').insert([{
        ...inventoryFormData,
        msmeId: currentUser.id
      }]);
      if (error) throw error;
      setIsAddInventoryModalOpen(false);
      setInventoryFormData({ name: '', category: '', description: '', stock: 0, price: 0, unitOfMeasure: '', minStockLevel: 0 });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: t('total_stock_value'), value: `₹${(liveStats.totalStockValue / 1000).toFixed(1)}k`, change: '+12.5%', trend: 'up', icon: Package, iconBg: 'bg-indigo-600', iconColor: 'text-white', color: 'rgb(79, 70, 229)', subtext: 'Updated just now' },
    { label: t('pending_orders'), value: liveStats.pendingOrders.toString(), change: '+3', trend: 'up', icon: ShoppingCart, iconBg: 'bg-emerald-600', iconColor: 'text-white', color: 'rgb(16, 185, 129)', subtext: 'Needs attention' },
    { label: t('items_in_stock'), value: liveStats.itemsInStock.toString(), change: '-5', trend: 'down', icon: Box, iconBg: 'bg-amber-600', iconColor: 'text-white', color: 'rgb(245, 158, 11)', subtext: 'In 12 categories' },
    { label: t('monthly_revenue'), value: `₹${(liveStats.monthlyRevenue / 1000).toFixed(1)}k`, change: '+8.2%', trend: 'up', icon: TrendingUp, iconBg: 'bg-rose-600', iconColor: 'text-white', color: 'rgb(225, 29, 72)', subtext: 'Target: ₹500k' },
  ];


  const stockLevelsData = inventory.slice(0, 5).map(item => ({
    category: item.name,
    current: item.stock,
    min: item.minStockLevel,
    status: item.stock > item.minStockLevel ? 'good' : 'low'
  }));

  const generateRecentActivity = () => {
    const activities: any[] = [];
    orders.slice(0, 3).forEach(o => {
      activities.push({
        type: 'order',
        action: `New Order from ${o.buyerName || 'Buyer'}`,
        item: o.itemName || 'Textile Goods',
        time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
      });
    });
    inventory.filter(i => i.stock < i.minStockLevel).slice(0, 2).forEach(i => {
      activities.push({
        type: 'alert',
        action: 'Low Stock Alert',
        item: i.name,
        time: 'Just now'
      });
    });
    return activities.length > 0 ? activities : [{ action: 'No recent activity', item: 'Dashboard ready', time: 'Now', type: 'stock' }];
  };

  const recentActivity = generateRecentActivity();
  const maxSales = 100; // Mock

  const quickActions = [
    { label: 'Add Stock', icon: Plus, color: 'bg-indigo-600', onClick: handleAddInventory },
    { label: 'New Order', icon: ShoppingCart, color: 'bg-emerald-600', onClick: handleNewOrder },
    { label: 'Export All', icon: Download, color: 'bg-amber-600', onClick: handleExportReport },
    { label: 'Alerts', icon: Bell, color: 'bg-rose-600', onClick: handleViewAlerts },
  ];

  const renderMainContent = () => {
    switch (currentView) {
      case 'inventory': return <InventoryPage onBack={() => setCurrentView('dashboard')} />;
      case 'orders': return <OrdersPage onBack={() => setCurrentView('dashboard')} />;
      case 'products': return <ProductsPage onBack={() => setCurrentView('dashboard')} />;
      case 'issues': return <IssuesPage onBack={() => setCurrentView('dashboard')} />;
      case 'profile':
        return <ProfileView />;
      default:
        return (
          <div className="space-y-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, idx) => (
                <button key={idx} onClick={action.onClick} className={`${action.color} text-white rounded-[1.5rem] p-6 flex flex-col gap-4 shadow-xl shadow-current/10 hover:shadow-2xl transition-all transform hover:-translate-y-2 active:scale-95 group`}>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest">{action.label}</span>
                </button>
              ))}
            </div>

            {/* AI Insights Section */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full -ml-40 -mb-40 blur-3xl group-hover:bg-purple-500/20 transition-all duration-1000 delay-300"></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Zap className="h-6 w-6 text-white animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">AI Intelligence</h2>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Predictive Analysis Active</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm max-w-lg font-medium leading-relaxed">
                    Our neural engine has analyzed market trends and your inventory. We recommend adjusting prices for high-demand items to maximize Q1 revenue.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:w-auto">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all group/card cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Price Suggestion</span>
                    </div>
                    <p className="text-white font-black text-xl mb-1">Cotton Yarn +4.5%</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Market demand rising</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all group/card cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-5 h-5 text-indigo-400" />
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Demand Forecast</span>
                    </div>
                    <p className="text-white font-black text-xl mb-1">Linen Peak: Feb 12</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Upcoming festive season</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="group bg-white rounded-[2.5rem] shadow-2xl p-8 border border-white transition-all hover:-translate-y-2 hover:shadow-indigo-500/10 overflow-hidden relative">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${stat.iconBg} text-white shadow-lg shadow-current/20`}>
                        <stat.icon className="h-6 w-6" strokeWidth={3} />
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${stat.trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Activity Pulsar</h2>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-hidden self-start">
                    {['market', 'week', 'month'].map((v) => (
                      <button key={v} onClick={() => setSalesView(v as any)} className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${salesView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="h-72 flex items-end gap-2 px-4 border-b border-slate-100 pb-4">
                  {/* Simulated Chart Bars */}
                  {[80, 45, 90, 65, 85, 40, 75].map((val, i) => (
                    <div key={i} className="flex-1 bg-indigo-600/10 rounded-t-2xl relative group" style={{ height: `${val}%` }}>
                      <div className="absolute inset-x-0 bottom-0 bg-indigo-600 rounded-t-2xl transition-all h-2 group-hover:h-full group-hover:bg-indigo-500"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Sync Log</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time pulses</p>
                  </div>
                  <Activity className="h-6 w-6 text-indigo-600 animate-pulse" />
                </div>
                <div className="space-y-6 overflow-y-auto max-h-[400px] pr-4 custom-scrollbar">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-5 p-5 rounded-[2rem] hover:bg-slate-50 transition-all group">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${activity.type === 'order' ? 'bg-blue-50 text-blue-600' :
                        activity.type === 'stock' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                        {activity.type === 'order' ? <ShoppingCart className="h-6 w-6" /> :
                          activity.type === 'stock' ? <Package className="h-6 w-6" /> :
                            <AlertCircle className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{activity.action}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Stock Health</h2>
                <Filter className="w-5 h-5 text-slate-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {inventory.slice(0, 4).map((item) => (
                  <div key={item.id} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-black text-slate-900">{item.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</p>
                      </div>
                      <p className="text-xl font-black text-slate-900">{item.stock}</p>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.stock <= item.minStockLevel ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, (item.stock / (item.minStockLevel * 2)) * 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-slate-50 font-outfit overflow-hidden flex">
      {/* Persistent Sidebar (Desktop) */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] w-80 bg-white/95 backdrop-blur-3xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-500 border-r border-slate-200 overflow-y-auto custom-scrollbar`}>
        <div className="p-10 space-y-12 h-screen flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
              </svg>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">TexConnect</span>
              <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.3em]">Precision ERP</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
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
                  className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all relative group ${isActive ? 'bg-slate-900 text-white shadow-2xl translate-x-3' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
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
          </nav>

          <div className="pt-10 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] text-rose-500 hover:bg-rose-50 transition-all">
              <LogOut className="h-5 w-5" />
              <span className="font-black text-[10px] uppercase tracking-widest">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative">
        <header className="h-24 px-10 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white z-40">
          <div className="flex items-center gap-6">
            <div className="lg:hidden p-3 bg-white rounded-xl shadow-lg" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{currentView === 'dashboard' ? 'Overview' : currentView}</h1>
              <p className="text-[10px] font-black text-slate-400 capitalize">{formatDate(new Date())}</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
              <Globe className="h-3.5 w-3.5 text-indigo-500" />
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-[10px] font-black uppercase tracking-widest bg-transparent border-none outline-none cursor-pointer">
                <option value="en">English</option>
                <option value="ta">Tamil</option>
              </select>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-xl overflow-hidden">
              {currentUser?.profilePictureUrl ? <img src={currentUser.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" /> : currentUser?.firstname?.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-10 pb-40 custom-scrollbar">
          {renderMainContent()}
        </main>

        {/* Spotify Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 z-50 pb-safe">
          <div className="flex items-center justify-around h-20">
            {[
              { id: 'dashboard', icon: LayoutDashboard },
              { id: 'inventory', icon: Box },
              { id: 'orders', icon: ShoppingCart },
              { id: 'profile', icon: Users },
            ].map((item) => (
              <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`flex flex-col items-center gap-1 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                <item.icon className="h-6 w-6" />
                <span className="text-[8px] font-black uppercase tracking-widest">{item.id}</span>
              </button>
            ))}
          </div>
        </div>

        {sidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
      </div>

      <Modal isOpen={isAddInventoryModalOpen} onClose={() => setIsAddInventoryModalOpen(false)} title="Add Item">
        <form onSubmit={handleInventorySubmit} className="space-y-4 p-2">
          <input type="text" name="name" value={inventoryFormData.name} onChange={handleInventoryFormChange} required placeholder="Name" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
          <input type="text" name="category" value={inventoryFormData.category} onChange={handleInventoryFormChange} required placeholder="Category" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" name="stock" value={inventoryFormData.stock} onChange={handleInventoryFormChange} required placeholder="Stock" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
            <input type="number" name="price" value={inventoryFormData.price} onChange={handleInventoryFormChange} required placeholder="Price" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20">{isSubmitting ? 'Adding...' : 'Add Item'}</button>
        </form>
      </Modal>

      <Modal isOpen={isAlertsModalOpen} onClose={() => setIsAlertsModalOpen(false)} title="Stock Notifications">
        <div className="space-y-4">
          {inventory.filter(i => i.stock <= i.minStockLevel).map(i => (
            <div key={i.id} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center">
              <div>
                <p className="font-black text-rose-900">{i.name}</p>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Low Stock Alert</p>
              </div>
              <p className="text-xl font-black text-rose-600">{i.stock}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
