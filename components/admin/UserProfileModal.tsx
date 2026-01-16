import React from 'react';
import Modal from '../common/Modal';
import { User } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/SupabaseContext';
import { CheckCircle } from 'lucide-react';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const DetailItem: React.FC<{ label: string, value?: string | React.ReactNode }> = ({ label, value }) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{value || 'N/A'}</dd>
    </div>
);

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
    const { t } = useLocalization();
    const { approveUser } = useAppContext();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    if (!user) return null;

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            await approveUser(user.id);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to approve user');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="User Profile Details">
            <div className="space-y-6">
                <dl className="divide-y divide-gray-100">
                    <DetailItem label="Username" value={user.username} />
                    <DetailItem label="Full Name" value={user.firstname} />
                    <DetailItem label="Role" value={<span className="capitalize font-medium text-indigo-600">{user.role}</span>} />
                    {user.role === 'msme' && user.domain && (
                        <DetailItem label={t('domain')} value={user.domain} />
                    )}
                    <DetailItem label="Email" value={user.email} />
                    <DetailItem label="Phone" value={user.phone} />
                    <DetailItem label="Address" value={user.address} />
                    <DetailItem label="GST Number" value={user.gstNumber} />
                    {user.role === 'msme' && (
                        <DetailItem label={t('gst_certificate')} value={
                            user.gstCertificateUrl
                                ? (<a href={user.gstCertificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition border border-indigo-200">{t('view_certificate')}</a>)
                                : <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-500 border border-slate-200">{t('not_uploaded')}</span>
                        } />
                    )}
                    <DetailItem label="Approval Status" value={
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user.isApproved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                            {user.isApproved ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    Approved
                                </>
                            ) : 'Pending Review'}
                        </span>
                    } />
                </dl>
                <div className="flex justify-end pt-6 border-t border-gray-100 gap-3">
                    <button
                        onClick={onClose}
                        className="bg-white text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition border border-slate-200 shadow-sm"
                    >
                        Close
                    </button>
                    {!user.isApproved && (
                        <button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition shadow-lg shadow-green-500/30 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Approving...' : 'Approve User'}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default UserProfileModal;