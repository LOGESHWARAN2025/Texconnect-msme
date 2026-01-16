import React, { useState, useMemo } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/SupabaseContext';
import type { User } from '../../types';
import UserProfileModal from './UserProfileModal';
import CreateAdminModal from './CreateAdminModal';
import AuditLogView from './AuditLogView';
import IssueLogView from './IssueLogView';
import ReviewChangesModal from './ReviewChangesModal';
import DeleteUserModal from './DeleteUserModal';
import FeedbackLogsView from './FeedbackLogsView';

type AdminViewTab = 'msme' | 'buyer' | 'admin' | 'audit' | 'feedback-logs' | 'issues';

// User Table Component for MSMEs and Buyers
const UserTable: React.FC<{ users: User[], onView: (user: User) => void, onReview: (user: User) => void, onDelete: (user: User) => void }> = ({ users, onView, onReview, onDelete }) => {
  const { t } = useLocalization();


  if (users.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        No users found for this category.
      </div>
    );
  }


  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('user_name')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('email_address')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('gst_number')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {users.map(user => {
            const hasPendingChanges = !!user.pendingChanges && Object.keys(user.pendingChanges).length > 0;
            return (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.gstNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user.isEmailVerified ? t('verified') : t('unverified')}
                  </span>
                  {hasPendingChanges && (
                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Changes Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                  <button
                    onClick={() => onView(user)}
                    className="text-primary hover:text-primary/80"
                  >
                    View Profile
                  </button>
                  {hasPendingChanges && (
                    <button onClick={() => onReview(user)} className="text-blue-600 hover:text-blue-800 font-semibold">{t('review_changes')}</button>
                  )}
                  <button
                    onClick={() => onDelete(user)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};

// Admin Table Component
const AdminTable: React.FC<{ users: User[], currentUser: User | null, onDelete: (user: User) => void }> = ({ users, currentUser, onDelete }) => {
  const { t } = useLocalization();
  const isMainAdmin = currentUser?.isMainAdmin === true;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('user_name')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('email_address')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin_type')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
            {isMainAdmin && (
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.username}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {user.isMainAdmin ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Main Admin</span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Sub Admin</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {user.isEmailVerified ? 'Verified' : 'Unverified'}
                </span>
              </td>
              {isMainAdmin && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!user.isMainAdmin && user.id !== currentUser?.id && (
                    <button
                      onClick={() => onDelete(user)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const UserManagementView: React.FC = () => {
  const { t } = useLocalization();
  const { users, currentUser } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<AdminViewTab>('msme');
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [reviewingUser, setReviewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);

  const isMainAdmin = currentUser?.isMainAdmin === true;



  const filteredUsers = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return users.filter(user =>
      (user.username.toLowerCase().includes(lowercasedFilter) || user.email.toLowerCase().includes(lowercasedFilter))
    );
  }, [users, searchTerm]);

  const msmeUsers = useMemo(() => filteredUsers.filter(u => u.role === 'msme'), [filteredUsers]);
  const buyerUsers = useMemo(() => filteredUsers.filter(u => u.role === 'buyer'), [filteredUsers]);
  const adminUsers = useMemo(() => users.filter(u => u.role === 'admin'), [users]); // Don't filter admins by search

  const renderContent = () => {
    switch (activeTab) {
      case 'msme':
        return <UserTable users={msmeUsers} onView={setViewingUser} onReview={setReviewingUser} onDelete={setDeletingUser} />;
      case 'buyer':
        return <UserTable users={buyerUsers} onView={setViewingUser} onReview={setReviewingUser} onDelete={setDeletingUser} />;
      case 'admin':
        return <AdminTable users={adminUsers} currentUser={currentUser} onDelete={setDeletingUser} />;
      case 'audit':
        return <AuditLogView />;
      case 'feedback-logs':
        return <FeedbackLogsView />;
      case 'issues':
        return <IssueLogView />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ tab: AdminViewTab, label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${activeTab === tab
        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-medium'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-slate-700 bg-clip-text text-transparent">{t('user_management')}</h3>
          <p className="text-slate-500 text-sm mt-1">Manage platform users and permissions</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="block w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="border-b border-slate-200 mb-4">
        <nav className="flex flex-wrap space-x-2 gap-y-2">
          <TabButton tab="msme" label="MSME Approvals" />
          <TabButton tab="buyer" label="Buyer Approvals" />
          <TabButton tab="admin" label="Admin Management" />
          <TabButton tab="audit" label="Audit Log" />
          <TabButton tab="feedback-logs" label="Feedback Logs" />
          <TabButton tab="issues" label="Issue Log" />
        </nav>
      </div>
      {activeTab === 'admin' && isMainAdmin && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsCreateAdminModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow"
          >
            Create New Admin
          </button>
        </div>
      )}

      <div className="mt-4">
        {renderContent()}
      </div>

      <UserProfileModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
      />
      <CreateAdminModal
        isOpen={isCreateAdminModalOpen}
        onClose={() => setIsCreateAdminModalOpen(false)}
      />
      <ReviewChangesModal
        isOpen={!!reviewingUser}
        onClose={() => setReviewingUser(null)}
        user={reviewingUser}
      />
      <DeleteUserModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        user={deletingUser}
      />
    </div>
  );
};

export default UserManagementView;
