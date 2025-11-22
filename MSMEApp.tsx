import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import OrdersView from './components/OrdersView';
import ProductManagementView from './components/msme/ProductManagementView';
import MSMECombinedDashboard from './components/msme/MSMECombinedDashboard';
import ProfileView from './components/msme/ProfileView';
import MSMEIssuesView from './components/msme/MSMEIssuesView';
import type { View } from './types';

const MSMEApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <MSMECombinedDashboard />;
      case 'inventory':
        return <InventoryView />;
      case 'orders':
        return <OrdersView />;
      case 'products':
        return <ProductManagementView />;
      case 'inventory-dashboard':
        return <MSMECombinedDashboard />;
      case 'issues':
        return <MSMEIssuesView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={currentView} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 md:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default MSMEApp;