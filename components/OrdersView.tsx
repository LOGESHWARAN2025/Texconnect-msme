import React, { useMemo, useState } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';
import type { OrderStatus, Order } from '../types';
import InvoiceModal from './invoice/InvoiceModal';
import QRCodeStickerPrinter from './QRCodeStickerPrinter';
import OrderQRScanner from './OrderQRScanner';

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
  const [scanningOrder, setScanningOrder] = useState<Order | null>(null);
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

      const order = orders.find(o => o.id === orderId);
      if (newStatus === 'Shipped' && order && order.totalUnits && order.totalUnits > 0) {
        const scannedCount = order.scannedUnits?.length || 0;
        if (scannedCount < order.totalUnits) {
          alert(`You must scan all ${order.totalUnits} unit stickers before shipping. (${scannedCount} scanned so far)`);
          setScanningOrder(order);
          setUpdatingOrderId(null);
          return;
        }
      }

      console.log('📝 Changing status to:', newStatus);
      await updateOrderStatus(orderId, newStatus);
      console.log('✅ Status changed successfully');
    } catch (error: any) {
      const errorMessage = error?.message || error?.code || 'Unknown error occurred';
      console.error('❌ Failed to update order status:', errorMessage);
      alert(`${t('failed_update_status')}: ${errorMessage}. ${t('please_try_again') || 'Please try again'}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Note: status transitions are handled inline per row to control allowed states

  return (
    <>
      <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('track_orders')}</h3>
            <p className="text-slate-500 font-bold">{t('manage_fulfill_orders')}</p>
          </div>
          <div className="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{userOrders.length} {t('orders')}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('order_id')}</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('buyer_name')}</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('item_name')}</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('date')}</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('total')}</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('status')}</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {userOrders.length > 0 ? userOrders.map(order => (
                  <tr key={order.id} className="group transition-all hover:bg-slate-50/50">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black tracking-widest group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">#{order.id.substring(0, 8)}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-black text-slate-900 group-hover:translate-x-1 transition-transform">{order.buyerName}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-500">{order.itemName || t('not_applicable')}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-600">{formatDate(order.createdAt || order.date || new Date().toISOString())}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-black text-indigo-600 tracking-tight">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-4 py-1.5 inline-flex text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm border border-black/5 ${getStatusColor(order.status)}`}>
                        {t(order.status.toLowerCase()) || order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-4">
                        {order.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, 'Accepted')}
                              disabled={updatingOrderId === order.id}
                              className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{t('accept')}</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, 'Cancelled')}
                              disabled={updatingOrderId === order.id}
                              className="px-6 py-2.5 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>{t('cancel')}</span>
                            </button>
                          </>
                        ) : order.status === 'Cancelled' ? (
                          <button
                            onClick={() => handleStatusChange(order.id, 'Pending')}
                            disabled={updatingOrderId === order.id}
                            className="px-6 py-2.5 border-2 border-slate-100 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                          >
                            {t('retrieve')}
                          </button>
                        ) : (
                          <div className="relative group/select">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              disabled={updatingOrderId === order.id}
                              className="appearance-none block w-40 pl-6 pr-10 py-3 text-[10px] font-black uppercase tracking-widest border-2 border-slate-50 focus:outline-none focus:border-indigo-600 focus:bg-white rounded-2xl bg-slate-50/50 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {order.status === 'Accepted' && (
                                <>
                                  <option value="Accepted" disabled>{t('accepted')}</option>
                                  <option value="Shipped">{t('shipped')}</option>
                                  <option value="Delivered">{t('delivered')}</option>
                                </>
                              )}
                              {order.status === 'Shipped' && (
                                <>
                                  <option value="Shipped" disabled>{t('shipped')}</option>
                                  <option value="Delivered">{t('delivered')}</option>
                                </>
                              )}
                              {order.status === 'Delivered' && (
                                <option value="Delivered" disabled>{t('delivered')}</option>
                              )}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-hover/select:translate-y-0.5 transition-transform">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        )}
                        {(order.status === 'Accepted' || order.status === 'Shipped' || order.status === 'Delivered') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingInvoiceOrder(order)}
                              className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all hover:-translate-y-1 shadow-sm border border-slate-100"
                              title={t('invoice')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setPrintingQROrder(order)}
                              className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all hover:-translate-y-1 shadow-sm border border-slate-100"
                              title={t('qr_sticker')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setScanningOrder(order)}
                              className="relative p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-green-600 hover:text-white transition-all hover:-translate-y-1 shadow-sm border border-slate-100"
                              title={t('scan_units')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {order.totalUnits && order.totalUnits > 0 && (
                                <span className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black border ${order.scannedUnits?.length === order.totalUnits ? 'bg-green-500 text-white border-green-600' : 'bg-yellow-400 text-yellow-900 border-yellow-500'}`}>
                                  {order.scannedUnits?.length || 0}/{order.totalUnits}
                                </span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="text-center py-32 bg-slate-50/20">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center grayscale opacity-50">
                        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-xl font-black text-slate-300 uppercase tracking-[0.2em]">{t('no_orders')}</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
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
      <OrderQRScanner
        isOpen={!!scanningOrder}
        onClose={() => setScanningOrder(null)}
        order={scanningOrder}
        onScanComplete={async (scannedIds) => {
          if (scanningOrder) {
            const { supabase } = await import('../src/lib/supabase');
            await supabase
              .from('orders')
              .update({ scannedUnits: scannedIds })
              .eq('id', scanningOrder.id);

            // Check if complete and auto-update status?
            if (scannedIds.length === (scanningOrder.totalUnits || 0)) {
              // We don't auto-update to avoid surprises, but user can now select Shipped
            }
          }
        }}
      />
    </>
  );
};

export default OrdersView;
