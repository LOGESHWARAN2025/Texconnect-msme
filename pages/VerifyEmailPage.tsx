import React, { useState } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';

interface VerifyEmailPageProps {
    email: string;
    onVerificationComplete: () => void;
}

const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ email }) => {
    const { t } = useLocalization();
    const { sendVerificationEmail, logout } = useAppContext();
    const [emailSent, setEmailSent] = useState(false);

    const handleResend = async () => {
        try {
            await sendVerificationEmail();
            setEmailSent(true);
        } catch (error: any) {
            console.error(`Failed to resend verification email: ${error.code} - ${error.message}`);
            alert("Failed to resend email. Please try again later.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="max-w-lg w-full bg-white p-10 rounded-xl shadow-lg text-center">
                <svg className="mx-auto h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h2 className="mt-4 text-2xl font-bold text-slate-800">{t('verify_your_email')}</h2>
                <p className="mt-2 text-slate-600">{t('verification_email_sent')}</p>
                <p className="mt-2 text-slate-600 font-semibold">{email}</p>
                <p className="mt-4 text-sm text-slate-500">
                    Once you've verified your email from your inbox, please refresh this page or log in again.
                </p>

                <div className="mt-6 space-y-4">
                     <button 
                        onClick={handleResend}
                        disabled={emailSent}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-400"
                    >
                        {emailSent ? "Verification Email Sent!" : t('resend_verification')}
                    </button>
                    <button 
                        onClick={logout} 
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        {t('logout')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default VerifyEmailPage;
