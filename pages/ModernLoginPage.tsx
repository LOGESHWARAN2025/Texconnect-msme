import React, { useState } from 'react';
import { useAppContext } from '../context/SupabaseContext';
import { useLocalization } from '../hooks/useLocalization';
import { useLoading } from '../src/contexts/LoadingContext';
import { supabase } from '../src/lib/supabase';
import type { UserRole, MSMEDomain } from '../types';
import { MSME_DOMAINS } from '../constants';

interface ModernLoginPageProps {
  onSwitchToRegister?: () => void;
  onSwitchToAdminLogin?: () => void;
  onNeedsVerification?: (email: string) => void;
  onBackToLanding?: () => void;
  onRegistrationSuccess?: (email: string) => void;
}

const ModernLoginPage: React.FC<ModernLoginPageProps> = ({
  onSwitchToAdminLogin,
  onNeedsVerification,
  onBackToLanding,
  onRegistrationSuccess,
}) => {
  const { login, register, socialLogin } = useAppContext();
  const { t } = useLocalization();
  const { showLoading, hideLoading } = useLoading();

  // Form state
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Signup form
  const [signupRole, setSignupRole] = useState<UserRole>('buyer');
  const [signupData, setSignupData] = useState({
    firstname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    gstNumber: '',
    domain: '' as MSMEDomain | '',
  });
  const [signupError, setSignupError] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Password reset
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setUnverifiedEmail(null);
    setIsLoading(true);
    showLoading('Signing in...');

    try {
      const result = await login(loginEmail, loginPassword);
      if (!result.success) {
        if (result.reason === 'NOT_VERIFIED') {
          setLoginError(t('email_not_verified'));
          setUnverifiedEmail(result.userEmail || null);
        } else {
          setLoginError(t('login_failed'));
        }
      }
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  // Signup handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!agreedToTerms) {
      setSignupError('You must agree to the terms and conditions');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    showLoading('Creating account...');

    try {
      const userData = {
        firstname: signupData.firstname,
        username: signupData.username,
        email: signupData.email,
        password: signupData.password,
        phone: signupData.phone,
        address: signupData.address,
        gstNumber: signupData.gstNumber,
        domain: signupRole === 'msme' ? (signupData.domain as MSMEDomain) : undefined,
        role: signupRole,
      };

      const result = await register(userData as any);
      if (result.success) {
        setSignupError('');
        if (onRegistrationSuccess) {
          onRegistrationSuccess(signupData.email);
        }
        // Reset form
        setSignupData({
          firstname: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          address: '',
          gstNumber: '',
          domain: '',
        });
      } else {
        setSignupError(
          result.reason === 'EMAIL_EXISTS'
            ? 'Email already registered'
            : result.message || 'Registration failed'
        );
      }
    } catch (error: any) {
      setSignupError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  // Social login handler
  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoginError('');
    setIsLoading(true);
    showLoading(`Signing in with ${provider}...`);

    try {
      const result = await socialLogin(provider);
      if (!result.success) {
        setLoginError(
          result.reason === 'USER_NOT_FOUND'
            ? 'No account found. Please sign up first.'
            : `${provider} login not available`
        );
      }
    } catch (error) {
      setLoginError(`${provider} login failed`);
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  // Password reset handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResettingPassword(true);
    showLoading('Sending reset email...');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetEmailSent(true);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setResetEmailSent(true);
    } finally {
      setIsResettingPassword(false);
      hideLoading();
    }
  };

  const toggleForm = () => {
    setIsLoginView(!isLoginView);
    setLoginError('');
    setSignupError('');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
      {/* Admin button - top right */}
      {onSwitchToAdminLogin && (
        <button
          onClick={onSwitchToAdminLogin}
          className="absolute top-6 right-6 text-sm font-semibold text-white hover:text-blue-300 py-2 px-4 rounded-lg transition z-50"
          title="Switch to Admin Login"
        >
          Admin
        </button>
      )}

      {/* Language Toggle - top right (next to Admin) */}
      <div className="absolute top-6 right-28 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white z-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2 2.5 2.5 0 002.5-2.5V4a2 2 0 00-2-2h-1.305" />
        </svg>
        <select
          value={useLocalization().language}
          onChange={(e) => useLocalization().setLanguage(e.target.value as any)}
          className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer appearance-none outline-none pr-1"
        >
          <option value="en" className="text-gray-900">English</option>
          <option value="ta" className="text-gray-900">தமிழ்</option>
        </select>
      </div>

      {/* Back button - top left */}
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="absolute top-6 left-6 text-sm font-semibold text-white hover:text-blue-300 py-2 px-4 rounded-lg transition flex items-center space-x-1 z-50"
          title="Back to Landing Page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{t('back')}</span>
        </button>
      )}

      <div style={{ width: '90%', maxWidth: '1100px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)', display: 'flex', minHeight: '600px', position: 'relative', zIndex: 10 }}>
        {/* Left Panel */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 40px',
            overflow: 'hidden',
            transition: 'all 0.6s ease',
            order: isLoginView ? 1 : 2,
          }}
        >
          {/* Wave shapes */}
          <div style={{ position: 'absolute', top: 0, right: isLoginView ? '-50px' : 'auto', left: isLoginView ? 'auto' : '-50px', width: '150px', height: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: isLoginView ? '50% 0 0 50%' : '0 50% 50% 0', transform: 'scaleX(1.5)', transition: 'all 0.6s ease' }} />
          <div style={{ position: 'absolute', top: 0, right: isLoginView ? '-80px' : 'auto', left: isLoginView ? 'auto' : '-80px', width: '200px', height: '100%', background: 'rgba(255, 255, 255, 0.05)', borderRadius: isLoginView ? '50% 0 0 50%' : '0 50% 50% 0', transform: 'scaleX(2)', transition: 'all 0.6s ease' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
              <svg fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '50px', height: '50px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
              </svg>
              <span style={{ color: 'white', fontSize: '36px', fontWeight: 700, letterSpacing: '2px' }}>TexConnect</span>
            </div>

            {/* Welcome text */}
            <h2 style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>
              {isLoginView ? t('welcome_back_login') : t('join_texconnect')}
            </h2>

            {/* Description */}
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', lineHeight: 1.6, marginBottom: '35px', maxWidth: '350px', marginLeft: 'auto', marginRight: 'auto' }}>
              {isLoginView
                ? t('login_description')
                : t('signup_description')}
            </p>

            {/* Toggle button */}
            <button
              onClick={toggleForm}
              style={{
                background: 'white',
                color: 'rgb(79, 70, 229)',
                padding: '14px 50px',
                borderRadius: '30px',
                fontWeight: 600,
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
              }}
            >
              {isLoginView ? t('create_account_btn') : t('sign_in_btn')}
            </button>

            {/* Icon */}
            <div style={{ width: '80px', height: '80px', margin: '20px auto', opacity: 0.3 }}>
              <svg fill="none" stroke="white" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'white', transition: 'all 0.6s ease', overflowY: 'auto', maxHeight: '100%' }}>
          {/* Login Form */}
          {isLoginView && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              {/* Logo */}
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <svg fill="none" stroke="rgb(79, 70, 229)" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '80px', height: '80px', margin: '0 auto 20px', color: 'rgb(79, 70, 229)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
                </svg>
                <h1 style={{ color: 'rgb(79, 70, 229)', fontSize: '48px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px' }}>{t('login_title')}</h1>
              </div>

              {/* Error message */}
              {loginError && (
                <div style={{ color: '#dc2626', fontSize: '14px', textAlign: 'center', background: '#fee2e2', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                  {loginError}
                  {unverifiedEmail && (
                    <button
                      type="button"
                      onClick={() => onNeedsVerification?.(unverifiedEmail)}
                      style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600, color: 'rgb(79, 70, 229)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {t('resend_verification')}
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ marginBottom: '30px' }}>
                {/* Email */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('email_address')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '12px 0', transition: 'border-color 0.3s' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', color: '#94a3b8', marginRight: '15px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={t('enter_email_placeholder')}
                      required
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#1e293b' }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('password')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '12px 0', transition: 'border-color 0.3s' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', color: '#94a3b8', marginRight: '15px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={t('enter_password_placeholder')}
                      required
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#1e293b' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showLoginPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div style={{ textAlign: 'right', marginBottom: '30px' }}>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    style={{ color: 'rgb(79, 70, 229)', textDecoration: 'none', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    {t('forgot_password')}
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    maxWidth: '200px',
                    padding: '15px',
                    background: 'rgb(79, 70, 229)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '18px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    marginLeft: 'auto',
                    display: 'block',
                    opacity: isLoading ? 0.5 : 1,
                    boxShadow: '0 8px 25px rgba(79, 70, 229, 0.4)',
                  }}
                >
                  {isLoading ? `${t('login')}...` : t('login')}
                </button>
              </form>

              {/* Social login */}
              <div style={{ marginTop: '30px' }}>
                <div style={{ textAlign: 'center', marginBottom: '25px', color: '#94a3b8', fontSize: '14px' }}>{t('or_login_with')}</div>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleSocialLogin('google')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '12px 24px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      background: 'white',
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgb(79, 70, 229)';
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                  <button
                    onClick={() => handleSocialLogin('facebook')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '12px 24px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      background: 'white',
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgb(79, 70, 229)';
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', color: '#1877f2' }}>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>

              {/* Sign up link */}
              <p style={{ marginTop: '30px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                {t('dont_have_account')}{' '}
                <button
                  onClick={toggleForm}
                  style={{
                    fontWeight: 600,
                    color: 'rgb(79, 70, 229)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  {t('sign_up')}
                </button>
              </p>
            </div>
          )}

          {/* Signup Form */}
          {!isLoginView && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              {/* Logo */}
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <svg fill="none" stroke="rgb(79, 70, 229)" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '80px', height: '80px', margin: '0 auto 20px', color: 'rgb(79, 70, 229)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
                </svg>
                <h1 style={{ color: 'rgb(79, 70, 229)', fontSize: '48px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px' }}>{t('signup_title')}</h1>
              </div>

              {/* Error message */}
              {signupError && (
                <div style={{ color: '#dc2626', fontSize: '14px', textAlign: 'center', background: '#fee2e2', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                  {signupError}
                </div>
              )}

              <form onSubmit={handleSignup} style={{ marginBottom: '30px' }}>
                {/* Role selector */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('i_am_a')}</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    {(['buyer', 'msme'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSignupRole(role)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: `2px solid ${signupRole === role ? 'rgb(79, 70, 229)' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          background: signupRole === role ? 'rgb(79, 70, 229)' : 'white',
                          color: signupRole === role ? 'white' : '#475569',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          textTransform: 'capitalize',
                        }}
                      >
                        {role === 'buyer' ? t('buyer_role') : t('msme_role')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* First Name */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('first_name')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '12px 0' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', color: '#94a3b8', marginRight: '15px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <input
                      type="text"
                      value={signupData.firstname}
                      onChange={(e) => setSignupData({ ...signupData, firstname: e.target.value })}
                      placeholder={t('enter_firstname_placeholder')}
                      required
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#1e293b' }}
                    />
                  </div>
                </div>

                {/* Username */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('username')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '12px 0' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', color: '#94a3b8', marginRight: '15px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <input
                      type="text"
                      value={signupData.username}
                      onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                      placeholder={t('choose_username_placeholder')}
                      required
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#1e293b' }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('email_address')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '12px 0' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', color: '#94a3b8', marginRight: '15px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <input
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder={t('enter_email_placeholder')}
                      required
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#1e293b' }}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('phone')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '12px 0' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', color: '#94a3b8', marginRight: '15px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <input
                      type="tel"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      placeholder={t('enter_phone_placeholder')}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#1e293b' }}
                    />
                  </div>
                </div>

                {/* MSME Domain */}
                {signupRole === 'msme' && (
                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('business_domain')}</label>
                    <select
                      value={signupData.domain}
                      onChange={(e) => setSignupData({ ...signupData, domain: e.target.value as MSMEDomain })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderBottom: '2px solid #e2e8f0',
                        background: 'transparent',
                        fontSize: '16px',
                        color: '#1e293b',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">{t('select_domain')}</option>
                      {MSME_DOMAINS.map((domain) => (
                        <option key={domain} value={domain}>
                          {t(domain.toLowerCase().replace(/\s+/g, '_')) || domain}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Password */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('password')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '12px 0' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', color: '#94a3b8', marginRight: '15px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      placeholder={t('create_password_placeholder')}
                      required
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#1e293b' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showSignupPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('confirm_password')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '12px 0' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', color: '#94a3b8', marginRight: '15px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    <input
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      placeholder={t('confirm_password_placeholder')}
                      required
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#1e293b' }}
                    />
                  </div>
                </div>

                {/* Terms checkbox */}
                <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <label htmlFor="terms" style={{ fontSize: '14px', color: '#475569', cursor: 'pointer' }}>
                    {t('agree_terms')}
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    maxWidth: '200px',
                    padding: '15px',
                    background: 'rgb(79, 70, 229)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '18px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
                    marginLeft: 'auto',
                    display: 'block',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  {isLoading ? `${t('sign_up')}...` : t('sign_up')}
                </button>
              </form>

              {/* Sign in link */}
              <p style={{ marginTop: '30px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                {t('already_have_account')}{' '}
                <button
                  onClick={toggleForm}
                  style={{
                    fontWeight: 600,
                    color: 'rgb(79, 70, 229)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  {t('sign_in_btn')}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {
        isForgotPasswordOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '30px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#1e293b' }}>{t('reset_password_title')}</h2>

              {!resetEmailSent ? (
                <form onSubmit={handleForgotPasswordSubmit}>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                    {t('reset_password_desc')}
                  </p>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569', display: 'block', marginBottom: '8px' }}>{t('email_address')}</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      style={{
                        padding: '10px 20px',
                        background: '#e2e8f0',
                        color: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      style={{
                        padding: '10px 20px',
                        background: 'rgb(79, 70, 229)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: isResettingPassword ? 'not-allowed' : 'pointer',
                        opacity: isResettingPassword ? 0.5 : 1,
                      }}
                    >
                      {isResettingPassword ? `${t('send_reset_link')}...` : t('send_reset_link')}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <p style={{ fontSize: '14px', color: '#1e293b', marginBottom: '20px' }}>
                    {t('check_email_reset')}
                  </p>
                  <button
                    onClick={() => setIsForgotPasswordOpen(false)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgb(79, 70, 229)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t('return_to_login')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      }

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div >
  );
};

export default ModernLoginPage;
