import React, { useState } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import IssueReportForm from '../common/IssueReportForm';
import type { Issue } from '../../types';
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const MSMEIssuesView: React.FC = () => {
  const { currentUser, issues } = useAppContext();
  const { formatDateTime } = useLocalization();
  const [showReportForm, setShowReportForm] = useState(false);
  const [viewTab, setViewTab] = useState<'active' | 'resolved'>('active');

  // Filter issues for current MSME user
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'closed': return <CheckCircle className="h-5 w-5 text-gray-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-slate-800">My Issues & Complaints</h3>
        <button
          onClick={() => setShowReportForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow"
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
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active Issues ({activeIssues.length})
        </button>
        <button
          onClick={() => setViewTab('resolved')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            viewTab === 'resolved'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Resolved ({resolvedIssues.length})
        </button>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {displayIssues.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {viewTab === 'active' ? 'No active issues' : 'No resolved issues'}
            </p>
          </div>
        ) : (
          displayIssues.map((issue: Issue) => (
            <div
              key={issue.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(issue.status)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                  {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex gap-4">
                  <span>Category: {issue.category}</span>
                  <span>Status: {issue.status}</span>
                </div>
                <span>{formatDateTime(issue.createdAt)}</span>
              </div>

              {issue.adminResponse && (
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">Admin Response:</p>
                  <p className="text-sm text-blue-800 mt-1">{issue.adminResponse}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Report Form Modal */}
      {showReportForm && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Report New Issue</h2>
              <button
                onClick={() => setShowReportForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <IssueReportForm
                userId={currentUser.id}
                userName={currentUser.firstname || currentUser.username}
                userRole="msme"
                onClose={() => setShowReportForm(false)}
                onSuccess={() => {
                  setShowReportForm(false);
                  // Issues will be updated via real-time subscription
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MSMEIssuesView;
