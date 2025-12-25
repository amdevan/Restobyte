
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Currency } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiDollarSign } from 'react-icons/fi';

interface CurrencyFormProps {
  initialData?: Currency | null;
  onSubmit: (data: Omit<Currency, 'id' | 'isDefault'>) => void;
  onUpdate: (data: Currency) => void;
  onClose: () => void;
  isEditingDefault?: boolean; // To disable editing rate of default currency
}

const CurrencyForm: React.FC<CurrencyFormProps> = ({ initialData, onSubmit, onUpdate, onClose, isEditingDefault }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [symbol, setSymbol] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | string>(1);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code);
      setSymbol(initialData.symbol);
      setExchangeRate(initialData.exchangeRate);
    } else {
      setName('');
      setCode('');
      setSymbol('');
      setExchangeRate(1); // Default for new currency, user to adjust
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !symbol.trim()) {
      alert('Currency Name, Code, and Symbol are required.');
      return;
    }
    const numExchangeRate = parseFloat(String(exchangeRate));
    if (isNaN(numExchangeRate) || numExchangeRate <= 0) {
      alert('Exchange Rate must be a positive number.');
      return;
    }

    // isDefault is handled by ManageCurrenciesPage logic (setDefaultCurrency)
    // Here we just submit the core data. If it's the default being edited, its rate is fixed at 1.
    const currencyData: Omit<Currency, 'id' | 'isDefault'> = { 
      name, 
      code: code.toUpperCase(), 
      symbol, 
      exchangeRate: isEditingDefault ? 1 : numExchangeRate 
    };
    
    if (initialData) {
      // For updates, pass the full Currency object including its current isDefault status.
      // The updateCurrency function in the hook will handle logic if isDefault is being changed.
      onUpdate({ ...initialData, ...currencyData });
    } else {
      onSubmit(currencyData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Currency Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., US Dollar, Euro"
        required
        autoFocus
        leftIcon={<FiDollarSign />}
      />
      <Input
        label="Currency Code (3 letters) *"
        value={code}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
        placeholder="e.g., USD, EUR"
        maxLength={3}
        required
        leftIcon={<FiDollarSign />}
      />
      <Input
        label="Symbol *"
        value={symbol}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setSymbol(e.target.value)}
        placeholder="e.g., $, €"
        maxLength={5}
        required
        leftIcon={<FiDollarSign />}
      />
      <Input
        label="Exchange Rate *"
        type="number"
        value={isEditingDefault ? 1 : exchangeRate} // Default currency rate is always 1 and not editable here
        onChange={(e: ChangeEvent<HTMLInputElement>) => setExchangeRate(e.target.value)}
        placeholder="e.g., 1.00, 0.92"
        min="0.000001" // Allow very small rates
        step="any"
        required
        disabled={isEditingDefault} // Disable if editing the default currency
        leftIcon={<FiDollarSign />}
      />
      {isEditingDefault && <p className="text-xs text-gray-500 -mt-2">The default currency's exchange rate is fixed at 1.</p>}
      {!isEditingDefault && <p className="text-xs text-gray-500 -mt-2">Exchange rate relative to your default currency.</p>}
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Currency' : 'Save Currency'}
        </Button>
      </div>
    </form>
  );
};

export default CurrencyForm;
