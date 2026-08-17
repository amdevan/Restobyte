
import React, { useState, useMemo, useEffect } from 'react';
import { PartialPayment, SaleItem } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { FiDollarSign, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { useRestaurantDataFields } from '@/hooks/useRestaurantData';
import { formatMoney, fromBase, toBase } from '@/utils/currency';
import FonepayQRModal from '@/components/payments/FonepayQRModal';
import { isNative } from '@/utils/capacitorService';

interface PaymentSectionProps {
  orderItems: SaleItem[];
  grandTotal: number;
  onFinalize: (payments: PartialPayment[], isSettled: boolean, receivedAmount: number, returnAmount: number) => void;
  onAddTip: () => void;
  isAlreadyDue?: boolean;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({ orderItems, grandTotal, onFinalize, onAddTip, isAlreadyDue }) => {
  const { getSingleActiveOutlet, currencies, applicationSettings, paymentMethods } = useRestaurantDataFields(['getSingleActiveOutlet','currencies','applicationSettings','paymentMethods'] as const);
  const outlet = getSingleActiveOutlet();

  const PAYMENT_METHODS = useMemo(() => {
    const enabled = (paymentMethods || []).filter(pm => pm.isEnabled).map(pm => pm.name);
    if (!enabled.includes('Due')) enabled.push('Due');
    return enabled;
  }, [paymentMethods]);

  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [amount, setAmount] = useState('');
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>([]);
  const [isFonepayQROpen, setIsFonepayQROpen] = useState(false);

  const defaultCurrency = useMemo(() => currencies.find(c => c.isDefault), [currencies]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string | undefined>(defaultCurrency?.id);
  const selectedCurrency = useMemo(() => currencies.find(c => c.id === selectedCurrencyId) || defaultCurrency, [currencies, selectedCurrencyId, defaultCurrency]);

  useEffect(() => {
    setSelectedCurrencyId(defaultCurrency?.id);
  }, [defaultCurrency?.id]);

  useEffect(() => {
    if (PAYMENT_METHODS.length > 0 && !PAYMENT_METHODS.includes(paymentMethod)) {
      setPaymentMethod(PAYMENT_METHODS[0]);
    }
  }, [PAYMENT_METHODS, paymentMethod]);

  const totalPaidFromPartials = useMemo(() => partialPayments.reduce((sum, p) => sum + p.amount, 0), [partialPayments]);
  const remainingDueBase = useMemo(() => grandTotal - totalPaidFromPartials, [grandTotal, totalPaidFromPartials]);
  const currentTenderedValueSelected = parseFloat(amount) || 0;
  const currentTenderedValueBase = useMemo(() => toBase(currentTenderedValueSelected, selectedCurrency), [currentTenderedValueSelected, selectedCurrency]);
  
  const displayTotalPaidBase = totalPaidFromPartials + currentTenderedValueBase;
  const displayBalanceBase = grandTotal - displayTotalPaidBase;
  
  useEffect(() => {
      const remainingInSelected = fromBase(remainingDueBase, selectedCurrency);
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
    const amountBase = toBase(numericAmountSelected, selectedCurrency);
    setPartialPayments(prev => [...prev, { method: paymentMethod, amount: amountBase }]);
  };

  const handleFinalizeSale = () => {
    let finalPayments = [...partialPayments];
    const numericAmountSelected = parseFloat(amount);
    
    if (paymentMethod !== 'Due' && !isNaN(numericAmountSelected) && numericAmountSelected > 0) {
        finalPayments.push({ method: paymentMethod, amount: toBase(numericAmountSelected, selectedCurrency) });
    }

    // For "Due" payment method, record the due amount as a payment so split aggregation tracks it
    if (paymentMethod === 'Due') {
      finalPayments.push({ method: 'Due', amount: grandTotal - finalPayments.reduce((sum, p) => sum + p.amount, 0) });
    }

    const finalTotalPaidBase = finalPayments.reduce((sum, p) => sum + p.amount, 0);
    const epsilon = 0.001;
    const calculatedReturnAmount = Math.max(0, finalTotalPaidBase - grandTotal);

    if (paymentMethod === 'Due' || finalTotalPaidBase < grandTotal - epsilon) {
       const paidFormatted = formatMoney(finalTotalPaidBase, selectedCurrency, applicationSettings);
       const totalFormatted = formatMoney(grandTotal, selectedCurrency, applicationSettings);
       if(paymentMethod !== 'Due' && !window.confirm(`Amount paid (${paidFormatted}) is less than total (${totalFormatted}). Mark remaining as due?`)) {
          return;
      }
      onFinalize(finalPayments, paymentMethod === 'Due' ? false : false, finalTotalPaidBase, 0);
    } else {
      onFinalize(finalPayments, true, finalTotalPaidBase, calculatedReturnAmount);
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
    const epsilon = 0.001;
    const isSettled = totalPaid >= grandTotal - epsilon;
    const calculatedReturnAmount = Math.max(0, totalPaid - grandTotal);
    setIsFonepayQROpen(false);
    onFinalize(payments, isSettled, totalPaid, calculatedReturnAmount);
  };

  return (
    <div className="h-full flex flex-col">
      <div className={`flex flex-grow ${isNative ? 'flex-col gap-4' : 'space-x-6'}`}>
        {/* Left Side: Bill Items */}
        <div className={`${isNative ? 'w-full' : 'w-1/2'}`}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Bill Items</h3>
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Item</th>
                    <th className="text-center px-2 py-2 font-medium text-gray-600">Qty</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Price</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-800">{item.name}</td>
                      <td className="px-2 py-2 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{formatMoney(item.price, selectedCurrency, applicationSettings)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{formatMoney(item.price * item.quantity, selectedCurrency, applicationSettings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 pt-3 border-t space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Items ({orderItems.reduce((s, i) => s + i.quantity, 0)})</span>
              <span className="text-gray-800">{formatMoney(grandTotal, selectedCurrency, applicationSettings)}</span>
            </div>
            {partialPayments.length > 0 && (
              <div className="space-y-1">
                {partialPayments.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-amber-50 px-2 py-1 rounded">
                    <span className="text-amber-700">{p.method}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-amber-700">{formatMoney(p.amount, selectedCurrency, applicationSettings)}</span>
                      <button onClick={() => setPartialPayments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><FiTrash2 size={11}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1 border-t">
              <span className="text-gray-700">Total Bill</span>
              <span className="text-gray-900">{formatMoney(grandTotal, selectedCurrency, applicationSettings)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount Paid</span>
              <span className="text-green-600">{formatMoney(displayTotalPaidBase, selectedCurrency, applicationSettings)}</span>
            </div>
            {displayBalanceBase >= 0 ? (
              <div className="flex justify-between font-bold text-base">
                <span className="text-red-500">Due Amount</span>
                <span className="text-red-500">{formatMoney(displayBalanceBase, selectedCurrency, applicationSettings)}</span>
              </div>
            ) : (
              <div className="flex justify-between font-bold text-base">
                <span className="text-green-600">Return Amount</span>
                <span className="text-green-600">{formatMoney(Math.abs(displayBalanceBase), selectedCurrency, applicationSettings)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Payment Methods & Input */}
        <div className={`${isNative ? 'w-full' : 'w-1/2'} flex flex-col`}>
          {/* Payment Methods */}
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Method</h3>
          <div className={`grid gap-2 mb-4 ${PAYMENT_METHODS.length <= 2 ? 'grid-cols-2' : PAYMENT_METHODS.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {PAYMENT_METHODS.map(method => (
                <Button key={method} size="lg" variant={paymentMethod === method ? 'primary' : 'outline'} onClick={() => setPaymentMethod(method)} className={isNative ? '!py-3 !text-base' : ''}>{method}</Button>
            ))}
          </div>

          {/* Quick Amount Buttons */}
          {paymentMethod !== 'Due' && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[50, 100, 500, 1000].map(val => {
                const label = applicationSettings.currencySymbolPosition === 'after'
                  ? `${val.toFixed(2)}${selectedCurrency?.symbol || '$'}`
                  : `${selectedCurrency?.symbol || '$'}${val.toFixed(2)}`;
                return (
                  <Button key={val} size="sm" variant="outline" onClick={() => setAmount(val.toFixed(2))} className="text-xs">{label}</Button>
                );
              })}
            </div>
          )}

          {/* Currency & Amount */}
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-600">Currency</label>
            <select className="border rounded px-2 py-1 text-sm" value={selectedCurrency?.id} onChange={(e) => setSelectedCurrencyId(e.target.value)}>
              {currencies.map(c => (
                <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>
          <Input label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={`text-2xl font-mono text-right py-2 ${isNative ? 'rb-pay-amount' : ''}`} leftIcon={<span className="font-bold">{selectedCurrency?.symbol || '$'}</span>} disabled={paymentMethod === 'Due'} />

          {paymentMethod === 'Fonepay' && (
            <Button className="mt-2" size="lg" variant="secondary" onClick={openFonepayQR} disabled={!amount || parseFloat(amount) <= 0}>
              Scan Fonepay QR
            </Button>
          )}

          {paymentMethod !== 'Due' && (
            <Button size="lg" className="mt-2" onClick={handleAddPartialPayment} disabled={!amount || parseFloat(amount) <= 0}>Add Partial Payment</Button>
          )}

          <Button size="lg" variant="outline" className="mt-2 border-dashed" onClick={onAddTip}>Add Tip</Button>
        </div>
      </div>

      {/* Finalize Button */}
      <div className={`${isNative ? 'rb-pay-foot' : 'mt-6 pt-4 border-t flex justify-end'}`}>
        <Button
          className={`${isNative ? 'rb-pay-confirm' : 'w-full !text-lg !py-3 bg-violet-600 hover:bg-violet-700 focus:ring-violet-500'}`}
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
            const gatewayCurrency = currencies.find(c => c.code === gatewayCode) || selectedCurrency;
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
