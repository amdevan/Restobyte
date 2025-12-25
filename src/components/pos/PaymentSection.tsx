
import React, { useState, useMemo, useEffect } from 'react';
import { PartialPayment } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { FiDollarSign, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { formatMoney, fromBase, toBase } from '@/utils/currency';
import FonepayQRModal from '@/components/payments/FonepayQRModal';

interface PaymentSectionProps {
  grandTotal: number;
  onFinalize: (payments: PartialPayment[], isSettled: boolean) => void;
  onAddTip: () => void;
}

const PAYMENT_METHODS = ["Cash", "Card", "Fonepay", "Due"]; 

export const PaymentSection: React.FC<PaymentSectionProps> = ({ grandTotal, onFinalize, onAddTip }) => {
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [amount, setAmount] = useState('');
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>([]);
  const [isFonepayQROpen, setIsFonepayQROpen] = useState(false);
  const { getSingleActiveOutlet, currencies, applicationSettings } = useRestaurantData();
  const outlet = getSingleActiveOutlet();

  const defaultCurrency = useMemo(() => currencies.find(c => c.isDefault), [currencies]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string | undefined>(defaultCurrency?.id);
  const selectedCurrency = useMemo(() => currencies.find(c => c.id === selectedCurrencyId) || defaultCurrency, [currencies, selectedCurrencyId, defaultCurrency]);

  // Calculations for display
  const totalPaidFromPartials = useMemo(() => partialPayments.reduce((sum, p) => sum + p.amount, 0), [partialPayments]);
  const remainingDueBase = useMemo(() => grandTotal - totalPaidFromPartials, [grandTotal, totalPaidFromPartials]);
  const currentTenderedValueSelected = parseFloat(amount) || 0;
  const currentTenderedValueBase = useMemo(() => toBase(currentTenderedValueSelected, selectedCurrency!), [currentTenderedValueSelected, selectedCurrency]);
  
  const displayTotalPaidBase = totalPaidFromPartials + currentTenderedValueBase;
  const displayBalanceBase = grandTotal - displayTotalPaidBase;
  
  useEffect(() => {
      // Set the initial amount to the remaining due amount.
      const remainingInSelected = fromBase(remainingDueBase, selectedCurrency!);
      setAmount(remainingInSelected > 0 ? remainingInSelected.toFixed(applicationSettings.decimalPlaces || 2) : '');
      if (paymentMethod === 'Due') {
          setAmount('0.00');
      }
  }, [remainingDueBase, paymentMethod, selectedCurrency, applicationSettings.decimalPlaces]);
  
  const handleAddPartialPayment = () => {
    const numericAmountSelected = parseFloat(amount);
    if (isNaN(numericAmountSelected) || numericAmountSelected <= 0) {
      alert("Please enter a valid amount to pay.");
      return;
    }
    const amountBase = toBase(numericAmountSelected, selectedCurrency!);
    setPartialPayments(prev => [...prev, { method: paymentMethod, amount: amountBase }]);
    // Amount will be reset by the useEffect hook when remainingDue changes
  };

  const handleFinalizeSale = () => {
    let finalPayments = [...partialPayments];
    const numericAmountSelected = parseFloat(amount);
    
    if (paymentMethod !== 'Due' && !isNaN(numericAmountSelected) && numericAmountSelected > 0) {
        finalPayments.push({ method: paymentMethod, amount: toBase(numericAmountSelected, selectedCurrency!) });
    }

    const finalTotalPaidBase = finalPayments.reduce((sum, p) => sum + p.amount, 0);

    if (paymentMethod === 'Due' || finalTotalPaidBase < grandTotal) {
       const paidFormatted = formatMoney(finalTotalPaidBase, selectedCurrency!, applicationSettings);
       const totalFormatted = formatMoney(grandTotal, selectedCurrency!, applicationSettings);
       if(paymentMethod !== 'Due' && !window.confirm(`Amount paid (${paidFormatted}) is less than total (${totalFormatted}). Mark remaining as due?`)) {
          return;
      }
      onFinalize(finalPayments, false); // false = not settled
    } else {
      onFinalize(finalPayments, true); // true = settled
    }
  };

  const openFonepayQR = () => {
    if (!outlet) {
      alert('No active outlet selected.');
      return;
    }
    if (!outlet.fonepayIsEnabled || !outlet.fonepayMerchantCode || !outlet.fonepayTerminalId) {
      alert('Fonepay is not configured for this outlet. Please set Merchant Code and Terminal ID in Outlet settings.');
      return;
    }
    setIsFonepayQROpen(true);
  };

  const handleFonepayPaidConfirmed = (paidAmount: number) => {
    const payments = [...partialPayments, { method: 'Fonepay', amount: paidAmount }];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const isSettled = totalPaid >= grandTotal;
    setIsFonepayQROpen(false);
    onFinalize(payments, isSettled);
  };


  const handleNumpadClick = (key: string | number) => {
    if (paymentMethod === 'Due') return; // Numpad disabled for 'Due'
    if (key === 'del') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === '.' && amount.includes('.')) {
      return;
    } else {
        const currentVal = amount || '0';
        if (currentVal === '0' && key !== '.') {
            setAmount(String(key));
        } else {
            setAmount(prev => `${prev}${key}`);
        }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex space-x-6 flex-grow">
        {/* Left Side: Methods and Summary */}
        <div className="w-1/2 flex flex-col">
          <div className="grid grid-cols-4 gap-3 mb-4">
            {PAYMENT_METHODS.map(method => (
                <Button key={method} size="lg" variant={paymentMethod === method ? 'primary' : 'outline'} onClick={() => setPaymentMethod(method)}>{method}</Button>
            ))}
            <Button size="lg" variant="outline" className="border-dashed" onClick={onAddTip}>Add Tip</Button>
          </div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-600">Currency</label>
            <select className="border rounded px-2 py-1 text-sm" value={selectedCurrency?.id} onChange={(e) => setSelectedCurrencyId(e.target.value)}>
              {currencies.map(c => (
                <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>
          <Input label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-3xl font-mono text-right py-3" leftIcon={<span className="font-bold">{selectedCurrency?.symbol || '$'}</span>} disabled={paymentMethod === 'Due'} />
          {paymentMethod === 'Fonepay' && (
            <Button className="mt-2" size="lg" variant="secondary" onClick={openFonepayQR} disabled={!amount || parseFloat(amount) <= 0}>
              Scan Fonepay QR
            </Button>
          )}
          
           {partialPayments.length > 0 && (
                <div className="mt-2 text-xs space-y-1">
                    {partialPayments.map((p, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-100 p-1 rounded">
                            <span>Paid {p.amount.toFixed(2)} via {p.method}</span>
                            <button onClick={() => setPartialPayments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500"><FiTrash2 size={12}/></button>
                        </div>
                    ))}
                </div>
            )}

            {paymentMethod !== 'Due' && <Button size="lg" className="mt-2" onClick={handleAddPartialPayment} disabled={!amount || parseFloat(amount) <= 0}>Add Partial Payment</Button>}

          <div className="mt-auto pt-4 border-t text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">Total Bill</span><span>{formatMoney(grandTotal, selectedCurrency!, applicationSettings)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Amount Paid</span><span>{formatMoney(displayTotalPaidBase, selectedCurrency!, applicationSettings)}</span></div>
            {displayBalanceBase >= 0 ? (
                <div className={`flex justify-between font-bold text-red-500`}>
                    <span>Due Amount</span>
                    <span>{formatMoney(displayBalanceBase, selectedCurrency!, applicationSettings)}</span>
                </div>
            ) : (
                <div className={`flex justify-between font-bold text-green-600`}>
                    <span>Return Amount</span>
                    <span>{formatMoney(Math.abs(displayBalanceBase), selectedCurrency!, applicationSettings)}</span>
                </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Cash and Numpad */}
        <div className="w-1/2">
            <div className="grid grid-cols-2 gap-3 mb-3">
                {[50, 100, 500, 1000].map(val => {
                  const label = applicationSettings.currencySymbolPosition === 'after'
                    ? `${val.toFixed(2)}${selectedCurrency?.symbol || '$'}`
                    : `${selectedCurrency?.symbol || '$'}${val.toFixed(2)}`;
                  return (
                    <Button key={val} size="lg" variant="outline" onClick={() => setAmount(val.toFixed(2))} disabled={paymentMethod === 'Due'}>{label}</Button>
                  );
                })}
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(key => (
                    <Button key={key} size="lg" variant="outline" className="py-5 text-2xl" onClick={() => handleNumpadClick(key)} disabled={paymentMethod === 'Due'}>{key}</Button>
                ))}
                <Button size="lg" variant="outline" className="py-5 text-2xl" onClick={() => handleNumpadClick('del')} disabled={paymentMethod === 'Due'}><FiTrash2 /></Button>
            </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t flex justify-end">
        <Button 
          className="w-full !text-lg !py-3 bg-violet-600 hover:bg-violet-700 focus:ring-violet-500" 
          onClick={handleFinalizeSale}
          leftIcon={<FiCheckCircle />}
        >
          {paymentMethod === 'Due' ? 'Mark as Due' : 'Complete Payment'}
        </Button>
      </div>

      {/* Fonepay QR Modal */}
      {outlet && (
        <FonepayQRModal
          isOpen={isFonepayQROpen}
          onClose={() => setIsFonepayQROpen(false)}
          amount={(function(){
            const baseToPay = currentTenderedValueBase || remainingDueBase;
            const gatewayCode = outlet.fonepayCurrency || 'NPR';
            const gatewayCurrency = currencies.find(c => c.code === gatewayCode) || selectedCurrency!;
            return fromBase(baseToPay, gatewayCurrency);
          })()}
          currency={outlet.fonepayCurrency || 'NPR'}
          merchantCode={outlet.fonepayMerchantCode}
          terminalId={outlet.fonepayTerminalId}
          onPaidConfirmed={handleFonepayPaidConfirmed}
        />
      )}
    </div>
  );
};
