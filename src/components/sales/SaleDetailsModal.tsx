import React from 'react';
import { Sale, Customer, PrinterType } from '../../types';
import Button from '../common/Button';
import { FiXCircle, FiPrinter, FiDownload } from 'react-icons/fi';
import html2pdf from 'html2pdf.js';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { QRCodeSVG } from 'qrcode.react';
import { applyLeftMarginToText, getConfiguredLineWidth, getDividerLine, getEscPosBottomFeed, getEscPosEmphasizedTitle, getMarginSpaces } from '../../utils/printSettings';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({ isOpen, onClose, sale }) => {
  const { websiteSettings, getSingleActiveOutlet, customers, applicationSettings, printers, printInvoice } = useRestaurantData();
  const currentOutlet = getSingleActiveOutlet();

  if (!isOpen || !sale) return null;

  const customer: Customer | undefined = sale.customerId ? customers.find(c => c.id === sale.customerId) : undefined;

  const generatePlainTextInvoice = () => {
    const marginSpaces = getMarginSpaces(applicationSettings.invoiceSideMarginMm);
    const lineWidth = Math.max(
      24,
      getConfiguredLineWidth(
        applicationSettings.saleDetailsPaperSize,
        applicationSettings.saleDetailsCharactersPerLine
      ) - marginSpaces * 2
    );
    const divider = getDividerLine(lineWidth, applicationSettings.invoiceDividerStyle);
    const itemNameWidth = Math.max(10, lineWidth - 17);
    const outletName = currentOutlet?.restaurantName || currentOutlet?.name || websiteSettings.whiteLabel.appName || 'Demo Restaurant';
    const outletAddress = currentOutlet?.address || websiteSettings.contactUsContent.address || 'Address not set';
    const outletPhone = currentOutlet?.phone || websiteSettings.contactUsContent.phone || 'Phone not set';
    const outletEmail = currentOutlet?.email || websiteSettings.contactUsContent.email || '';
    const showRestaurantDetails = applicationSettings.invoiceShowRestaurantDetails ?? true;
    const showRestaurantName = applicationSettings.invoiceShowRestaurantName ?? true;
    const showRestaurantAddress = applicationSettings.invoiceShowRestaurantAddress ?? true;
    const showRestaurantPhone = applicationSettings.invoiceShowRestaurantPhone ?? true;
    const showRestaurantEmail = applicationSettings.invoiceShowRestaurantEmail ?? true;

    const centerText = (value: string) => {
      const text = value.trim();
      if (!text) return '';
      if (text.length >= lineWidth) return `${text}\n`;
      const leftPad = Math.floor((lineWidth - text.length) / 2);
      return `${' '.repeat(leftPad)}${text}\n`;
    };

    const formatPair = (label: string, value: string) => {
      const suffix = `: ${value}`;
      const spaces = Math.max(1, lineWidth - label.length - suffix.length);
      return `${label}${' '.repeat(spaces)}${suffix}\n`;
    };

    const formatMoneyLine = (label: string, amount: number) => {
      const amountText = amount.toFixed(2);
      const spaces = Math.max(1, lineWidth - label.length - amountText.length);
      return `${label}${' '.repeat(spaces)}${amountText}\n`;
    };

    const formatItemsSummary = (count: number, subtotal: number) => {
      const left = `Items/${count}`;
      const middle = 'Sub Total';
      const right = subtotal.toFixed(2);
      const firstGap = Math.max(1, 17 - left.length);
      const secondGap = Math.max(1, lineWidth - left.length - firstGap - middle.length - right.length);
      return `${left}${' '.repeat(firstGap)}${middle}${' '.repeat(secondGap)}${right}\n`;
    };

    let invoiceText = '';
    if (showRestaurantDetails) {
      if (showRestaurantName) invoiceText += getEscPosEmphasizedTitle(outletName, lineWidth) || centerText(outletName.toUpperCase());
      if (showRestaurantAddress) invoiceText += centerText(outletAddress);
      if (showRestaurantPhone) invoiceText += centerText(`Tel No.: ${outletPhone}`);
      if (showRestaurantEmail && outletEmail) {
        invoiceText += centerText(`Email: ${outletEmail}`);
      }
      if (applicationSettings.invoiceRestaurantSectionTitle?.trim()) {
        invoiceText += centerText(applicationSettings.invoiceRestaurantSectionTitle.trim());
      }
      invoiceText += `${divider}\n\n`;
    }
    invoiceText += centerText(applicationSettings.invoiceTitle || sale.orderType || 'Invoice');
    invoiceText += `${divider}\n`;

    if (applicationSettings.invoiceShowCustomerDetails && customer) {
      invoiceText += `${applicationSettings.invoiceCustomerSectionTitle || 'Customer Details'}\n`;
      invoiceText += `${divider}\n`;
      if (applicationSettings.invoiceShowCustomerName) invoiceText += formatPair('Name', customer.name);
      if (applicationSettings.invoiceShowCustomerPhone && customer.phone) invoiceText += formatPair('Phone', customer.phone);
      if (applicationSettings.invoiceShowCustomerEmail && customer.email) invoiceText += formatPair('Email', customer.email);
      if (applicationSettings.invoiceShowCustomerAddress && customer.address) invoiceText += formatPair('Address', customer.address);
      if (applicationSettings.invoiceShowCustomerCompany && customer.companyName) invoiceText += formatPair('Company', customer.companyName);
      if (applicationSettings.invoiceShowCustomerVatPan && customer.vatPan) invoiceText += formatPair('VAT/PAN', customer.vatPan);
      invoiceText += `${divider}\n`;
    }

    invoiceText += formatPair('Bill No', `DNBILL ${sale.id.slice(-4).toUpperCase()}`);
    if (sale.assignedTableName) {
      invoiceText += formatPair('Table Name', `${sale.assignedTableName}   Pax: ${sale.pax || 1}`);
    }
    if (sale.waiterName) {
      invoiceText += formatPair('Waiter', sale.waiterName);
    }
    invoiceText += formatPair(
      'Date & Time',
      new Date(sale.saleDate).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
    invoiceText += formatPair('Bill By', 'Admin');
    invoiceText += `${divider}\n`;
    invoiceText += `${'Item Name'.padEnd(itemNameWidth)}Qty   Rate Amount\n`;
    invoiceText += `${divider}\n`;

    sale.items.forEach((item) => {
      const name = item.name.substring(0, itemNameWidth).padEnd(itemNameWidth);
      const qty = item.quantity.toString().padStart(4);
      const rate = item.price.toFixed(2).padStart(6);
      const amount = (item.price * item.quantity).toFixed(2).padStart(7);
      invoiceText += `${name}${qty} ${rate} ${amount}\n`;
    });

    invoiceText += `${divider}\n`;
    invoiceText += formatItemsSummary(sale.items.length, sale.subTotal);

    if (applicationSettings.invoiceShowTaxBreakdown) {
      sale.taxDetails.forEach((tax) => {
        invoiceText += formatMoneyLine(`${tax.name} (${tax.rate}%)`, tax.amount);
      });
    }

    if (sale.discountAmount && sale.discountAmount > 0) {
      const discountValue =
        sale.discountType === 'percentage'
          ? (sale.subTotal * sale.discountAmount) / 100
          : sale.discountAmount;
      invoiceText += formatMoneyLine('Discount', -discountValue);
    }

    if (sale.tipAmount && sale.tipAmount > 0) {
      invoiceText += formatMoneyLine('Tip', sale.tipAmount);
    }

    invoiceText += `${divider}\n`;
    invoiceText += formatMoneyLine('Grand Total', sale.totalAmount);
    invoiceText += `\n`;

    if (applicationSettings.invoiceShowPaymentDetails) {
      invoiceText += `Payment Details\n`;
      invoiceText += `${divider}\n`;
      if (applicationSettings.invoiceShowPaymentMethod && sale.paymentMethod) {
        invoiceText += formatPair('Payment Method', sale.paymentMethod);
      }
      if (applicationSettings.invoiceShowPaymentDate) {
        invoiceText += formatPair(
          'Payment Date',
          new Date(sale.paymentDate || sale.saleDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        );
      }
      if (applicationSettings.invoiceShowPaymentReference && sale.paymentReference) {
        invoiceText += formatPair('Reference', sale.paymentReference);
      }
      if (applicationSettings.invoiceShowReceivedAmount) {
        invoiceText += formatPair('Received Amount', (sale.receivedAmount || sale.totalAmount).toFixed(2));
      }
      if (
        applicationSettings.invoiceShowReturnAmount &&
        ((sale.returnAmount ?? 0) > 0 || ((sale.receivedAmount ?? 0) > sale.totalAmount))
      ) {
        invoiceText += formatPair(
          'Return/Change Amount',
          ((sale.returnAmount ?? 0) || ((sale.receivedAmount || sale.totalAmount) - sale.totalAmount)).toFixed(2)
        );
      }
      invoiceText += `\n`;
    }

    if (applicationSettings.invoiceShowReturnInformation && applicationSettings.invoiceReturnPolicyText) {
      invoiceText += `Return Policy\n`;
      invoiceText += `${divider}\n`;
      invoiceText += `${applicationSettings.invoiceReturnPolicyText}\n\n`;
    }

    invoiceText += centerText(applicationSettings.invoiceFooterText || 'Thank you Visit Us Again!');
    invoiceText += `\n`;
    invoiceText += centerText('Powered by RestoByte Software');
    invoiceText += `${divider}\n`;

    return `${applyLeftMarginToText(invoiceText, marginSpaces)}${getEscPosBottomFeed(12)}`;
  };

  const handlePrintReceipt = () => {
    const receiptPrinters = printers.filter(
      (printer) => printer.type === PrinterType.Receipt || printer.autoPrintReceipt
    );
    const directReceiptPrinters = receiptPrinters.filter((printer) => printer.isActive);
    const printersToUse = directReceiptPrinters.length > 0 ? directReceiptPrinters : receiptPrinters;

    if (printersToUse.length === 0) {
      alert('No receipt printer configured. Please activate a receipt printer in settings.');
      return;
    }

    const content = generatePlainTextInvoice();
    printersToUse.forEach((printer) => {
      void printInvoice(printer.id, content);
    });
  };

  const handleDownloadReceipt = () => {
    const contentElement = document.getElementById('sale-details-content');
    if(!contentElement) return;

    const options = {
      margin: 0.5,
      filename: `invoice-${sale.id.slice(-6).toUpperCase()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(options).from(contentElement).save();
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
        id="sale-details-content"
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
            <p className="text-xs text-gray-500 mt-4">Powered by RestoByte Software</p>
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
