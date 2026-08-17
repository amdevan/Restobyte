/**
 * Centralized order calculation utilities.
 *
 * IMPORTANT: Every place that computes subtotals, tax, discounts, or totals
 * must use these functions to ensure consistency across POS, receipts,
 * invoices, splits, and saved records.
 */

import { SaleTaxDetail } from '../types';

/** Item that has per-item discount fields */
interface DiscountableItem {
  price: number;
  quantity: number;
  discountType?: 'fixed' | 'percentage';
  discountValue?: number;
}

/**
 * Calculate the effective line total for a single item AFTER per-item discount.
 * This is the single source of truth for "what does this line cost?".
 *
 * Example: price=100, qty=2, discountType='percentage', discountValue=10
 *   → baseTotal=200, discount=20, result=180
 */
export function calcItemLineTotal(item: DiscountableItem): number {
  const baseTotal = item.price * item.quantity;
  if (!item.discountType || !item.discountValue || item.discountValue <= 0) {
    return baseTotal;
  }
  if (item.discountType === 'fixed') {
    return Math.max(0, baseTotal - item.discountValue * item.quantity);
  }
  // percentage
  return Math.max(0, baseTotal * (1 - item.discountValue / 100));
}

/**
 * Calculate the subtotal for an array of items (with per-item discounts).
 */
export function calcSubTotal(items: DiscountableItem[]): number {
  return items.reduce((sum, item) => sum + calcItemLineTotal(item), 0);
}

/**
 * Calculate per-item discount total (useful for displaying "Item Discounts" on receipts).
 */
export function calcItemDiscountTotal(items: DiscountableItem[]): number {
  const rawTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountedTotal = calcSubTotal(items);
  return rawTotal - discountedTotal;
}

/**
 * Calculate tax details array for a given subtotal.
 *
 * @param subtotal - The base amount to apply taxes to (already discount-adjusted)
 * @param taxRates - Array of { name, rate } (rate is percentage, e.g. 13 for 13%)
 * @returns Array of SaleTaxDetail with computed amounts
 */
export function calcTaxDetails(
  subtotal: number,
  taxRates: { name: string; rate: number }[]
): SaleTaxDetail[] {
  return taxRates.map((tax) => ({
    id: `tax-${tax.name}`,
    name: tax.name,
    rate: tax.rate,
    amount: parseFloat(((subtotal * tax.rate) / 100).toFixed(2)),
  }));
}

/**
 * Sum all tax amounts from a tax details array.
 */
export function calcTotalTax(taxDetails: SaleTaxDetail[]): number {
  return taxDetails.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate the grand total for display (before tip).
 *
 * totalAmount = subtotal - orderDiscount + tax
 *
 * NOTE: tip is added separately in the payment flow, NOT included in totalAmount.
 * This ensures totalAmount is consistent across display and saved records.
 */
export function calcGrandTotal(
  subTotal: number,
  discountType: 'fixed' | 'percentage' | null,
  discountAmount: number,
  totalTax: number
): number {
  const discountValue =
    discountAmount > 0
      ? discountType === 'percentage'
        ? (subTotal * discountAmount) / 100
        : discountAmount
      : 0;
  return Math.max(0, subTotal - discountValue + totalTax);
}
