import { Currency } from '@/types';

export interface MoneyFormatSettings {
  currencySymbolPosition: 'before' | 'after';
  decimalPlaces: number;
}

export const getDefaultCurrency = (currencies: Currency[]): Currency | undefined => {
  return currencies.find(c => c.isDefault);
};

// Assumption: exchangeRate expresses how much of the default currency equals 1 unit of this currency.
// base (default) -> selected: selectedAmount = baseAmount / exchangeRate
// selected -> base (default): baseAmount = selectedAmount * exchangeRate
export const fromBase = (baseAmount: number, currency: Currency): number => {
  return baseAmount / (currency.exchangeRate || 1);
};

export const toBase = (amountInCurrency: number, currency: Currency): number => {
  return amountInCurrency * (currency.exchangeRate || 1);
};

export const formatMoney = (
  baseAmount: number,
  currency: Currency,
  settings: MoneyFormatSettings
): string => {
  const decimals = typeof settings.decimalPlaces === 'number' ? settings.decimalPlaces : 2;
  const amountInCurrency = fromBase(baseAmount, currency);
  const value = amountInCurrency.toFixed(decimals);
  return settings.currencySymbolPosition === 'after'
    ? `${value}${currency.symbol}`
    : `${currency.symbol}${value}`;
};

