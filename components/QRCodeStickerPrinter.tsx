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
  const [qrCode, setQRCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && order) {
      generateQRForOrder();
    }
  }, [isOpen, order]);

  const generateQRForOrder = async () => {
    if (!order) return;
    
    setLoading(true);
    try {
      // Encode a scan URL so scanners open the app and show the scan dialog
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://texconnect-msme.vercel.app';
      const scanUrl = `${base}/?scan=1&orderId=${encodeURIComponent(order.id)}`;

      const qrCodeDataUrl = await generateQRCode(scanUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQRCode(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;

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
              padding: 5mm;
              font-family: Arial, sans-serif;
            }
            .sticker-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 5mm;
              page-break-after: always;
            }
            .sticker {
              width: 127mm;
              height: 127mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 1px solid #ccc;
              padding: 5mm;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            .sticker img {
              width: 100mm;
              height: 100mm;
              margin-bottom: 5mm;
            }
            .sticker-info {
              text-align: center;
              font-size: 10px;
              width: 100%;
            }
            .sticker-info p {
              margin: 2px 0;
              word-break: break-all;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .sticker {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="sticker-container">
            ${printContent}
          </div>
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Number of Stickers to Print
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="1"
                max="100"
                value={stickerCount}
                onChange={(e) => setStickerCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                (5×5 cm sticker format - {Math.ceil(stickerCount / 2)} page(s))
              </span>
            </div>
          </div>

          {/* QR Code Preview */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Preview</h3>
              <div className="bg-slate-50 p-4 rounded-lg flex justify-center">
                <img src={qrCode} alt="QR Code Preview" className="w-40 h-40" />
              </div>
            </div>
          ) : null}

          {/* Print Preview (Hidden) */}
          <div ref={printRef} className="hidden">
            {Array.from({ length: stickerCount }).map((_, index) => (
              <div key={index} className="sticker">
                <img src={qrCode} alt={`QR Code ${index + 1}`} />
                <div className="sticker-info">
                  <p><strong>Order: {order.id.substring(0, 8)}</strong></p>
                  <p>{order.buyerName}</p>
                  <p>₹{order.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Print Preview Display */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Print Preview (2 stickers per page)</h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {Array.from({ length: Math.min(stickerCount, 4) }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-dashed border-slate-300 p-4 flex flex-col items-center justify-center rounded"
                  style={{ aspectRatio: '1/1' }}
                >
                  {qrCode && (
                    <>
                      <img src={qrCode} alt={`Sticker ${index + 1}`} className="w-20 h-20 mb-2" />
                      <p className="text-xs text-center text-slate-600">
                        <strong>{order.id.substring(0, 8)}</strong>
                      </p>
                    </>
                  )}
                </div>
              ))}
              {stickerCount > 4 && (
                <div className="col-span-2 text-center text-slate-600 text-sm py-4">
                  ... and {stickerCount - 4} more sticker(s)
                </div>
              )}
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
            disabled={!qrCode || loading}
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
