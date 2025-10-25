import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import { supabase } from '../../src/lib/supabase';
import type { Issue } from '../../types';

const IssueLogView: React.FC = () => {
    const { issues, currentUser } = useAppContext();
    const { formatDateTime } = useLocalization();
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [viewTab, setViewTab] = useState<'active' | 'resolved'>('active');
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Separate active and resolved issues
    const activeIssues = useMemo(() => {
        return (issues || []).filter(issue => issue.status !== 'resolved' && issue.status !== 'closed');
    }, [issues]);

    const resolvedIssues = useMemo(() => {
        return (issues || []).filter(issue => issue.status === 'resolved' || issue.status === 'closed');
    }, [issues]);

    // Filter issues based on selected filters
    const filteredIssues = useMemo(() => {
        let filtered = viewTab === 'active' ? activeIssues : resolvedIssues;
        
        if (filterStatus !== 'all') {
            filtered = filtered.filter(issue => issue.status === filterStatus);
        }
        
        if (filterPriority !== 'all') {
            filtered = filtered.filter(issue => issue.priority === filterPriority);
        }
        
        if (filterCategory !== 'all') {
            filtered = filtered.filter(issue => issue.category === filterCategory);
        }
        
        return filtered;
    }, [activeIssues, resolvedIssues, viewTab, filterStatus, filterPriority, filterCategory]);

    const handleResolve = async (issue: Issue) => {
        if (!currentUser) return;

        const confirmed = confirm(`Mark issue "${issue.title}" as resolved?`);
        if (!confirmed) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('issues')
                .update({
                    status: 'resolved',
                    resolvedat: new Date().toISOString(),
                    resolvedby: currentUser.id,
                    updatedat: new Date().toISOString()
                })
                .eq('id', issue.id);

            if (error) throw error;

            console.log('✅ Issue resolved successfully');
            alert('Issue marked as resolved!');
        } catch (error) {
            console.error('❌ Error resolving issue:', error);
            alert('Failed to resolve issue. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddResponse = async (issue: Issue) => {
        if (!currentUser || !adminResponse.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('issues')
                .update({
                    adminresponse: adminResponse.trim(),
                    updatedat: new Date().toISOString()
                })
                .eq('id', issue.id);

            if (error) throw error;

            console.log('✅ Response added successfully');
            alert('Response added successfully!');
            setSelectedIssue(null);
            setAdminResponse('');
        } catch (error) {
            console.error('❌ Error adding response:', error);
            alert('Failed to add response. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-purple-100 text-purple-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                <h4 className="text-lg font-medium text-slate-700">Issue Log</h4>
                <div className='flex flex-wrap items-center gap-2'>
                    <div className="flex gap-2 mr-4">
                        <button
                            onClick={() => setViewTab('active')}
                            className={`px-4 py-1.5 rounded-lg font-medium text-sm transition ${
                                viewTab === 'active'
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Active ({activeIssues.length})
                        </button>
                        <button
                            onClick={() => setViewTab('resolved')}
                            className={`px-4 py-1.5 rounded-lg font-medium text-sm transition ${
                                viewTab === 'resolved'
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Resolved ({resolvedIssues.length})
                        </button>
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        {viewTab === 'resolved' && <option value="resolved">Resolved</option>}
                        {viewTab === 'resolved' && <option value="closed">Closed</option>}
                    </select>
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="all">All Priority</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
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
                </div>
            </div>
            
            {filteredIssues.length === 0 ? (
                <div className="text-center py-16">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No issues found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {issues && issues.length === 0 
                            ? 'No issues have been reported yet.' 
                            : 'No issues match the selected filters.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredIssues.map(issue => (
                        <div key={issue.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">{getPriorityIcon(issue.priority)}</span>
                                        <h5 className="text-base font-semibold text-slate-800">{issue.title}</h5>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(issue.priority)}`}>
                                            {issue.priority.toUpperCase()}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                                            {issue.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 mb-2">{issue.description}</p>
                                    
                                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                        <span>
                                            <span className="font-medium">Reporter:</span> {issue.reporterName} ({issue.reporterRole.toUpperCase()})
                                        </span>
                                        <span>
                                            <span className="font-medium">Category:</span> {issue.category}
                                        </span>
                                        {issue.orderId && (
                                            <span>
                                                <span className="font-medium">Order:</span> {issue.orderId.substring(0, 8)}...
                                            </span>
                                        )}
                                        <span>
                                            <span className="font-medium">Created:</span> {formatDateTime(issue.createdAt)}
                                        </span>
                                        {issue.resolvedAt && (
                                            <span>
                                                <span className="font-medium">Resolved:</span> {formatDateTime(issue.resolvedAt)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {issue.adminResponse && (
                                        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                                            <p className="text-xs font-semibold text-blue-800 mb-1">Admin Response:</p>
                                            <p className="text-sm text-blue-700">{issue.adminResponse}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col gap-2 ml-4">
                                    {viewTab === 'active' && (
                                        <>
                                            <button
                                                onClick={() => setSelectedIssue(issue)}
                                                className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-200 transition whitespace-nowrap"
                                            >
                                                Add Response
                                            </button>
                                            <button
                                                onClick={() => handleResolve(issue)}
                                                disabled={isSubmitting}
                                                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-200 transition disabled:opacity-50 whitespace-nowrap"
                                            >
                                                {isSubmitting ? 'Resolving...' : 'Mark Resolved'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Response Modal */}
            {selectedIssue && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800">Add Response to Issue</h3>
                            <button
                                onClick={() => {
                                    setSelectedIssue(null);
                                    setAdminResponse('');
                                }}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold text-slate-800 mb-2">{selectedIssue.title}</h4>
                            <p className="text-sm text-slate-600">{selectedIssue.description}</p>
                            <div className="mt-2 text-xs text-slate-500">
                                <span className="font-medium">Reporter:</span> {selectedIssue.reporterName}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Your Response *
                            </label>
                            <textarea
                                value={adminResponse}
                                onChange={(e) => setAdminResponse(e.target.value)}
                                placeholder="Enter your response to the user..."
                                rows={4}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleAddResponse(selectedIssue)}
                                disabled={isSubmitting || !adminResponse.trim()}
                                className="flex-1 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Response'}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedIssue(null);
                                    setAdminResponse('');
                                }}
                                className="px-6 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueLogView;
