import React, { memo, useContext } from 'react';
import { AppDataContext } from '../../hooks/useAppData';
import { formatMoney, getDefaultCurrency } from '../../utils/currency';
import type { Currency } from '../../types';

type MoneyProps = {
  amount: number;
  currency?: Currency | null;
  className?: string;
};

// Internal component that does NOT consume context directly.
// It receives all needed values as props, so React.memo can effectively
// prevent re-renders when the context value changes due to unrelated
// state updates (e.g., polling of sales/tables).
const MoneyInner: React.FC<MoneyProps & {
  currencies: Currency[];
  applicationSettings: any;
}> = ({ amount, currency, className, currencies, applicationSettings }) => {
  const cur = currency ?? getDefaultCurrency(currencies);

  let formatted: string;
  if (cur) {
    formatted = formatMoney(amount, cur, applicationSettings);
  } else {
    const decimals = applicationSettings?.decimalPlaces ?? 2;
    const symbol = 'Rs';
    const position = applicationSettings?.currencySymbolPosition ?? 'before';
    const fixed = amount.toFixed(decimals);
    formatted = position === 'before' ? `${symbol} ${fixed}` : `${fixed} ${symbol}`;
  }

  return <span className={className}>{formatted}</span>;
};

const MoneyInnerMemo = memo(MoneyInner, (prev, next) => {
  return prev.amount === next.amount &&
    prev.currency === next.currency &&
    prev.className === next.className &&
    prev.currencies === next.currencies &&
    prev.applicationSettings === next.applicationSettings;
});

// Displays a money value formatted according to the currently selected default currency
// and application settings. If a currency is provided, it will be used; otherwise, the
// current default currency from context is used.
//
// Uses AppDataContext (separate from RestaurantDataContext) so that polling updates
// to sales/tables do NOT cause Money components to re-render.
export const Money: React.FC<MoneyProps> = ({ amount, currency, className }) => {
  const appData = useContext(AppDataContext);
  const currencies = appData?.currencies || [];
  const applicationSettings = appData?.applicationSettings;
  return <MoneyInnerMemo amount={amount} currency={currency} className={className} currencies={currencies} applicationSettings={applicationSettings} />;
};

export default Money;
