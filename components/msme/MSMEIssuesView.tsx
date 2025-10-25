import React, { useState } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import IssueReportForm from '../common/IssueReportForm';
import type { Issue } from '../../types';

const MSMEIssuesView: React.FC = () => {
    const { currentUser, issues } = useAppContext();
    const { formatDateTime } = useLocalization();
    const [showReportForm, setShowReportForm] = useState(false);
    const [viewTab, setViewTab] = useState<'active' | 'resolved'>('active');

    // Filter issues for current user
    const myIssues = issues ? issues.filter((issue: Issue) => issue.reporterId === currentUser?.id) : [];

    // Debug logging
    React.useEffect(() => {
        console.log('🔍 MSME Issues Debug:', {
            totalIssues: issues?.length || 0,
            currentUserId: currentUser?.id,
            myIssuesCount: myIssues.length,
            myIssues: myIssues
        });
    }, [issues, currentUser, myIssues]);

    // Separate active and resolved
    const activeIssues = myIssues.filter(issue => issue.status !== 'resolved' && issue.status !== 'closed');
    const resolvedIssues = myIssues.filter(issue => issue.status === 'resolved' || issue.status === 'closed');

    // Current view issues
    const displayIssues = viewTab === 'active' ? activeIssues : resolvedIssues;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">My Complaints</h3>
                <button
                    onClick={() => setShowReportForm(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow"
                >
                    Report New Issue
                </button>
            </div>

            {/* Active/Resolved Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setViewTab('active')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        viewTab === 'active'
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    Active ({activeIssues.length})
                </button>
                <button
                    onClick={() => setViewTab('resolved')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        viewTab === 'resolved'
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    Resolved ({resolvedIssues.length})
                </button>
            </div>

            {displayIssues.length === 0 ? (
                <div className="text-center py-16">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No complaints</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {viewTab === 'active' 
                            ? "You have no active complaints." 
                            : "You have no resolved complaints."}
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => setShowReportForm(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                        >
                            Report an Issue
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayIssues.map((issue) => (
                        <div key={issue.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-slate-800">{issue.title}</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    issue.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                    issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                    issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                    'bg-slate-100 text-slate-800'
                                }`}>
                                    {issue.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{issue.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <span className={`px-2 py-1 rounded ${
                                        issue.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                        issue.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                        issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {issue.priority.toUpperCase()}
                                    </span>
                                </span>
                                <span>📦 {issue.category}</span>
                                <span>🕒 {formatDateTime(issue.createdAt)}</span>
                            </div>
                            {issue.adminResponse && (
                                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                                    <p className="text-xs font-semibold text-blue-800 mb-1">Admin Response:</p>
                                    <p className="text-sm text-blue-700">{issue.adminResponse}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Report Form Modal */}
            {showReportForm && currentUser && (
                <IssueReportForm
                    userId={currentUser.id}
                    userName={currentUser.username}
                    userRole={currentUser.role}
                    onClose={() => setShowReportForm(false)}
                />
            )}
        </div>
    );
};

export default MSMEIssuesView;
