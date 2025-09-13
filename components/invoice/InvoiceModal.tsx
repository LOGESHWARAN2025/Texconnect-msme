import React, { useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/AppContext';
import InvoiceTemplate from './InvoiceTemplate';
import type { Order, InventoryItem } from '../../types';

// Declare global variables for CDN libraries to satisfy TypeScript
declare const jspdf: any;
declare const html2canvas: any;

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order }) => {
    const { t } = useLocalization();
    const { users, inventory } = useAppContext();
    const [isDownloading, setIsDownloading] = useState(false);

    const invoiceData = useMemo(() => {
        if (!order) return null;

        const buyer = users.find(u => u.username === order.buyerName);
        
        const firstItemInOrder = order.items[0];
        if (!firstItemInOrder) return null;
        
        const productInfo = inventory.find(i => i.id === firstItemInOrder.productId);
        if (!productInfo) return null;

        const seller = users.find(u => u.id === productInfo.msmeId);

        const itemsWithDetails = order.items.map(orderItem => {
            const inventoryItem = inventory.find(i => i.id === orderItem.productId);
            return { ...inventoryItem, quantity: orderItem.quantity } as (InventoryItem & { quantity: number });
        }).filter(item => item.id); // Filter out any items that couldn't be found

        if (!buyer || !seller || itemsWithDetails.length === 0) return null;

        return { order, buyer, seller, items: itemsWithDetails };

    }, [order, users, inventory]);

    const handleDownloadPdf = () => {
        const invoiceElement = document.getElementById('invoice-to-print');
        if (!invoiceElement || !invoiceData) return;
        
        setIsDownloading(true);
        
        // Use jsPDF and html2canvas from the global scope (loaded via CDN)
        html2canvas(invoiceElement, { scale: 2 }) // Increase scale for better resolution
            .then((canvas: HTMLCanvasElement) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const height = pdfWidth / ratio;
                
                // If the content height is less than the page height, fit it.
                // If it's more, it will span multiple pages (though this basic implementation doesn't handle multi-page perfectly).
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height);
                pdf.save(`invoice-${invoiceData.order.id}.pdf`);
            })
            .finally(() => {
                setIsDownloading(false);
            });
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('invoice')} - ${order?.id || ''}`} size="xl">
            <div className="max-h-[70vh] overflow-y-auto bg-slate-50 p-2">
                {invoiceData ? (
                    <InvoiceTemplate {...invoiceData} />
                ) : (
                    <p className="text-center p-8">Could not load invoice details.</p>
                )}
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end items-center space-x-3">
                 <button 
                    onClick={onClose} 
                    className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                 >
                    {t('cancel')}
                 </button>
                 <button 
                    onClick={handleDownloadPdf}
                    disabled={!invoiceData || isDownloading}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow flex items-center disabled:bg-slate-400"
                 >
                    {isDownloading ? (
                        <>
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading...
                        </>
                    ) : t('download_pdf')}
                 </button>
            </div>
        </Modal>
    )
};

export default InvoiceModal;