import React from 'react';
import { Sale, Customer } from '../../types';
import Button from '../common/Button';
import { FiXCircle, FiPrinter, FiDownload } from 'react-icons/fi';
import html2pdf from 'html2pdf.js';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { QRCodeSVG } from 'qrcode.react';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({ isOpen, onClose, sale }) => {
  const { websiteSettings, getSingleActiveOutlet, customers, applicationSettings, printers } = useRestaurantData();
  const currentOutlet = getSingleActiveOutlet();

  if (!isOpen || !sale) return null;

  const customer: Customer | undefined = sale.customerId ? customers.find(c => c.id === sale.customerId) : undefined;

  const handlePrintReceipt = () => {
    const contentElement = document.getElementById('sale-details-content');
    if(!contentElement) return;

    // Open new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print receipts');
      return;
    }

    // Get active receipt printers to determine paper size
    const activeReceiptPrinter = printers.find(p => p.type === 'Receipt' && p.isActive);
    const paperWidth = activeReceiptPrinter?.paperSize === '58mm' ? '58mm' : '80mm';

    // Write receipt content to new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${sale.id.slice(-6).toUpperCase()}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Courier New', monospace;
            }
            body {
              width: ${paperWidth};
              padding: 5mm;
              font-size: 12px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .border-t { border-top: 1px dashed #000; margin: 8px 0; padding-top: 8px; }
            .border-b { border-bottom: 1px dashed #000; margin: 8px 0; padding-bottom: 8px; }
            .mt-2 { margin-top: 8px; }
            .mt-4 { margin-top: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .mt-6 { margin-top: 24px; }
            .font-bold { font-weight: bold; }
            .text-sm { font-size: 10px; }
            .text-lg { font-size: 14px; }
            .text-xl { font-size: 16px; }
            .text-2xl { font-size: 20px; }
            .text-xs { font-size: 8px; }
            .text-gray-600 { color: #666; }
            .text-gray-700 { color: #333; }
            .text-gray-800 { color: #111; }
            .text-gray-900 { color: #000; }
            .bg-white { background-color: white; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            td { vertical-align: top; }
            .max-w-md { max-width: 280px; margin: 0 auto; }
            @media print {
              body { margin: 0; padding: 5mm; }
              @page { margin: 0; size: auto; }
            }
          </style>
        </head>
        <body>${contentElement.innerHTML}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownloadReceipt = () => {
    const contentElement = document.getElementById('sale-details-content');
    if(!contentElement) return;

    const options = {
      margin: 0.5,
      filename: `invoice-${sale.id.slice(-6).toUpperCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(options).from(contentElement).save();
  };

  const outletName = currentOutlet?.restaurantName || websiteSettings.whiteLabel.appName || 'Demo Restaurant';
  const outletAddress = currentOutlet?.address || websiteSettings.contactUsContent.address || 'Address not set';
  const outletPhone = currentOutlet?.phone || websiteSettings.contactUsContent.phone || 'Phone not set';
  const outletEmail = websiteSettings.contactUsContent.email || 'info@restobyte.com';

  // Calculate tax breakdown from real tax details
  let totalTax = 0;
  const taxRows: JSX.Element[] = [];
  sale.taxDetails.forEach(tax => {
    totalTax += tax.amount;
    if (tax.name.toLowerCase().includes('cgst')) {
      taxRows.push(
        <div key={tax.id} className="flex justify-between">
          <span className="text-lg text-gray-800">{tax.name} ({tax.rate}%)</span>
          <span className="text-lg text-gray-800">{tax.amount.toFixed(2)}</span>
        </div>
      );
    } else if (tax.name.toLowerCase().includes('sgst')) {
      taxRows.push(
        <div key={tax.id} className="flex justify-between">
          <span className="text-lg text-gray-800">{tax.name} ({tax.rate}%)</span>
          <span className="text-lg text-gray-800">{tax.amount.toFixed(2)}</span>
        </div>
      );
    } else {
      taxRows.push(
        <div key={tax.id} className="flex justify-between">
          <span className="text-lg text-gray-800">{tax.name} ({tax.rate}%)</span>
          <span className="text-lg text-gray-800">{tax.amount.toFixed(2)}</span>
        </div>
      );
    }
  });

  return (
    <div className="text-gray-700">
      <div id="sale-details-content" className="bg-white p-4 rounded-lg max-w-md mx-auto">
        {/* Header Section */}
        <div className="text-center mb-4">
            {(applicationSettings.invoiceShowLogo && (currentOutlet?.logoUrl || websiteSettings.whiteLabel.logoUrl)) && (
                <img 
                    src={currentOutlet?.logoUrl || websiteSettings.whiteLabel.logoUrl} 
                    alt={outletName} 
                    className="max-h-20 mx-auto mb-2"
                />
            )}
          <h2 className="text-2xl font-bold text-gray-700">{outletName}</h2>
          <p className="text-sm text-gray-600 mt-1">{outletAddress}</p>
          <p className="text-sm text-gray-600">Tel No.: {outletPhone}</p>
          {outletEmail && <p className="text-sm text-gray-600">Email: {outletEmail}</p>}
        </div>

        {/* Customer Section */}
        {applicationSettings.invoiceShowCustomerDetails && customer && (
          <div className="border-t-2 border-b-2 border-gray-300 py-3 mb-4">
            <h4 className="text-lg font-bold text-gray-800 mb-2">Customer Details</h4>
            {applicationSettings.invoiceShowCustomerName && <p className="text-sm text-gray-700"><strong>Name:</strong> {customer.name}</p>}
            {applicationSettings.invoiceShowCustomerPhone && customer.phone && <p className="text-sm text-gray-700"><strong>Phone:</strong> {customer.phone}</p>}
            {applicationSettings.invoiceShowCustomerEmail && customer.email && <p className="text-sm text-gray-700"><strong>Email:</strong> {customer.email}</p>}
            {applicationSettings.invoiceShowCustomerAddress && customer.address && <p className="text-sm text-gray-700"><strong>Address:</strong> {customer.address}</p>}
            {applicationSettings.invoiceShowCustomerCompany && customer.companyName && <p className="text-sm text-gray-700"><strong>Company:</strong> {customer.companyName}</p>}
            {applicationSettings.invoiceShowCustomerVatPan && customer.vatPan && <p className="text-sm text-gray-700"><strong>VAT/PAN:</strong> {customer.vatPan}</p>}
          </div>
        )}

        {/* Order Type */}
        <div className="text-center my-2">
          <h3 className="text-2xl font-bold text-gray-800 border-y-2 border-black py-2">{applicationSettings.invoiceTitle || sale.orderType || 'Invoice'}</h3>
        </div>

        {/* Invoice Details */}
        <div className="text-left mb-4 space-y-1">
          <div className="flex justify-between">
            <span className="text-lg font-medium text-gray-800">Bill No</span>
            <span className="text-lg font-bold text-gray-700">: DNBILL {sale.id.slice(-4).toUpperCase()}</span>
          </div>
          {sale.assignedTableName && (
            <div className="flex justify-between">
              <span className="text-lg font-medium text-gray-800">Table Name</span>
              <span className="text-lg font-bold text-gray-700">: {sale.assignedTableName} <span className="ml-8">Pax: {sale.pax || 1}</span></span>
            </div>
          )}
          {sale.waiterName && (
            <div className="flex justify-between">
              <span className="text-lg font-medium text-gray-800">Waiter</span>
              <span className="text-lg font-bold text-gray-700">: {sale.waiterName}</span>
            </div>
          )}
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
            {sale.items.map((item, index) => (
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
            <span className="text-lg font-bold text-gray-800">Sub Total</span>
            <span className="text-lg font-bold text-gray-800">{sale.subTotal.toFixed(2)}</span>
          </div>
          {applicationSettings.invoiceShowTaxBreakdown && taxRows}
          {sale.discountAmount && sale.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-lg text-gray-800">Discount {sale.discountType === 'percentage' ? `(${sale.discountAmount}%)` : ''}</span>
              <span className="text-lg text-gray-800">-{(sale.discountType === 'percentage' ? (sale.subTotal * sale.discountAmount / 100) : sale.discountAmount).toFixed(2)}</span>
            </div>
          )}
          {sale.tipAmount && sale.tipAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-lg text-gray-800">Tip</span>
              <span className="text-lg text-gray-800">{sale.tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mt-2 border-t-2 border-black pt-2">
            <span className="text-2xl font-extrabold text-gray-900">Grand Total</span>
            <span className="text-2xl font-extrabold text-gray-900">{sale.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Details Section */}
        {applicationSettings.invoiceShowPaymentDetails && (
          <div className="border-t-2 border-b-2 border-gray-300 py-3 mb-4">
            <h4 className="text-lg font-bold text-gray-800 mb-2">Payment Details</h4>
            {applicationSettings.invoiceShowPaymentMethod && sale.paymentMethod && <p className="text-sm text-gray-700"><strong>Payment Method:</strong> {sale.paymentMethod}</p>}
            {applicationSettings.invoiceShowPaymentDate && (sale.paymentDate || sale.saleDate) && <p className="text-sm text-gray-700"><strong>Payment Date:</strong> {new Date(sale.paymentDate || sale.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>}
            {applicationSettings.invoiceShowPaymentReference && sale.paymentReference && <p className="text-sm text-gray-700"><strong>Reference:</strong> {sale.paymentReference}</p>}
            {applicationSettings.invoiceShowReceivedAmount && <p className="text-sm text-gray-700"><strong>Received Amount:</strong> {(sale.receivedAmount || sale.totalAmount).toFixed(2)}</p>}
            {applicationSettings.invoiceShowReturnAmount && (
        (sale.returnAmount > 0 || (sale.receivedAmount && sale.receivedAmount > sale.totalAmount)) && (
            <p className="text-sm text-gray-700">
                <strong>Return/Change Amount:</strong> {(sale.returnAmount || (sale.receivedAmount || sale.totalAmount) - sale.totalAmount).toFixed(2)}
            </p>
        )
    )}
          </div>
        )}

        {/* Return Information Section */}
        {applicationSettings.invoiceShowReturnInformation && applicationSettings.invoiceReturnPolicyText && (
          <div className="py-3 mb-4">
            <h4 className="text-lg font-bold text-gray-800 mb-2">Return Policy</h4>
            <p className="text-sm text-gray-700">{applicationSettings.invoiceReturnPolicyText}</p>
          </div>
        )}

        {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xl text-gray-700">{applicationSettings.invoiceFooterText || 'Thank you Visit Us Again!'}</p>
            {applicationSettings.invoiceShowQrCode && (
                <div className="mt-4 flex justify-center">
                  <div className="border-2 border-black p-1 inline-block">
                    <QRCodeSVG 
                      value={`${window.location.origin}/invoice/${sale.id}`} 
                      size={128}
                      level="H"
                    />
                  </div>
                </div>
            )}
            <p className="text-xs text-gray-500 mt-4">Powered by Restobyte Software</p>
          </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <Button onClick={handleDownloadReceipt} variant="secondary" leftIcon={<FiDownload />}>Download</Button>
        <Button onClick={handlePrintReceipt} variant="secondary" leftIcon={<FiPrinter />}>Print Receipt</Button>
        <Button onClick={onClose} variant="primary" leftIcon={<FiXCircle />}>Close</Button>
      </div>
    </div>
  );
};

export default SaleDetailsModal;
