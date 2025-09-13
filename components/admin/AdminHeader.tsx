import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/AppContext';

const AdminHeader: React.FC = () => {
  const { t, setLanguage, currentLanguage } = useLocalization();
  const { currentUser, logout } = useAppContext();

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
        <h1 className="text-xl font-bold text-slate-800">{t('texconnect')} - {t('admin_panel')}</h1>
      </div>
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
          <span className="font-medium text-slate-700 hidden sm:block">{currentUser?.username}</span>
          <img 
            src={currentUser?.profilePictureUrl || `https://i.pravatar.cc/40?u=${currentUser?.email}`} 
            alt="Admin Avatar" 
            className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-primary transition" 
            onClick={() => window.location.hash = 'profile'}
            title="View Profile"
          />
        </div>
        <button onClick={logout} className="text-slate-500 hover:text-primary" title={t('logout')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;