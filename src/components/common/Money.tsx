import React from 'react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { formatMoney, getDefaultCurrency } from '../../utils/currency';
import type { Currency } from '../../types';

type MoneyProps = {
  amount: number;
  currency?: Currency | null;
  className?: string;
};

// Displays a money value formatted according to the currently selected default currency
// and application settings. If a currency is provided, it will be used; otherwise, the
// current default currency from context is used.
export const Money: React.FC<MoneyProps> = ({ amount, currency, className }) => {
  const { currencies, applicationSettings } = useRestaurantData();
  const cur = currency ?? getDefaultCurrency(currencies);

  let formatted: string;
  if (cur) {
    formatted = formatMoney(amount, cur, applicationSettings);
  } else {
    const decimals = applicationSettings?.decimalPlaces ?? 2;
    const symbol = applicationSettings?.currencySymbol ?? '$';
    const position = applicationSettings?.currencySymbolPosition ?? 'left';
    const fixed = amount.toFixed(decimals);
    formatted = position === 'left' ? `${symbol}${fixed}` : `${fixed}${symbol}`;
  }

  return <span className={className}>{formatted}</span>;
};

export default Money;
