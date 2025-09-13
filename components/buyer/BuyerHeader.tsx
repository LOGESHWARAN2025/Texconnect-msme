import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/AppContext';

type BuyerView = 'browse' | 'orders' | 'profile';

interface BuyerHeaderProps {
  currentView: BuyerView;
  setView: (view: BuyerView) => void;
}

const BuyerHeader: React.FC<BuyerHeaderProps> = ({ currentView, setView }) => {
  const { t, setLanguage, currentLanguage } = useLocalization();
  const { currentUser, logout } = useAppContext();

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
        <h1 className="text-xl font-bold text-slate-800">{t('texconnect')} - {t('buyer_portal')}</h1>
        <nav className="flex items-center space-x-2 border-l border-slate-200 ml-4 pl-4">
            <button onClick={() => setView('browse')} className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'browse' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>{t('browse_products')}</button>
            <button onClick={() => setView('orders')} className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'orders' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>{t('my_orders')}</button>
            <button onClick={() => setView('profile')} className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'profile' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>{t('profile')}</button>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
         <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-600">{t('language')}:</span>
            <div className="relative inline-block w-28 text-left">
                <select 
                    value={currentLanguage} 
                    onChange={setLanguage} 
                    className="block appearance-none w-full bg-white border border-slate-300 hover:border-slate-400 px-4 py-2 pr-8 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    aria-label="Select language"
                >
                    <option value="en">{t('english')}</option>
                    <option value="ta">{t('tamil')}</option>
                </select>
            </div>
        </div>
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setView('profile')}
          role="button"
          title="View Profile"
        >
          <span className="font-medium text-slate-700 hidden sm:block">{currentUser?.companyName || currentUser?.username}</span>
          <img 
            src={currentUser?.profilePictureUrl || `https://i.pravatar.cc/40?u=${currentUser?.email}`} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        <button onClick={logout} className="text-slate-500 hover:text-primary" title={t('logout')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
    </header>
  );
};

export default BuyerHeader;