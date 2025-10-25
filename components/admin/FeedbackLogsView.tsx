import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import type { Feedback } from '../../types';
import Modal from '../common/Modal';

interface FeedbackLog extends Feedback {
  actionType?: 'created' | 'updated' | 'responded';
}

const FeedbackLogsView: React.FC = () => {
  const [logs, setLogs] = useState<FeedbackLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackLog | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLogs();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('feedback-logs-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'feedback' 
      }, (payload) => {
        console.log('🔄 Feedback changed:', payload);
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('createdat', { ascending: false });

      if (error) throw error;

      if (data) {
        console.log('✅ Fetched feedback logs:', data.length, 'items');
        const mappedLogs: FeedbackLog[] = data.map((item: any) => ({
          id: item.id,
          userId: item.userId || item.userid,
          userName: item.userName || item.username,
          userRole: item.userRole || item.userrole,
          orderId: item.orderId || item.orderid,
          rating: item.rating,
          comment: item.comment,
          category: item.category,
          status: item.status,
          adminResponse: item.adminResponse || item.adminresponse,
          createdAt: item.createdAt || item.createdat,
          updatedAt: item.updatedAt || item.updatedat,
          actionType: (item.adminResponse || item.adminresponse) ? 'responded' : 'created'
        }));
        setLogs(mappedLogs);
      }
    } catch (error) {
      console.error('Error fetching feedback logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'msme': return 'bg-purple-100 text-purple-800';
      case 'buyer': return 'bg-cyan-100 text-cyan-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMarkAsReviewed = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: 'reviewed', updatedat: new Date().toISOString() })
        .eq('id', feedbackId);

      if (error) throw error;
      console.log('✅ Feedback marked as reviewed');
      fetchLogs();
    } catch (error) {
      console.error('❌ Error marking as reviewed:', error);
      alert('Failed to mark as reviewed');
    }
  };

  const handleResolve = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: 'resolved', updatedat: new Date().toISOString() })
        .eq('id', feedbackId);

      if (error) throw error;
      console.log('✅ Feedback resolved');
      fetchLogs();
    } catch (error) {
      console.error('❌ Error resolving feedback:', error);
      alert('Failed to resolve feedback');
    }
  };

  const handleOpenReviewModal = (feedback: FeedbackLog) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.adminResponse || '');
    setIsReviewModalOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ 
          adminresponse: responseText,
          status: 'reviewed',
          updatedat: new Date().toISOString()
        })
        .eq('id', selectedFeedback.id);

      if (error) throw error;
      console.log('✅ Response submitted');
      setIsReviewModalOpen(false);
      setSelectedFeedback(null);
      setResponseText('');
      fetchLogs();
    } catch (error) {
      console.error('❌ Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'product_quality': return '📦';
      case 'delivery': return '🚚';
      case 'service': return '🤝';
      case 'platform': return '💻';
      case 'other': return '📝';
      default: return '📋';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading feedback logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Feedback Logs</h2>
            <p className="text-sm text-slate-600 mt-1">Chronological activity log of all feedback</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search user or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-slate-800">{logs.length}</div>
            <div className="text-sm text-slate-600">Total Logs</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-800">
              {logs.filter(l => l.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-800">
              {logs.filter(l => l.status === 'reviewed').length}
            </div>
            <div className="text-sm text-blue-600">Reviewed</div>
          </div>
        </div>
      </div>

      {/* Timeline Logs */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Activity Timeline</h3>
        
        {filteredLogs.length > 0 ? (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border-l-4 border-primary pl-4 py-3 hover:bg-slate-50 rounded-r-lg transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCategoryIcon(log.category)}</span>
                      <span className="font-semibold text-slate-800">{log.userName}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(log.userRole)}`}>
                        {log.userRole.toUpperCase()}
                      </span>
                      <span className="text-yellow-400 text-sm">{getRatingStars(log.rating)}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">{formatTimestamp(log.createdAt)}</span>
                    </div>

                    {/* Category and Order */}
                    <div className="flex items-center gap-3 mb-2 text-sm text-slate-600">
                      {log.category && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {log.category.replace('_', ' ')}
                        </span>
                      )}
                      {log.orderId && (
                        <span className="bg-blue-50 px-2 py-1 rounded text-blue-700">
                          Order: {log.orderId.substring(0, 8)}...
                        </span>
                      )}
                    </div>

                    {/* Comment */}
                    {log.comment && (
                      <div className="bg-slate-50 p-3 rounded-lg mb-2">
                        <p className="text-sm text-slate-700">{log.comment}</p>
                      </div>
                    )}

                    {/* Admin Response */}
                    {log.adminResponse && (
                      <div className="bg-blue-50 p-3 rounded-lg border-l-2 border-blue-400">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-700">Admin Response:</span>
                          {log.updatedAt && log.updatedAt !== log.createdAt && (
                            <span className="text-xs text-blue-600">
                              {formatTimestamp(log.updatedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-900">{log.adminResponse}</p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleOpenReviewModal(log)}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'No feedback logs match your filters'
              : 'No feedback logs yet'}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedFeedback(null);
          setResponseText('');
        }}
        title="Feedback Review"
        size="lg"
      >
        {selectedFeedback && (
          <div className="space-y-4">
            {/* Feedback Details */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(selectedFeedback.category)}</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedFeedback.userName}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleColor(selectedFeedback.userRole)}`}>
                      {selectedFeedback.userRole.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 text-lg">{getRatingStars(selectedFeedback.rating)}</div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Category:</span>
                  <span className="ml-2 font-semibold">{selectedFeedback.category?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-600">Submitted:</span>
                  <span className="ml-2 font-semibold">{formatTimestamp(selectedFeedback.createdAt)}</span>
                </div>
                {selectedFeedback.orderId && (
                  <div className="col-span-2">
                    <span className="text-slate-600">Order ID:</span>
                    <span className="ml-2 font-mono text-sm bg-blue-50 px-2 py-1 rounded">{selectedFeedback.orderId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* User Comment */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">User Feedback:</label>
              <div className="bg-white border border-slate-200 p-4 rounded-lg">
                <p className="text-slate-800">{selectedFeedback.comment || 'No comment provided'}</p>
              </div>
            </div>

            {/* Admin Response */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Admin Response:
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter your response to the user..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setSelectedFeedback(null);
                  setResponseText('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              
              {selectedFeedback.status === 'pending' && (
                <button
                  onClick={async () => {
                    await handleMarkAsReviewed(selectedFeedback.id);
                    setIsReviewModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark as Reviewed
                </button>
              )}
              
              <button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || !responseText.trim()}
                className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {isSubmitting ? 'Submitting...' : (selectedFeedback.adminResponse ? 'Update Response' : 'Submit Response')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackLogsView;
