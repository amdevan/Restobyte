import React from 'react';
import { Sale, SaleItem } from '../../types';
import Button from '../common/Button';
import { FiPrinter, FiXCircle } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';

interface ReceiptModalProps {
  onClose: () => void;
  sale: Sale | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ onClose, sale }) => {
  const { websiteSettings, getSingleActiveOutlet } = useRestaurantData();
  const currentOutlet = getSingleActiveOutlet();

  if (!sale) return null;

  const handlePrint = () => {
    // A more advanced print could use a dedicated print component and CSS
    const printContent = document.getElementById('receipt-content')?.innerHTML;
    const printWindow = window.open('', '_blank');
    if(printWindow && printContent) {
        printWindow.document.write(`<html><head><title>Receipt #${sale.id.slice(-6)}</title>
        <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; color: #000; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 0; }
            .header { text-align: center; margin-bottom: 10px; }
            .header h4 { font-size: 16px; margin: 0; }
            .header p { margin: 2px 0; font-size: 10px; }
            .details { border-bottom: 1px dashed black; padding-bottom: 5px; margin-bottom: 5px; }
            .details > div { display: flex; justify-content: space-between; }
            .items-table th { border-bottom: 1px dashed black; text-align: left; }
            .items-table .qty { text-align: center; }
            .items-table .price, .items-table .total { text-align: right; }
            .summary { border-top: 1px dashed black; padding-top: 5px; }
            .summary > div, .payment-details > div { display: flex; justify-content: space-between; }
            .grand-total { border-top: 2px solid black; font-weight: bold; }
            .footer { text-align: center; margin-top: 10px; font-size: 10px; }
        </style>
        </head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
  };

  const outletName = currentOutlet?.restaurantName || websiteSettings.whiteLabel.appName || 'RestoByte POS';
  const outletAddress = currentOutlet?.address || websiteSettings.contactUsContent.address;
  const outletPhone = currentOutlet?.phone || websiteSettings.contactUsContent.phone;

  const totalPaid = sale.partialPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balance = totalPaid - sale.totalAmount;

  return (
    <div className="text-gray-700">
      <div id="receipt-content" className="font-mono bg-white p-4 rounded-lg border-2 border-dashed">
        <div className="header text-center mb-4">
            <h4 className="text-lg font-bold">{outletName}</h4>
            <p className="text-xs">{outletAddress}</p>
            <p className="text-xs">Phone: {outletPhone}</p>
        </div>

        <div className="details border-b border-dashed pb-2 mb-2 text-xs">
            <div className="flex justify-between"><span>Order #:</span><span>{sale.id.slice(-6).toUpperCase()}</span></div>
            <div className="flex justify-between"><span>Date:</span><span>{new Date(sale.saleDate).toLocaleString()}</span></div>
            {sale.customerName && <div className="flex justify-between"><span>Customer:</span><span>{sale.customerName}</span></div>}
            {sale.assignedTableName && <div className="flex justify-between"><span>Table:</span><span>{sale.assignedTableName}</span></div>}
            <div className="flex justify-between"><span>Type:</span><span>{sale.orderType}</span></div>
            {sale.waiterName && <div className="flex justify-between"><span>Waiter:</span><span>{sale.waiterName}</span></div>}
        </div>

        <table className="w-full mb-2 text-xs items-table">
            <thead>
            <tr className="border-b border-dashed">
                <th className="text-left py-1">Item</th>
                <th className="qty text-center py-1">Qty</th>
                <th className="price text-right py-1">Price</th>
                <th className="total text-right py-1">Total</th>
            </tr>
            </thead>
            <tbody>
            {sale.items.map((item: SaleItem, index: number) => (
                <tr key={`${item.id}-${index}`}>
                <td className="py-0.5">{item.name}</td>
                <td className="qty py-0.5">{item.quantity}</td>
                <td className="price py-0.5">${item.price.toFixed(2)}</td>
                <td className="total py-0.5">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            ))}
            </tbody>
        </table>

        <div className="summary border-t border-dashed pt-2 space-y-0.5 text-xs">
            <div className="flex justify-between"><span>Subtotal:</span><span>${sale.subTotal.toFixed(2)}</span></div>
            {sale.discountAmount && sale.discountAmount > 0 && (
            <div className="flex justify-between"><span>Discount:</span><span>-${(sale.discountType === 'percentage' ? (sale.subTotal * sale.discountAmount / 100) : sale.discountAmount).toFixed(2)}</span></div>
            )}
            {sale.taxDetails.map(tax => (
            <div className="flex justify-between" key={tax.id}><span>{tax.name} ({tax.rate}%):</span><span>${tax.amount.toFixed(2)}</span></div>
            ))}
             {sale.tipAmount && sale.tipAmount > 0 && (
                <div className="flex justify-between"><span>Tip:</span><span>${sale.tipAmount.toFixed(2)}</span></div>
            )}
            <div className="grand-total flex justify-between font-bold text-sm pt-1 mt-1"><span>GRAND TOTAL:</span><span>${sale.totalAmount.toFixed(2)}</span></div>
        </div>
        
        <div className="payment-details border-t border-dashed pt-2 mt-2 text-xs space-y-0.5">
            {sale.partialPayments?.map((payment, index) => (
                <div className="flex justify-between" key={index}>
                    <span>Paid ({payment.method}):</span>
                    <span>${payment.amount.toFixed(2)}</span>
                </div>
            ))}
             <div className="flex justify-between font-semibold mt-1 pt-1 border-t border-dotted">
                <span>Total Paid:</span>
                <span>${totalPaid.toFixed(2)}</span>
            </div>
            {balance > 0 && (
                <div className="flex justify-between font-bold">
                    <span>Return Amount:</span>
                    <span>${balance.toFixed(2)}</span>
                </div>
            )}
            {!sale.isSettled && balance < 0 && (
                <div className="flex justify-between font-bold">
                    <span>Amount Due:</span>
                    <span>${Math.abs(balance).toFixed(2)}</span>
                </div>
            )}
        </div>


         <div className="footer text-center mt-4 text-xs">
            <p>Thank you for your visit!</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <Button onClick={handlePrint} variant="secondary" leftIcon={<FiPrinter />}>Print</Button>
        <Button onClick={onClose} variant="primary" leftIcon={<FiXCircle />}>Close & New Order</Button>
      </div>
    </div>
  );
};

export default ReceiptModal;