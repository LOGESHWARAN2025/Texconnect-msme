import React from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';

const BuyerResolvedView: React.FC = () => {
    const { currentUser } = useAppContext();
    const { formatDateTime } = useLocalization();

    // Placeholder - will be connected to context later
    const myResolvedIssues: any[] = [];

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">Resolved Complaints</h3>

            {myResolvedIssues.length === 0 ? (
                <div className="text-center py-16">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No resolved complaints</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        You don't have any resolved complaints yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Resolved issues will be displayed here */}
                    <p className="text-slate-500">Your resolved complaints will appear here</p>
                </div>
            )}
        </div>
    );
};

export default BuyerResolvedView;
