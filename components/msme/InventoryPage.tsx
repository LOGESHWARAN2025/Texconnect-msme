import React from 'react';
import { ArrowLeft } from 'lucide-react';
import InventoryDashboard from './InventoryDashboard';

interface InventoryPageProps {
  onBack: () => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ onBack }) => {
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
        <InventoryDashboard />
      </div>
    </div>
  );
};

export default InventoryPage;
