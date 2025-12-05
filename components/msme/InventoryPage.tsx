import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import InventoryDashboard from './InventoryDashboard';
import ProductManagementView from './ProductManagementView';

interface InventoryPageProps {
  onBack: () => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ onBack }) => {
  const [showAddProduct, setShowAddProduct] = useState(false);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto" style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#a5b4fc #f3f4f6'
    }}>
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {showAddProduct ? (
          <div>
            <button
              onClick={() => setShowAddProduct(false)}
              className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </button>
            <ProductManagementView />
          </div>
        ) : (
          <InventoryDashboard onAddProduct={() => setShowAddProduct(true)} />
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
