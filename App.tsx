import React, { useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './context/SupabaseContext';
import { LocalizationProvider } from './context/LocalizationContext';
import { LoadingProvider } from './src/contexts/LoadingContext';
import AdminApp from './AdminApp';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import LandingPage from './pages/LandingPage';
import TexConnectWelcomeEnhanced from './components/welcome/TexConnectWelcomeEnhanced';
import DemoApp from './DemoApp';
import OfflineIndicator from './components/common/OfflineIndicator';
import LoadingSpinner from './components/common/LoadingSpinner';
import ScanStatusModal from './components/ScanStatusModal';

const AppRouter: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();
  const [authView, setAuthView] = useState<'login' | 'register' | 'adminLogin' | 'verifyEmail' | 'landing'>('landing');
  const [userToVerify, setUserToVerify] = useState<string | null>(null);

  console.log('AppRouter: isLoading=', isLoading, 'currentUser=', currentUser);
  console.log('AppRouter: currentUser details:', currentUser ? {
    id: currentUser.id,
    email: currentUser.email,
    role: currentUser.role,
    isEmailVerified: currentUser.isEmailVerified,
    isApproved: currentUser.isApproved
  } : 'null');

  const handleRegistrationSuccess = (email: string) => {
    setUserToVerify(email);
    setAuthView('verifyEmail');
  };

  const handleNeedsVerification = (email: string) => {
    setUserToVerify(email);
    setAuthView('verifyEmail');
  }
  
  if (isLoading) {
    console.log('AppRouter: Showing loading spinner');
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!currentUser) {
    if (authView === 'verifyEmail' && userToVerify) {
      return <VerifyEmailPage email={userToVerify} onVerificationComplete={() => { setAuthView('login'); setUserToVerify(null); }} />;
    }

    switch(authView) {
      case 'landing':
        return <TexConnectWelcomeEnhanced onSignup={() => setAuthView('register')} onGetStarted={() => setAuthView('login')} onBookDemo={() => setAuthView('login')} />;
      case 'login':
        return <LoginPage onSwitchToRegister={() => setAuthView('register')} onSwitchToAdminLogin={() => setAuthView('adminLogin')} onNeedsVerification={handleNeedsVerification} onBackToLanding={() => setAuthView('landing')} />;
      case 'register':
        return <RegistrationPage onSwitchToLogin={() => setAuthView('login')} onRegistrationSuccess={handleRegistrationSuccess} onBackToLanding={() => setAuthView('landing')} />;
      case 'adminLogin':
        return <AdminLoginPage onSwitchToUserLogin={() => setAuthView('login')} />;
      default:
        return <TexConnectWelcomeEnhanced onSignup={() => setAuthView('register')} onGetStarted={() => setAuthView('login')} onBookDemo={() => setAuthView('login')} />;
    }
  }
  
  // After login, check for email verification if it's not done
  if (!currentUser.isEmailVerified) {
    return <VerifyEmailPage email={currentUser.email} onVerificationComplete={() => window.location.reload()} />;
  }

  console.log('App.tsx: Current user role:', currentUser.role);
  console.log('App.tsx: Current user data:', currentUser);
  
  switch (currentUser.role) {
    case 'msme':
    case 'buyer':
      console.log('App.tsx: Rendering DemoApp');
      return <DemoApp />;
    case 'admin':
      console.log('App.tsx: Rendering AdminApp');
      return <AdminApp />;
    default:
      console.log('App.tsx: No role match, showing login');
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} onSwitchToAdminLogin={() => setAuthView('adminLogin')} onNeedsVerification={handleNeedsVerification} />;
  }
};

const AppUI: React.FC = () => {
  const { isOffline } = useAppContext();
  const [scanOpen, setScanOpen] = useState(false);
  const [scanOrderId, setScanOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const scan = params.get('scan');
      const orderId = params.get('orderId');
      if (scan === '1' && orderId) {
        setScanOrderId(orderId);
        setScanOpen(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);
  
  return (
    <div className="h-screen bg-slate-100 text-slate-800">
      {isOffline && <OfflineIndicator />}
      <AppRouter />
      <ScanStatusModal 
        isOpen={scanOpen} 
        orderId={scanOrderId} 
        onClose={() => {
          setScanOpen(false);
          // remove query params so dialog doesn't reopen on refresh
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('scan');
            url.searchParams.delete('orderId');
            window.history.replaceState({}, document.title, url.toString());
          } catch (e) {
            // ignore
          }
        }}
      />
    </div>
  );
};


const App: React.FC = () => {
  console.log('App.tsx: App component rendering');
  
  return (
    <LoadingProvider>
      <AppProvider>
        <LocalizationProvider>
          <AppUI />
        </LocalizationProvider>
      </AppProvider>
    </LoadingProvider>
  );
};

export default App;