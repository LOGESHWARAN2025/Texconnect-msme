import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { useLocalization } from '../hooks/useLocalization';
import type { UserRole, MSMEDomain } from '../types';
import { MSME_DOMAINS } from '../constants';

interface CompleteProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: { email: string; username: string; firstname: string } | null;
    onComplete: (details: any) => void;
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ isOpen, onClose, userData, onComplete }) => {
    const { t } = useLocalization();
    const [role, setRole] = useState<UserRole>('buyer');
    const [formData, setFormData] = useState({
        phone: '',
        address: '',
        gstNumber: '',
        domain: '' as MSMEDomain | '',
    });

    useEffect(() => {
        // Reset form when modal opens with new user data
        if (userData) {
            setFormData({
                phone: '',
                address: '',
                gstNumber: '',
                domain: '',
            });
            setRole('buyer');
        }
    }, [userData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const detailsToComplete = {
            ...formData,
            role,
            domain: role === 'msme' ? formData.domain : undefined,
        };
        onComplete(detailsToComplete);
    };

    if (!userData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Complete Your Profile">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-slate-600">Please provide a few more details to complete your registration.</p>
                
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                    <input id="email" type="text" value={userData.email} disabled className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                    <input id="username" type="text" value={userData.username} disabled className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md shadow-sm"/>
                </div>

                <div className="relative my-4 w-full bg-slate-100 rounded-full p-1">
                    <div className="relative flex justify-around">
                        <button type="button" onClick={() => setRole('buyer')} className={`w-1/2 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${role === 'buyer' ? 'bg-primary text-white shadow' : 'text-slate-600'}`}>
                        Buyer
                        </button>
                        <button type="button" onClick={() => setRole('msme')} className={`w-1/2 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${role === 'msme' ? 'bg-primary text-white shadow' : 'text-slate-600'}`}>
                        MSME
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number</label>
                    <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
                    <input id="address" type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-slate-700">GST Number</label>
                    <input id="gstNumber" type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} placeholder="GST Number" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>

                {role === 'msme' && (
                    <div>
                        <label htmlFor="domain" className="block text-sm font-medium text-slate-700">Domain</label>
                        <select id="domain" name="domain" value={formData.domain} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                            <option value="" disabled>{t('select_domain')}</option>
                            {MSME_DOMAINS.map(d => (
                                <option key={d} value={d}>{t(d.toLowerCase().replace(/ /g, '_'))}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition">{t('cancel')}</button>
                    <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow">{t('create_account')}</button>
                </div>
            </form>
        </Modal>
    );
};

export default CompleteProfileModal;
