import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  color?: string;
  fullScreen?: boolean;
  className?: string;
  withText?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 80,
  text = 'Loading...',
  color = 'rgb(79, 70, 229)',
  fullScreen = false,
  className = '',
  withText = true,
}) => {
  const content = (
    <div className="text-center">
      <div
        className="relative mx-auto"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Static center */}
        <svg className="absolute top-0 left-0 w-full h-full" fill="none" viewBox="0 0 24 24">
          <path
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 10l-2 1m0 0l-2-1m2 1v2.5"
          />
        </svg>

        {/* Rotating parts */}
        <svg
          className="absolute top-0 left-0 w-full h-full animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          style={{ animationDuration: '2s' }}
        >
          <path
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
          />
        </svg>
      </div>

      {withText && text && (
        <div
          className="text-lg mt-8 uppercase tracking-widest font-semibold"
          style={{ color }}
        >
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center min-h-[200px] ${className}`}>
      {content}
    </div>
  );
};

export default LoadingSpinner;
