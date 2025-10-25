import React, { useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { useLocalization } from '../../hooks/useLocalization';
import { useAppContext } from '../../context/SupabaseContext';
import InvoiceTemplateA4 from './InvoiceTemplateA4';
import type { Order, InventoryItem, Product } from '../../types';

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
    const { users, inventory, products } = useAppContext();
    const [isDownloading, setIsDownloading] = useState(false);

    const invoiceData = useMemo(() => {
        if (!order || !order.items || order.items.length === 0) {
            console.log('❌ Invoice: No order or items');
            return null;
        }

        console.log('📄 Loading invoice for order:', order.id);
        console.log('Order buyer name:', order.buyerName);
        console.log('Order items:', order.items);

        const buyer = users.find(u => u.username === order.buyerName || u.id === order.buyerId);
        if (!buyer) {
            console.log('❌ Buyer not found. Looking for:', order.buyerName, 'or ID:', order.buyerId);
            console.log('Available users:', users.map(u => ({ id: u.id, username: u.username })));
        }
        
        const firstItemInOrder = order.items[0];
        if (!firstItemInOrder) {
            console.log('❌ No first item in order');
            return null;
        }
        
        // Try to find in products first, then inventory
        let productInfo: Product | InventoryItem | undefined = products.find(p => p.id === firstItemInOrder.productId);
        if (!productInfo) {
            productInfo = inventory.find(i => i.id === firstItemInOrder.productId);
        }
        
        if (!productInfo) {
            console.log('❌ Product not found. Looking for:', firstItemInOrder.productId);
            console.log('Available products:', products.map(p => p.id));
            console.log('Available inventory:', inventory.map(i => i.id));
            return null;
        }

        const seller = users.find(u => u.id === productInfo.msmeId);
        if (!seller) {
            console.log('❌ Seller not found. Looking for:', productInfo.msmeId);
        }

        const itemsWithDetails = order.items.map(orderItem => {
            // Try products first, then inventory
            let item: Product | InventoryItem | undefined = products.find(p => p.id === orderItem.productId);
            if (!item) {
                item = inventory.find(i => i.id === orderItem.productId);
            }
            // Convert to InventoryItem format for invoice template
            if (item) {
                return {
                    id: item.id,
                    msmeId: item.msmeId,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    stock: item.stock,
                    category: 'category' in item ? item.category : '',
                    unitOfMeasure: 'unitOfMeasure' in item ? item.unitOfMeasure : 'unit',
                    minStockLevel: 'minStockLevel' in item ? item.minStockLevel : 0,
                    quantity: orderItem.quantity,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                } as InventoryItem & { quantity: number };
            }
            return null;
        }).filter((item): item is InventoryItem & { quantity: number } => item !== null);

        if (!buyer || !seller || itemsWithDetails.length === 0) {
            console.log('❌ Missing data - Buyer:', !!buyer, 'Seller:', !!seller, 'Items:', itemsWithDetails.length);
            return null;
        }

        console.log('✅ Invoice data loaded successfully');
        return { order, buyer, seller, items: itemsWithDetails };

    }, [order, users, inventory, products]);

    const handleDownloadPdf = () => {
        const invoiceElement = document.getElementById('invoice-content');
        if (!invoiceElement || !invoiceData) return;
        
        setIsDownloading(true);
        
        // Use jsPDF and html2canvas from the global scope (loaded via CDN)
        html2canvas(invoiceElement, { 
            scale: 2,
            useCORS: true,
            logging: false,
            width: 794, // A4 width in pixels at 96 DPI (210mm)
            height: 1123 // A4 height in pixels at 96 DPI (297mm)
        }).then((canvas: HTMLCanvasElement) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210; // A4 width in mm
            const pdfHeight = 297; // A4 height in mm
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`invoice-${invoiceData.order.id.substring(0, 8)}.pdf`);
        }).finally(() => {
            setIsDownloading(false);
        });
    };

    const handlePrint = () => {
        const invoiceElement = document.getElementById('invoice-content');
        if (!invoiceElement) return;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${invoiceData?.order.id.substring(0, 8)}</title>
                <style>
                    @media print {
                        @page { size: A4; margin: 0; }
                        body { margin: 0; }
                    }
                    body { margin: 0; padding: 0; }
                </style>
            </head>
            <body>
                ${invoiceElement.outerHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('invoice')} - ${order?.id || ''}`} size="xl">
            <div className="max-h-[70vh] overflow-y-auto bg-slate-50 p-2">
                {invoiceData ? (
                    <InvoiceTemplateA4 {...invoiceData} />
                ) : (
                    <p className="text-center p-8">Could not load invoice details.</p>
                )}
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-between items-center">
                <button 
                    onClick={onClose} 
                    className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                >
                    {t('cancel')}
                </button>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={handlePrint}
                        disabled={!invoiceData}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition shadow flex items-center disabled:bg-slate-400"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                        Print
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
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    )
};

export default InvoiceModal;