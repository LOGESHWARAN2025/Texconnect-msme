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
  const { currentUser, isLoading, logout, notifyAdminOfError } = useAppContext();
  const [minSplashDone] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register' | 'adminLogin' | 'verifyEmail' | 'landing'>(() => {
    try {
      const stored = window.localStorage.getItem('tex_authView');
      if (stored && ['login', 'register', 'adminLogin', 'verifyEmail', 'landing'].includes(stored)) {
        return stored as any;
      }
    } catch (e) {}
    return 'login';
  });
  const [userToVerify, setUserToVerify] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) return;

    const isAdminRole = currentUser.role === 'admin' || currentUser.role === 'sub-admin';
    const desiredView = isAdminRole ? 'adminLogin' : 'login';
    if (authView !== desiredView) {
      handleSetAuthView(desiredView);
    }
  }, [currentUser, authView, isLoading]);

  const handleSetAuthView = (view: 'login' | 'register' | 'adminLogin' | 'verifyEmail' | 'landing') => {
    try {
      window.localStorage.setItem('tex_authView', view);
    } catch (e) {}
    setAuthView(view);
  };

  // Sync login status for persistence tracking and enforce portal restrictions
  useEffect(() => {
    if (currentUser) {
      const isAdminPortal = authView === 'adminLogin';
      const isUserRole = currentUser.role === 'buyer' || currentUser.role === 'msme';
      const isAdminRole = currentUser.role === 'admin' || currentUser.role === 'sub-admin';

      // Portal Cross-Entry Guard:
      // If a Buyer/MSME logs in through the Admin Portal, or an Admin logs in through the User Portal, force logout.
      if ((isAdminPortal && isUserRole) || (!isAdminPortal && authView !== 'landing' && authView !== 'register' && isAdminRole)) {
        console.warn('❌ Portal Role Mismatch: Forced Logout triggered', { authView, role: currentUser.role });
        
        // Notify admin of potential portal breach or unauthorized access attempt
        if (notifyAdminOfError) {
           const detail = `User ${currentUser.email} (${currentUser.role}) tried to access ${authView} portal. Session terminated.`;
           notifyAdminOfError(detail, 'Web Security Guard');
        }

        const timer = setTimeout(async () => {
          await logout();
          window.localStorage.setItem('tex_auth_error', 'Unauthorized portal access for your role.');
          window.location.reload(); 
        }, 100);
        return () => clearTimeout(timer);
      }

      localStorage.setItem('tex_lastLoggedInRole', currentUser.role);
      localStorage.setItem('tex_isLoggedIn', 'true');
      
      // Update default view for next visit
      if (isAdminRole) {
        localStorage.setItem('tex_authView', 'adminLogin');
      } else {
        localStorage.setItem('tex_authView', 'login');
      }
    }
  }, [currentUser, authView]);

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
    handleSetAuthView('verifyEmail');
  };

  const handleNeedsVerification = (email: string) => {
    setUserToVerify(email);
    handleSetAuthView('verifyEmail');
  }

  if (isLoading || !minSplashDone) {
    console.log('AppRouter: Showing loading spinner');
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!currentUser) {
    if (authView === 'verifyEmail' && userToVerify) {
      return <VerifyEmailPage email={userToVerify} onVerificationComplete={() => { handleSetAuthView('login'); setUserToVerify(null); }} />;
    }

    switch(authView) {
      case 'landing':
        return <TexConnectWelcomeEnhanced onSignup={() => handleSetAuthView('register')} onGetStarted={() => handleSetAuthView('login')} onBookDemo={() => handleSetAuthView('login')} />;
      case 'login':
        return <LoginPage onSwitchToRegister={() => handleSetAuthView('register')} onSwitchToAdminLogin={() => handleSetAuthView('adminLogin')} onNeedsVerification={handleNeedsVerification} onBackToLanding={() => handleSetAuthView('landing')} />;
      case 'register':
        return <RegistrationPage onSwitchToLogin={() => handleSetAuthView('login')} onRegistrationSuccess={handleRegistrationSuccess} onBackToLanding={() => handleSetAuthView('landing')} />;
      case 'adminLogin':
        return <AdminLoginPage onSwitchToUserLogin={() => handleSetAuthView('login')} />;
      default:
        return <TexConnectWelcomeEnhanced onSignup={() => handleSetAuthView('register')} onGetStarted={() => handleSetAuthView('login')} onBookDemo={() => handleSetAuthView('login')} />;
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
    case 'sub-admin':
      console.log('App.tsx: Rendering AdminApp');
      return <AdminApp />;
    default:
      console.log('App.tsx: No role match, showing login');
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} onSwitchToAdminLogin={() => setAuthView('adminLogin')} onNeedsVerification={handleNeedsVerification} />;
  }
};

const AppUI: React.FC = () => {
  const { isOffline, currentUser } = useAppContext();
  const [scanOpen, setScanOpen] = useState(false);
  const [scanOrderId, setScanOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const scan = params.get('scan');
      const orderId = params.get('orderId');
      const uid = params.get('uid');
      const unit = params.get('unit');

      if (scan === '1' && orderId) {
        if (!currentUser || !currentUser.isEmailVerified) {
          try {
            const payload = { orderId, uid: uid || '', unit: unit || '' };
            window.localStorage.setItem('pendingScan', JSON.stringify(payload));
          } catch (_) {}
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('scan');
            url.searchParams.delete('orderId');
            url.searchParams.delete('uid');
            url.searchParams.delete('unit');
            window.history.replaceState({}, document.title, url.toString());
          } catch (_) {}
        } else {
          setScanOrderId(orderId);
          setScanOpen(true);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !currentUser.isEmailVerified) return;
    try {
      const raw = window.localStorage.getItem('pendingScan');
      if (!raw) return;
      const data = JSON.parse(raw || '{}');
      if (!data?.orderId) return;

      const url = new URL(window.location.href);
      url.searchParams.set('scan', '1');
      url.searchParams.set('orderId', data.orderId);
      if (data.uid) url.searchParams.set('uid', data.uid);
      if (data.unit) url.searchParams.set('unit', data.unit);
      window.history.replaceState({}, document.title, url.toString());

      setScanOrderId(data.orderId as string);
      setScanOpen(true);
      window.localStorage.removeItem('pendingScan');
    } catch (_) {
      // ignore
    }
  }, [currentUser]);
  
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
            url.searchParams.delete('uid');
            url.searchParams.delete('unit');
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