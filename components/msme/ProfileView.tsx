import React, { useState } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import Modal from '../common/Modal';
import { MSME_DOMAINS } from '../../constants';
import type { MSMEDomain, User } from '../../types';
import { supabase } from '../../src/lib/supabase';


const ProfileView: React.FC = () => {
    const { t } = useLocalization();
    const { currentUser, requestProfileUpdate, addInventoryItem } = useAppContext();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        firstname: '',
        phone: '',
        address: '',
        gstNumber: '',
        companyName: '',
        domain: '' as MSMEDomain | ''
    });
    const [gstCertificateFile, setGstCertificateFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
    const [inventoryForm, setInventoryForm] = useState({
        name: '',
        category: '',
        description: '',
        price: '',
        stock: '',
        unitOfMeasure: 'unit',
        minStockLevel: '',
        status: 'active' as 'active' | 'inactive'
    });
    const [addingInventory, setAddingInventory] = useState(false);
    const [inventoryError, setInventoryError] = useState<string | null>(null);
    const [inventorySuccess, setInventorySuccess] = useState(false);

    const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;

        // Validate file size and type
        if (file.size > 5 * 1024 * 1024) {
            setError(t('file_size_error'));
            return;
        }
        if (!file.type.startsWith('image/')) {
            setError(t('invalid_image_error'));
            return;
        }

        try {
            setUploading(true);
            setError(null);
            setSuccess(false);

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(uniqueFileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(uniqueFileName);

            const profilePictureUrl = urlData.publicUrl;

            // Update the user's profile with the new profile picture
            await requestProfileUpdate(currentUser.id, { profilePictureUrl });

            // Show success message
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    React.useEffect(() => {
        if (currentUser) {
            setFormData({
                username: currentUser.username || '',
                firstname: currentUser.firstname || '',
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                gstNumber: currentUser.gstNumber || '',
                companyName: currentUser.companyName || '',
                domain: currentUser.domain || ''
            });
        }
    }, [currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGstCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                setError(t('invalid_gst_file_error'));
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError(t('file_size_error'));
                return;
            }
            setGstCertificateFile(file);
            setError(null);
        }
    };

    const handleInventoryInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setInventoryForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSubmitting(true);

        try {
            const changes: any = {};
            if (formData.username !== currentUser.username) changes.username = formData.username;
            if (formData.firstname !== currentUser.firstname) changes.firstname = formData.firstname;
            if (formData.phone !== currentUser.phone) changes.phone = formData.phone;
            if (formData.address !== currentUser.address) changes.address = formData.address;
            if (formData.gstNumber !== currentUser.gstNumber) changes.gstNumber = formData.gstNumber;
            if (formData.companyName !== currentUser.companyName) changes.companyName = formData.companyName;
            if (formData.domain !== currentUser.domain) changes.domain = formData.domain;

            // Upload GST certificate if provided
            if (gstCertificateFile) {
                const fileExt = gstCertificateFile.name.split('.').pop();
                const uniqueFileName = `${currentUser.id}/gst-certificate-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('gst-certificates')
                    .upload(uniqueFileName, gstCertificateFile, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('gst-certificates')
                    .getPublicUrl(uniqueFileName);

                changes.gstCertificateUrl = urlData.publicUrl;
            }

            if (Object.keys(changes).length > 0) {
                await requestProfileUpdate(currentUser.id, changes);
                setSuccess(true);
                setError(null);
            }
            setIsEditModalOpen(false);
            setGstCertificateFile(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddInventorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setAddingInventory(true);
        setInventoryError(null);
        setInventorySuccess(false);

        try {
            const name = inventoryForm.name.trim();
            const category = inventoryForm.category.trim();
            const description = inventoryForm.description?.trim() || '';
            const unitOfMeasure = inventoryForm.unitOfMeasure.trim() || 'unit';
            const price = Number(inventoryForm.price);
            const stock = Number(inventoryForm.stock);
            const minStockLevel = Number(inventoryForm.minStockLevel || 0);

            if (!name) throw new Error('Name is required');
            if (Number.isNaN(price) || price < 0) throw new Error('Price must be 0 or more');
            if (Number.isNaN(stock) || stock < 0) throw new Error('Stock must be 0 or more');
            if (Number.isNaN(minStockLevel) || minStockLevel < 0) throw new Error('Min stock must be 0 or more');

            await addInventoryItem({
                msmeId: currentUser.id,
                name,
                category,
                description,
                stock,
                price,
                unitOfMeasure,
                minStockLevel,
                status: inventoryForm.status,
            } as any);

            setInventorySuccess(true);
            setIsAddInventoryOpen(false);
            setInventoryForm({
                name: '',
                category: '',
                description: '',
                price: '',
                stock: '',
                unitOfMeasure: 'unit',
                minStockLevel: '',
                status: 'active'
            });
        } catch (err: any) {
            setInventoryError(err.message || 'Failed to add inventory');
        } finally {
            setAddingInventory(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="max-w-4xl mx-auto p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{t('msme_profile')}</h1>
                    <p className="text-slate-500 font-bold">{t('manage_your_business_details') || 'Manage your business identity'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAddInventoryOpen(true)}
                        className="group flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all hover:-translate-y-1 active:translate-y-0"
                    >
                        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14M5 12h14" />
                        </svg>
                        {t('add_inventory')}
                    </button>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="bg-white text-slate-900 border-2 border-slate-200 px-6 py-3 rounded-2xl font-black shadow-lg hover:border-indigo-600 hover:text-indigo-600 transition-all hover:shadow-xl"
                    >
                        {t('edit_profile')}
                    </button>
                </div>
            </div>

            {/* Profile Picture Section */}
            <div className="mb-8">
                <div className="flex items-start space-x-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 shadow-md border-2 border-gray-200">
                            {currentUser.profilePictureUrl ? (
                                <img
                                    src={currentUser.profilePictureUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback to default avatar if image fails to load
                                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <label className="block mt-6">
                            <button
                                type="button"
                                disabled={uploading}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
                                    input?.click();
                                }}
                                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all disabled:bg-slate-400 flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {uploading ? t('uploading') : t('update_photo')}
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/20">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('company_name')}</label>
                                <p className="text-xl font-black text-slate-900 leading-tight">{currentUser.companyName || currentUser.username}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('contact_person')}</label>
                                <p className="text-xl font-bold text-slate-700">{currentUser.username}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('email')}</label>
                                <p className="text-lg font-medium text-slate-600">{currentUser.email}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('gst_number')}</label>
                                <p className="text-lg font-black text-indigo-600">{currentUser.gstNumber}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('domain')}</label>
                                <p className="text-lg font-bold text-slate-700">{currentUser.domain}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('phone')}</label>
                                <p className="text-lg font-bold text-slate-700">{currentUser.phone}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('address')}</label>
                                <p className="text-lg font-medium text-slate-600 leading-relaxed">{currentUser.address}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('gst_certificate')}</label>
                                {currentUser?.gstCertificateUrl ? (
                                    <a
                                        href={currentUser.gstCertificateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-2 text-indigo-600 font-black hover:text-indigo-700 transition-colors group"
                                    >
                                        <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        {t('view_certificate')}
                                    </a>
                                ) : (
                                    <p className="mt-2 text-slate-400 font-bold italic">{t('not_uploaded')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('edit_profile')}>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">Company Name</label>
                        <input
                            id="companyName"
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter company name"
                            aria-label="Company Name"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your full name"
                            aria-label="Full Name"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="firstname" className="block text-sm font-medium text-slate-700">First Name</label>
                        <input
                            id="firstname"
                            type="text"
                            name="firstname"
                            value={formData.firstname}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your first name"
                            aria-label="First Name"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone</label>
                        <input
                            id="phone"
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your phone number"
                            aria-label="Phone Number"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
                        <input
                            id="address"
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your address"
                            aria-label="Address"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="gstNumber" className="block text-sm font-medium text-slate-700">GST Number</label>
                        <input
                            id="gstNumber"
                            type="text"
                            name="gstNumber"
                            value={formData.gstNumber}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your GST number"
                            aria-label="GST Number"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-gstCertificate" className="block text-sm font-medium text-slate-700">GST Certificate (JPEG/PDF)</label>
                        <input
                            id="edit-gstCertificate"
                            type="file"
                            accept=".jpg,.jpeg,.pdf"
                            onChange={handleGstCertificateUpload}
                            aria-label="Upload GST Certificate"
                            className="mt-1 block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary/10 file:text-primary
                                hover:file:bg-primary/20"
                        />
                        {currentUser?.gstCertificateUrl && (
                            <a
                                href={currentUser.gstCertificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-sm text-primary hover:underline inline-block"
                            >
                                View current certificate
                            </a>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Domain</label>
                        <select
                            id="domain"
                            name="domain"
                            value={formData.domain}
                            onChange={handleInputChange}
                            required
                            aria-label="Business Domain"
                            title="Select your business domain"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            <option value="" disabled>Select Domain</option>
                            {MSME_DOMAINS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow disabled:bg-slate-400"
                        >
                            {isSubmitting ? 'Saving...' : t('save_changes')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Add Inventory Modal */}
            <Modal isOpen={isAddInventoryOpen} onClose={() => setIsAddInventoryOpen(false)} title="Add Inventory">
                <form onSubmit={handleAddInventorySubmit} className="space-y-4">
                    <div>
                        <label htmlFor="inv-name" className="block text-sm font-medium text-slate-700">Name</label>
                        <input
                            id="inv-name"
                            type="text"
                            name="name"
                            value={inventoryForm.name}
                            onChange={handleInventoryInputChange}
                            required
                            placeholder="Enter item name"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="inv-category" className="block text-sm font-medium text-slate-700">Category</label>
                        <input
                            id="inv-category"
                            type="text"
                            name="category"
                            value={inventoryForm.category}
                            onChange={handleInventoryInputChange}
                            placeholder="e.g., Fabric, Thread, Dye"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="inv-description" className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            id="inv-description"
                            name="description"
                            value={inventoryForm.description}
                            onChange={handleInventoryInputChange}
                            placeholder="Optional description"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="inv-price" className="block text-sm font-medium text-slate-700">Price</label>
                            <input
                                id="inv-price"
                                type="number"
                                step="0.01"
                                min="0"
                                name="price"
                                value={inventoryForm.price}
                                onChange={handleInventoryInputChange}
                                required
                                placeholder="0.00"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label htmlFor="inv-stock" className="block text-sm font-medium text-slate-700">Stock</label>
                            <input
                                id="inv-stock"
                                type="number"
                                min="0"
                                name="stock"
                                value={inventoryForm.stock}
                                onChange={handleInventoryInputChange}
                                required
                                placeholder="0"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label htmlFor="inv-min" className="block text-sm font-medium text-slate-700">Min Stock</label>
                            <input
                                id="inv-min"
                                type="number"
                                min="0"
                                name="minStockLevel"
                                value={inventoryForm.minStockLevel}
                                onChange={handleInventoryInputChange}
                                placeholder="0"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="inv-uom" className="block text-sm font-medium text-slate-700">Unit</label>
                            <select
                                id="inv-uom"
                                name="unitOfMeasure"
                                value={inventoryForm.unitOfMeasure}
                                onChange={handleInventoryInputChange}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="unit">Unit</option>
                                <option value="pcs">Pcs</option>
                                <option value="kg">Kg</option>
                                <option value="m">Meter</option>
                                <option value="box">Box</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="inv-status" className="block text-sm font-medium text-slate-700">Status</label>
                            <select
                                id="inv-status"
                                name="status"
                                value={inventoryForm.status}
                                onChange={handleInventoryInputChange}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    {inventoryError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                            {inventoryError}
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAddInventoryOpen(false)}
                            className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={addingInventory}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow disabled:bg-slate-400"
                        >
                            {addingInventory ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Status Messages */}
            {uploading && (
                <div className="fixed bottom-10 right-10 p-6 bg-white/80 backdrop-blur-xl border border-white/20 text-indigo-600 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 font-bold">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    {t('uploading_profile_photo')}
                </div>
            )}
            {success && (
                <div className="mt-6 p-6 bg-green-50/50 border border-green-200 text-green-700 rounded-3xl flex items-center gap-4 animate-in fade-in duration-500">
                    <div className="p-2 bg-green-100 rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-bold">{t('profile_updated_success')}</span>
                </div>
            )}
            {inventorySuccess && (
                <div className="mt-6 p-6 bg-green-50/50 border border-green-200 text-green-700 rounded-3xl flex items-center gap-4 animate-in fade-in duration-500">
                    <div className="p-2 bg-green-100 rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-bold">{t('inventory_item_added')}</span>
                </div>
            )}
            {error && (
                <div className="mt-6 p-6 bg-red-50/50 border border-red-200 text-red-700 rounded-3xl flex items-center gap-4 animate-in fade-in duration-500">
                    <div className="p-2 bg-red-100 rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-bold">{t('error')}: {error}</span>
                </div>
            )}
        </div>
    );
};

export default ProfileView;