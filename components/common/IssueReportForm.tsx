import React, { useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import type { IssueCategory, IssuePriority } from '../../types';

interface IssueReportFormProps {
  userId: string;
  userName: string;
  userRole: 'msme' | 'buyer' | 'admin';
  orderId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const IssueReportForm: React.FC<IssueReportFormProps> = ({
  userId,
  userName,
  userRole,
  orderId,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('order');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { value: IssueCategory; label: string; icon: string }[] = [
    { value: 'order', label: 'Order Issue', icon: '📦' },
    { value: 'payment', label: 'Payment Issue', icon: '💳' },
    { value: 'quality', label: 'Quality Issue', icon: '⭐' },
    { value: 'delivery', label: 'Delivery Issue', icon: '🚚' },
    { value: 'technical', label: 'Technical Issue', icon: '🔧' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const priorities: { value: IssuePriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('issues')
        .insert({
          reporterid: userId,
          reportername: userName,
          reporterrole: userRole,
          orderid: orderId || null,
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          status: 'open'
        });

      if (error) throw error;

      console.log('✅ Issue reported successfully');
      alert('Issue reported successfully! Our team will review it soon.');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error reporting issue:', error);
      alert('Failed to report issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Report an Issue</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Issue Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                    category === cat.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Priority *
            </label>
            <div className="flex gap-2">
              {priorities.map((pri) => (
                <button
                  key={pri.value}
                  type="button"
                  onClick={() => setPriority(pri.value)}
                  className={`flex-1 px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                    priority === pri.value
                      ? 'border-primary bg-primary text-white'
                      : `border-slate-200 hover:border-slate-300 ${pri.color}`
                  }`}
                >
                  {pri.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Please provide detailed information about the issue..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Order ID (if provided) */}
          {orderId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Linked to Order:</span> {orderId.substring(0, 8)}...
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueReportForm;
