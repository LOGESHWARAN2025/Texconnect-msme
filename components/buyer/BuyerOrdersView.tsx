import React, { useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/SupabaseContext';
import { supabase } from '../../src/lib/supabase';
import type { Order, OrderStatus } from '../../types';
import InvoiceModal from '../invoice/InvoiceModal';
import FeedbackForm from '../feedback/FeedbackForm';
import OrderQRScanner from '../OrderQRScanner';

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

const BuyerOrdersView: React.FC = () => {
  const { t, formatDate } = useLocalization();
  const { orders, currentUser, updateOrderStatus } = useAppContext();
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  
  // States for Buyer QR Scanning feature
  const [scanningOrder, setScanningOrder] = useState<Order | null>(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ orderId: string, status: OrderStatus } | null>(null);
  const [localScannedCounts, setLocalScannedCounts] = useState<Record<string, number>>({});

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    setDeletingOrder(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      console.log('✅ Order deleted successfully');
      console.log('ℹ️ Stock restored by database trigger');
      
      // Trigger products refetch by touching the products table
      // This will cause the realtime subscription to fire
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert('Order deleted successfully! Product stock has been restored.');
      
      // Reload page to show updated stock
      window.location.reload();
    } catch (error) {
      console.error('❌ Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    } finally {
      setDeletingOrder(null);
    }
  };

  const handleFeedbackSubmit = async (data: { rating: number; comment: string; category: string }) => {
    if (!currentUser || !feedbackOrder) {
      console.error('❌ Missing currentUser or feedbackOrder');
      return;
    }

    // Get productId from the first item in the order
    const productId = feedbackOrder.items && feedbackOrder.items.length > 0 
      ? feedbackOrder.items[0].productId 
      : null;

    if (!productId) {
      console.error('❌ No product ID found in order');
      alert('Error: Cannot submit feedback - product not found');
      return;
    }

    console.log('📝 Submitting feedback:', {
      userid: currentUser.id,
      username: currentUser.username,
      userrole: currentUser.role,
      orderid: feedbackOrder.id,
      productid: productId,
      rating: data.rating,
      category: data.category
    });

    try {
      const { data: insertedData, error } = await supabase
        .from('feedback')
        .insert({
          userid: currentUser.id,
          username: currentUser.username,
          userrole: currentUser.role,
          orderid: feedbackOrder.id,
          productid: productId, // ✅ CRITICAL: Link feedback to product
          rating: data.rating,
          comment: data.comment,
          category: data.category,
          status: 'pending'
        })
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Feedback submitted successfully:', insertedData);
      console.log('✅ Product rating will update automatically via trigger');
      alert('Thank you for your feedback! Product rating updated.');
      setFeedbackOrder(null); // Reset state
    } catch (error: any) {
      console.error('❌ Error submitting feedback:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      alert(`Failed to submit feedback: ${error.message || 'Please try again.'}`);
      throw error;
    }
  };

  // The orders from context are already filtered for the current buyer
  const myOrders = orders;

  // Debug logging
  React.useEffect(() => {
    console.log('🛒 Buyer Orders View - Total orders:', myOrders.length);
    if (myOrders.length > 0) {
      console.log('📦 Sample order:', myOrders[0]);
      console.log('Order fields:', {
        id: myOrders[0].id,
        date: myOrders[0].date,
        total: myOrders[0].total,
        status: myOrders[0].status,
        items: myOrders[0].items,
        itemsLength: myOrders[0].items?.length || 0,
        itemsIsArray: Array.isArray(myOrders[0].items),
        buyerName: myOrders[0].buyerName,
        buyerId: myOrders[0].buyerId
      });
      
      // Check all orders
      myOrders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`, {
          id: order.id?.substring(0, 8),
          hasItems: order.items && order.items.length > 0,
          itemCount: order.items?.length || 0
        });
      });
    }
  }, [myOrders]);

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md">
       <h3 className="text-xl font-semibold text-slate-800 mb-6">{t('your_orders')}</h3>

       <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('order_id')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Delivery Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('total')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('invoice')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {myOrders.length > 0 ? myOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{order.id?.substring(0, 8) || 'N/A'}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">
                  {order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || order.totalUnits || 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(order.createdAt || order.date || new Date().toISOString())}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                  {order.deliveryDate ? formatDate(order.deliveryDate) : <span className="text-slate-300 italic">Not set</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status || 'Pending')}`}>
                        {order.status || 'Pending'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {order.status === 'Out for Delivery' ? (
                     <button
                        onClick={() => setScanningOrder(order)}
                        className="px-4 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 hover:shadow-lg transition-all animate-pulse"
                     >
                        Scan to Receive
                     </button>
                  ) : order.status === 'Delivered' ? (
                     <span className="text-green-600 font-bold text-xs">✓ Received</span>
                  ) : (
                     <span className="text-slate-300 text-xs italic">Awaiting dispatch</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {order.status === 'Delivered' ? (
                        <button onClick={() => setViewingInvoiceOrder(order)} className="text-primary hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all">
                          📄 Download PDF
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                          Unavailable
                        </span>
                      )}
                      
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deletingOrder === order.id}
                          className="px-3 py-1.5 bg-red-50 text-red-600 font-bold text-xs rounded-lg hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingOrder === order.id ? '⏳' : '🗑️'}
                        </button>
                      )}
                      {order.status === 'Delivered' && (
                        <button
                          onClick={() => setFeedbackOrder(order)}
                          className="px-3 py-1.5 bg-green-50 text-green-700 font-bold text-xs rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                        >
                          📝 Rate
                        </button>
                      )}
                    </div>
                </td>
              </tr>
            )) : (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">{t('no_orders')}</td></tr>
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
    <OrderQRScanner
        isOpen={!!scanningOrder}
        onClose={() => setScanningOrder(null)}
        order={scanningOrder}
        onScanComplete={(scannedIds) => {
          if (scanningOrder) {
            setLocalScannedCounts(prev => ({ ...prev, [scanningOrder.id]: scannedIds.length }));
          }
        }}
        onConfirmClose={() => {
          if (scanningOrder) {
             setPendingStatusUpdate({ orderId: scanningOrder.id, status: 'Delivered' });
          }
        }}
    />
    {pendingStatusUpdate && !scanningOrder && (() => {
      const order = orders.find(o => o.id === pendingStatusUpdate.orderId);
      if (!order) return null;
      
      const total = order.printedUnits || order.totalUnits || order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 1;

      return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in duration-300">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Package Successfully Verified!</h3>
             <p className="text-slate-500 text-sm mb-6">You have scanned all verified items. Mark this order as Delivered?</p>
             <div className="flex gap-4 justify-center">
               <button onClick={() => setPendingStatusUpdate(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
               <button onClick={async () => {
                  const id = pendingStatusUpdate.orderId;
                  setPendingStatusUpdate(null);
                  try {
                     await updateOrderStatus(id, 'Delivered');
                     alert("Success! Order marked as Delivered. The invoice is now available.");
                  } catch (e: any) {
                     alert("Error marking as delivered: " + e.message);
                  }
               }} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-colors">Confirm Delivery</button>
             </div>
          </div>
        </div>
      );
    })()}
    {feedbackOrder && (
      <FeedbackForm
        orderId={feedbackOrder.id}
        onSubmit={handleFeedbackSubmit}
        onClose={() => setFeedbackOrder(null)}
      />
    )}
    </>
  );
};

export default BuyerOrdersView;