import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, Users, BarChart3, ShoppingCart, Layers, Bell, Settings, Search, Menu, X, Filter, Download, Plus, Shirt, Clock, DollarSign, LogOut, Globe, Lock, ClipboardList, Box, FileText, ChevronRight, Zap, Activity } from 'lucide-react';
import { useAppContext } from '../../context/SupabaseContext';
import InventoryPage from './InventoryPage';
import OrdersPage from './OrdersPage';
import ProductsPage from './ProductsPage';
import IssuesPage from './IssuesPage';

export default function ModernMSMEDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'orders' | 'products' | 'issues' | 'profile'>('dashboard');
  const [salesView, setSalesView] = useState<'week' | 'month'>('week');
  const { currentUser, logout, inventory, orders } = useAppContext();
  const [liveStats, setLiveStats] = useState({
    totalStockValue: 0,
    pendingOrders: 0,
    itemsInStock: 0,
    monthlyRevenue: 0
  });

  // Calculate live stats from data
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

  const handleLogout = async () => {
    try {
      await logout();
      // Clear any local state if needed
      setSidebarOpen(false);
      setCurrentView('dashboard');
      // User will be redirected by App.tsx when currentUser becomes null
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
      icon: Package, 
      label: 'Total Stock Value', 
      value: formatCurrency(liveStats.totalStockValue),
      subtext: `${liveStats.itemsInStock} items`,
      change: '+12%',
      trend: 'up' as const,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      icon: Clock, 
      label: 'Pending Orders', 
      value: liveStats.pendingOrders.toString(),
      subtext: `${liveStats.pendingOrders} orders waiting`,
      change: '+8%',
      trend: 'up' as const,
      color: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    { 
      icon: Layers, 
      label: 'Items in Stock', 
      value: liveStats.itemsInStock.toString(),
      subtext: `${inventory.filter(i => i.stock < i.minStockLevel).length} low stock`,
      change: '-5%',
      trend: 'down' as const,
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    { 
      icon: TrendingUp, 
      label: 'Revenue (This Month)', 
      value: formatCurrency(liveStats.monthlyRevenue),
      subtext: `${orders.filter(o => o.createdAt && new Date(o.createdAt).getMonth() === new Date().getMonth()).length} orders`,
      change: '+18%',
      trend: 'up' as const,
      color: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    },
  ];

  // Calculate sales data from real orders
  const calculateSalesData = () => {
    if (salesView === 'week') {
      // Get last 7 days of sales
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const salesByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      
      if (orders && orders.length > 0) {
        const now = new Date();
        orders.forEach(order => {
          if (order.createdAt) {
            const orderDate = new Date(order.createdAt);
            const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff < 7) {
              const dayIndex = orderDate.getDay() === 0 ? 6 : orderDate.getDay() - 1;
              const dayName = days[dayIndex];
              salesByDay[dayName as keyof typeof salesByDay] += (order.totalAmount || 0) / 1000; // Convert to K
            }
          }
        });
      }
      
      return days.map(day => ({ day, value: Math.round(salesByDay[day as keyof typeof salesByDay]) || 0 }));
    } else {
      // Get monthly sales
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const salesByMonth = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 };
      
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          if (order.createdAt) {
            const orderDate = new Date(order.createdAt);
            const monthIndex = orderDate.getMonth();
            salesByMonth[monthIndex as keyof typeof salesByMonth] += (order.totalAmount || 0) / 1000; // Convert to K
          }
        });
      }
      
      return months.map((month, idx) => ({ day: month, value: Math.round(salesByMonth[idx as keyof typeof salesByMonth]) || 0 }));
    }
  };

  const dailySalesData = calculateSalesData();

  // Convert live inventory to stock levels format
  const stockLevelsData = inventory && inventory.length > 0 
    ? inventory.map(item => ({
        category: item.name,
        current: item.stock,
        min: item.minStockLevel,
        status: item.stock >= item.minStockLevel ? 'good' : 'low'
      }))
    : [
        { category: 'Yarn', current: 850, min: 500, status: 'good' },
        { category: 'Fabric', current: 420, min: 600, status: 'low' },
        { category: 'Accessories', current: 920, min: 400, status: 'good' },
        { category: 'Finished Goods', current: 680, min: 500, status: 'good' },
        { category: 'Raw Cotton', current: 350, min: 450, status: 'low' },
      ];

  // Generate recent activity from live orders and inventory
  const generateRecentActivity = () => {
    const activities: any[] = [];
    
    // Add recent orders
    if (orders && orders.length > 0) {
      orders.slice(0, 3).forEach(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        const timeAgo = getTimeAgo(orderDate);
        activities.push({
          action: `Order ${order.status.toLowerCase()}`,
          item: `${order.itemName || 'Order'} - ${order.buyerName}`,
          time: timeAgo,
          type: 'order'
        });
      });
    }

    // Add low stock alerts
    if (inventory && inventory.length > 0) {
      inventory.filter(i => i.stock < i.minStockLevel).slice(0, 2).forEach(item => {
        activities.push({
          action: 'Low stock alert',
          item: item.name,
          time: 'Just now',
          type: 'alert'
        });
      });
    }

    return activities.length > 0 ? activities : [
      { action: 'No recent activity', item: 'Dashboard ready', time: 'Now', type: 'stock' }
    ];
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const recentActivity = generateRecentActivity();

  const quickActions = [
    { icon: Plus, label: 'Add Inventory', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { icon: ShoppingCart, label: 'New Order', color: 'bg-green-600 hover:bg-green-700' },
    { icon: Download, label: 'Export Report', color: 'bg-blue-600 hover:bg-blue-700' },
    { icon: Bell, label: 'View Alerts', color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  const maxSales = Math.max(...dailySalesData.map(d => d.value));
  const maxStock = Math.max(...stockLevelsData.flatMap(d => [d.current, d.min]));

  // Render different pages based on currentView
  if (currentView === 'inventory') {
    return <InventoryPage onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'orders') {
    return <OrdersPage onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'products') {
    return <ProductsPage onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'issues') {
    return <IssuesPage onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'profile') {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [formData, setFormData] = useState({
        username: currentUser?.username || '',
        firstname: currentUser?.firstname || '',
        phone: currentUser?.phone || '',
        address: currentUser?.address || '',
        gstNumber: currentUser?.gstNumber || '',
        companyName: currentUser?.companyName || '',
        domain: currentUser?.domain || ''
    });
    const [gstCertificateFile, setGstCertificateFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;

        if (file.size > 5 * 1024 * 1024) {
            setProfileError('File size must be less than 5MB');
            return;
        }
        if (!file.type.startsWith('image/')) {
            setProfileError('Please select a valid image file');
            return;
        }

        try {
            setUploading(true);
            setProfileError(null);
            setProfileSuccess(false);

            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(uniqueFileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(uniqueFileName);

            const profilePictureUrl = urlData.publicUrl;
            await requestProfileUpdate(currentUser.id, { profilePictureUrl });
            
            setProfileSuccess(true);
        } catch (err: any) {
            setProfileError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGstCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                setProfileError('Please upload a JPEG or PDF file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setProfileError('File size must be less than 5MB');
                return;
            }
            setGstCertificateFile(file);
            setProfileError(null);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSubmitting(true);

        try {
            const changes: any = {};
            if (formData.username !== currentUser.username) changes.username = formData.username;
            if (formData.firstname !== currentUser.firstname) changes.firstname = formData.firstname;
            if (formData.phone !== currentUser.phone) changes.phone = formData.phone;
            if (formData.address !== currentUser.address) changes.address = formData.address;
            if (formData.gstNumber !== currentUser.gstNumber) changes.gstNumber = formData.gstNumber;
            if (formData.companyName !== currentUser.companyName) changes.companyName = formData.companyName;
            if (formData.domain !== currentUser.domain) changes.domain = formData.domain;

            if (gstCertificateFile) {
                const fileExt = gstCertificateFile.name.split('.').pop();
                const uniqueFileName = `${currentUser.id}/gst-certificate-${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('gst-certificates')
                    .upload(uniqueFileName, gstCertificateFile, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('gst-certificates')
                    .getPublicUrl(uniqueFileName);

                changes.gstCertificateUrl = urlData.publicUrl;
            }

            if (Object.keys(changes).length > 0) {
                await requestProfileUpdate(currentUser.id, changes);
                setProfileSuccess(true);
                setProfileError(null);
            }
            setIsEditModalOpen(false);
            setGstCertificateFile(null);
        } catch (err: any) {
            setProfileError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#a5b4fc #f3f4f6'
      }}>
        <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
          <div className="px-6 py-4 flex items-center justify-between">
            <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold">
              <ChevronRight className="h-5 w-5 rotate-180" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-bold text-gray-900">MSME Profile</h1>
            <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow"
            >
              Edit Profile
            </button>
          </div>
        </nav>
        <div className="lg:pl-72">
          <div className="p-6 max-w-4xl">
            {/* Profile Header Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 shadow-lg mb-6">
              <div className="flex items-start gap-8">
                {/* Profile Picture Section */}
                <div className="relative flex-shrink-0">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl border-4 border-white">
                    {currentUser?.profilePictureUrl ? (
                      <img 
                        src={currentUser.profilePictureUrl} 
                        alt={currentUser?.firstname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl font-bold text-white">{currentUser?.firstname?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <label className="block mt-4">
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={(e) => {
                            e.preventDefault();
                            const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
                            input?.click();
                        }}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {uploading ? 'Uploading...' : 'Update Photo'}
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                  </label>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentUser?.companyName || 'Company Name'}</h2>
                    <p className="text-lg text-indigo-600 font-semibold">{currentUser?.firstname || 'N/A'}</p>
                    <p className="text-gray-600 mt-1">{currentUser?.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 font-medium">GST Number</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{currentUser?.gstNumber || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 font-medium">Phone</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{currentUser?.phone || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 font-medium">Domain</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{currentUser?.domain || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 font-medium">Status</p>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-bold ${currentUser?.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {currentUser?.isApproved ? '✓ Approved' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Details</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">Full Name</p>
                  <p className="text-lg font-semibold text-gray-900">{currentUser?.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">First Name</p>
                  <p className="text-lg font-semibold text-gray-900">{currentUser?.firstname || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">Address</p>
                  <p className="text-lg font-semibold text-gray-900">{currentUser?.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">GST Certificate</p>
                  {currentUser?.gstCertificateUrl ? (
                    <a
                      href={currentUser.gstCertificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Certificate
                    </a>
                  ) : (
                    <p className="text-gray-400">Not uploaded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {uploading && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Uploading profile picture...
                </div>
            )}
            {profileSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Profile updated successfully!
                </div>
            )}
            {profileError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Error: {profileError}
                </div>
            )}

            {/* Edit Profile Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile">
                <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">Company Name</label>
                        <input
                            id="companyName"
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter company name"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your full name"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="firstname" className="block text-sm font-medium text-slate-700">First Name</label>
                        <input
                            id="firstname"
                            type="text"
                            name="firstname"
                            value={formData.firstname}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your first name"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone</label>
                        <input
                            id="phone"
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your phone number"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
                        <input
                            id="address"
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your address"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="gstNumber" className="block text-sm font-medium text-slate-700">GST Number</label>
                        <input
                            id="gstNumber"
                            type="text"
                            name="gstNumber"
                            value={formData.gstNumber}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your GST number"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="domain" className="block text-sm font-medium text-slate-700">Domain</label>
                        <select
                            id="domain"
                            name="domain"
                            value={formData.domain}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Select Domain</option>
                            <option value="Textiles">Textiles</option>
                            <option value="Apparel">Apparel</option>
                            <option value="Dyeing">Dyeing</option>
                            <option value="Printing">Printing</option>
                            <option value="Finishing">Finishing</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="gstCertificate" className="block text-sm font-medium text-slate-700">GST Certificate (JPEG/PDF)</label>
                        <input
                            id="gstCertificate"
                            type="file"
                            accept=".jpg,.jpeg,.pdf"
                            onChange={handleGstCertificateUpload}
                            className="mt-1 block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-600
                                hover:file:bg-indigo-100"
                        />
                        {currentUser?.gstCertificateUrl && (
                            <a
                                href={currentUser.gstCertificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-sm text-indigo-600 hover:underline inline-block"
                            >
                                View current certificate
                            </a>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow disabled:bg-slate-400"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>
          </div>
        </div>
      </div>
    );
  }

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
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">TexConnect</span>
                <p className="text-xs text-gray-500">Inventory Management</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-gray-700">Dashboard Overview</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-gray-500" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white px-3 py-1.5 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option>English</option>
                <option>தமிழ்</option>
              </select>
            </div>

            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{currentUser?.firstname || 'User'}</p>
                <p className="text-xs text-gray-500">GST: {currentUser?.gstNumber || 'N/A'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg overflow-hidden flex-shrink-0">
                {currentUser?.profilePicture || currentUser?.profilePictureUrl ? (
                  <img 
                    src={currentUser.profilePicture || currentUser.profilePictureUrl} 
                    alt={currentUser?.firstname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser?.firstname?.charAt(0) || 'U'}</span>
                )}
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
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200">
          </div>

          {/* Company Profile */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                {currentUser?.profilePicture || currentUser?.profilePictureUrl ? (
                  <img 
                    src={currentUser.profilePicture || currentUser.profilePictureUrl} 
                    alt={currentUser?.firstname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{currentUser?.firstname?.charAt(0) || '👨'}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{currentUser?.companyName || 'Company Name'}</p>
                <p className="text-xs text-indigo-600 font-medium">{currentUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-white rounded-lg shadow-sm">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-medium text-gray-600">{currentUser?.isApproved ? 'Approved' : 'Pending Approval'}</span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <button onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'dashboard' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">Dashboard</span>
              {currentView === 'dashboard' && <ChevronRight className="h-4 w-4 ml-auto" />}
            </button>
            <button onClick={() => { setCurrentView('inventory'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${currentView === 'inventory' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'inventory' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
              <Lock className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Inventory</span>
            </button>
            <button onClick={() => { setCurrentView('orders'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${currentView === 'orders' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'orders' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
              <ClipboardList className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Orders</span>
            </button>
            <button onClick={() => { setCurrentView('products'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${currentView === 'products' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'products' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
              <Box className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Products</span>
            </button>
            <button onClick={() => { setCurrentView('issues'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${currentView === 'issues' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'issues' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
              <AlertCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Issues</span>
            </button>
          </nav>

          {/* Profile Link */}
          <div className="p-4 border-t border-gray-200">
            <button onClick={() => { setCurrentView('profile'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'profile' ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`} style={currentView === 'profile' ? { background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(99, 102, 241) 100%)' } : {}}>
              <Users className="h-5 w-5" />
              <span className="font-medium">Profile</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <button key={idx} className={`${action.color} text-white rounded-xl p-4 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
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
                    <span className={`text-sm font-bold px-2 py-1 rounded-lg ${stat.trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subtext}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sales Trends & Stock Levels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trends */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Sales Trends</h2>
                  <p className="text-sm text-gray-500">{salesView === 'week' ? 'Last 7 days performance' : 'Monthly performance'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSalesView('week')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${salesView === 'week' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}>Week</button>
                  <button onClick={() => setSalesView('month')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${salesView === 'month' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}>Month</button>
                </div>
              </div>
              <div className="flex items-end justify-between h-64 gap-3 pb-8">
                {dailySalesData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full flex items-end justify-center" style={{ height: '220px' }}>
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl transition-all hover:from-indigo-700 hover:to-indigo-500 cursor-pointer relative group shadow-lg"
                        style={{ height: `${(item.value / maxSales) * 100}%` }}
                      >
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                          ₹{item.value}K
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{item.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded shadow"></div>
                <span className="text-sm text-gray-600 font-medium">Daily Sales Revenue</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-500">Latest updates</p>
                </div>
                <Activity className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="space-y-4 overflow-y-auto max-h-96 pr-2 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-gray-100">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'order' ? 'bg-blue-100' :
                      activity.type === 'stock' ? 'bg-green-100' :
                      'bg-orange-100'
                    }`}>
                      {activity.type === 'order' ? <ShoppingCart className="h-4 w-4 text-blue-600" /> :
                       activity.type === 'stock' ? <Package className="h-4 w-4 text-green-600" /> :
                       <AlertCircle className="h-4 w-4 text-orange-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.item}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Stock Levels</h2>
                <p className="text-sm text-gray-500">Current inventory status</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto max-h-96 pr-2 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-gray-100">
              {stockLevelsData.map((item, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.status === 'good' ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <Package className={`h-5 w-5 ${item.status === 'good' ? 'text-green-600' : 'text-orange-600'}`} />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{item.category}</span>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-teal-500 rounded-full shadow"></div>
                            <span className="text-xs text-gray-600 font-medium">{item.current} units</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-orange-500 rounded-full shadow"></div>
                            <span className="text-xs text-gray-600 font-medium">Min: {item.min}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      item.status === 'good' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.status === 'good' ? 'Good' : 'Low Stock'}
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="absolute h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all shadow"
                      style={{ width: `${(item.current / maxStock) * 100}%` }}
                    ></div>
                    <div
                      className="absolute h-full border-2 border-orange-500 border-dashed rounded-full"
                      style={{ width: `${(item.min / maxStock) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-teal-500 to-teal-400 rounded-full shadow"></div>
                <span className="text-sm text-gray-600 font-medium">Current Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-orange-500 border-dashed rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">Minimum Level</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
