import React, { useState } from 'react';
import { useAppContext } from '../context/SupabaseContext';
import { useLocalization } from '../hooks/useLocalization';
import type { UserRole, MSMEDomain } from '../types';
import { MSME_DOMAINS } from '../constants';
import CompleteProfileModal from '../components/CompleteProfileModal';
import EmailVerificationNotice from '../components/EmailVerificationNotice';
import { supabase } from '../src/lib/supabase';

interface RegistrationPageProps {
  onSwitchToLogin: () => void;
  onRegistrationSuccess: (email: string) => void;
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
      />
      <div className="absolute right-1 text-slate-400">
        {children}
      </div>
    </div>
  </div>
);

const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSwitchToLogin, onRegistrationSuccess }) => {
  const { register, socialLogin } = useAppContext();
  const { t } = useLocalization();
  
  const [currentRole, setCurrentRole] = useState<UserRole>('buyer'); 
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    gstNumber: '',
    domain: '' as MSMEDomain | '',
  });
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState(false);
  const [socialUserData] = useState<{ email: string; username: string; firstname: string } | null>(null);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert("You must agree to the terms and conditions.");
      return;
    }
    
    setIsLoading(true);
    const userData = {
      ...formData,
      firstname: formData.username, // Use username as firstname
      role: currentRole,
      domain: currentRole === 'msme' ? (formData.domain as MSMEDomain) : undefined,
    };

    try {
      const result = await register(userData as any);
      if (result.success && result.user) {
        setRegisteredEmail(result.user.email);
        setShowVerificationNotice(true);
      } else {
        alert(result.reason === 'EMAIL_EXISTS' ? "User with this email already exists." : "Registration failed.");
      }
    } catch (error: any) {
      const sanitizedCode = String(error.code || 'unknown').replace(/[\r\n]/g, '');
      const sanitizedMessage = String(error.message || 'unknown error').replace(/[\r\n]/g, '');
      console.error(`Registration failed: ${sanitizedCode} - ${sanitizedMessage}`);
      alert("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialSignup = async (provider: 'google' | 'apple' | 'facebook') => {
    setIsLoading(true);
    
    try {
      const result = await socialLogin(provider);
      setIsLoading(false);

      if (!result.success) {
        if (result.reason === 'USER_NOT_FOUND') {
          alert('No account found with this social profile. Creating a new account...');
        } else {
          alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} signup is not configured yet. Please use email/password registration or contact support.`);
        }
      }
      // On success, AppContext handles navigation
    } catch (error) {
      setIsLoading(false);
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} signup is not available. Please use email/password registration.`);
    }
  };

  const handleCompleteProfile = (_details: any) => {
    // This function would be called after a successful social sign-up for a NEW user
    // to collect the remaining details (phone, address, etc.)
  };

  const handleResendVerificationEmail = async () => {
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
      });
      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend verification email. Please try again.');
    }
  };

  const handleCloseVerificationNotice = () => {
    setShowVerificationNotice(false);
    onRegistrationSuccess(registeredEmail);
  };


  const setRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-lg">
        {/* Role Toggle Switch */}
        <div className="relative mb-8 w-full bg-slate-100 rounded-full p-1" style={{boxShadow: '0 0 25px 5px rgba(50, 205, 50, 0.2)'}}>
          <div 
            className="absolute top-1 left-1 h-[calc(100%-0.5rem)] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-transform duration-300 ease-in-out"
            style={{ 
              width: 'calc(50% - 0.25rem)',
              transform: currentRole === 'buyer' ? 'translateX(0%)' : 'translateX(100%)' 
            }}
          ></div>
          <div className="relative flex justify-around">
            <button type="button" onClick={() => setRole('buyer')} className={`w-1/2 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${currentRole === 'buyer' ? 'text-white' : 'text-slate-600'}`}>
              Buyer
            </button>
            <button type="button" onClick={() => setRole('msme')} className={`w-1/2 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${currentRole === 'msme' ? 'text-white' : 'text-slate-600'}`}>
              MSME
            </button>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
            <InputField id="username" name="username" value={formData.username} onChange={handleInputChange} label={t('full_name')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </InputField>
            <InputField id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} label="+91 (Phone)"/>
            <InputField id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} label="E-mail"/>
            <InputField id="password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} label="Enter password">
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword 
                  ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                }
              </button>
            </InputField>
            <InputField id="address" name="address" value={formData.address} onChange={handleInputChange} label="Address"/>
            {currentRole === 'msme' && (
              <div>
                <label htmlFor="domain" className="text-xs font-normal text-slate-600">{t('domain')}</label>
                <div className="relative flex items-center">
                  <select
                    id="domain"
                    name="domain"
                    value={formData.domain}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2 text-sm text-slate-800 bg-transparent border-b border-slate-300 focus:outline-none focus:border-green-500 appearance-none"
                  >
                    <option value="" disabled>{t('select_domain')}</option>
                    {MSME_DOMAINS.map(domain => (
                      <option key={domain} value={domain}>{t(domain.toLowerCase().replace(/ /g, '_'))}</option>
                    ))}
                  </select>
                   <div className="absolute right-1 text-slate-400 pointer-events-none">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                   </div>
                </div>
              </div>
            )}
            <InputField id="gstNumber" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} label="GST Number"/>
          
            <div className="flex items-center pt-2">
                <input id="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="h-4 w-4 text-green-500 focus:ring-green-400 border-slate-300 rounded" />
                <label htmlFor="terms" className="ml-2 block text-sm text-slate-600">I agree to the terms & conditions</label>
            </div>

            <div className="pt-4">
                <button type="submit" disabled={!agreedToTerms || isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Registering...' : t('register')}
                </button>
            </div>
        </form>

        {/* Social Signup */}
        <div className="mt-6">
          <div className="relative">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or sign up with</span>
              </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
              <div>
                  <button onClick={() => handleSocialSignup('google')} className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                      <span className="sr-only">Sign up with Google</span>
                      <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                  </button>
              </div>
              <div>
                   <button onClick={() => handleSocialSignup('apple')} className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                      <span className="sr-only">Sign up as Guest</span>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                  </button>
              </div>
              <div>
                  <button onClick={() => handleSocialSignup('facebook')} className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                      <span className="sr-only">Sign up with Facebook</span>
                      <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                      </svg>
                  </button>
              </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-600">
          {t('already_have_account')}{' '}
          <button onClick={onSwitchToLogin} className="font-medium text-primary hover:text-primary/80">
            {t('login')}
          </button>
        </p>
      </div>

       <CompleteProfileModal 
            isOpen={isCompleteProfileModalOpen}
            onClose={() => setIsCompleteProfileModalOpen(false)}
            userData={socialUserData}
            onComplete={handleCompleteProfile}
        />

        {showVerificationNotice && (
          <EmailVerificationNotice
            email={registeredEmail}
            onResendEmail={handleResendVerificationEmail}
            onClose={handleCloseVerificationNotice}
          />
        )}
    </div>
  );
};

export default RegistrationPage;
