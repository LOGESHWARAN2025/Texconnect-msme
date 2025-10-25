import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/SupabaseContext';
import { MSME_DOMAINS } from '../../constants';
import type { MSMEDomain, User } from '../../types';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLocalization();
    const { currentUser, requestProfileUpdate } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        firstname: '',
        phone: '',
        address: '',
        gstNumber: '',
        domain: '' as MSMEDomain | '',
    });
    const [gstFile, setGstFile] = useState<File | null>(null);
    const [gstFileName, setGstFileName] = useState('');

    useEffect(() => {
        if (currentUser) {
            setFormData({
                username: currentUser.username,
                firstname: currentUser.firstname,
                phone: currentUser.phone,
                address: currentUser.address,
                gstNumber: currentUser.gstNumber,
                domain: currentUser.domain || '',
            });
            setGstFile(null);
            setGstFileName('');
        }
    }, [currentUser, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setGstFile(file);
            setGstFileName(file.name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSubmitting(true);

        try {
            const changes: Partial<User> = {};

            if (formData.username !== currentUser.username) changes.username = formData.username;
            if (formData.firstname !== currentUser.firstname) changes.firstname = formData.firstname;
            if (formData.phone !== currentUser.phone) changes.phone = formData.phone;
            if (formData.address !== currentUser.address) changes.address = formData.address;
            if (formData.gstNumber !== currentUser.gstNumber) changes.gstNumber = formData.gstNumber;
            if (currentUser.role === 'msme' && formData.domain && formData.domain !== currentUser.domain) {
                changes.domain = formData.domain;
            }

            if (Object.keys(changes).length > 0 || gstFile) {
                await requestProfileUpdate(currentUser.id, changes, gstFile);
                alert("Your profile changes have been submitted for admin approval.");
            }
            onClose();
        } catch (error: any) {
            const sanitizedCode = String(error.code || 'unknown').replace(/[\r\n]/g, '');
            const sanitizedMessage = String(error.message || 'unknown error').replace(/[\r\n]/g, '');
            console.error(`Error submitting profile changes: ${sanitizedCode} - ${sanitizedMessage}`);
            alert("Could not submit changes. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('edit_profile')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">{t('full_name')}</label>
                    <input id="username" type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder="Enter your full name" aria-label="Full Name" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone</label>
                    <input id="phone" type="text" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="Enter your phone number" aria-label="Phone Number" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                 <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
                    <input id="address" type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="Enter your address" aria-label="Address" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                 <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-slate-700">{t('gst_number')}</label>
                    <input id="gstNumber" type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} required placeholder="Enter your GST number" aria-label="GST Number" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                 {currentUser.role === 'msme' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('domain')}</label>
                            <select id="domain" name="domain" value={formData.domain} onChange={handleInputChange} required aria-label="Business Domain" title="Select your business domain" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                                <option value="" disabled>{t('select_domain')}</option>
                                {MSME_DOMAINS.map(d => (
                                    <option key={d} value={d}>{t(d.toLowerCase().replace(/ /g, '_'))}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('gst_certificate')}</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-slate-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg"/>
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PDF, PNG, JPG up to 10MB</p>
                                {gstFileName && <p className="text-sm font-semibold text-green-600 mt-2">Selected: {gstFileName.replace(/[<>"'&]/g, '')}</p>}
                                </div>
                            </div>
                        </div>
                    </>
                )}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition">{t('cancel')}</button>
                    <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow disabled:bg-slate-400">
                      {isSubmitting ? 'Submitting...' : t('save_changes')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProfileModal;