import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import type { Feedback } from '../../types';

interface FeedbackLog extends Feedback {
  actionType?: 'created' | 'updated' | 'responded';
}

const FeedbackLogsView: React.FC = () => {
  const [logs, setLogs] = useState<FeedbackLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        <div className="grid grid-cols-5 gap-4">
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
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-800">
              {logs.filter(l => l.status === 'resolved').length}
            </div>
            <div className="text-sm text-green-600">Resolved</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-800">
              {logs.filter(l => l.adminResponse).length}
            </div>
            <div className="text-sm text-purple-600">Responded</div>
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
    </div>
  );
};

export default FeedbackLogsView;
