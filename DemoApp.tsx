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
    // The initial view is set to their primary role, 'msme'.
    const [displayRole, setDisplayRole] = useState<UserRole>('msme');

    const handleSetRole = (role: UserRole) => {
        if (role === 'msme' || role === 'buyer') {
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
