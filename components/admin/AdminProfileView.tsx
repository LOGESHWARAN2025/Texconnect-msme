import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { supabase } from '../../src/lib/supabase';
import { User } from '../../types';
import Modal from '../common/Modal';

interface UserProfile extends User {
  id: string;
}

interface AdminProfileViewProps {
  onBack?: () => void;
}

const AdminProfileView: React.FC<AdminProfileViewProps> = ({ onBack }) => {
  const { currentUser, requestProfileUpdate } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminListOpen, setIsAdminListOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    address: ''
  });

  // Fetch all admins
  useEffect(() => {
    const fetchAdmins = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'admin');
        
        if (error) throw error;
        
        const adminsList = data as UserProfile[];
        setAdmins(adminsList);
        
        const currentAdmin = adminsList.find(admin => admin.id === currentUser.id);
        if (currentAdmin) {
          setSelectedAdmin(currentAdmin);
        }
      } catch (err) {
        console.error('Error fetching admins:', err);
        setError('Failed to load admin profiles');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdmins();
  }, [currentUser]);

  // Update form data when selected admin changes
  useEffect(() => {
    if (selectedAdmin) {
      setFormData({
        username: selectedAdmin.username || '',
        phone: selectedAdmin.phone || '',
        address: selectedAdmin.address || ''
      });
    }
  }, [selectedAdmin]);
  
  const handleAdminSelect = (admin: UserProfile) => {
    setSelectedAdmin(admin);
    setIsAdminListOpen(false);
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAdmin) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${selectedAdmin.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      // Upload file to Supabase Storage
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

      // Update profile using requestProfileUpdate
      await requestProfileUpdate(selectedAdmin.id, { profilePictureUrl });
      
      // Update local state
      const updatedAdmin = { ...selectedAdmin, profilePictureUrl };
      setSelectedAdmin(updatedAdmin);
      setAdmins(admins.map(admin => 
        admin.id === selectedAdmin.id ? updatedAdmin : admin
      ));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      setError(error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updates: Partial<User> = {};
      
      if (formData.username !== selectedAdmin.username) {
        updates.username = formData.username;
      }
      if (formData.phone !== selectedAdmin.phone) {
        updates.phone = formData.phone;
      }
      if (formData.address !== selectedAdmin.address) {
        updates.address = formData.address;
      }

      if (Object.keys(updates).length === 0) {
        setIsEditModalOpen(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', selectedAdmin.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedAdmin = { ...selectedAdmin, ...updates };
      setSelectedAdmin(updatedAdmin);
      setAdmins(admins.map(admin => 
        admin.id === selectedAdmin.id ? updatedAdmin : admin
      ));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading admin profiles...</div>;
  }
  
  if (!currentUser || !selectedAdmin) {
    return <div className="p-6">Please log in to view admin profiles.</div>;
  }

  const isCurrentUser = currentUser.id === selectedAdmin.id;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition"
                title="Back to Dashboard"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <h2 className="text-2xl font-bold">
              {isCurrentUser ? 'My Profile' : `Admin Profile: ${selectedAdmin.username}`}
            </h2>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsAdminListOpen(!isAdminListOpen)}
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>Switch Admin</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isAdminListOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {admins.map(admin => (
                    <button
                      key={admin.id}
                      onClick={() => handleAdminSelect(admin)}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        admin.id === selectedAdmin.id
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <span>{admin.username}</span>
                        {admin.id === currentUser.id && (
                          <span className="ml-auto text-xs text-gray-500">(You)</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {selectedAdmin.profilePictureUrl || selectedAdmin.profilePicture ? (
                <img
                  src={selectedAdmin.profilePictureUrl || selectedAdmin.profilePicture}
                  alt={selectedAdmin.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-4xl">
                  {selectedAdmin.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
              title="Change profile picture"
              type="button"
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureUpload}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <p className="mt-1 text-sm text-gray-900">{selectedAdmin.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{selectedAdmin.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="mt-1 text-sm text-gray-900">{selectedAdmin.phone || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <p className="mt-1 text-sm text-gray-900">{selectedAdmin.address || 'Not set'}</p>
          </div>
        </div>

        {isCurrentUser && (
          <div className="mt-6">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

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
          Profile updated successfully!
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter your username"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your address"
              rows={3}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:bg-gray-400"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProfileView;
