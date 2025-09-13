
import React, { useState, useEffect } from 'react';
import AdminHeader from './components/admin/AdminHeader';
import UserManagementView from './components/admin/UserManagementView';
import AdminProfileView from './components/admin/AdminProfileView';

const AdminApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'management' | 'profile'>('management');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'profile') {
        setCurrentView('profile');
      } else {
        setCurrentView('management');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'profile':
        return <AdminProfileView />;
      case 'management':
      default:
        return <UserManagementView />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AdminHeader />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default AdminApp;