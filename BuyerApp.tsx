import React, { useState } from 'react';
import BuyerHeader from './components/buyer/BuyerHeader';
import { ProductBrowseView } from './components/buyer/ProductBrowseView';
import BuyerOrdersView from './components/buyer/BuyerOrdersView';
import BuyerProfileView from './components/buyer/BuyerProfileView';

type BuyerView = 'browse' | 'orders' | 'profile';

const BuyerApp: React.FC = () => {
    const [view, setView] = useState<BuyerView>('browse');

    const renderView = () => {
        switch (view) {
            case 'browse':
                return <ProductBrowseView />;
            case 'orders':
                return <BuyerOrdersView />;
            case 'profile':
                return <BuyerProfileView />;
            default:
                return <ProductBrowseView />;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <BuyerHeader currentView={view} setView={setView} />
            <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
                {renderView()}
            </main>
        </div>
    );
};

export default BuyerApp;