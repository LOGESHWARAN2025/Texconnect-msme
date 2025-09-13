import React from 'react';
import Modal from '../common/Modal';
import type { User } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/AppContext';

interface ReviewChangesModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const ReviewItem: React.FC<{label: string, currentValue: any, proposedValue: any}> = ({label, currentValue, proposedValue}) => {
    const isChanged = proposedValue !== undefined && currentValue !== proposedValue;
    return (
        <tr className={isChanged ? "bg-yellow-50" : ""}>
            <td className="py-2 px-3 text-sm font-medium text-slate-500 border-r align-top">{label}</td>
            <td className="py-2 px-3 text-sm text-slate-700 align-top">{currentValue}</td>
            <td className={`py-2 px-3 text-sm ${isChanged ? 'font-bold text-slate-900' : 'text-slate-700'} align-top`}>
                {proposedValue !== undefined ? proposedValue : currentValue}
            </td>
        </tr>
    );
}

const ReviewChangesModal: React.FC<ReviewChangesModalProps> = ({isOpen, onClose, user}) => {
    const { t } = useLocalization();
    const { approveProfileChanges, rejectProfileChanges } = useAppContext();
    if (!user || !user.pendingChanges) return null;
    
    const pending = user.pendingChanges;

    const handleApprove = async () => {
        try {
            await approveProfileChanges(user.id);
            onClose();
        } catch (error: any) {
            console.error(`Failed to approve changes: ${error.code} - ${error.message}`);
            alert("Approval failed.");
        }
    };

    const handleReject = async () => {
        try {
            await rejectProfileChanges(user.id);
            onClose();
        } catch (error: any) {
            console.error(`Failed to reject changes: ${error.code} - ${error.message}`);
            alert("Rejection failed.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Review Changes for ${user.username}`} size="lg">
            <div>
                <p className="text-sm text-slate-600 mb-4">Review the requested changes below. Approving will update the user's profile information permanently.</p>
                <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-600 uppercase w-1/4 border-r">Field</th>
                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-600 uppercase w-3/8">Current Value</th>
                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-600 uppercase w-3/8">Proposed Value</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            <ReviewItem label={t('full_name')} currentValue={user.username} proposedValue={pending.username} />
                            <ReviewItem label="Phone" currentValue={user.phone} proposedValue={pending.phone} />
                            <ReviewItem label="Address" currentValue={user.address} proposedValue={pending.address} />
                            <ReviewItem label={t('gst_number')} currentValue={user.gstNumber} proposedValue={pending.gstNumber} />
                            {user.role === 'msme' && (
                                <>
                                    <ReviewItem label={t('domain')} currentValue={user.domain} proposedValue={pending.domain} />
                                    <ReviewItem 
                                        label={t('gst_certificate')}
                                        currentValue={
                                            user.gstCertificateUrl 
                                            ? <a href={user.gstCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Current</a> 
                                            : t('not_uploaded')
                                        }
                                        proposedValue={pending.gstCertificateUrl !== undefined ? (
                                            <a href={pending.gstCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View New Certificate</a>
                                        ) : undefined}
                                    />
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end space-x-3 pt-5">
                    <button onClick={handleReject} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition">Reject Changes</button>
                    <button onClick={handleApprove} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition">Approve Changes</button>
                </div>
            </div>
        </Modal>
    );
};

export default ReviewChangesModal;
