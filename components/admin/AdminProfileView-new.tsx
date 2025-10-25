import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { supabase } from '../../src/lib/supabase';
import { User } from '../../types';

interface UserProfile extends User {
  id: string;
}

const AdminProfileView: React.FC = () => {
  const { currentUser } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminListOpen, setIsAdminListOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
  
  const handleAdminSelect = (admin: UserProfile) => {
    setSelectedAdmin(admin);
    setIsAdminListOpen(false);
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAdmin) return;

    if (file.size > 1 * 1024 * 1024) {
      setError('File size must be less than 1MB');
      return;
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      setError('Please select a valid image file');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ profilepicture: base64Image })
          .eq('id', selectedAdmin.id);
        
        if (updateError) throw updateError;

        const updatedAdmin = { ...selectedAdmin, profilePicture: base64Image };
        setSelectedAdmin(updatedAdmin);
        setAdmins(admins.map(admin => 
          admin.id === selectedAdmin.id ? updatedAdmin : admin
        ));
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setUploading(false);
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      setError(error.message || 'Failed to upload profile picture');
      setUploading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
          <h2 className="text-2xl font-bold">
            {isCurrentUser ? 'My Profile' : `Admin Profile: ${selectedAdmin.username}`}
          </h2>

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
              {selectedAdmin.profilePicture ? (
                <img
                  src={selectedAdmin.profilePicture}
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
    </div>
  );
};

export default AdminProfileView;
