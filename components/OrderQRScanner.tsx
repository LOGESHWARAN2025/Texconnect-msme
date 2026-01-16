import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';
import type { Order } from '../types';

interface OrderQRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onScanComplete: (scannedIds: string[]) => void;
}

const OrderQRScanner: React.FC<OrderQRScannerProps> = ({ isOpen, onClose, order, onScanComplete }) => {
    const { t } = useLocalization();
    const { updateOrderStatus } = useAppContext();
    const [scannedIds, setScannedIds] = useState<string[]>([]);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isOpen && order) {
            setScannedIds(order.scannedUnits || []);

            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;

            return () => {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
                }
            };
        }
    }, [isOpen, order]);

    const onScanSuccess = (decodedText: string) => {
        if (!order) return;

        try {
            // Expected format in QR: ...&orderId=xyz&unit=1&uid=xyz_1
            const url = new URL(decodedText);
            const scanOrderId = url.searchParams.get('orderId');
            const uid = url.searchParams.get('uid');
            const unitIndex = url.searchParams.get('unit');

            if (scanOrderId !== order.id) {
                setError(`Wrong order! This sticker belongs to order #${scanOrderId?.substring(0, 8)}`);
                return;
            }

            if (uid && !scannedIds.includes(uid)) {
                const newScanned = [...scannedIds, uid];
                setScannedIds(newScanned);
                setLastScanned(`Success! Scanned Unit ${unitIndex}`);
                setError(null);

                // Notify parent
                onScanComplete(newScanned);

                // If all scanned, maybe play a sound?
                if (newScanned.length === (order.totalUnits || 0)) {
                    // Success!
                }
            } else if (uid) {
                setLastScanned(`Unit ${unitIndex} already scanned`);
            }
        } catch (e) {
            console.error("Invalid QR code scanned:", decodedText);
            setError("Invalid TexConnect QR code");
        }
    };

    const onScanFailure = (err: any) => {
        // Too noisy to alert here, just ignore
    };

    if (!isOpen || !order) return null;

    const totalUnits = order.totalUnits || 1;
    const isComplete = scannedIds.length >= totalUnits;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Scan Unit Stickers</h2>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Order #{order.id.substring(0, 8)}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div id="qr-reader" className="overflow-hidden rounded-3xl border-4 border-slate-100 bg-slate-50 aspect-square"></div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress</span>
                            <span className="text-xl font-black text-indigo-600 tracking-tight">{scannedIds.length} / {totalUnits}</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-50">
                            <div
                                className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                                style={{ width: `${(scannedIds.length / totalUnits) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <span className="text-lg">⚠️</span> {error}
                        </div>
                    )}

                    {lastScanned && !error && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-xs font-bold border border-green-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <span className="text-lg">✅</span> {lastScanned}
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            onClick={onClose}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isComplete
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:-translate-y-1'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                        >
                            {isComplete ? 'Scan Complete' : 'Close Scanner'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderQRScanner;
