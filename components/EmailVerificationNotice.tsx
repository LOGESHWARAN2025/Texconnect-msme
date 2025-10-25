import React from 'react';

interface EmailVerificationNoticeProps {
  email: string;
  onResendEmail?: () => void;
  onClose: () => void;
}

const EmailVerificationNotice: React.FC<EmailVerificationNoticeProps> = ({ 
  email, 
  onResendEmail,
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-4">
          Verify Your Email
        </h2>

        {/* Message */}
        <div className="text-center space-y-4 mb-6">
          <p className="text-slate-600">
            We've sent a verification email to:
          </p>
          <p className="font-semibold text-slate-800 bg-slate-50 px-4 py-2 rounded-lg break-all">
            {email}
          </p>
          <p className="text-sm text-slate-500">
            Please check your inbox and click the verification link to activate your account.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Next Steps:
          </h3>
          <ol className="text-sm text-blue-800 space-y-2 ml-7 list-decimal">
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the verification link in the email</li>
            <li>Return to the login page and sign in</li>
          </ol>
        </div>

        {/* Resend Email Button */}
        {onResendEmail && (
          <button
            onClick={onResendEmail}
            className="w-full mb-3 py-3 px-4 border border-green-500 text-green-600 rounded-full hover:bg-green-50 transition-colors font-medium"
          >
            Resend Verification Email
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full hover:from-green-500 hover:to-emerald-600 transition-all font-medium shadow-lg"
        >
          Go to Login
        </button>

        {/* Didn't receive email? */}
        <p className="text-xs text-center text-slate-500 mt-4">
          Didn't receive the email? Check your spam folder or click "Resend" above.
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationNotice;
