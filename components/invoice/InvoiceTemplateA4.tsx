import React from 'react';
import type { Order, User, InventoryItem, Address } from '../../types';

interface InvoiceTemplateA4Props {
    order: Order;
    buyer: User;
    seller: User;
    items: (InventoryItem & { quantity: number })[];
}

const InvoiceTemplateA4: React.FC<InvoiceTemplateA4Props> = ({ order, buyer, seller, items }) => {
    const invoiceDate = new Date(order.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = subtotal * 0.18; // 18% GST
    const total = subtotal + gst;

    return (
        <div 
            id="invoice-content" 
            style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '20mm',
                margin: '0 auto',
                backgroundColor: 'white',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#000',
                position: 'relative'
            }}
        >
            {/* Header */}
            <div style={{ borderBottom: '3px solid #2563eb', paddingBottom: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#2563eb', fontWeight: 'bold' }}>
                            TAX INVOICE
                        </h1>
                        <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>
                            Original for Recipient
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0', fontSize: '11px' }}>
                            <strong>Invoice No:</strong> {order.id.substring(0, 12).toUpperCase()}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '11px' }}>
                            <strong>Date:</strong> {invoiceDate}
                        </p>
                    </div>
                </div>
            </div>

            {/* Seller and Buyer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                {/* Seller Details */}
                <div style={{ border: '1px solid #e5e7eb', padding: '15px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2563eb', fontWeight: 'bold' }}>
                        Seller Details
                    </h3>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '13px' }}>
                        {seller.companyName || seller.username}
                    </p>
                    <p style={{ margin: '0 0 3px 0', fontSize: '11px', color: '#666' }}>
                        {seller.address || 'Address not provided'}
                    </p>
                    <p style={{ margin: '8px 0 3px 0', fontSize: '11px' }}>
                        <strong>GSTIN:</strong> {seller.gstNumber || 'N/A'}
                    </p>
                    <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>
                        <strong>Email:</strong> {seller.email}
                    </p>
                    <p style={{ margin: '0', fontSize: '11px' }}>
                        <strong>Phone:</strong> {seller.phone}
                    </p>
                </div>

                {/* Buyer Details */}
                <div style={{ border: '1px solid #e5e7eb', padding: '15px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2563eb', fontWeight: 'bold' }}>
                        Buyer Details
                    </h3>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '13px' }}>
                        {buyer.companyName || order.shippingAddress?.fullName || buyer.username}
                    </p>
                    {buyer.companyName && order.shippingAddress?.fullName && (
                        <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#666' }}>
                            Attn: {order.shippingAddress.fullName}
                        </p>
                    )}
                    {order.shippingAddress ? (
                        <>
                            <p style={{ margin: '0 0 3px 0', fontSize: '11px', color: '#666' }}>
                                {order.shippingAddress.addressLine1}
                            </p>
                            {order.shippingAddress.addressLine2 && (
                                <p style={{ margin: '0 0 3px 0', fontSize: '11px', color: '#666' }}>
                                    {order.shippingAddress.addressLine2}
                                </p>
                            )}
                            <p style={{ margin: '0 0 3px 0', fontSize: '11px', color: '#666' }}>
                                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                            </p>
                        </>
                    ) : (
                        <p style={{ margin: '0 0 3px 0', fontSize: '11px', color: '#666' }}>
                            {buyer.address || 'Address not provided'}
                        </p>
                    )}
                    <p style={{ margin: '8px 0 3px 0', fontSize: '11px' }}>
                        <strong>GSTIN:</strong> {buyer.gstNumber || order.buyerGst || 'N/A'}
                    </p>
                    <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>
                        <strong>Email:</strong> {buyer.email}
                    </p>
                    <p style={{ margin: '0', fontSize: '11px' }}>
                        <strong>Phone:</strong> {order.buyerPhone || order.shippingAddress?.phone || buyer.phone}
                    </p>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '25px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #d1d5db', width: '5%' }}>
                                S.No
                            </th>
                            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #d1d5db', width: '35%' }}>
                                Material Description
                            </th>
                            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #d1d5db', width: '15%' }}>
                                Category
                            </th>
                            <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #d1d5db', width: '10%' }}>
                                UOM
                            </th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #d1d5db', width: '10%' }}>
                                Qty
                            </th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #d1d5db', width: '12%' }}>
                                Rate (₹)
                            </th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #d1d5db', width: '13%' }}>
                                Amount (₹)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '10px 8px', fontSize: '11px' }}>
                                    {index + 1}
                                </td>
                                <td style={{ padding: '10px 8px', fontSize: '11px' }}>
                                    <strong>{item.name}</strong>
                                    {item.description && (
                                        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                                            {item.description}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '10px 8px', fontSize: '11px' }}>
                                    {item.category || 'Textile'}
                                </td>
                                <td style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'center' }}>
                                    {item.unitOfMeasure || 'meters'}
                                </td>
                                <td style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'right' }}>
                                    {item.quantity}
                                </td>
                                <td style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'right' }}>
                                    {item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
                <div style={{ width: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '11px' }}>Subtotal:</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                            ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '11px' }}>GST (18%):</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                            ₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', backgroundColor: '#f3f4f6', marginTop: '5px', paddingLeft: '10px', paddingRight: '10px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Total Amount:</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}>
                            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Terms and Conditions */}
            <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold' }}>
                    Terms & Conditions:
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '10px', color: '#666' }}>
                    <li>Payment is due within 30 days of invoice date.</li>
                    <li>Goods once sold will not be taken back or exchanged.</li>
                    <li>All disputes are subject to jurisdiction of courts in seller's location.</li>
                    <li>Interest @18% p.a. will be charged on delayed payments.</li>
                </ul>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                        <p style={{ margin: '0' }}>This is a computer-generated invoice and does not require a signature.</p>
                        <p style={{ margin: '3px 0 0 0' }}>Generated on: {new Date().toLocaleString('en-IN')}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 30px 0', fontSize: '11px', fontWeight: 'bold' }}>
                            For {seller.companyName || seller.username}
                        </p>
                        <p style={{ margin: '0', fontSize: '10px', borderTop: '1px solid #000', paddingTop: '5px', display: 'inline-block' }}>
                            Authorized Signatory
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceTemplateA4;
