import React, { useState } from 'react';
import Modal from '../common/Modal';
import { User } from '../../types';
import { useAppContext } from '../../context/SupabaseContext';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isOpen, onClose, user }) => {
    const { deleteUser } = useAppContext();
    const [feedback, setFeedback] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    if (!user) return null;

    const handleDelete = async () => {
        if (!feedback.trim()) {
            alert('Please provide feedback/reason for deletion');
            return;
        }

        setIsDeleting(true);
        try {
            await deleteUser(user.id, feedback);
            alert(`User ${user.username} has been deleted successfully.`);
            onClose();
            setFeedback('');
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(`Failed to delete user: ${error.message || 'Unknown error'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete User">
            <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-semibold text-red-800">Warning: This action cannot be undone</h4>
                            <p className="text-sm text-red-700 mt-1">
                                You are about to permanently delete the user <strong>{user.username}</strong> ({user.email}).
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">User Details:</p>
                    <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {user.username}</p>
                        <p><span className="font-medium">Email:</span> {user.email}</p>
                        <p><span className="font-medium">Role:</span> {user.role.toUpperCase()}</p>
                        {user.role !== 'admin' && (
                            <p><span className="font-medium">GST Number:</span> {user.gstNumber}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="feedback" className="block text-sm font-medium text-slate-700 mb-2">
                        Reason for Deletion <span className="text-red-600">*</span>
                    </label>
                    <textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Please provide a reason for deleting this user (e.g., user request, policy violation, duplicate account, etc.)"
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">This feedback will be logged in the audit trail.</p>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || !feedback.trim()}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete User'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteUserModal;
