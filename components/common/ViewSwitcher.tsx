import React from 'react';
import type { UserRole } from '../../types';

interface ViewSwitcherProps {
    currentRole: UserRole;
    setRole: (role: UserRole) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentRole, setRole }) => {
    return (
        <div className="bg-slate-800 p-2 flex justify-center items-center space-x-4">
            <span className="text-white font-semibold text-sm">Switch View:</span>
            <div className="flex rounded-md bg-slate-700 p-1">
                <button
                    onClick={() => setRole('msme')}
                    className={`px-4 py-1 text-sm font-medium rounded ${
                        currentRole === 'msme' ? 'bg-primary text-white shadow' : 'text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    MSME
                </button>
                <button
                    onClick={() => setRole('buyer')}
                    className={`px-4 py-1 text-sm font-medium rounded ${
                        currentRole === 'buyer' ? 'bg-secondary text-white shadow' : 'text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    Buyer
                </button>
            </div>
        </div>
    );
};

export default ViewSwitcher;
