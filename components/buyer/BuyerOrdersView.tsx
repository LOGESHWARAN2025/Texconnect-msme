import React, { useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/AppContext';
import type { Order, OrderStatus } from '../../types';
import InvoiceModal from '../invoice/InvoiceModal';

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Shipped': return 'bg-blue-100 text-blue-800';
    case 'Delivered': return 'bg-green-100 text-green-800';
    case 'Cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

const BuyerOrdersView: React.FC = () => {
  const { t, formatDate } = useLocalization();
  const { orders } = useAppContext();
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);

  // The orders from context are already filtered for the current buyer
  const myOrders = orders;

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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{order.id.substring(0, 8)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(order.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{order.total.toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => setViewingInvoiceOrder(order)} className="text-primary hover:underline">{t('download_pdf')}</button>
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
    </>
  );
};

export default BuyerOrdersView;