import React, { useRef } from 'react';
import { Sale, SaleItem, Customer, PrinterType } from '../../types';
import Button from '../common/Button';
import { FiPrinter, FiXCircle, FiDownload } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';
import { applyLeftMarginToText, getConfiguredLineWidth, getDividerLine, getEscPosBottomFeed, getEscPosEmphasizedTitle, getMarginSpaces } from '../../utils/printSettings';

interface ReceiptModalProps {
  onClose: () => void;
  sale: Sale | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ onClose, sale }) => {
  const { websiteSettings, getSingleActiveOutlet, applicationSettings, customers, printers, printInvoice } = useRestaurantData();
  const currentOutlet = getSingleActiveOutlet();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const generatePlainTextInvoice = (): string => {
    const marginSpaces = getMarginSpaces(applicationSettings.invoiceSideMarginMm);
    const lineWidth = Math.max(24, getConfiguredLineWidth(
      applicationSettings.invoicePaperSize,
      applicationSettings.invoiceCharactersPerLine
    ) - marginSpaces * 2);
    const divider = getDividerLine(lineWidth, applicationSettings.invoiceDividerStyle);
    const itemNameWidth = Math.max(12, lineWidth - 18);
    const outletName = currentOutlet?.restaurantName || currentOutlet?.name || websiteSettings.whiteLabel.appName || 'Demo Restaurant';
    const outletAddress = currentOutlet?.address || websiteSettings.contactUsContent.address || 'Address not set';
    const outletPhone = currentOutlet?.phone || websiteSettings.contactUsContent.phone || 'Phone not set';
    const outletEmail = currentOutlet?.email || websiteSettings.contactUsContent.email || '';
    const customer: Customer | undefined = sale.customerId ? customers.find(c => c.id === sale.customerId) : undefined;
    const showRestaurantDetails = applicationSettings.invoiceShowRestaurantDetails ?? true;
    const showRestaurantName = applicationSettings.invoiceShowRestaurantName ?? true;
    const showRestaurantAddress = applicationSettings.invoiceShowRestaurantAddress ?? true;
    const showRestaurantPhone = applicationSettings.invoiceShowRestaurantPhone ?? true;
    const showRestaurantEmail = applicationSettings.invoiceShowRestaurantEmail ?? true;
    let invoiceText = `${divider}\n`;
    if (showRestaurantDetails) {
      if (showRestaurantName) invoiceText += getEscPosEmphasizedTitle(outletName, lineWidth) || `${outletName.toUpperCase()}\n`;
      if (showRestaurantAddress) invoiceText += `${outletAddress}\n`;
      if (showRestaurantPhone) invoiceText += `Tel: ${outletPhone}\n`;
      if (showRestaurantEmail && outletEmail) invoiceText += `Email: ${outletEmail}\n`;
      if (applicationSettings.invoiceRestaurantSectionTitle?.trim()) {
        invoiceText += `${applicationSettings.invoiceRestaurantSectionTitle.trim()}\n`;
      }
      invoiceText += `${divider}\n`;
    }
    invoiceText += `\n${applicationSettings.invoiceTitle || 'INVOICE'}\n`;
    invoiceText += `Bill No: DNBILL ${sale.id.slice(-4).toUpperCase()}\n`;
    if (applicationSettings.invoiceShowCustomerDetails && customer) {
      invoiceText += `${applicationSettings.invoiceCustomerSectionTitle || 'Customer Details'}\n`;
      invoiceText += `${divider}\n`;
      if (applicationSettings.invoiceShowCustomerName) invoiceText += `Name: ${customer.name}\n`;
      if (applicationSettings.invoiceShowCustomerPhone && customer.phone) invoiceText += `Phone: ${customer.phone}\n`;
      if (applicationSettings.invoiceShowCustomerEmail && customer.email) invoiceText += `Email: ${customer.email}\n`;
      if (applicationSettings.invoiceShowCustomerAddress && customer.address) invoiceText += `Address: ${customer.address}\n`;
      if (applicationSettings.invoiceShowCustomerCompany && customer.companyName) invoiceText += `Company: ${customer.companyName}\n`;
      if (applicationSettings.invoiceShowCustomerVatPan && customer.vatPan) invoiceText += `VAT/PAN: ${customer.vatPan}\n`;
      invoiceText += `${divider}\n`;
    }
    if (sale.assignedTableName) {
      invoiceText += `Table: ${sale.assignedTableName}  Pax: ${sale.pax || 1}\n`;
    }
    if (sale.waiterName) {
      invoiceText += `Waiter: ${sale.waiterName}\n`;
    }
    invoiceText += `Date: ${new Date(sale.saleDate).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    invoiceText += `Bill By: Admin\n\n`;
    invoiceText += `${divider}\n`;
    invoiceText += `${'Item'.padEnd(itemNameWidth)}Qty   Rate   Amount\n`;
    invoiceText += `${divider}\n`;
    sale.items.forEach(item => {
      const name = item.name.substring(0, itemNameWidth).padEnd(itemNameWidth);
      const qty = item.quantity.toString().padStart(3);
      const rate = item.price.toFixed(2).padStart(6);
      const amount = (item.price * item.quantity).toFixed(2).padStart(8);
      invoiceText += `${name}${qty} ${rate} ${amount}\n`;
    });
    invoiceText += `${divider}\n`;
    invoiceText += `Items: ${sale.items.length}     Sub Total: ${sale.subTotal.toFixed(2)}\n`;
    let totalTax = 0;
    sale.taxDetails.forEach(tax => {
      totalTax += tax.amount;
      invoiceText += `${tax.name} (${tax.rate}%): ${tax.amount.toFixed(2)}\n`;
    });
    if (sale.discountAmount && sale.discountAmount > 0) {
      const discountVal = sale.discountType === 'percentage' ? (sale.subTotal * sale.discountAmount / 100) : sale.discountAmount;
      invoiceText += `Discount: -${discountVal.toFixed(2)}\n`;
    }
    if (sale.tipAmount && sale.tipAmount > 0) {
      invoiceText += `Tip: ${sale.tipAmount.toFixed(2)}\n`;
    }
    invoiceText += `\nGrand Total: ${sale.totalAmount.toFixed(2)}\n`;
    invoiceText += `${divider}\n\n`;
    if (applicationSettings.invoiceShowPaymentDetails) {
      if (sale.paymentMethod) invoiceText += `Payment: ${sale.paymentMethod}\n`;
      invoiceText += `Paid: ${(sale.receivedAmount || sale.totalAmount).toFixed(2)}\n`;
      if ((sale.returnAmount ?? 0) > 0 || (sale.receivedAmount && sale.receivedAmount > sale.totalAmount)) {
        invoiceText += `Change: ${((sale.returnAmount ?? 0) || (sale.receivedAmount || sale.totalAmount) - sale.totalAmount).toFixed(2)}\n`;
      }
      invoiceText += `\n`;
    }
    invoiceText += `${applicationSettings.invoiceFooterText || 'Thank you for your business!'}\n`;
    invoiceText += `Powered by RestoByte\n`;
    invoiceText += `${divider}\n`;
    return `${applyLeftMarginToText(invoiceText, marginSpaces)}${getEscPosBottomFeed(12)}`;
  };
  
  const receiptPrinters = printers.filter(
    (printer) => printer.type === PrinterType.Receipt || printer.autoPrintReceipt
  );
  const directReceiptPrinters = receiptPrinters.filter((printer) => printer.isActive);
  const receiptPrintersToUse = directReceiptPrinters.length > 0 ? directReceiptPrinters : receiptPrinters;
  if (!sale) return null;

  const customer: Customer | undefined = sale.customerId ? customers.find(c => c.id === sale.customerId) : undefined;

  const handlePrint = () => {
    if (receiptPrintersToUse.length === 0) {
      // Fallback to browser print if no printers configured
      if (!receiptRef.current) return;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups to print receipts');
        return;
      }
      
      const configuredReceiptPrinter = receiptPrinters[0];
      const paperWidth = configuredReceiptPrinter?.paperSize || applicationSettings.invoicePaperSize || '80mm';
      const borderStyle = applicationSettings.invoiceDividerStyle === 'solid' ? 'solid' : 'dashed';
      
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
                padding: ${applicationSettings.invoiceSideMarginMm}mm;
                font-size: ${applicationSettings.invoiceFontSize}px;
                line-height: 1.4;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .border-t { border-top: 1px ${borderStyle} #000; margin: 8px 0; padding-top: 8px; }
              .border-b { border-bottom: 1px ${borderStyle} #000; margin: 8px 0; padding-bottom: 8px; }
              .mt-2 { margin-top: 8px; }
              .mt-4 { margin-top: 16px; }
              .mb-2 { margin-bottom: 8px; }
              .font-bold { font-weight: bold; }
              .text-sm { font-size: 10px; }
              .text-lg { font-size: 14px; }
              .text-xl { font-size: 16px; }
              table { width: 100%; border-collapse: collapse; margin: 8px 0; }
              td { vertical-align: top; }
              @media print {
                body { margin: 0; padding: ${applicationSettings.invoiceSideMarginMm}mm; font-size: ${applicationSettings.invoiceFontSize}px; }
                @page { margin: 0; size: auto; }
              }
            </style>
          </head>
          <body>${receiptRef.current.innerHTML}</body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      // Use our backend print function
      const content = generatePlainTextInvoice();
      receiptPrintersToUse.forEach((printer) => {
        void printInvoice(printer.id, content);
      });
    }
  };

  const handleDownload = () => {
    const receiptElement = document.getElementById('receipt-content');
    if(!receiptElement) return;

    const options = {
      margin: 0.5,
      filename: `invoice-${sale.id.slice(-6).toUpperCase()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(options).from(receiptElement).save();
  };

  const outletName = currentOutlet?.restaurantName || currentOutlet?.name || websiteSettings.whiteLabel.appName || 'Demo Restaurant';
  const outletAddress = currentOutlet?.address || websiteSettings.contactUsContent.address || 'Address not set';
  const outletPhone = currentOutlet?.phone || websiteSettings.contactUsContent.phone || 'Phone not set';
  const outletEmail = currentOutlet?.email || websiteSettings.contactUsContent.email || 'info@restobyte.com';
  const showRestaurantDetails = applicationSettings.invoiceShowRestaurantDetails ?? true;
  const showRestaurantName = applicationSettings.invoiceShowRestaurantName ?? true;
  const showRestaurantAddress = applicationSettings.invoiceShowRestaurantAddress ?? true;
  const showRestaurantPhone = applicationSettings.invoiceShowRestaurantPhone ?? true;
  const showRestaurantEmail = applicationSettings.invoiceShowRestaurantEmail ?? true;

  // Calculate tax breakdown from real tax details
  let totalTax = 0;
  const taxRows: React.ReactElement[] = [];
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
      <div
        ref={receiptRef}
        id="receipt-content"
        className="bg-white rounded-lg max-w-md mx-auto"
        style={{
          padding: `${applicationSettings.invoiceSideMarginMm}mm`,
          fontSize: `${applicationSettings.invoiceFontSize}px`,
        }}
      >
        {/* Header Section */}
        <div className="text-center mb-4">
            {(applicationSettings.invoiceShowLogo && (currentOutlet?.logoUrl || websiteSettings.whiteLabel.logoUrl)) && (
                <img 
                    src={currentOutlet?.logoUrl || websiteSettings.whiteLabel.logoUrl} 
                    alt={outletName} 
                    className="max-h-20 mx-auto mb-3"
                />
            )}
            {showRestaurantDetails && showRestaurantName && (
              <h2
                className="text-gray-700"
                style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.05, letterSpacing: '0.03em' }}
              >
                {outletName}
              </h2>
            )}
            {showRestaurantDetails && showRestaurantAddress && <p className="text-sm text-gray-600 mt-1">{outletAddress}</p>}
            {showRestaurantDetails && showRestaurantPhone && <p className="text-sm text-gray-600">Tel No.: {outletPhone}</p>}
            {showRestaurantDetails && showRestaurantEmail && outletEmail && <p className="text-sm text-gray-600">Email: {outletEmail}</p>}
            {showRestaurantDetails && applicationSettings.invoiceRestaurantSectionTitle?.trim() && (
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 mt-2">
                {applicationSettings.invoiceRestaurantSectionTitle.trim()}
              </p>
            )}
        </div>

        {/* Customer Section */}
        {applicationSettings.invoiceShowCustomerDetails && customer && (
          <div className="border-t-2 border-b-2 border-gray-300 py-3 mb-4">
            <h4 className="text-lg font-bold text-gray-800 mb-2">{applicationSettings.invoiceCustomerSectionTitle || 'Customer Details'}</h4>
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
          <h3
            className="text-gray-800 border-y-2 border-black py-2"
            style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2 }}
          >
            {applicationSettings.invoiceTitle || sale.orderType || 'Invoice'}
          </h3>
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
              <th className="text-left py-2 text-gray-800" style={{ fontSize: '1.125rem', fontWeight: 800 }}>Item Name</th>
              <th className="text-center py-2 text-gray-800" style={{ fontSize: '1.125rem', fontWeight: 800 }}>Qty</th>
              <th className="text-right py-2 text-gray-800" style={{ fontSize: '1.125rem', fontWeight: 800 }}>Rate</th>
              <th className="text-right py-2 text-gray-800" style={{ fontSize: '1.125rem', fontWeight: 800 }}>Amount</th>
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
            <span className="text-gray-900" style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2 }}>Grand Total</span>
            <span className="text-gray-900" style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2 }}>{sale.totalAmount.toFixed(2)}</span>
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
                ((sale.returnAmount ?? 0) > 0 || (sale.receivedAmount && sale.receivedAmount > sale.totalAmount)) && (
                    <p className="text-sm text-gray-700">
                        <strong>Return/Change Amount:</strong> {((sale.returnAmount ?? 0) || (sale.receivedAmount || sale.totalAmount) - sale.totalAmount).toFixed(2)}
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
        <Button onClick={handleDownload} variant="secondary" leftIcon={<FiDownload />}>Download</Button>
        <Button onClick={handlePrint} variant="secondary" leftIcon={<FiPrinter />}>Print</Button>
        <Button onClick={onClose} variant="primary" leftIcon={<FiXCircle />}>Close & New Order</Button>
      </div>
    </div>
  );
};

export default ReceiptModal;
