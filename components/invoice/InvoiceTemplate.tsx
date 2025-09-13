import React from 'react';
import type { Order, User, InventoryItem } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';

const GST_RATE = 0.18;

interface InvoiceTemplateProps {
    order: Order;
    seller: User;
    buyer: User;
    items: (InventoryItem & { quantity: number })[];
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, seller, buyer, items }) => {
    const { t, formatDate } = useLocalization();

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const gstAmount = subtotal * GST_RATE;
    const grandTotal = subtotal + gstAmount;

    return (
        <div className="bg-white p-8 font-sans text-sm text-slate-800 shadow-lg" id="invoice-to-print">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <svg className="w-12 h-12 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">TexConnect</h1>
                        <p className="text-slate-500">Connecting Textile Businesses</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase text-slate-600">Tax Invoice</h2>
                </div>
            </div>

            {/* Seller & Invoice Details Header */}
            <div className="flex justify-between items-start pt-6 pb-6 border-y">
                <div>
                    <h3 className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-2">Sold By</h3>
                    <h1 className="text-lg font-bold text-slate-900">{seller.username}</h1>
                    <p>{seller.address}</p>
                    <p>{seller.phone}</p>
                    <p>{seller.email}</p>
                    <p><span className="font-semibold">{t('gst_number')}:</span> {seller.gstNumber}</p>
                </div>
                <div className="text-right">
                    <p><span className="font-semibold">{t('invoice_no')}:</span> INV-{order.id}</p>
                    <p><span className="font-semibold">{t('invoice_date')}:</span> {formatDate(new Date())}</p>
                    <p className="mt-2"><span className="font-semibold">{t('order_id')}:</span> {order.id}</p>
                    <p><span className="font-semibold">{t('order_date')}:</span> {formatDate(order.date)}</p>
                </div>
            </div>

            {/* Billing Info */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                    <h3 className="font-semibold text-slate-500 uppercase tracking-wide text-xs">{t('bill_to')}</h3>
                    <p className="font-bold text-slate-900">{buyer.username}</p>
                    <p>{buyer.address}</p>
                    <p>{buyer.phone}</p>
                    <p><span className="font-semibold">{t('gst_number')}:</span> {buyer.gstNumber}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-500 uppercase tracking-wide text-xs">{t('ship_to')}</h3>
                    <p className="font-bold text-slate-900">{buyer.username}</p>
                    <p>{buyer.address}</p>
                </div>
            </div>

            {/* Items Table */}
            <div className="mt-8">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-100 border-y border-slate-200 text-slate-600">
                             <th className="p-3 font-semibold uppercase text-xs">#</th>
                            <th className="p-3 font-semibold uppercase text-xs">{t('item_description')}</th>
                            <th className="p-3 text-center font-semibold uppercase text-xs">{t('qty')}</th>
                            <th className="p-3 text-right font-semibold uppercase text-xs">{t('rate')}</th>
                            <th className="p-3 text-right font-semibold uppercase text-xs">{t('amount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id} className="border-b border-slate-100">
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-right">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="p-3 text-right font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-6">
                <div className="w-full max-w-sm">
                    <div className="flex justify-between py-2 border-b">
                        <span className="font-semibold">{t('subtotal')}</span>
                        <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="font-semibold">{t('gst_18')}</span>
                        <span>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-slate-100 px-3 rounded mt-2 text-slate-900">
                        <span className="font-bold text-lg">{t('grand_total')}</span>
                        <span className="font-bold text-lg">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-16 pt-8 border-t text-center text-xs text-slate-500">
                 <p>This is a computer-generated invoice and does not require a signature.</p>
                 <p className="font-bold text-primary mt-2">Thank you for your business with TexConnect!</p>
                <div className="mt-12">
                    <p className="border-t border-slate-400 inline-block px-8 pt-2">{t('authorized_signatory')}</p>
                </div>
            </div>

        </div>
    );
};

export default InvoiceTemplate;
