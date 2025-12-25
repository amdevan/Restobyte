import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface FonepayQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string; // e.g., 'NPR'
  merchantCode?: string;
  terminalId?: string;
  onPaidConfirmed: (amount: number) => void;
}

const FonepayQRModal: React.FC<FonepayQRModalProps> = ({ isOpen, onClose, amount, currency = 'NPR', merchantCode = '', terminalId = '', onPaidConfirmed }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [qrSessionId, setQrSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fallbackPayload = useMemo(() => {
    const obj = {
      type: 'FONEPAY_DYNAMIC_QR',
      merchantCode,
      terminalId,
      currency,
      amount: amount.toFixed(2),
      ts: Date.now(),
    };
    return encodeURIComponent(JSON.stringify(obj));
  }, [merchantCode, terminalId, currency, amount]);

  const fallbackQrUrl = useMemo(() => {
    return `https://chart.googleapis.com/chart?cht=qr&chs=320x320&chl=${fallbackPayload}`;
  }, [fallbackPayload]);

  useEffect(() => {
    const createQr = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:3000/api/fonepay/create-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency, merchantCode, terminalId }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to create QR (${res.status})`);
        }
        const data = await res.json();
        setQrUrl(data.qrUrl || '');
        setQrSessionId(data.qrSessionId || '');
      } catch (err: any) {
        console.error('Failed to create Fonepay QR:', err);
        setError('Could not create QR via backend. Using fallback QR.');
        setQrUrl(fallbackQrUrl);
        setQrSessionId('');
      } finally {
        setLoading(false);
      }
    };
    if (isOpen && amount > 0 && merchantCode && terminalId) {
      createQr();
    } else if (!isOpen) {
      setQrUrl('');
      setQrSessionId('');
      setError('');
    }
  }, [isOpen, amount, currency, merchantCode, terminalId, fallbackQrUrl]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Fonepay (QR)`} size="md">
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-600">Ask the customer to scan and pay.</p>
        <div className="flex justify-center min-h-[22rem] items-center">
          {loading ? (
            <div className="text-sm text-gray-600">Generating QR…</div>
          ) : (
            <img src={qrUrl || fallbackQrUrl} alt="Fonepay QR" className="h-80 w-80 border rounded-lg bg-white p-3 shadow" />
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="text-sm text-gray-700">
          <div>Amount: <span className="font-mono">{amount.toFixed(2)} {currency}</span></div>
          {merchantCode && <div className="text-xs text-gray-500">Merchant: {merchantCode}</div>}
          {terminalId && <div className="text-xs text-gray-500">Terminal: {terminalId}</div>}
          {qrSessionId && <div className="text-xs text-gray-400">Session: {qrSessionId.slice(-6)}</div>}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => onPaidConfirmed(amount)}>Payment Received</Button>
        </div>
        <p className="text-xs text-gray-400">Production tip: Move QR generation server-side and auto-confirm via webhook/polling.</p>
      </div>
    </Modal>
  );
};

export default FonepayQRModal;
