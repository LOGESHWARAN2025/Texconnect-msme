import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';
import type { View } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  viewName: View;
  label: string;
  icon: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
}> = ({ viewName, label, icon, currentView, setCurrentView }) => {
  const isActive = currentView === viewName;
  return (
    <button
      onClick={() => setCurrentView(viewName)}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${
        isActive
          ? 'bg-primary text-white shadow-lg'
          : 'text-slate-500 hover:bg-primary/10 hover:text-primary'
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { t } = useLocalization();
  const { currentUser } = useAppContext();

  return (
    <div className="w-64 bg-white p-4 flex-shrink-0 flex flex-col shadow-lg">
      <div className="flex items-center mb-4 px-2">
         <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
        <h1 className="text-2xl font-bold text-slate-800 ml-2">{t('texconnect')}</h1>
      </div>
      
      {/* User Profile Section */}
      <div 
        className="flex items-center space-x-3 px-2 py-3 mb-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
        onClick={() => setCurrentView('profile')}
        role="button"
        title="View Profile"
      >
        {currentUser?.profilePictureUrl ? (
          <img 
            src={currentUser.profilePictureUrl} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-medium text-sm text-slate-800">{currentUser?.companyName || currentUser?.username}</span>
          <span className="text-xs text-slate-500">{currentUser?.email}</span>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        <NavItem
          viewName="dashboard"
          label={t('dashboard')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        <NavItem
          viewName="inventory"
          label={t('inventory')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v10a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4z" clipRule="evenodd" /></svg>}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        <NavItem
          viewName="orders"
          label={t('orders')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        <NavItem
          viewName="products"
          label={t('products')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" /></svg>}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        <NavItem
          viewName="issues"
          label="Issues"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        {/* Inventory Dashboard merged into main dashboard */}
      </nav>
      <div className="mt-auto">
        <NavItem
          viewName="profile"
          label={t('profile')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      </div>
    </div>
  );
};

export default Sidebar;