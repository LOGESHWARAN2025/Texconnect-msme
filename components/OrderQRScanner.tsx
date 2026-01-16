import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';
import { Camera, QrCode, ClipboardCheck } from 'lucide-react';
import type { Order } from '../types';

interface OrderQRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onScanComplete: (scannedIds: string[]) => void;
}

const OrderQRScanner: React.FC<OrderQRScannerProps> = ({ isOpen, onClose, order, onScanComplete }) => {
    const { t } = useLocalization();
    const [scannedIds, setScannedIds] = useState<string[]>([]);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'camera' | 'device'>('camera');
    const [manualInput, setManualInput] = useState('');
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && order) {
            setScannedIds(order.scannedUnits || []);
            if (mode === 'camera') {
                const scanner = new Html5QrcodeScanner(
                    "qr-reader",
                    {
                        fps: 10,
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                            const edgeSize = Math.floor(minEdge * 0.7);
                            return { width: edgeSize, height: edgeSize };
                        }
                    },
                    /* verbose= */ false
                );

                scanner.render(onScanSuccess, onScanFailure);
                scannerRef.current = scanner;

                return () => {
                    if (scannerRef.current) {
                        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
                    }
                };
            } else {
                // Device mode - focus input
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }
    }, [isOpen, order, mode]);

    const handleProcessCode = (decodedText: string) => {
        if (!order) return;

        try {
            // Expected format in QR: ...&orderId=xyz&unit=1&uid=xyz_1
            // Handle both full URLs and the UID directly (some hardware scanners might just send the content)
            let uid = '';
            let unitIndex = '';
            let scanOrderId = '';

            if (decodedText.startsWith('http')) {
                const url = new URL(decodedText);
                scanOrderId = url.searchParams.get('orderId') || '';
                uid = url.searchParams.get('uid') || '';
                unitIndex = url.searchParams.get('unit') || '';
            } else {
                // If it's just the UID (e.g. ord_123_1)
                uid = decodedText;
                const parts = uid.split('_');
                scanOrderId = parts.slice(0, -1).join('_');
                unitIndex = parts[parts.length - 1];
            }

            if (scanOrderId !== order.id) {
                setError(`Wrong order! Sticker #${scanOrderId?.substring(0, 8)} doesn't match #${order.id.substring(0, 8)}`);
                return;
            }

            if (uid && !scannedIds.includes(uid)) {
                const newScanned = [...scannedIds, uid];
                setScannedIds(newScanned);
                setLastScanned(`Verified: Box Unit ${unitIndex}`);
                setError(null);
                onScanComplete(newScanned);
            } else if (uid) {
                setLastScanned(`Box ${unitIndex} already scanned`);
            }
        } catch (e) {
            console.error("Invalid code scanned:", decodedText);
            setError("Invalid Sticker Data");
        }
    };

    const onScanSuccess = (decodedText: string) => {
        handleProcessCode(decodedText);
    };

    const onScanFailure = (err: any) => { /* ignore */ };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualInput.trim()) {
            handleProcessCode(manualInput.trim());
            setManualInput('');
        }
    };

    if (!isOpen || !order) return null;

    const totalUnits = order.totalUnits || 1;
    const balance = totalUnits - scannedIds.length;
    const isComplete = scannedIds.length >= totalUnits;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6">
            <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl max-w-lg w-full max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
                <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onClose}
                            className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all group"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-md">Step 2: Verification</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Security Check</h2>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button
                            onClick={() => setMode('camera')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'camera' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Camera className="w-4 h-4" /> Camera
                        </button>
                        <button
                            onClick={() => setMode('device')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'device' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <QrCode className="w-4 h-4" /> Scanner Device
                        </button>
                    </div>

                    {/* Scanner Area */}
                    <div className="relative aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-inner flex items-center justify-center">
                        {mode === 'camera' ? (
                            <div id="qr-reader" className="w-full h-full"></div>
                        ) : (
                            <div className="p-8 text-center space-y-6">
                                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                    <QrCode className="w-12 h-12 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl mb-2">Ready to Scan</h3>
                                    <p className="text-slate-400 text-sm font-bold">Please scan the sticker using your connected QR scanner.</p>
                                </div>
                                <form onSubmit={handleManualSubmit}>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={manualInput}
                                        onChange={(e) => setManualInput(e.target.value)}
                                        placeholder="Waiting for input..."
                                        className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-white text-center font-black outline-none focus:border-indigo-500 transition-all"
                                        autoFocus
                                    />
                                </form>
                            </div>
                        )}

                        {/* Complete Overlay */}
                        {isComplete && (
                            <div className="absolute inset-0 bg-indigo-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
                                <div className="w-24 h-24 bg-white text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-bounce">
                                    <ClipboardCheck className="w-12 h-12" />
                                </div>
                                <h3 className="text-3xl font-black tracking-tight mb-2">All Units Verified</h3>
                                <p className="text-indigo-100 font-bold uppercase tracking-[0.2em] text-xs">Ready for status update</p>
                            </div>
                        )}
                    </div>

                    {/* Progress & Balance */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1 flex-1">
                                <h4 className="text-slate-900 font-black text-2xl leading-none tracking-tighter">{scannedIds.length} Scanned</h4>
                                <p className={`font-black text-[10px] uppercase tracking-widest ${balance > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                                    {balance > 0 ? `${balance} boxes remaining` : 'System Verified'}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-indigo-600 tracking-tighter">{Math.round((scannedIds.length / totalUnits) * 100)}%</span>
                            </div>
                        </div>
                        <div className="h-4 bg-slate-200 rounded-full overflow-hidden p-1 shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${isComplete ? 'bg-green-500' : 'bg-indigo-600'}`}
                                style={{ width: `${(scannedIds.length / totalUnits) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="p-5 bg-red-50 text-red-600 rounded-3xl text-sm font-bold border border-red-100 flex items-center gap-4 animate-in slide-in-from-top-4">
                            <span className="text-2xl">❌</span> {error}
                        </div>
                    )}

                    {lastScanned && !error && (
                        <div className="p-5 bg-green-50 text-green-700 rounded-3xl text-sm font-bold border border-green-100 flex items-center gap-4 animate-in slide-in-from-top-4">
                            <span className="text-2xl">✅</span> {lastScanned}
                        </div>
                    )}

                    {/* Action */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all transform active:scale-95 hover:bg-slate-200"
                        >
                            Back
                        </button>
                        <button
                            onClick={onClose}
                            className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all transform active:scale-95 ${isComplete
                                ? 'bg-slate-900 text-white shadow-2xl hover:-translate-y-1'
                                : 'bg-slate-100 text-slate-400'
                                }`}
                        >
                            {isComplete ? 'Confirm' : 'Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderQRScanner;
