import React, { useState } from 'react';
import { useAppContext } from '../context/SupabaseContext';
import { useLocalization } from '../hooks/useLocalization';
import { useLoading } from '../src/contexts/LoadingContext';
import { supabase } from '../src/lib/supabase';
import { MOCK_USERS } from '../constants';

interface AdminLoginPageProps {
  onSwitchToUserLogin: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSwitchToUserLogin }) => {
  const { login } = useAppContext();
  const { t } = useLocalization();
  const { showLoading, hideLoading } = useLoading();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const adminUser = MOCK_USERS.find(user => user.role === 'admin');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    showLoading('Signing in...');

    try {
      // Try to login first with the provided email/username
      const result = await login(email, password);
      
      if (!result.success) {
        setError('Invalid admin credentials');
        setIsLoading(false);
        hideLoading();
        return;
      }

      // After successful login, verify that the user is an admin
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('role, isApproved, isMainAdmin')
        .eq('email', email)
        .single();

      console.log('Admin login - User data:', userData, 'Error:', fetchError);

      if (fetchError || !userData) {
        console.error('User fetch error:', fetchError);
        setError('User not found in system');
        setIsLoading(false);
        hideLoading();
        return;
      }

      // Check if user is an admin (includes both main admin and sub-admin)
      if (userData.role !== 'admin') {
        console.error('User role is not admin:', userData.role);
        setError('Only admin users can access this page');
        setIsLoading(false);
        hideLoading();
        return;
      }

      // Check if admin is approved
      if (!userData.isApproved) {
        console.error('Admin not approved');
        setError('Admin account is not approved');
        setIsLoading(false);
        hideLoading();
        return;
      }

      console.log('✅ Admin login successful - Main Admin:', userData.isMainAdmin);

      // All checks passed, user is logged in as admin
      console.log('✅ Admin login successful for:', email);
      hideLoading();
      // Let the auth state listener handle the redirect
    } catch (err) {
      console.error("Login error:", err);
      setError('Login failed. Please try again.');
      setIsLoading(false);
      hideLoading();
    }
  };

  const handleAutoFill = () => {
    if (adminUser) {
      setEmail(adminUser.email);
      setPassword(adminUser.password as string);
      setError('');
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Sewing Items Background */}
      {/* Scissor */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '50px', height: '50px', top: '8%', left: '12%', animationDelay: '0s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="1.5">
        <path d="M9 3L5 6.99h11.53a2 2 0 011.4 3.43L13 15m-4 0l-3 3m8-3l3 3m-3-3v-2.5M9 21a2 2 0 100-4 2 2 0 000 4zm0 0V9m12 12a2 2 0 100-4 2 2 0 000 4z"/>
      </svg>

      {/* Thread Roll 1 */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '40px', height: '40px', top: '15%', right: '10%', animationDelay: '2s' }} viewBox="0 0 24 24" fill="rgb(79, 70, 229)" stroke="rgb(79, 70, 229)" strokeWidth="1">
        <circle cx="12" cy="12" r="8" fill="none" strokeWidth="2"/>
        <circle cx="12" cy="12" r="5" fill="none" strokeWidth="1.5"/>
        <path d="M12 4v4M12 16v4M4 12h4M16 12h4" strokeWidth="1.5"/>
      </svg>

      {/* Thread Roll 2 */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '45px', height: '45px', bottom: '12%', left: '8%', animationDelay: '4s' }} viewBox="0 0 24 24" fill="rgb(99, 102, 241)" stroke="rgb(99, 102, 241)" strokeWidth="1">
        <circle cx="12" cy="12" r="8" fill="none" strokeWidth="2"/>
        <circle cx="12" cy="12" r="5" fill="none" strokeWidth="1.5"/>
        <path d="M12 4v4M12 16v4M4 12h4M16 12h4" strokeWidth="1.5"/>
      </svg>

      {/* Needle */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '35px', height: '35px', top: '55%', right: '18%', animationDelay: '1s', transform: 'rotate(45deg)' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="2">
        <path d="M3 3l18 18M6 6l12 12" strokeLinecap="round"/>
        <circle cx="5" cy="5" r="1.5" fill="rgb(79, 70, 229)"/>
      </svg>

      {/* Button */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '30px', height: '30px', top: '35%', left: '6%', animationDelay: '3s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="9" cy="9" r="1" fill="rgb(79, 70, 229)"/>
        <circle cx="15" cy="9" r="1" fill="rgb(79, 70, 229)"/>
        <circle cx="9" cy="15" r="1" fill="rgb(79, 70, 229)"/>
        <circle cx="15" cy="15" r="1" fill="rgb(79, 70, 229)"/>
      </svg>

      {/* Pin */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '35px', height: '35px', bottom: '20%', right: '8%', animationDelay: '2.5s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="2">
        <path d="M12 2v20M8 4h8l-1 2H9l-1-2z" strokeLinecap="round"/>
        <circle cx="12" cy="3" r="2" fill="rgb(245, 158, 11)"/>
      </svg>

      {/* Cotton */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '42px', height: '42px', top: '30%', right: '22%', animationDelay: '4.5s' }} viewBox="0 0 24 24" fill="rgb(79, 70, 229)">
        <circle cx="12" cy="12" r="8"/>
        <circle cx="8" cy="8" r="3" fill="rgb(99, 102, 241)"/>
        <circle cx="16" cy="10" r="2.5" fill="rgb(129, 140, 248)"/>
        <circle cx="10" cy="16" r="2.5" fill="rgb(129, 140, 248)"/>
      </svg>

      {/* Measuring Tape */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '55px', height: '55px', bottom: '8%', right: '15%', animationDelay: '6.5s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="1.5">
        <path d="M3 9h18v6H3z"/>
        <path d="M5 9v6M7 9v6M9 9v6M11 9v6M13 9v6M15 9v6M17 9v6M19 9v6" strokeWidth="0.8"/>
      </svg>

      {/* Bobbin */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '32px', height: '32px', top: '70%', left: '18%', animationDelay: '4s' }} viewBox="0 0 24 24" fill="rgb(99, 102, 241)" stroke="rgb(99, 102, 241)" strokeWidth="1.5">
        <rect x="8" y="6" width="8" height="12" rx="1" fill="none"/>
        <circle cx="12" cy="12" r="3" fill="none"/>
        <path d="M9 9h6M9 15h6"/>
      </svg>

      {/* Zipper */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '38px', height: '38px', bottom: '35%', left: '22%', animationDelay: '5.5s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="1.5">
        <rect x="10" y="3" width="4" height="18" fill="none"/>
        <path d="M8 5h8M8 8h8M8 11h8M8 14h8M8 17h8M8 20h8" strokeWidth="0.8"/>
        <rect x="11" y="10" width="2" height="4" fill="rgb(79, 70, 229)"/>
      </svg>

      {/* Needle 2 */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '32px', height: '32px', bottom: '30%', left: '15%', animationDelay: '3.5s', transform: 'rotate(-30deg)' }} viewBox="0 0 24 24" fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2">
        <path d="M3 3l18 18M6 6l12 12" strokeLinecap="round"/>
        <circle cx="5" cy="5" r="1.5" fill="rgb(99, 102, 241)"/>
      </svg>

      {/* Button 2 */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '28px', height: '28px', top: '65%', right: '12%', animationDelay: '5s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="9" cy="9" r="1" fill="rgb(99, 102, 241)"/>
        <circle cx="15" cy="9" r="1" fill="rgb(99, 102, 241)"/>
        <circle cx="9" cy="15" r="1" fill="rgb(99, 102, 241)"/>
        <circle cx="15" cy="15" r="1" fill="rgb(99, 102, 241)"/>
      </svg>

      {/* Button 3 */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '32px', height: '32px', bottom: '40%', right: '6%', animationDelay: '7s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(129, 140, 248)" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="9" cy="9" r="1" fill="rgb(129, 140, 248)"/>
        <circle cx="15" cy="9" r="1" fill="rgb(129, 140, 248)"/>
        <circle cx="9" cy="15" r="1" fill="rgb(129, 140, 248)"/>
        <circle cx="15" cy="15" r="1" fill="rgb(129, 140, 248)"/>
      </svg>

      {/* Pin 2 */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '33px', height: '33px', top: '45%', right: '5%', animationDelay: '5.5s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2">
        <path d="M12 2v20M8 4h8l-1 2H9l-1-2z" strokeLinecap="round"/>
        <circle cx="12" cy="3" r="2" fill="rgb(239, 68, 68)"/>
      </svg>

      {/* Thimble */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '35px', height: '35px', top: '25%', left: '20%', animationDelay: '1.5s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="1.5">
        <path d="M8 20c0-3.314 2.686-6 6-6h4c1.105 0 2 .895 2 2v2c0 1.105-.895 2-2 2h-8c-1.105 0-2-.895-2-2z"/>
        <circle cx="10" cy="16" r="0.5" fill="rgb(79, 70, 229)"/>
        <circle cx="13" cy="16" r="0.5" fill="rgb(79, 70, 229)"/>
        <circle cx="16" cy="16" r="0.5" fill="rgb(79, 70, 229)"/>
      </svg>

      {/* Safety Pin */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '40px', height: '40px', top: '18%', left: '25%', animationDelay: '2s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="1.5">
        <path d="M4 12c0-2 2-4 4-4h8c2 0 4 2 4 4M8 8V6c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        <circle cx="6" cy="12" r="2" fill="rgb(79, 70, 229)"/>
      </svg>

      {/* Hook */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '28px', height: '28px', top: '60%', left: '10%', animationDelay: '3s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2">
        <path d="M8 12c0-2 1-4 4-4s4 2 4 4-1 4-4 4"/>
        <circle cx="12" cy="8" r="1.5" fill="rgb(99, 102, 241)"/>
      </svg>

      {/* Fabric Roll */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '48px', height: '48px', bottom: '45%', right: '20%', animationDelay: '7.5s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="1.5">
        <rect x="6" y="4" width="12" height="16" rx="2" fill="none"/>
        <path d="M6 8h12M6 12h12M6 16h12" strokeWidth="1"/>
      </svg>

      {/* Seam Ripper */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '36px', height: '36px', top: '40%', right: '28%', animationDelay: '4.5s' }} viewBox="0 0 24 24" fill="none" stroke="rgb(79, 70, 229)" strokeWidth="1.5">
        <path d="M6 18l12-12M10 18c1-1 2-3 2-5"/>
        <circle cx="6" cy="18" r="2" fill="rgb(239, 68, 68)"/>
      </svg>

      {/* Thread Roll 3 */}
      <svg style={{ position: 'absolute', opacity: 0.12, animation: 'float 15s ease-in-out infinite', width: '38px', height: '38px', top: '50%', left: '5%', animationDelay: '6s' }} viewBox="0 0 24 24" fill="rgb(129, 140, 248)" stroke="rgb(129, 140, 248)" strokeWidth="1">
        <circle cx="12" cy="12" r="8" fill="none" strokeWidth="2"/>
        <circle cx="12" cy="12" r="5" fill="none" strokeWidth="1.5"/>
        <path d="M12 4v4M12 16v4M4 12h4M16 12h4" strokeWidth="1.5"/>
      </svg>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) rotate(3deg);
          }
          50% {
            transform: translateY(-8px) rotate(-3deg);
          }
          75% {
            transform: translateY(-12px) rotate(2deg);
          }
        }

        @keyframes weaveShift {
          0%, 100% {
            transform: translateX(0) scaleY(1);
          }
          50% {
            transform: translateX(-20px) scaleY(1.05);
          }
        }

        @keyframes threadFlow {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.8;
          }
          50% {
            transform: translateX(30px);
            opacity: 1;
          }
        }
      `}</style>

      {/* User Login Button */}
      <button 
        onClick={onSwitchToUserLogin}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'rgb(79, 70, 229)',
          padding: '8px 16px',
          borderRadius: '8px',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(79, 70, 229, 0.1)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(79, 70, 229, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)';
        }}
      >
        User Login
      </button>

      {/* Admin Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '90%',
        maxWidth: '450px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: 0,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(79, 70, 229, 0.1)',
        overflow: 'hidden',
      }}>
        {/* Admin Header */}
        <div style={{
          textAlign: 'center',
          padding: '40px 40px 30px',
          background: 'rgba(248, 250, 252, 0.8)',
          borderBottom: '1px solid rgba(79, 70, 229, 0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <svg style={{
              width: '50px',
              height: '50px',
              color: 'rgb(79, 70, 229)',
              filter: 'drop-shadow(0 0 10px rgba(79, 70, 229, 0.5))',
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
            </svg>
            <span style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'rgb(79, 70, 229)',
              letterSpacing: '1px',
            }}>TexConnect</span>
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'rgb(79, 70, 229)',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '8px',
          }}>ADMIN PANEL</h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(79, 70, 229, 0.6)',
            letterSpacing: '1px',
          }}>Admin & Sub-Admin Login</p>
        </div>

        {/* Form Container */}
        <div style={{ padding: '40px 40px 0', position: 'relative' }}>
          <form onSubmit={handleLogin}>
            {/* Error Message */}
            {error && (
              <div style={{
                color: '#dc2626',
                fontSize: '14px',
                textAlign: 'center',
                background: '#fee2e2',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            {/* Email Input */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569', display: 'block', marginBottom: '8px' }}>Username</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <svg style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: 'rgb(79, 70, 229)',
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 15px 10px 35px',
                    background: 'rgba(79, 70, 229, 0.03)',
                    border: 'none',
                    borderBottom: '2px solid rgba(79, 70, 229, 0.2)',
                    color: '#1e293b',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.05)';
                    e.currentTarget.style.borderBottomColor = 'rgb(79, 70, 229)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.03)';
                    e.currentTarget.style.borderBottomColor = 'rgba(79, 70, 229, 0.2)';
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569', display: 'block', marginBottom: '8px' }}>Password</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <svg style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: 'rgb(79, 70, 229)',
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 45px 10px 35px',
                    background: 'rgba(79, 70, 229, 0.03)',
                    border: 'none',
                    borderBottom: '2px solid rgba(79, 70, 229, 0.2)',
                    color: '#1e293b',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.05)';
                    e.currentTarget.style.borderBottomColor = 'rgb(79, 70, 229)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.03)';
                    e.currentTarget.style.borderBottomColor = 'rgba(79, 70, 229, 0.2)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Textile Wave with Login Button */}
            <div style={{
              position: 'relative',
              height: '180px',
              marginTop: '40px',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: '140px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(99, 102, 241, 0.2) 25%, rgba(79, 70, 229, 0.25) 50%, rgba(99, 102, 241, 0.2) 75%, rgba(79, 70, 229, 0.15) 100%)',
                clipPath: 'polygon(0 40%, 10% 35%, 20% 40%, 30% 35%, 40% 40%, 50% 30%, 60% 40%, 70% 35%, 80% 40%, 90% 35%, 100% 40%, 100% 100%, 0 100%)',
                animation: 'weaveShift 8s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: '100px',
                background: 'linear-gradient(to right, transparent, rgba(79, 70, 229, 0.3), transparent)',
                clipPath: 'polygon(0 50%, 15% 45%, 30% 50%, 45% 40%, 60% 50%, 75% 45%, 90% 50%, 100% 45%, 100% 100%, 0 100%)',
                animation: 'threadFlow 10s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: '80px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(129, 140, 248, 0.3))',
                clipPath: 'polygon(0 60%, 20% 55%, 40% 60%, 60% 50%, 80% 60%, 100% 55%, 100% 100%, 0 100%)',
                animation: 'threadFlow 12s ease-in-out infinite reverse',
              }} />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  padding: '15px 50px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '18px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.3s',
                  zIndex: 10,
                  opacity: isLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translate(-50%, -53px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(245, 158, 11, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.4)';
                  }
                }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
