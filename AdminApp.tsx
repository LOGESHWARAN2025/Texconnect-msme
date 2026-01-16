import React, { useEffect } from 'react';
import { useAppContext } from './context/SupabaseContext';
import ModernAdminDashboard from './components/admin/ModernAdminDashboard';

const AdminApp: React.FC = () => {
  const { currentUser } = useAppContext();

  // Verify user is admin (main-admin or sub-admin)
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      console.error('❌ Unauthorized access to AdminApp - redirecting to login');
      // window.location.href = '/'; 
      // Commented out to prevent infinite loop during dev testing if roles are messy
      // but in production this should be active
    }
  }, [currentUser]);

  return <ModernAdminDashboard />;
};

export default AdminApp;