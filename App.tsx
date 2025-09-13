import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { LocalizationProvider } from './context/LocalizationContext';
import AdminApp from './AdminApp';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DemoApp from './DemoApp';
import OfflineIndicator from './components/common/OfflineIndicator';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-slate-100">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const AppRouter: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();
  const [authView, setAuthView] = useState<'login' | 'register' | 'adminLogin' | 'verifyEmail'>('login');
  const [userToVerify, setUserToVerify] = useState<string | null>(null);

  const handleRegistrationSuccess = (email: string) => {
    setUserToVerify(email);
    setAuthView('verifyEmail');
  };

  const handleNeedsVerification = (email: string) => {
    setUserToVerify(email);
    setAuthView('verifyEmail');
  }
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    if (authView === 'verifyEmail' && userToVerify) {
      return <VerifyEmailPage email={userToVerify} onVerificationComplete={() => { setAuthView('login'); setUserToVerify(null); }} />;
    }

    switch(authView) {
      case 'login':
        return <LoginPage onSwitchToRegister={() => setAuthView('register')} onSwitchToAdminLogin={() => setAuthView('adminLogin')} onNeedsVerification={handleNeedsVerification} />;
      case 'register':
        return <RegistrationPage onSwitchToLogin={() => setAuthView('login')} onRegistrationSuccess={handleRegistrationSuccess} />;
      case 'adminLogin':
        return <AdminLoginPage onSwitchToUserLogin={() => setAuthView('login')} />;
      default:
        return <LoginPage onSwitchToRegister={() => setAuthView('register')} onSwitchToAdminLogin={() => setAuthView('adminLogin')} onNeedsVerification={handleNeedsVerification} />;
    }
  }
  
  // After login, check for email verification if it's not done
  if (!currentUser.isEmailVerified) {
    return <VerifyEmailPage email={currentUser.email} onVerificationComplete={() => window.location.reload()} />;
  }

  switch (currentUser.role) {
    case 'msme':
    case 'buyer':
      return <DemoApp />;
    case 'admin':
      return <AdminApp />;
    default:
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} onSwitchToAdminLogin={() => setAuthView('adminLogin')} onNeedsVerification={handleNeedsVerification} />;
  }
};

const AppUI: React.FC = () => {
  const { isOffline } = useAppContext();
  
  return (
    <div className="h-screen bg-slate-100 text-slate-800">
      {isOffline && <OfflineIndicator />}
      <AppRouter />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AppProvider>
      <LocalizationProvider>
        <AppUI />
      </LocalizationProvider>
    </AppProvider>
  );
};

export default App;