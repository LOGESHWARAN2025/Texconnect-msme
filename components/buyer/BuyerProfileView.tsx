import React, { useState } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import Modal from '../common/Modal';
import { User } from '../../types';
import { supabase } from '../../src/lib/supabase';

const BuyerProfileView: React.FC = () => {
  const { t } = useLocalization();
  const { currentUser, requestProfileUpdate } = useAppContext();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    address: '',
    gstNumber: '',
    companyName: ''
  });
  const [gstCertificateFile, setGstCertificateFile] = useState<File | null>(null);
  
  // Function to get the effective value (pending changes or current value)
  const getEffectiveValue = (field: keyof Pick<User, 'username' | 'phone' | 'address' | 'gstNumber' | 'companyName'>) => {
    if (currentUser?.pendingChanges?.[field] !== undefined) {
      return currentUser.pendingChanges[field];
    }
    return currentUser?.[field] || '';
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

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

      // Update user profile
      await requestProfileUpdate(currentUser.id, {
        profilePictureUrl
      });

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
        username: currentUser.pendingChanges?.username ?? currentUser.username ?? '',
        phone: currentUser.pendingChanges?.phone ?? currentUser.phone ?? '',
        address: currentUser.pendingChanges?.address ?? currentUser.address ?? '',
        gstNumber: currentUser.pendingChanges?.gstNumber ?? currentUser.gstNumber ?? '',
        companyName: currentUser.pendingChanges?.companyName ?? currentUser.companyName ?? ''
      });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGstCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a JPEG or PDF file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setGstCertificateFile(file);
      setError(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      const changes: any = {};
      if (formData.username !== currentUser.username) changes.username = formData.username;
      if (formData.phone !== currentUser.phone) changes.phone = formData.phone;
      if (formData.address !== currentUser.address) changes.address = formData.address;
      if (formData.gstNumber !== currentUser.gstNumber) changes.gstNumber = formData.gstNumber;
      if (formData.companyName !== currentUser.companyName) changes.companyName = formData.companyName;

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

  if (!currentUser) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Company Profile</h2>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow"
        >
          {t('edit_profile')}
        </button>
      </div>

      {/* Profile Picture Section */}
      <div className="mb-8">
        <div className="flex items-start space-x-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
              {currentUser.profilePictureUrl ? (
                <img
                  src={currentUser.profilePictureUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>
            <label className="block mt-4">
              <span className="sr-only">Choose company profile photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                disabled={uploading}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </label>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <p className="mt-1 text-lg">
                  {getEffectiveValue('companyName') || getEffectiveValue('username')}
                  {currentUser?.pendingChanges?.companyName && (
                    <span className="ml-2 text-sm text-yellow-600">(Pending Approval)</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <p className="mt-1 text-lg">
                  {getEffectiveValue('username')}
                  {currentUser?.pendingChanges?.username && (
                    <span className="ml-2 text-sm text-yellow-600">(Pending Approval)</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-lg">{currentUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GST Number</label>
                <p className="mt-1 text-lg">
                  {getEffectiveValue('gstNumber')}
                  {currentUser?.pendingChanges?.gstNumber && (
                    <span className="ml-2 text-sm text-yellow-600">(Pending Approval)</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-lg">
                  {getEffectiveValue('address')}
                  {currentUser?.pendingChanges?.address && (
                    <span className="ml-2 text-sm text-yellow-600">(Pending Approval)</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-lg">
                  {getEffectiveValue('phone')}
                  {currentUser?.pendingChanges?.phone && (
                    <span className="ml-2 text-sm text-yellow-600">(Pending Approval)</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GST Certificate</label>
                {currentUser?.gstCertificateUrl ? (
                  <a 
                    href={currentUser.gstCertificateUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-primary hover:underline inline-flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Certificate
                  </a>
                ) : (
                  <p className="mt-1 text-gray-400">Not uploaded</p>
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
            <label htmlFor="edit-companyName" className="block text-sm font-medium text-slate-700">Company Name</label>
            <input
              id="edit-companyName"
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              aria-label="Company Name"
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="edit-username" className="block text-sm font-medium text-slate-700">Contact Person</label>
            <input
              id="edit-username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              aria-label="Contact Person Name"
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="edit-phone" className="block text-sm font-medium text-slate-700">Phone</label>
            <input
              id="edit-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              aria-label="Phone Number"
              autoComplete="tel"
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="edit-address" className="block text-sm font-medium text-slate-700">Address</label>
            <input
              id="edit-address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              aria-label="Business Address"
              autoComplete="address-line1"
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="edit-gstNumber" className="block text-sm font-medium text-slate-700">GST Number</label>
            <input
              id="edit-gstNumber"
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleInputChange}
              required
              aria-label="GST Registration Number"
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
                file:rounded-md file:border-0
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

      {/* Status Messages */}
      {uploading && (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded">
          Uploading profile picture...
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded">
          Profile picture updated successfully!
        </div>
      )}
    </div>
  );
};

export default BuyerProfileView;
