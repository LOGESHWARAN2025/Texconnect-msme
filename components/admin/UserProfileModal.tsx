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

const DetailItem: React.FC<{ label: string, value?: string | React.ReactNode }> = ({ label, value }) => {
    const { t } = useLocalization();
    return (
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{value || t('not_applicable')}</dd>
        </div>
    );
};

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
            alert(t('failed_approve_user'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('user_profile_details')}>
            <div className="space-y-6">
                <dl className="divide-y divide-gray-100">
                    <DetailItem label={t('user_name')} value={user.username} />
                    <DetailItem label={t('full_name')} value={user.firstname} />
                    <DetailItem label={t('role')} value={<span className="capitalize font-black text-indigo-600">{t(user.role) || user.role}</span>} />
                    {user.role === 'msme' && user.domain && (
                        <DetailItem label={t('domain')} value={t(user.domain) || user.domain} />
                    )}
                    <DetailItem label={t('email')} value={user.email} />
                    <DetailItem label={t('phone')} value={user.phone} />
                    <DetailItem label={t('address')} value={user.address} />
                    <DetailItem label={t('gst_number')} value={user.gstNumber} />
                    {user.role === 'msme' && (
                        <DetailItem label={t('gst_certificate')} value={
                            user.gstCertificateUrl
                                ? (<a href={user.gstCertificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-black hover:bg-indigo-100 transition border border-indigo-200">{t('view_certificate')}</a>)
                                : <span className="px-3 py-1 inline-flex text-xs leading-5 font-black rounded-full bg-slate-100 text-slate-500 border border-slate-200">{t('not_uploaded')}</span>
                        } />
                    )}
                    <DetailItem label={t('approval_status')} value={
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${user.isApproved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                            {user.isApproved ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    {t('approved')}
                                </>
                            ) : t('pending_review')}
                        </span>
                    } />
                </dl>
                <div className="flex justify-end pt-6 border-t border-gray-100 gap-3">
                    <button
                        onClick={onClose}
                        className="bg-white text-slate-700 px-5 py-2.5 rounded-xl font-black hover:bg-slate-50 transition border border-slate-200 shadow-sm"
                    >
                        {t('close')}
                    </button>
                    {!user.isApproved && (
                        <button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? t('approving') : t('approve_user')}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default UserProfileModal;