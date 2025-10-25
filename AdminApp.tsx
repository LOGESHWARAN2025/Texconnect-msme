
import React, { useState, useEffect } from 'react';
import AdminHeader from './components/admin/AdminHeader';
import UserManagementView from './components/admin/UserManagementView';
import AdminProfileView from './components/admin/AdminProfileView';

const AdminApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'management' | 'profile'>('management');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      console.log('AdminApp: Hash changed to:', hash);
      if (hash === 'profile') {
        console.log('AdminApp: Setting view to profile');
        setCurrentView('profile');
      } else {
        console.log('AdminApp: Setting view to management');
        setCurrentView('management');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  console.log('AdminApp: Current view is:', currentView);

  const handleBackToDashboard = () => {
    window.location.hash = '';
    setCurrentView('management');
  };

  const renderView = () => {
    console.log('AdminApp: Rendering view:', currentView);
    switch (currentView) {
      case 'profile':
        console.log('AdminApp: Returning AdminProfileView');
        return <AdminProfileView onBack={handleBackToDashboard} />;
      case 'management':
      default:
        console.log('AdminApp: Returning UserManagementView');
        return <UserManagementView />;
    }
  };

  console.log('AdminApp: About to render, currentView:', currentView);
  
  return (
    <div className="flex flex-col h-full">
      <AdminHeader />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
        <div style={{padding: '20px', background: 'white'}}>
          <h1>Admin App Loaded - Current View: {currentView}</h1>
        </div>
        {renderView()}
      </main>
    </div>
  );
};

export default AdminApp;