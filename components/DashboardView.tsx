import React, { useMemo, useEffect, useState } from 'react';
import Card from './common/Card';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/AppContext';
import { getDailySalesTrends, subscribeToInventoryUpdates } from '../services/dashboardService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Order } from '../types';

const DashboardView: React.FC = () => {
  const { t } = useLocalization();
  const { products, orders, currentUser } = useAppContext();
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [stockLevels, setStockLevels] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // Load initial sales trends
    getDailySalesTrends(currentUser.id).then(setSalesTrends);

    // Subscribe to real-time stock level updates
    const unsubscribe = subscribeToInventoryUpdates(currentUser.id, setStockLevels);

    return () => unsubscribe();
  }, [currentUser]);

  const userProducts = useMemo(() => {
    if (!currentUser) {
      console.log('❌ No current user in DashboardView');
      return [];
    }
    const filtered = products.filter(product => product.msmeId === currentUser.id);
    console.log('📦 User products in DashboardView:', filtered.length, 'out of', products.length, 'total products');
    return filtered;
  }, [products, currentUser]);

  const userProductIds = useMemo(() => {
    return new Set(userProducts.map(product => product.id));
  }, [userProducts]);

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter((order: Order) => order.items.some((item: { productId: string }) => userProductIds.has(item.productId)));
  }, [orders, userProductIds, currentUser]);

  const totalStockValue = userProducts.reduce((acc, product) => acc + product.stock * product.price, 0);
  const pendingOrders = userOrders.filter(o => o.status === 'Pending').length;
  const totalItems = userProducts.reduce((acc, product) => acc + product.stock, 0);
  const revenueThisMonth = userOrders.filter(o => o.status === 'Delivered').reduce((acc, order) => acc + order.total, 0);

  console.log('📊 Dashboard calculations:', {
    totalStockValue,
    pendingOrders,
    totalItems,
    revenueThisMonth,
    userOrdersCount: userOrders.length
  });


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title={t('total_stock_value')}
          value={`₹${totalStockValue.toLocaleString('en-IN')}`}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          colorClass="bg-blue-500"
        />
        <Card
          title={t('pending_orders')}
          value={pendingOrders}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          colorClass="bg-yellow-500"
        />
        <Card
          title={t('items_in_stock')}
          value={totalItems.toLocaleString('en-IN')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
          colorClass="bg-green-500"
        />
         <Card
          title={t('revenue_this_month')}
          value={`₹${revenueThisMonth.toLocaleString('en-IN')}`}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          colorClass="bg-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('sales_trends')}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Sales']}
                    />
                    <Legend />
                    <Bar dataKey="sales" fill="#4f46e5" name="Daily Sales" />
                </BarChart>
            </ResponsiveContainer>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('stock_levels')}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockLevels}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                    />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                        formatter={(value, name) => [value, name === 'stock' ? 'Current Stock' : 'Min Stock Level']}
                    />
                    <Legend />
                    <Bar dataKey="stock" fill="#10b981" name="Current Stock" />
                    <Bar dataKey="minStockLevel" fill="#f59e0b" name="Min Stock Level" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;