import React, { useState, useEffect } from 'react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { IoCameraOutline, IoCloseOutline } from 'react-icons/io5';

const MobileScanner: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startScan = async () => {
        try {
            // Check permission
            const status = await BarcodeScanner.checkPermission({ force: true });

            if (status.granted) {
                // Hide webview for scanning
                document.querySelector('body')?.classList.add('scanner-active');
                await BarcodeScanner.hideBackground();
                setIsScanning(true);

                const result = await BarcodeScanner.startScan();

                if (result.hasContent) {
                    setScanResult(result.content);
                    stopScan();
                }
            } else {
                setError('Camera permission denied');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to start scanner');
            stopScan();
        }
    };

    const stopScan = async () => {
        setIsScanning(false);
        document.querySelector('body')?.classList.remove('scanner-active');
        await BarcodeScanner.showBackground();
        await BarcodeScanner.stopScan();
    };

    useEffect(() => {
        return () => {
            stopScan();
        };
    }, []);

    if (isScanning) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-8 bg-transparent">
                <div className="w-full flex justify-end">
                    <button
                        onClick={stopScan}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white"
                    >
                        <IoCloseOutline size={32} />
                    </button>
                </div>

                <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
                    <div className="absolute inset-0 bg-white/10 animate-pulse rounded-2xl"></div>
                </div>

                <div className="text-white text-lg font-medium bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">
                    Scanning Table QR Code...
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto mt-10">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IoCameraOutline size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Mobile Scanner</h2>
                <p className="text-gray-500 mt-2">Scan a table QR code to start an order or view details.</p>
            </div>

            {scanResult && (
                <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-sm text-green-700 font-medium">Last Scan Result:</p>
                    <p className="text-lg font-bold text-green-900 break-all">{scanResult}</p>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <button
                onClick={startScan}
                className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-200 flex items-center justify-center gap-2"
            >
                <IoCameraOutline size={24} />
                Start Scanning
            </button>
        </div>
    );
};

export default MobileScanner;
