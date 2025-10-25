import React from 'react';
import type { Order, User } from '../../types';

interface InvoiceGeneratorProps {
  order: Order;
  buyer: User;
  msme?: User;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ order, buyer, msme }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateSubtotal = () => {
    return order.items?.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 0);
    }, 0) || 0;
  };

  const calculateGST = (subtotal: number) => {
    return subtotal * 0.18; // 18% GST
  };

  const subtotal = calculateSubtotal();
  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  return (
    <div className="invoice-container">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-container, .invoice-container * {
            visibility: visible;
          }
          .invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
        
        @page {
          size: A4;
          margin: 0;
        }
      `}</style>

      {/* Action Buttons - Hidden on Print */}
      <div className="no-print mb-4 flex justify-end space-x-3">
        <button
          onClick={handlePrint}
          className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
        <button
          onClick={handleDownload}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition shadow flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Invoice Content - A4 Format */}
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-[210mm] mx-auto" style={{ minHeight: '297mm' }}>
        {/* Header */}
        <div className="border-b-2 border-primary pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">INVOICE</h1>
              <p className="text-slate-600">Tax Invoice</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-800 mb-2">TexConnect</div>
              <p className="text-sm text-slate-600">Textile B2B Marketplace</p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Invoice Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-600">Invoice No:</span>
                <span className="ml-2 font-semibold">INV-{order.id?.slice(0, 8).toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-600">Order ID:</span>
                <span className="ml-2 font-semibold">{order.id?.slice(0, 8).toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-600">Date:</span>
                <span className="ml-2 font-semibold">{formatDate(order.createdAt || order.createdat || new Date())}</span>
              </div>
              <div>
                <span className="text-slate-600">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                  order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Payment Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-600">Payment Method:</span>
                <span className="ml-2 font-semibold">Bank Transfer</span>
              </div>
              <div>
                <span className="text-slate-600">Payment Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                  order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status === 'Delivered' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer and Seller Information */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Bill To */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Bill To</h3>
            <div className="space-y-1">
              <p className="font-bold text-slate-800">{buyer.companyName || buyer.username}</p>
              <p className="text-sm text-slate-600">{buyer.address}</p>
              <p className="text-sm text-slate-600">Phone: {buyer.phone}</p>
              <p className="text-sm text-slate-600">Email: {buyer.email}</p>
              {buyer.gstNumber && (
                <p className="text-sm text-slate-600">GSTIN: {buyer.gstNumber}</p>
              )}
            </div>
          </div>

          {/* Ship From */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Ship From</h3>
            <div className="space-y-1">
              <p className="font-bold text-slate-800">{msme?.companyName || msme?.username || 'MSME Seller'}</p>
              <p className="text-sm text-slate-600">{msme?.address || 'N/A'}</p>
              <p className="text-sm text-slate-600">Phone: {msme?.phone || 'N/A'}</p>
              <p className="text-sm text-slate-600">Email: {msme?.email || 'N/A'}</p>
              {msme?.gstNumber && (
                <p className="text-sm text-slate-600">GSTIN: {msme.gstNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">S.No</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Product Description</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantity</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Unit Price</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index} className="border-b border-slate-200">
                  <td className="py-3 px-4 text-slate-600">{index + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{item.productName || item.name || 'Product'}</p>
                    {item.description && (
                      <p className="text-sm text-slate-500">{item.description}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-slate-600">₹{(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                    ₹{((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">GST (18%):</span>
                <span className="font-semibold text-slate-800">₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-slate-300">
                <span className="text-lg font-bold text-slate-800">Total Amount:</span>
                <span className="text-lg font-bold text-primary">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="bg-slate-50 p-4 rounded-lg mb-8">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Amount in Words: </span>
            <span className="capitalize">{convertNumberToWords(total)} Rupees Only</span>
          </p>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-700 uppercase mb-3">Terms & Conditions</h3>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Payment is due within 30 days of invoice date.</li>
            <li>• Please include invoice number with payment.</li>
            <li>• Goods once sold will not be taken back or exchanged.</li>
            <li>• All disputes are subject to local jurisdiction only.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-200 pt-6 mt-8">
          <div className="flex justify-between items-end">
            <div className="text-sm text-slate-600">
              <p>Thank you for your business!</p>
              <p className="mt-2">For any queries, contact: support@texconnect.com</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-8">Authorized Signature</p>
              <div className="border-t border-slate-400 w-48"></div>
            </div>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="text-center text-xs text-slate-500 mt-8">
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert number to words (Indian numbering system)
function convertNumberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = Math.floor(num % 100);

  let words = '';

  if (crore > 0) {
    words += convertNumberToWords(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertNumberToWords(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertNumberToWords(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }
  if (remainder >= 20) {
    words += tens[Math.floor(remainder / 10)] + ' ';
    if (remainder % 10 > 0) {
      words += ones[remainder % 10];
    }
  } else if (remainder >= 10) {
    words += teens[remainder - 10];
  } else if (remainder > 0) {
    words += ones[remainder];
  }

  return words.trim();
}

export default InvoiceGenerator;
