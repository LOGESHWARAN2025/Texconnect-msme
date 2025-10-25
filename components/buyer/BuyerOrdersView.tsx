import React, { useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/SupabaseContext';
import { supabase } from '../../src/lib/supabase';
import type { Order, OrderStatus } from '../../types';
import InvoiceModal from '../invoice/InvoiceModal';
import FeedbackForm from '../feedback/FeedbackForm';

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
  const { orders, currentUser } = useAppContext();
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

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
      alert('Order deleted successfully!');
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

    console.log('📝 Submitting feedback:', {
      userid: currentUser.id,
      username: currentUser.username,
      userrole: currentUser.role,
      orderid: feedbackOrder.id,
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
      alert('Thank you for your feedback!');
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
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('total')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('invoice')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {myOrders.length > 0 ? myOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{order.id?.substring(0, 8) || 'N/A'}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.date ? formatDate(order.date) : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{(order.total || 0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status || 'Pending')}`}>
                        {order.status || 'Pending'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {(order.status === 'Shipped' || order.status === 'Delivered') ? (
                        <button onClick={() => setViewingInvoiceOrder(order)} className="text-primary hover:underline">{t('download_pdf')}</button>
                      ) : (
                        <span className="text-slate-400 text-xs">
                          {order.status === 'Pending' && 'Awaiting acceptance'}
                          {order.status === 'Accepted' && 'Preparing shipment'}
                          {order.status === 'Cancelled' && 'Cancelled'}
                        </span>
                      )}
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deletingOrder === order.id}
                          className="ml-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingOrder === order.id ? '⏳ Deleting...' : '🗑️ Delete'}
                        </button>
                      )}
                      {order.status === 'Delivered' && (
                        <button
                          onClick={() => setFeedbackOrder(order)}
                          className="ml-2 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                        >
                          📝 Feedback
                        </button>
                      )}
                    </div>
                </td>
              </tr>
            )) : (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">{t('no_orders')}</td></tr>
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