import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withText?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  withText = true,
  text = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Static center part */}
        <svg 
          className="absolute top-0 left-0 w-full h-full text-indigo-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5"></path>
        </svg>
        
        {/* Rotating outer parts */}
        <svg 
          className="absolute top-0 left-0 w-full h-full text-indigo-600 animate-spin" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ animationDuration: '2s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
        </svg>
      </div>
      
      {withText && (
        <div className={`mt-4 text-indigo-600 font-medium tracking-wider ${textSizes[size]}`}>
          {text}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
