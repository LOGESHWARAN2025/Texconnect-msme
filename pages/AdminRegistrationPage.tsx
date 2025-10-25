import React, { useState } from 'react';
import { useAppContext } from '../context/SupabaseContext';
import { useLocalization } from '../hooks/useLocalization';
import EmailVerificationNotice from '../components/EmailVerificationNotice';
import { supabase } from '../src/lib/supabase';

interface AdminRegistrationPageProps {
  onSwitchToLogin: () => void;
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
        className="w-full py-2 text-sm text-slate-800 bg-transparent border-b border-slate-300 focus:outline-none focus:border-primary"
      />
      <div className="absolute right-1 text-slate-400">
        {children}
      </div>
    </div>
  </div>
);

const AdminRegistrationPage: React.FC<AdminRegistrationPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAppContext();
  const { t } = useLocalization();
  
  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    phone: '',
    email: '',
    password: '',
    adminId: '',
    gstNumber: 'ADMINISTRATOR', // Default for admin
  });
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    onSwitchToLogin();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert("You must agree to the terms and conditions.");
      return;
    }
    
    const { gstNumber, ...requiredFields } = formData;
    const allFieldsFilled = Object.values(requiredFields).every(field => field.trim() !== '');

    if (allFieldsFilled) {
      const result = await register({ ...formData, role: 'admin', address: '' });
      if (result.success && result.user) {
        setRegisteredEmail(result.user.email);
        setShowVerificationNotice(true);
      } else {
        const errorMessage = result.message || 
          (result.reason === 'EMAIL_EXISTS' ? 'An account with this email already exists.' :
           result.reason === 'DATABASE_ERROR' ? 'Database error. Please check console for details.' :
           'Registration failed. Please try again.');
        alert(`Registration failed: ${errorMessage}`);
      }
    } else {
        alert("Please fill all required fields.");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Create Admin Account</h2>
            <p className="text-slate-500 text-sm">Register a new administrator for TexConnect.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
            <InputField id="username" name="username" value={formData.username} onChange={handleInputChange} label="Username">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </InputField>
            <InputField id="firstname" name="firstname" value={formData.firstname} onChange={handleInputChange} label="Full Name" />
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
            <InputField id="adminId" name="adminId" value={formData.adminId} onChange={handleInputChange} label="adminId"/>
            
            <div className="flex items-center pt-2">
                <input id="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary/80 border-slate-300 rounded" />
                <label htmlFor="terms" className="ml-2 block text-sm text-slate-600">I agree to the terms & conditions</label>
            </div>

            <div className="pt-4">
                <button type="submit" disabled={!agreedToTerms} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">{t('create_account')}</button>
            </div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          {t('already_have_account')}{' '}
          <button onClick={onSwitchToLogin} className="font-medium text-primary hover:text-primary/80">
            {t('login')}
          </button>
        </p>
      </div>

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

export default AdminRegistrationPage;
