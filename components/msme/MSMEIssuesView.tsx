import React, { useState } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import IssueReportForm from '../common/IssueReportForm';
import type { Issue } from '../../types';
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const MSMEIssuesView: React.FC = () => {
  const { currentUser, issues } = useAppContext();
  const { t, formatDateTime } = useLocalization();
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
    <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('my_issues_complaints')}</h3>
          <p className="text-slate-500 font-bold">{t('track_and_manage_your_tickets') || 'Track and manage your support tickets'}</p>
        </div>
        <button
          onClick={() => setShowReportForm(true)}
          className="group flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all hover:-translate-y-1 active:translate-y-0"
        >
          <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14M5 12h14" />
          </svg>
          {t('report_new_issue')}
        </button>
      </div>

      {/* Active/Resolved Tabs */}
      <div className="flex gap-4 mb-10 p-1.5 bg-slate-100 rounded-[1.25rem] w-fit">
        <button
          onClick={() => setViewTab('active')}
          className={`px-8 py-3 rounded-[1rem] font-black text-sm transition-all ${viewTab === 'active'
            ? 'bg-white text-indigo-600 shadow-xl'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          {t('active_issues')} ({activeIssues.length})
        </button>
        <button
          onClick={() => setViewTab('resolved')}
          className={`px-8 py-3 rounded-[1rem] font-black text-sm transition-all ${viewTab === 'resolved'
            ? 'bg-white text-indigo-600 shadow-xl'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          {t('resolved')} ({resolvedIssues.length})
        </button>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {displayIssues.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold text-lg">
              {viewTab === 'active' ? t('no_active_issues') : t('no_resolved_issues')}
            </p>
          </div>
        ) : (
          displayIssues.map((issue: Issue) => (
            <div
              key={issue.id}
              className="group bg-white border border-slate-200 rounded-[2rem] p-8 hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-5 flex-1">
                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                    {getStatusIcon(issue.status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{issue.title}</h4>
                    <p className="text-slate-500 font-medium mt-2 leading-relaxed">{issue.description}</p>
                  </div>
                </div>
                <span className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${getPriorityColor(issue.priority)}`}>
                  {t(issue.priority) || issue.priority}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('category')}:</span>
                    <span className="text-slate-700 font-black">{t(issue.category) || issue.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('status')}:</span>
                    <span className="text-indigo-600 font-black uppercase text-[10px] tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">
                      {t(issue.status) || issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 font-bold">{formatDateTime(issue.createdAt)}</span>
              </div>

              {issue.adminResponse && (
                <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm h-fit">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t('admin_response')}:</p>
                    <p className="text-slate-700 font-bold leading-relaxed">{issue.adminResponse}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Report Form Modal */}
      {showReportForm && currentUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('report_new_issue')}</h2>
              <button
                onClick={() => setShowReportForm(false)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all text-2xl font-light"
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
