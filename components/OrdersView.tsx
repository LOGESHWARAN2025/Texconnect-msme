import React, { useMemo, useState } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';
import type { OrderStatus, Order } from '../types';
import InvoiceModal from './invoice/InvoiceModal';

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Accepted': return 'bg-cyan-100 text-cyan-800';
    case 'Shipped': return 'bg-blue-100 text-blue-800';
    case 'Delivered': return 'bg-green-100 text-green-800';
    case 'Cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

const OrdersView: React.FC = () => {
  const { t, formatDate } = useLocalization();
  const { orders, updateOrderStatus, currentUser, products } = useAppContext();
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const userProductIds = useMemo(() => {
    if (!currentUser || currentUser.role !== 'msme') return new Set();
    const userProducts = products.filter(item => item.msmeId === currentUser.id);
    return new Set(userProducts.map(item => item.id));
  }, [products, currentUser]);

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'msme') {
       return orders.filter(order => 
         order.items && Array.isArray(order.items) && order.items.some(item => userProductIds.has(item.productId))
       );
    }
    // For other roles, orders are already filtered in context, but this is a safeguard.
    return orders;
  }, [orders, userProductIds, currentUser]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Prevent duplicate calls
    if (updatingOrderId === orderId) {
      console.log('⏳ Already updating this order, skipping...');
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      console.log('📝 Changing status to:', newStatus);
      await updateOrderStatus(orderId, newStatus);
      console.log('✅ Status changed successfully');
    } catch (error: any) {
      const errorMessage = error?.message || error?.code || 'Unknown error occurred';
      console.error('❌ Failed to update order status:', errorMessage);
      alert(`Failed to update status: ${errorMessage}. Please try again.`);
    } finally {
      setUpdatingOrderId(null);
    }
  };
  
  const orderStatuses: OrderStatus[] = ['Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md">
       <h3 className="text-xl font-semibold text-slate-800 mb-6">{t('track_orders')}</h3>

       <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('order_id')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('buyer_name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('buyer_gst')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('total')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {userOrders.length > 0 ? userOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.id.substring(0,8)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.buyerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.buyerGst}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(order.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{order.total.toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-2">
                    <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={updatingOrderId === order.id}
                        className={`block w-32 pl-3 pr-8 py-1 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md ${
                          updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        aria-label={`Update status for order ${order.id}`}
                    >
                        {orderStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button onClick={() => setViewingInvoiceOrder(order)} className="text-primary hover:text-primary/80" title={t('invoice')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                    </button>
                </td>
              </tr>
            )) : (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">{t('no_orders')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    <InvoiceModal 
        isOpen={!!viewingInvoiceOrder}
        onClose={() => setViewingInvoiceOrder(null)}
        order={viewingInvoiceOrder}
      />
    </>
  );
};

export default OrdersView;
