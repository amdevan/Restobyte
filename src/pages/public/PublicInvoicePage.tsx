import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import { API_BASE_URL } from '../../config';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';

// Helper function to map backend order to frontend sale type
const mapBackendOrderToSale = (order: any) => {
  const saleData = order?.saleData || {};
  const items = order?.items || [];
  
  return {
    id: order.id,
    saleDate: order.createdAt || saleData.saleDate,
    items: items.map((item: any) => ({
      id: item.id,
      name: item.menuItem?.name || saleData.items?.find((i: any) => i.id === item.menuItemId)?.name || 'Item',
      price: Number(item.unitPrice),
      quantity: Number(item.quantity),
    })),
    subTotal: saleData.subTotal || items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0),
    taxDetails: saleData.taxDetails || [],
    totalAmount: Number(order.total || saleData.totalAmount),
    orderType: saleData.orderType || 'Dine In',
    pax: saleData.pax,
    waiterName: saleData.waiterName,
    assignedTableName: saleData.assignedTableName,
    customerId: order.customerId,
    customerName: order.customer?.name || saleData.customerName,
    discountType: saleData.discountType,
    discountAmount: saleData.discountAmount,
    tipAmount: saleData.tipAmount,
  };
};

const PublicInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/public/${id}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
      <Spinner size="lg" />
    </div>
  );

  if (error) return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
        <p className="text-gray-600">The invoice you're looking for doesn't exist.</p>
      </div>
    </div>
  );

  const sale = mapBackendOrderToSale(order);
  const outlet = order?.outlet;
  const customer = order?.customer;
  const outletName = outlet?.restaurantName || outlet?.name || 'Restaurant';
  const outletAddress = outlet?.address || '';
  const outletPhone = outlet?.phone || '';
  const outletEmail = outlet?.email || '';

  const handleDownload = () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;
    
    const options = {
      margin: 0.5,
      filename: `invoice-${sale.id.slice(-6).toUpperCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(options).from(element).save();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Invoice
          </button>
        </div>
        
        <div id="invoice-content" className="bg-white p-6 rounded-lg shadow-lg">
          {/* Header Section */}
          <div className="text-center mb-6">
            {outlet?.logoUrl && (
              <img 
                src={outlet.logoUrl} 
                alt={outletName} 
                className="max-h-20 mx-auto mb-2" 
              />
            )}
            <h2 className="text-2xl font-bold text-gray-800">{outletName}</h2>
            {outletAddress && <p className="text-sm text-gray-600 mt-1">{outletAddress}</p>}
            {outletPhone && <p className="text-sm text-gray-600">Tel No.: {outletPhone}</p>}
            {outletEmail && <p className="text-sm text-gray-600">Email: {outletEmail}</p>}
          </div>

          {/* Customer Section */}
          {customer && (
            <div className="border-t-2 border-b-2 border-gray-200 py-3 mb-4">
              <h4 className="text-lg font-bold text-gray-800 mb-2">Customer Details</h4>
              <p className="text-sm text-gray-700"><strong>Name:</strong> {customer.name}</p>
              {customer.phone && <p className="text-sm text-gray-700"><strong>Phone:</strong> {customer.phone}</p>}
              {customer.email && <p className="text-sm text-gray-700"><strong>Email:</strong> {customer.email}</p>}
              {customer.address && <p className="text-sm text-gray-700"><strong>Address:</strong> {customer.address}</p>}
              {customer.companyName && <p className="text-sm text-gray-700"><strong>Company:</strong> {customer.companyName}</p>}
              {customer.vatPan && <p className="text-sm text-gray-700"><strong>VAT/PAN:</strong> {customer.vatPan}</p>}
            </div>
          )}

          {/* Order Type */}
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800 border-y-2 border-black py-2">{sale.orderType || 'Invoice'}</h3>
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
                <span className="text-lg font-bold text-gray-700">: {sale.assignedTableName} {sale.pax ? `Pax: ${sale.pax}` : ''}</span>
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
              {sale.items.map((item: any, index: number) => (
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
            {sale.taxDetails.map((tax: any) => (
              <div key={tax.id} className="flex justify-between">
                <span className="text-lg text-gray-800">{tax.name} ({tax.rate}%)</span>
                <span className="text-lg text-gray-800">{tax.amount.toFixed(2)}</span>
              </div>
            ))}
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

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xl text-gray-700">Thank you Visit Us Again!</p>
            <div className="mt-4 flex justify-center">
              <div className="border-2 border-black p-1 inline-block">
                <QRCodeSVG 
                  value={`${window.location.origin}${window.location.pathname}#/invoice/${sale.id}`} 
                  size={128}
                  level="H"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Powered by Restobyte Software</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicInvoicePage;