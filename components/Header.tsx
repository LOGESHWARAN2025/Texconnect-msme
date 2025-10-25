import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';
import type { View } from '../types';

interface HeaderProps {
  currentView: View;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { t, setLanguage, currentLanguage } = useLocalization();
  const { currentUser, logout } = useAppContext();

  const viewTitles: Record<View, string> = {
    dashboard: t('dashboard_overview'),
    inventory: t('manage_inventory'),
    orders: t('track_orders'),
    profile: t('your_profile'),
    products: t('manage_products'),
    'inventory-dashboard': t('dashboard_overview'), // Legacy route, now merged with dashboard
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <h2 className="text-2xl font-bold text-slate-800 capitalize">{viewTitles[currentView]}</h2>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-600">{t('language')}:</span>
            <div className="relative inline-block w-28 text-left">
                <select 
                    value={currentLanguage} 
                    onChange={setLanguage} 
                    className="block appearance-none w-full bg-white border border-slate-300 hover:border-slate-400 px-4 py-2 pr-8 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                    <option value="en">{t('english')}</option>
                    <option value="ta">{t('tamil')}</option>
                </select>
            </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <span className="font-medium text-slate-700">{currentUser?.username}</span>
            <p className="text-xs text-slate-500">{t('gst_number')}: {currentUser?.gstNumber}</p>
          </div>
          {currentUser?.profilePictureUrl ? (
            <img src={currentUser.profilePictureUrl} alt="User Avatar" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <button onClick={logout} className="text-slate-500 hover:text-primary" title={t('logout')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
    </header>
  );
};

export default Header;