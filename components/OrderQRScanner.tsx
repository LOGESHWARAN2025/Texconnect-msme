import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';
import { Camera, QrCode, ClipboardCheck, Image as ImageIcon, Upload } from 'lucide-react';
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
    const [mode, setMode] = useState<'camera' | 'device' | 'file'>('camera');
    const [manualInput, setManualInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize/Cleanup Scanner
    useEffect(() => {
        if (isOpen && order && mode === 'camera') {
            const startScanner = async () => {
                try {
                    const html5QrCode = new Html5Qrcode("qr-reader");
                    html5QrCodeRef.current = html5QrCode;

                    const config = {
                        fps: 10,
                        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                            const edgeSize = Math.floor(minEdge * 0.7);
                            return { width: edgeSize, height: edgeSize };
                        }
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        onScanSuccess,
                        onScanFailure
                    );
                    setIsScanning(true);
                    setCameraPermission('granted');
                } catch (err: any) {
                    console.error("Failed to start scanner", err);
                    if (err.toString().includes("NotAllowedError") || err.toString().includes("Permission denied")) {
                        setCameraPermission('denied');
                    }
                    setError("Camera access denied or not available");
                }
            };

            startScanner();

            return () => {
                const stopScanner = async () => {
                    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                        try {
                            await html5QrCodeRef.current.stop();
                        } catch (e) {
                            console.error("Failed to stop scanner", e);
                        }
                    }
                };
                stopScanner();
            };
        } else if (mode === 'device') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, order, mode]);

    // Sync scanned IDs when opened
    useEffect(() => {
        if (isOpen && order) {
            setScannedIds(order.scannedUnits || []);
            setLastScanned(null);
            setError(null);
        }
    }, [isOpen, order]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !order) return;

        try {
            setError(null);
            setLastScanned("Processing image...");

            // We use a temporary Html5Qrcode instance for file scanning if the main one isn't ready
            const html5QrCode = html5QrCodeRef.current || new Html5Qrcode("qr-reader", false);
            const decodedText = await html5QrCode.scanFile(file, true);
            handleProcessCode(decodedText);
        } catch (err: any) {
            console.error("File scan error:", err);
            setError("Could not find a valid QR code in this image");
            setLastScanned(null);
        } finally {
            if (event.target) event.target.value = ''; // Reset input
        }
    };

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
                    <div className="flex p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setMode('camera')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mode === 'camera' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Camera className="w-3.5 h-3.5" /> Camera
                        </button>
                        <button
                            onClick={() => setMode('file')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mode === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ImageIcon className="w-3.5 h-3.5" /> File
                        </button>
                        <button
                            onClick={() => setMode('device')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mode === 'device' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <QrCode className="w-3.5 h-3.5" /> Device
                        </button>
                    </div>

                    {/* Scanner Area */}
                    <div className="relative aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-inner flex items-center justify-center">
                        {/* Always keep qr-reader in DOM but hide it when not in camera mode */}
                        <div id="qr-reader" className={`w-full h-full ${mode === 'camera' ? 'block' : 'hidden'}`}></div>

                        {mode === 'camera' && cameraPermission === 'denied' && (
                            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-rose-500" />
                                </div>
                                <h3 className="text-white font-black">Camera Blocked</h3>
                                <p className="text-slate-400 text-xs font-bold leading-relaxed">Please enable camera permissions in your browser settings to continue scanning.</p>
                                <button
                                    onClick={() => { setMode('device'); setTimeout(() => setMode('camera'), 50); }}
                                    className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {mode === 'file' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-8 text-center space-y-6 flex-col">
                                <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center border-2 border-white/20">
                                    <Upload className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-white font-black text-xl">Upload Image</h3>
                                    <p className="text-slate-400 text-sm font-bold">Select a photo of the QR code from your gallery.</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all active:scale-95"
                                >
                                    Select Image
                                </button>
                            </div>
                        )}

                        {mode === 'device' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-8 text-center space-y-6 flex-col">
                                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                                    <QrCode className="w-12 h-12 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl mb-2">Ready to Scan</h3>
                                    <p className="text-slate-400 text-sm font-bold">Please scan the sticker using your connected QR scanner.</p>
                                </div>
                                <form onSubmit={handleManualSubmit} className="w-full">
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

                    {/* Scanned History */}
                    {scannedIds.length > 0 && (
                        <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Scanned Units</h5>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                                {scannedIds.map((id, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-100 flex items-center gap-2">
                                        <div className="w-1 h-1 bg-indigo-600 rounded-full animate-pulse"></div>
                                        {id.split('_').pop()}
                                    </span>
                                ))}
                            </div>
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
