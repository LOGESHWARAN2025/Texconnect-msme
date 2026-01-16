import React, { useState } from 'react';
import InventoryDashboard from './InventoryDashboard';
import ProductManagementView from './ProductManagementView';

interface InventoryPageProps {
  onBack: () => void;
}

const InventoryPage: React.FC<InventoryPageProps> = () => {
  const [showAddProduct, setShowAddProduct] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Inventory Hub</h1>
        {showAddProduct && (
          <button
            onClick={() => setShowAddProduct(false)}
            className="px-6 py-2 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
          >
            Close Manual Entry
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        {showAddProduct ? (
          <div className="p-8">
            <ProductManagementView />
          </div>
        ) : (
          <InventoryDashboard />
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
