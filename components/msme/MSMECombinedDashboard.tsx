import React from 'react';
import DashboardView from '../DashboardView';
import InventoryDashboard from './InventoryDashboard';

const MSMECombinedDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Sales & Stock charts */}
      <DashboardView />
      {/* Inventory overview cards and low stock */}
      <InventoryDashboard />
    </div>
  );
};

export default MSMECombinedDashboard;
