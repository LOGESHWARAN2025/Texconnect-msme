import React, { useState, useRef } from 'react';
import { generateQRCode } from '../src/services/barcode/barcodeService';
import type { Order } from '../types';

interface QRCodeStickerPrinterProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const QRCodeStickerPrinter: React.FC<QRCodeStickerPrinterProps> = ({ isOpen, onClose, order }) => {
  const [stickerCount, setStickerCount] = useState(1);
  const [qrCodes, setQRCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && order) {
      generateQRsForOrder();
    }
  }, [isOpen, order, stickerCount]);

  const generateQRsForOrder = async () => {
    if (!order) return;

    setLoading(true);
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://texconnect-msme.vercel.app';
      const codes: string[] = [];

      for (let i = 1; i <= stickerCount; i++) {
        // Unique scan URL for each sticker: orderId_index
        const uniqueId = `${order.id}_${i}`;
        const scanUrl = `${base}/?scan=1&orderId=${encodeURIComponent(order.id)}&unit=${i}&uid=${uniqueId}`;

        const qrCodeDataUrl = await generateQRCode(scanUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        codes.push(qrCodeDataUrl);
      }

      setQRCodes(codes);
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!printRef.current || !order) return;

    // Update the total units in the background
    try {
      const { supabase } = await import('../src/lib/supabase');
      await supabase
        .from('orders')
        .update({ totalUnits: stickerCount })
        .eq('id', order.id);
    } catch (e) {
      console.error('Failed to update totalUnits:', e);
    }

    const printWindow = window.open('', '', 'height=600,width=600');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Sticker Print</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .sticker {
              width: 100mm;
              height: 100mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 1px solid #eee;
              padding: 5mm;
              box-sizing: border-box;
              page-break-after: always;
            }
            .sticker img {
              width: 70mm;
              height: 70mm;
              margin-bottom: 5mm;
            }
            .sticker-info {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              width: 100%;
            }
            .sticker-info p {
              margin: 4px 0;
            }
            @media print {
              .sticker {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            🏷️ QR Code Sticker Printer
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Order Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Order ID</p>
                <p className="font-medium text-slate-800">{order.id.substring(0, 12)}...</p>
              </div>
              <div>
                <p className="text-slate-600">Buyer</p>
                <p className="font-medium text-slate-800">{order.buyerName}</p>
              </div>
              <div>
                <p className="text-slate-600">Amount</p>
                <p className="font-medium text-slate-800">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-slate-600">Items</p>
                <p className="font-medium text-slate-800">{order.items?.length || 0} item(s)</p>
              </div>
            </div>
          </div>

          {/* Sticker Count Input */}
          <div className="space-y-4">
            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">
              Total Units to Track
            </label>
            <div className="flex items-center space-x-6">
              <input
                type="number"
                min="1"
                max="100"
                value={stickerCount}
                onChange={(e) => setStickerCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 px-4 py-3 border-2 border-slate-200 rounded-xl font-black text-xl focus:border-blue-500 outline-none transition-all"
              />
              <div className="text-sm text-slate-500 leading-tight">
                <p className="font-bold text-slate-800">Each unit gets a unique ID</p>
                <p>Order update requires scanning all {stickerCount} stickers.</p>
              </div>
            </div>
          </div>

          {/* QR Code Preview */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : qrCodes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Sample Preview (Unit 1)</h3>
              <div className="bg-slate-50 p-6 rounded-3xl flex justify-center border-2 border-dashed border-slate-200">
                <img src={qrCodes[0]} alt="QR Code Preview" className="w-40 h-40" />
              </div>
            </div>
          ) : null}

          {/* Print Preview (Hidden) */}
          <div ref={printRef} className="hidden">
            {qrCodes.map((qr, index) => (
              <div key={index} className="sticker">
                <img src={qr} alt={`QR Code ${index + 1}`} />
                <div className="sticker-info">
                  <p>Order: {order.id.substring(0, 8)}</p>
                  <p>Unit {index + 1} of {stickerCount}</p>
                  <p>{order.buyerName}</p>
                  <p>TexConnect B2B</p>
                </div>
              </div>
            ))}
          </div>

          {/* Grid Preview Display */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Unit Grid ({stickerCount} Stickers)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-3xl max-h-64 overflow-y-auto border border-slate-100">
              {qrCodes.map((qr, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 p-2 flex flex-col items-center justify-center rounded-2xl shadow-sm"
                >
                  <img src={qr} alt={`Sticker ${index + 1}`} className="w-full aspect-square mb-1" />
                  <p className="text-[8px] font-black text-slate-400">UNIT {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={!qrCodes.length || loading}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 rounded-lg font-medium transition flex items-center space-x-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            <span>Print Stickers</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeStickerPrinter;
