import React, { useMemo, useState } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';
import type { OrderStatus, Order } from '../types';
import InvoiceModal from './invoice/InvoiceModal';
import QRCodeStickerPrinter from './QRCodeStickerPrinter';

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
  const [printingQROrder, setPrintingQROrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const userProductIds = useMemo(() => {
    if (!currentUser || currentUser.role !== 'msme') return new Set();
    const userProducts = products.filter(item => item.msmeId === currentUser.id);
    console.log('🏭 MSME Products:', {
      totalProducts: products.length,
      userProducts: userProducts.length,
      currentUserId: currentUser.id,
      productIds: userProducts.map(p => p.id)
    });
    return new Set(userProducts.map(item => item.id));
  }, [products, currentUser]);

  const userOrders = useMemo(() => {
    if (!currentUser) {
      console.log('❌ No current user in OrdersView');
      return [];
    }
    
    console.log('📋 OrdersView - Filtering orders:', {
      role: currentUser.role,
      totalOrders: orders.length,
      userProductIds: Array.from(userProductIds)
    });
    
    if (currentUser.role === 'msme') {
      // Debug each order
      orders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`, {
          id: order.id?.substring(0, 8),
          buyerName: order.buyerName,
          items: order.items,
          itemsIsArray: Array.isArray(order.items),
          itemsLength: order.items?.length,
          productIds: order.items?.map((item: any) => item.productId)
        });
      });
      
      const filtered = orders.filter(order => {
        if (!order.items || !Array.isArray(order.items)) {
          console.log('⚠️ Order has no items array:', order.id);
          return false;
        }
        
        const hasMatchingProduct = order.items.some(item => {
          const matches = userProductIds.has(item.productId);
          console.log('  Item check:', {
            productId: item.productId,
            productName: item.productName,
            matches: matches
          });
          return matches;
        });
        
        return hasMatchingProduct;
      });
      
      console.log('✅ Filtered MSME orders:', filtered.length);
      return filtered;
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
  
  // Note: status transitions are handled inline per row to control allowed states

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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.itemName || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(order.createdAt || order.date || new Date().toISOString())}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2 mb-2">
                        {order.status === 'Pending' ? (
                            // Show Accept and Cancel buttons for Pending orders
                            <>
                                <button
                                    onClick={() => handleStatusChange(order.id, 'Accepted')}
                                    disabled={updatingOrderId === order.id}
                                    className={`px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded font-medium transition flex items-center justify-center space-x-1 ${
                                        updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Accept Order"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Accept</span>
                                </button>
                                <button
                                    onClick={() => handleStatusChange(order.id, 'Cancelled')}
                                    disabled={updatingOrderId === order.id}
                                    className={`px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded font-medium transition flex items-center justify-center space-x-1 ${
                                        updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Cancel Order"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span>Cancel</span>
                                </button>
                            </>
                        ) : (
                            // Show dropdown for non-Pending orders with limited options
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                disabled={updatingOrderId === order.id}
                                className={`block w-40 pl-3 pr-8 py-1 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md ${
                                    updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                aria-label={`Update status for order ${order.id}`}
                            >
                                {/* After acceptance: only allow Shipped or Delivered. Keep current as disabled */}
                                {order.status === 'Accepted' && (
                                    <>
                                        <option value="Accepted" disabled>Accepted</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                    </>
                                )}
                                {/* After shipped: allow only Delivered. Keep current as disabled */}
                                {order.status === 'Shipped' && (
                                    <>
                                        <option value="Shipped" disabled>Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                    </>
                                )}
                                {/* Delivered & Cancelled are terminal states */}
                                {order.status === 'Delivered' && (
                                    <option value="Delivered" disabled>Delivered</option>
                                )}
                                {order.status === 'Cancelled' && (
                                    <option value="Cancelled" disabled>Cancelled</option>
                                )}
                            </select>
                        )}
                        <button onClick={() => setViewingInvoiceOrder(order)} className="text-primary hover:text-primary/80" title={t('invoice')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                    {order.status === 'Accepted' && (
                        <button
                            onClick={() => setPrintingQROrder(order)}
                            className="w-full px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-medium transition flex items-center justify-center space-x-1"
                            title="Print QR Code Sticker"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v4a1 1 0 11-2 0V4H4v10h4a1 1 0 110 2H4a2 2 0 01-2-2V4z" />
                                <path fillRule="evenodd" d="M12.586 4a1 1 0 100 1.414l2.828 2.828a1 1 0 001.414 0l2.828-2.828a1 1 0 00-1.414-1.414L15.828 5.172l-1.414-1.414a1 1 0 00-1.414 0l-2.828 2.828a1 1 0 001.414 1.414l1.414-1.414 1.414 1.414a1 1 0 001.414-1.414l-2.828-2.828z" clipRule="evenodd" />
                            </svg>
                            <span>QR Sticker</span>
                        </button>
                    )}
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
    <QRCodeStickerPrinter
        isOpen={!!printingQROrder}
        onClose={() => setPrintingQROrder(null)}
        order={printingQROrder}
      />
    </>
  );
};

export default OrdersView;
