import React from 'react';
import { Sale, SaleItem } from '../../types';
import Button from '../common/Button';
import { FiPrinter, FiXCircle, FiDownload } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Money from '../common/Money';
import html2pdf from 'html2pdf.js';

interface ReceiptModalProps {
  onClose: () => void;
  sale: Sale | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ onClose, sale }) => {
  const { websiteSettings, getSingleActiveOutlet } = useRestaurantData();
  const currentOutlet = getSingleActiveOutlet();

  if (!sale) return null;

  const handlePrint = () => {
    const receiptElement = document.getElementById('receipt-content');
    if(!receiptElement) return;

    const options = {
      margin: 0.5,
      filename: `invoice-${sale.id.slice(-6).toUpperCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(options).from(receiptElement).print();
  };

  const handleDownload = () => {
    const receiptElement = document.getElementById('receipt-content');
    if(!receiptElement) return;

    const options = {
      margin: 0.5,
      filename: `invoice-${sale.id.slice(-6).toUpperCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(options).from(receiptElement).save();
  };

  const outletName = currentOutlet?.restaurantName || websiteSettings.whiteLabel.appName || 'Demo Restaurant';
  const outletAddress = currentOutlet?.address || 'Address not set';
  const outletPhone = currentOutlet?.phone || 'Phone not set';
  const outletEmail = 'info@restobyte.com';

  // Calculate tax breakdown (we'll assume 2 equal taxes for CGST/SGST if not provided, to match the design)
  const totalTax = sale.taxDetails.reduce((sum, tax) => sum + tax.amount, 0);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const serviceCharge = sale.totalAmount * 0.1; // 10% service charge, matching the design

  return (
    <div className="text-gray-700">
      <div id="receipt-content" className="bg-white p-4 rounded-lg max-w-md mx-auto">
        {/* Header Section */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-extrabold text-red-600 tracking-wider">DPOS</h1>
          <p className="text-xs text-gray-500">Digital Point of Sale</p>
          <h2 className="text-2xl font-bold text-gray-700 mt-2">{outletName}</h2>
          <p className="text-sm text-gray-600 mt-1">{outletAddress}</p>
          <p className="text-sm text-gray-600">Tel No.: {outletPhone}</p>
          <p className="text-sm text-gray-600">Email: {outletEmail}</p>
        </div>

        {/* Order Type */}
        <div className="text-center my-2">
          <h3 className="text-2xl font-bold text-gray-800 border-y-2 border-black py-2">{sale.orderType || 'Dine In'}</h3>
        </div>

        {/* Invoice Details */}
        <div className="text-left mb-4 space-y-1">
          <div className="flex justify-between">
            <span className="text-lg font-medium text-gray-800">Bill No</span>
            <span className="text-lg font-bold text-gray-700">: DNBILL {sale.id.slice(-4).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg font-medium text-gray-800">Table Name</span>
            <span className="text-lg font-bold text-gray-700">: {sale.assignedTableName || 'G5'} <span className="ml-8">Pax: {sale.pax || 1}</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg font-medium text-gray-800">Waiter</span>
            <span className="text-lg font-bold text-gray-700">: {sale.waiterName || 'Ravi'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg font-medium text-gray-800">Date & Time</span>
            <span className="text-lg font-bold text-gray-700">: {new Date(sale.saleDate).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg font-medium text-gray-800">Bill By</span>
            <span className="text-lg font-bold text-gray-700">: Admin</span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-4 border-t-2 border-b-2 border-black">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 text-lg font-bold text-gray-800">Item Name</th>
              <th className="text-center py-2 text-lg font-bold text-gray-800">Qty</th>
              <th className="text-right py-2 text-lg font-bold text-gray-800">Rate</th>
              <th className="text-right py-2 text-lg font-bold text-gray-800">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item: SaleItem, index: number) => (
              <tr key={`${item.id}-${index}`}>
                <td className="py-1 text-lg">{item.name}</td>
                <td className="text-center py-1 text-lg">{item.quantity}</td>
                <td className="text-right py-1 text-lg">{item.price.toFixed(2)}</td>
                <td className="text-right py-1 text-lg">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Section */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Items/{sale.items.length}</span>
            <span className="text-lg font-bold text-gray-800">x2</span>
            <span className="text-lg font-bold text-gray-800">Sub Total</span>
            <span className="text-lg font-bold text-gray-800">{sale.subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg text-gray-800">Service Charge</span>
            <span className="text-lg text-gray-800">{serviceCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg text-gray-800">CGST</span>
            <span className="text-lg text-gray-800">{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg text-gray-800">SGST</span>
            <span className="text-lg text-gray-800">{sgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-2 border-t-2 border-black pt-2">
            <span className="text-2xl font-extrabold text-gray-900">Grand Total</span>
            <span className="text-2xl font-extrabold text-gray-900">{sale.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xl text-gray-700">Thank you Visit Us Again!</p>
          <div className="mt-4 flex justify-center">
            <div className="w-32 h-32 border-2 border-black p-1">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Simple QR code pattern */}
                {Array.from({ length: 25 }).map((_, i) => 
                  Array.from({ length: 25 }).map((_, j) => {
                    const isOn = Math.random() > 0.5 || (i < 5 && j < 5) || (i < 5 && j > 19) || (i > 19 && j < 5) || (i === 0 || i === 24 || j === 0 || j === 24);
                    return (
                      <rect
                        key={`${i}-${j}`}
                        x={j * 4}
                        y={i * 4}
                        width="4"
                        height="4"
                        fill={isOn ? "#000" : "#fff"}
                      />
                    );
                  })
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <Button onClick={handleDownload} variant="secondary" leftIcon={<FiDownload />}>Download</Button>
        <Button onClick={handlePrint} variant="secondary" leftIcon={<FiPrinter />}>Print</Button>
        <Button onClick={onClose} variant="primary" leftIcon={<FiXCircle />}>Close & New Order</Button>
      </div>
    </div>
  );
};

export default ReceiptModal;