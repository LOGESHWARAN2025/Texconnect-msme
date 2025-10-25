import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import type { ResolvedIssue } from '../../types';

const ResolvedIssuesView: React.FC = () => {
    const { resolvedIssues, currentUser } = useAppContext();
    const { formatDateTime } = useLocalization();
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterResolvedBy, setFilterResolvedBy] = useState<string>('all');

    // Filter resolved issues based on selected filters and admin type
    const filteredIssues = useMemo(() => {
        let filtered = resolvedIssues || [];
        
        // Sub-admins only see issues THEY resolved
        if (!currentUser?.isMainAdmin) {
            filtered = filtered.filter((issue: ResolvedIssue) => issue.resolvedBy === currentUser?.id);
        }
        
        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter((issue: ResolvedIssue) => issue.category === filterCategory);
        }
        
        // Apply resolved by filter (only for main admin)
        if (currentUser?.isMainAdmin && filterResolvedBy === 'me') {
            filtered = filtered.filter((issue: ResolvedIssue) => issue.resolvedBy === currentUser?.id);
        }
        
        return filtered;
    }, [resolvedIssues, filterCategory, filterResolvedBy, currentUser]);

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                <div>
                    <h4 className="text-lg font-medium text-slate-700">Resolved Issues Log</h4>
                    {!currentUser?.isMainAdmin && (
                        <p className="text-xs text-slate-500 mt-1">
                            Showing only issues resolved by you
                        </p>
                    )}
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="all">All Categories</option>
                        <option value="Technical">Technical</option>
                        <option value="Payment">Payment</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Quality">Quality</option>
                        <option value="Other">Other</option>
                    </select>
                    {currentUser?.isMainAdmin && (
                        <select
                            value={filterResolvedBy}
                            onChange={(e) => setFilterResolvedBy(e.target.value)}
                            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="all">All Admins</option>
                            <option value="me">Resolved by Me</option>
                        </select>
                    )}
                </div>
            </div>
            
            {filteredIssues.length === 0 ? (
                <div className="text-center py-16">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No resolved issues</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {resolvedIssues && resolvedIssues.length === 0 
                            ? 'No issues have been resolved yet.' 
                            : 'No resolved issues match the selected filters.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredIssues.map((issue: ResolvedIssue) => (
                        <div key={issue.id} className="border border-green-200 bg-green-50 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">✅</span>
                                        <h5 className="text-base font-semibold text-slate-800">{issue.title}</h5>
                                        {issue.priority && (
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(issue.priority)}`}>
                                                {issue.priority.toUpperCase()}
                                            </span>
                                        )}
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            RESOLVED
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 mb-2">{issue.description}</p>
                                    
                                    <div className="bg-white border border-green-200 rounded-md p-3 mb-2">
                                        <p className="text-xs font-medium text-green-800 mb-1">Resolution:</p>
                                        <p className="text-sm text-slate-700">{issue.resolutionNotes}</p>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                        <span>
                                            <span className="font-medium">Reporter:</span> {issue.reporterUsername} ({issue.reporterRole.toUpperCase()})
                                        </span>
                                        {issue.relatedUsername && (
                                            <span>
                                                <span className="font-medium">Related:</span> {issue.relatedUsername}
                                            </span>
                                        )}
                                        <span>
                                            <span className="font-medium">Category:</span> {issue.category}
                                        </span>
                                        {issue.orderId && (
                                            <span>
                                                <span className="font-medium">Order:</span> {issue.orderId}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                                        <span>
                                            <span className="font-medium">Resolved by:</span> {issue.resolvedByUsername}
                                        </span>
                                        <span>
                                            <span className="font-medium">Resolved on:</span> {formatDateTime(issue.resolvedAt)}
                                        </span>
                                        <span>
                                            <span className="font-medium">Reported on:</span> {formatDateTime(issue.reportedAt)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2 ml-4">
                                    <button className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-200 transition">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResolvedIssuesView;
