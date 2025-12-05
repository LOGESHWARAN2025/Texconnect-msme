import React, { useState } from 'react';
import { useAppContext } from '../context/SupabaseContext';
import { useLocalization } from '../hooks/useLocalization';
import { useLoading } from '../src/contexts/LoadingContext';
import type { UserRole, MSMEDomain } from '../types';
import { MSME_DOMAINS } from '../constants';
import { supabase } from '../src/lib/supabase';

interface RegistrationPageProps {
  onSwitchToLogin: () => void;
  onRegistrationSuccess: (email: string) => void;
  onBackToLanding?: () => void;
}

const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSwitchToLogin, onRegistrationSuccess, onBackToLanding }) => {
  const { register, socialLogin } = useAppContext();
  const { t, language, setLanguage } = useLocalization();
  const formRef = React.useRef<HTMLDivElement>(null);
  const formTitleRef = React.useRef<HTMLDivElement>(null);
  
  const [currentRole, setCurrentRole] = useState<UserRole>('buyer'); 
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top when role changes
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    // Use setTimeout to ensure state is updated before scrolling
    setTimeout(() => {
      if (formTitleRef.current) {
        formTitleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    
    setIsLoading(true);
    const userData = {
      username: formData.username,
      firstname: formData.firstname || formData.username,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      address: formData.address,
      gstNumber: formData.gstNumber,
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


  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)', display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Back button - top left */}
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 100,
          }}
          title="Back to Landing Page"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      )}

      {/* Language toggle - top right */}
      <button
        onClick={() => setLanguage()}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100,
        }}
        title="Toggle Language"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span>{language === 'en' ? 'தமிழ்' : 'EN'}</span>
      </button>

      <div style={{ width: '100%', height: '100%', background: 'white', display: 'flex', position: 'relative' }}>
        {/* Left Panel */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 1) 0%, rgba(129, 140, 248, 0.8) 100%)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 40px',
            overflow: 'hidden',
            transition: 'all 0.6s ease',
          }}
        >
          {/* Wave shapes */}
          <div style={{ position: 'absolute', top: 0, right: '-50px', width: '150px', height: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50% 0 0 50%', transform: 'scaleX(1.5)', transition: 'all 0.6s ease' }} />
          <div style={{ position: 'absolute', top: 0, right: '-80px', width: '200px', height: '100%', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50% 0 0 50%', transform: 'scaleX(2)', transition: 'all 0.6s ease' }} />

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
              Join TexConnect
            </h2>

            {/* Description */}
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', lineHeight: 1.6, marginBottom: '35px', maxWidth: '350px', marginLeft: 'auto', marginRight: 'auto' }}>
              Start managing your textile inventory digitally. Join 850+ Tiruppur manufacturers already using TexConnect.
            </p>

            {/* Toggle button */}
            <button
              onClick={onSwitchToLogin}
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
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
              }}
            >
              SIGN IN
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
        <div ref={formRef} style={{ flex: 1, padding: '40px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', background: 'white', transition: 'all 0.6s ease', overflowY: 'auto', height: '100%', paddingTop: '20px' }}>
          {/* Logo */}
          <div ref={formTitleRef} style={{ textAlign: 'center', marginBottom: '30px' }}>
            <svg fill="none" stroke="rgb(79, 70, 229)" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '60px', height: '60px', margin: '0 auto 15px', color: 'rgb(79, 70, 229)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
            </svg>
            <h1 style={{ color: 'rgb(79, 70, 229)', fontSize: '40px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>{t('sign_up')}</h1>
          </div>

          <form onSubmit={handleRegister} style={{ marginBottom: '20px' }}>
            {/* Role selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569', display: 'block', marginBottom: '8px' }}>{t('i_am_a')}</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['buyer', 'msme'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `2px solid ${currentRole === role ? 'rgb(79, 70, 229)' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      background: currentRole === role ? 'rgb(79, 70, 229)' : 'white',
                      color: currentRole === role ? 'white' : '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textTransform: 'capitalize',
                      fontSize: '14px',
                    }}
                  >
                    {role === 'buyer' ? t('buyer') : 'MSME'}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('full_name')}</label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '10px 0' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', color: '#94a3b8', marginRight: '12px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#1e293b' }}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('email')}</label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '10px 0' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', color: '#94a3b8', marginRight: '12px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#1e293b' }}
                />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>Phone</label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '10px 0' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', color: '#94a3b8', marginRight: '12px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#1e293b' }}
                />
              </div>
            </div>

            {/* MSME Domain */}
            {currentRole === 'msme' && (
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569', display: 'block', marginBottom: '8px' }}>{t('domain')}</label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderBottom: '2px solid #e2e8f0',
                    background: 'transparent',
                    fontSize: '14px',
                    color: '#1e293b',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">{t('select_domain')}</option>
                  {MSME_DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Password */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('password')}</label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '10px 0' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', color: '#94a3b8', marginRight: '12px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  required
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#1e293b' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>Confirm Password</label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '10px 0' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', color: '#94a3b8', marginRight: '12px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#1e293b' }}
                />
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('address')}</label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '10px 0' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', color: '#94a3b8', marginRight: '12px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#1e293b' }}
                />
              </div>
            </div>

            {/* GST Number (MSME only) */}
            {currentRole === 'msme' && (
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>{t('gst_number')}</label>
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #e2e8f0', padding: '10px 0' }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', color: '#94a3b8', marginRight: '12px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="Enter GST number"
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#1e293b' }}
                  />
                </div>
              </div>
            )}

            {/* Terms checkbox */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ marginRight: '10px', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="terms" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                I agree to the terms and conditions
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              style={{
                width: '100%',
                maxWidth: '180px',
                padding: '12px',
                background: 'rgb(79, 70, 229)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'uppercase',
                cursor: isLoading || !agreedToTerms ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
                marginLeft: 'auto',
                display: 'block',
                opacity: isLoading || !agreedToTerms ? 0.5 : 1,
              }}
            >
              {isLoading ? 'Signing up...' : t('sign_up')}
            </button>
          </form>

          {/* Social signup */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px', color: '#94a3b8', fontSize: '13px' }}>Or Sign Up with</div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => handleSocialSignup('google')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  background: 'white',
                  color: '#64748b',
                  fontSize: '13px',
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
                <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                onClick={() => handleSocialSignup('facebook')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  background: 'white',
                  color: '#64748b',
                  fontSize: '13px',
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
                <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', color: '#1877f2' }}>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </div>

          {/* Sign in link */}
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
            {t('already_have_account')}{' '}
            <button
              onClick={onSwitchToLogin}
              style={{
                fontWeight: 600,
                color: 'rgb(79, 70, 229)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              {t('login')}
            </button>
          </p>
        </div>
      </div>

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
    </div>
  );
};

export default RegistrationPage;
