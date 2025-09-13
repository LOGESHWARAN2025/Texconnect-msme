import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useLocalization } from '../../hooks/useLocalization';

const AuditLogView: React.FC = () => {
    const { auditLogs, clearLogs } = useAppContext();
    const { formatDateTime } = useLocalization();

    const handleClearLogs = () => {
        if (window.confirm("Are you sure you want to clear the entire audit log? This action cannot be undone.")) {
            clearLogs().catch((err: any) => {
                const sanitizedCode = String(err.code || 'unknown').replace(/[\r\n]/g, '');
                const sanitizedMessage = String(err.message || 'unknown error').replace(/[\r\n]/g, '');
                console.error(`Failed to clear logs: ${sanitizedCode} - ${sanitizedMessage}`);
                alert("Could not clear logs. Please try again.");
            });
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                 <h4 className="text-lg font-medium text-slate-700">Administrator Actions Log</h4>
                 <div className='flex items-center'>
                    <button onClick={handleClearLogs} className="text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-200 transition">Clear Log</button>
                 </div>
            </div>
            {auditLogs.length === 0 ? (
                <div className="text-center py-16">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No log entries</h3>
                    <p className="mt-1 text-sm text-slate-500">Approve a user or create a new admin to see log entries here.</p>
                </div>
            ) : (
                <div className="border border-slate-200 rounded-lg">
                    <ul className="divide-y divide-slate-200">
                        {auditLogs.map(log => (
                            <li key={log.id} className="p-4 flex items-start space-x-4">
                               <div className="flex-shrink-0 bg-slate-100 rounded-full p-2">
                                  <svg className="h-6 w-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                               </div>
                               <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                                        <p className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</p>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1"><span className="font-medium">Admin:</span> {log.adminUsername}</p>
                                    <p className="text-sm text-slate-600"><span className="font-medium">Details:</span> {log.details}</p>
                               </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AuditLogView;
