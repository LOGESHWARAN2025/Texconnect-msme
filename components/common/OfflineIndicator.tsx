import React from 'react';

const OfflineIndicator: React.FC = () => {
    return (
        <div 
            className="fixed top-0 left-0 w-full bg-yellow-500 text-white text-center p-2 text-sm font-semibold shadow-lg z-[100]"
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-center justify-center">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364m12.728-12.728L5.636 5.636" /></svg>
                 <span>You are currently offline. Your changes will be saved and synced when you reconnect.</span>
            </div>
        </div>
    );
};

export default OfflineIndicator;
