import React from 'react';
import OrdersView from '../OrdersView';

interface OrdersPageProps {
  onBack: () => void;
}

const OrdersPage: React.FC<OrdersPageProps> = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Orders Control</h1>
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <OrdersView />
      </div>
    </div>
  );
};

export default OrdersPage;
