
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLocalization } from '../hooks/useLocalization';
import Modal from '../components/common/Modal';
import { auth } from '../firebase';
// fix: Removed unused import from `firebase/auth` as `sendPasswordResetEmail` is called via the `auth` object in v8.

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSwitchToAdminLogin: () => void;
  onNeedsVerification: (email: string) => void;
}

const InputField: React.FC<{id: string, name: string, type?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string, required?: boolean, children?: React.ReactNode}> = 
  ({id, name, type = "text", value, onChange, label, required = true, children}) => (
  <div>
    <label htmlFor={id} className="text-xs font-normal text-slate-600">{label}</label>
    <div className="relative flex items-center">
      <input 
        id={id} 
        name={name} 
        type={type} 
        value={value} 
        onChange={onChange}
        required={required}
        className="w-full py-2 text-sm text-slate-800 bg-transparent border-b border-slate-300 focus:outline-none focus:border-green-500"
        autoComplete={name === 'password' ? 'current-password' : name === 'email' ? 'email' : 'off'}
      />
      <div className="absolute right-1 text-slate-400">
        {children}
      </div>
    </div>
  </div>
);


const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, onSwitchToAdminLogin, onNeedsVerification }) => {
  const { login, socialLogin } = useAppContext();
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loginAs, setLoginAs] = useState<'buyer' | 'msme'>('buyer');
  
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnverifiedEmail(null);
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (!result.success) {
      if (result.reason === 'NOT_VERIFIED') {
        setError(t('email_not_verified'));
        setUnverifiedEmail(result.userEmail || null);
      } else {
        setError(t('login_failed'));
      }
    }
  };
  
  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setError('');
    setUnverifiedEmail(null);
    setIsLoading(true);
    const result = await socialLogin(provider);
    setIsLoading(false);

    if (!result.success) {
      if (result.reason === 'USER_NOT_FOUND') {
         setError('No account found with this social profile. Please sign up first.');
      } else {
         setError('An error occurred during social login. Please try again.');
      }
    }
    // On success, AppContext handles navigation
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResettingPassword(true);
    try {
      // fix: Use Firebase v8 `auth.sendPasswordResetEmail` syntax.
      await auth.sendPasswordResetEmail(resetEmail);
      setResetEmailSent(true);
    } catch (error) {
      console.error(`Error sending password reset email: ${(error as any).code} - ${(error as any).message}`);
      // For security, show the success message even on failure to prevent email enumeration.
      setResetEmailSent(true);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const openForgotPasswordModal = () => {
    setIsForgotPasswordModalOpen(true);
    setResetEmailSent(false);
    setResetEmail('');
  };

  const closeForgotPasswordModal = () => {
    setIsForgotPasswordModalOpen(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
        <button 
          onClick={onSwitchToAdminLogin}
          className="absolute top-6 right-6 text-sm font-semibold text-primary hover:underline py-2 px-4 rounded-lg transition"
          title="Switch to Admin Login"
        >
          Admin
        </button>

      <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-lg">
        
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Welcome Back!</h2>
            <p className="text-slate-500 text-sm">Login to access your TexConnect dashboard.</p>
        </div>

        <div className="relative mb-8 w-full bg-slate-100 rounded-full p-1 shadow-green-glow">
          <div 
            className={`absolute top-1 left-1 h-[calc(100%-0.5rem)] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-transform duration-300 ease-in-out w-[calc(50%-0.25rem)] ${loginAs === 'buyer' ? 'translate-x-0' : 'translate-x-full'}`}
          ></div>
          <div className="relative flex justify-around">
            <button type="button" onClick={() => setLoginAs('buyer')} className={`w-1/2 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${loginAs === 'buyer' ? 'text-white' : 'text-slate-600'}`}>
              Buyer
            </button>
            <button type="button" onClick={() => setLoginAs('msme')} className={`w-1/2 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${loginAs === 'msme' ? 'text-white' : 'text-slate-600'}`}>
              MSME
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
              {unverifiedEmail && (
                <button
                  type="button"
                  onClick={() => onNeedsVerification(unverifiedEmail)}
                  className="mt-2 text-sm font-semibold text-primary underline"
                >
                  {t('resend_verification')}
                </button>
              )}
            </div>
          )}

          <div>
            <InputField id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} label="E-mail">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
            </InputField>
          </div>
          
          <div>
            <InputField id="password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} label="Enter password">
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword 
                    ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                  }
                </button>
            </InputField>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                {/* Remember me is not implemented with Firebase Auth persistence */}
              </div>
              <button 
                  type="button" 
                  onClick={openForgotPasswordModal}
                  className="text-sm font-medium text-primary hover:text-primary/80 focus:outline-none"
              >
                  Forgot Password?
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50">
              {isLoading ? 'Logging in...' : t('login')}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
              <div>
                  <button onClick={() => handleSocialLogin('google')} className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                      <span className="sr-only">Sign in with Google</span>
                      <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                  </button>
              </div>
              <div>
                  <button onClick={() => handleSocialLogin('apple')} className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                      <span className="sr-only">Sign in with Apple</span>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v10a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zM8.22 12.78a.75.75 0 001.06 1.06l1.22-1.22 1.22 1.22a.75.75 0 101.06-1.06L11.06 11.5l1.22-1.22a.75.75 0 00-1.06-1.06L10 10.44l-1.22-1.22a.75.75 0 00-1.06 1.06l1.22 1.22-1.22 1.22z" clipRule="evenodd" /></svg>
                  </button>
              </div>
              <div>
                  <button onClick={() => handleSocialLogin('facebook')} className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                      <span className="sr-only">Sign in with Facebook</span>
                      <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                      </svg>
                  </button>
              </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('dont_have_account')}{' '}
          <button onClick={onSwitchToRegister} className="font-medium text-primary hover:text-primary/80">
            {t('sign_up')}
          </button>
        </p>

      </div>
      
      <Modal isOpen={isForgotPasswordModalOpen} onClose={closeForgotPasswordModal} title="Reset Password">
        {!resetEmailSent ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <p className="text-sm text-slate-600">Enter your email address and we will send you a link to reset your password.</p>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">Email Address</label>
              <input 
                id="reset-email" 
                name="reset-email" 
                type="email" 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={closeForgotPasswordModal} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition">Cancel</button>
              <button type="submit" disabled={isResettingPassword} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow disabled:opacity-50">
                {isResettingPassword ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-sm text-slate-700">If an account with that email exists, a password reset link has been sent.</p>
            <div className="flex justify-end pt-4">
              <button onClick={closeForgotPasswordModal} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LoginPage;
