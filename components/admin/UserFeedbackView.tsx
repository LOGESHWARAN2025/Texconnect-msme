import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import type { Feedback, UserRole } from '../../types';

const UserFeedbackView: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    if (roleFilter === 'all') {
      setFilteredFeedbacks(feedbacks);
    } else {
      setFilteredFeedbacks(feedbacks.filter(f => f.userRole === roleFilter));
    }
  }, [roleFilter, feedbacks]);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedFeedbacks: Feedback[] = data.map((item: any) => ({
          id: item.id,
          userId: item.userId,
          userName: item.userName,
          userRole: item.userRole,
          orderId: item.orderId,
          rating: item.rating,
          comment: item.comment,
          category: item.category,
          status: item.status,
          adminResponse: item.adminResponse,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }));
        setFeedbacks(mappedFeedbacks);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;

      alert('Status updated successfully!');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !adminResponse.trim()) return;

    try {
      const { error } = await supabase
        .from('feedback')
        .update({ 
          adminResponse: adminResponse,
          status: 'reviewed'
        })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      alert('Response submitted successfully!');
      setSelectedFeedback(null);
      setAdminResponse('');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading feedbacks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">User Feedback</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Filter by Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="msme">MSME Users</option>
              <option value="buyer">Buyers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-slate-800">{feedbacks.length}</div>
            <div className="text-sm text-slate-600">Total Feedback</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-800">
              {feedbacks.filter(f => f.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-800">
              {feedbacks.filter(f => f.status === 'reviewed').length}
            </div>
            <div className="text-sm text-blue-600">Reviewed</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-800">
              {feedbacks.filter(f => f.status === 'resolved').length}
            </div>
            <div className="text-sm text-green-600">Resolved</div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Comment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredFeedbacks.length > 0 ? filteredFeedbacks.map((feedback) => (
                <tr key={feedback.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {feedback.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(feedback.userRole)}`}>
                      {feedback.userRole.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="text-yellow-400">{getRatingStars(feedback.rating)}</span>
                    <span className="ml-1 text-slate-600">({feedback.rating}/5)</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {feedback.category || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                    {feedback.comment || 'No comment'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={feedback.status}
                      onChange={(e) => handleUpdateStatus(feedback.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(feedback.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedFeedback(feedback)}
                      className="text-primary hover:underline"
                    >
                      View/Respond
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                    No feedback found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Feedback Details</h3>
              <button
                onClick={() => {
                  setSelectedFeedback(null);
                  setAdminResponse('');
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">User:</label>
                  <p className="text-slate-900">{selectedFeedback.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Role:</label>
                  <p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedFeedback.userRole)}`}>
                    {selectedFeedback.userRole.toUpperCase()}
                  </span></p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Rating:</label>
                  <p className="text-yellow-400 text-lg">{getRatingStars(selectedFeedback.rating)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Category:</label>
                  <p className="text-slate-900">{selectedFeedback.category || 'N/A'}</p>
                </div>
              </div>

              {selectedFeedback.orderId && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Order ID:</label>
                  <p className="text-slate-900 font-mono">{selectedFeedback.orderId.substring(0, 8)}...</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700">Comment:</label>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg mt-1">
                  {selectedFeedback.comment || 'No comment provided'}
                </p>
              </div>

              {selectedFeedback.adminResponse && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Previous Admin Response:</label>
                  <p className="text-slate-900 bg-blue-50 p-3 rounded-lg mt-1">
                    {selectedFeedback.adminResponse}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700">Admin Response:</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={4}
                  placeholder="Write your response here..."
                  className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFeedback(null);
                    setAdminResponse('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={!adminResponse.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFeedbackView;
