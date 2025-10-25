import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';

const PendingApprovalPage: React.FC = () => {
    const { t } = useLocalization();
    const { logout } = useAppContext();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="max-w-lg w-full bg-white p-10 rounded-xl shadow-lg text-center">
                <svg className="mx-auto h-12 w-12 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="mt-4 text-2xl font-bold text-slate-800">{t('pending_approval')}</h2>
                <p className="mt-2 text-slate-600">{t('pending_approval_message')}</p>
                <button 
                    onClick={logout} 
                    className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    {t('logout')}
                </button>
            </div>
        </div>
    );
};

export default PendingApprovalPage;
