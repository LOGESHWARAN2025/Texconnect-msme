import React, { useState } from 'react';
import MSMEApp from './MSMEApp';
import BuyerApp from './BuyerApp';
import { useAppContext } from './context/SupabaseContext';
import type { UserRole } from './types';

const DemoApp: React.FC = () => {
    const { currentUser } = useAppContext();
    
    // The AppRouter ensures currentUser is not null here.
    // If the user's primary role is 'buyer', they only see the BuyerApp.
    if (currentUser!.role === 'buyer') {
        return <BuyerApp />;
    }

    // If the user is an MSME, they can switch between MSME and Buyer views.
    const [displayRole, setDisplayRole] = useState<UserRole>(() => {
        const saved = localStorage.getItem('demo-app-display-role');
        if (saved === 'msme' || saved === 'buyer') return saved as UserRole;
        return 'msme';
    });

    const handleSetRole = (role: UserRole) => {
        if (role === 'msme' || role === 'buyer') {
            localStorage.setItem('demo-app-display-role', role);
            setDisplayRole(role);
        }
    };

    return (
        <div className="h-full overflow-hidden">
            {displayRole === 'msme' ? <MSMEApp /> : <BuyerApp />}
        </div>
    );
}

export default DemoApp;
