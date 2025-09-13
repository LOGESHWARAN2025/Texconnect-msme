import React from 'react';
import Modal from '../common/Modal';
import { User } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const DetailItem: React.FC<{label: string, value?: string | React.ReactNode}> = ({label, value}) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{value || 'N/A'}</dd>
    </div>
);

const UserProfileModal: React.FC<UserProfileModalProps> = ({isOpen, onClose, user}) => {
    const { t } = useLocalization();
    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="User Profile Details">
            <div className="space-y-4">
               <dl className="divide-y divide-slate-200">
                    <DetailItem label="Username" value={user.username}/>
                    <DetailItem label="Full Name" value={user.firstname}/>
                    <DetailItem label="Role" value={user.role}/>
                    {user.role === 'msme' && user.domain && (
                        <DetailItem label={t('domain')} value={user.domain} />
                    )}
                    <DetailItem label="Email" value={user.email}/>
                    <DetailItem label="Phone" value={user.phone}/>
                    <DetailItem label="Address" value={user.address}/>
                    <DetailItem label="GST Number" value={user.gstNumber}/>
                    {user.role === 'msme' && (
                         <DetailItem label={t('gst_certificate')} value={
                            user.gstCertificateUrl
                            ? (<a href={user.gstCertificateUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition shadow">{t('view_certificate')}</a>)
                            : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">{t('not_uploaded')}</span>
                        }/>
                    )}
                    <DetailItem label="Approval Status" value={user.isApproved ? 'Approved' : 'Pending'}/>
               </dl>
                <div className="flex justify-end pt-2">
                    <button 
                        onClick={onClose} 
                        className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UserProfileModal;