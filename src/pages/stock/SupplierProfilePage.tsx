
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, FiFileText, FiShoppingCart, FiCreditCard, FiDollarSign } from 'react-icons/fi';

const SupplierProfilePage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { suppliers, purchases, recordSupplierPayment } = useRestaurantData();

  const supplier = useMemo(() => suppliers.find(s => s.id === supplierId), [suppliers, supplierId]);

  const supplierPurchases = useMemo(() =>
    purchases.filter(p => p.supplierId === supplierId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [purchases, supplierId]
  );

  const summary = useMemo(() => {
    const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.grandTotalAmount || 0), 0);
    const totalPaid = supplierPurchases.reduce((sum, p) => {
      const paidFromPayments = (p.payments || []).reduce((ps, pay) => ps + (pay.amountPaid || 0), 0);
      return sum + (p.paidAmount || 0) + paidFromPayments;
    }, 0);
    const totalDue = Math.max(0, totalPurchases - totalPaid);
    const totalTransactions = supplierPurchases.reduce((sum, p) => sum + (p.payments?.length || 0), 0);
    return { totalPurchases, totalPaid, totalDue, totalTransactions };
  }, [supplierPurchases]);

  const allTransactions = useMemo(() => {
    const txns: Array<{
      id: string;
      date: string;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
      purchaseNumber: string;
      purchaseId: string;
    }> = [];
    for (const purchase of supplierPurchases) {
      if (purchase.paidAmount && purchase.paidAmount > 0) {
        txns.push({
          id: `${purchase.id}-initial`,
          date: purchase.date,
          amount: purchase.paidAmount,
          method: 'Initial Payment',
          purchaseNumber: purchase.purchaseNumber,
          purchaseId: purchase.id,
        });
      }
      for (const payment of purchase.payments || []) {
        txns.push({
          id: payment.id,
          date: payment.paymentDate,
          amount: payment.amountPaid,
          method: payment.paymentMethod,
          reference: payment.reference,
          notes: payment.notes,
          purchaseNumber: purchase.purchaseNumber,
          purchaseId: purchase.id,
        });
      }
    }
    return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [supplierPurchases]);

  if (!supplier) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 text-lg">Supplier not found.</p>
        <Button onClick={() => navigate('/app/stock/suppliers')} variant="primary" className="mt-4">
          Back to Suppliers
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/app/stock/suppliers')} variant="secondary" size="sm">
          <FiArrowLeft className="mr-1" /> Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiUser className="mr-3 text-sky-600" /> {supplier.name}
        </h1>
      </div>

      {/* Supplier Info + Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Details */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiUser className="mr-2 text-sky-600" /> Supplier Details
          </h2>
          <div className="space-y-3">
            {supplier.contactPerson && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-28">Contact Person:</span>
                <span className="text-gray-800 font-medium">{supplier.contactPerson}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2 text-sm">
                <FiPhone className="text-gray-400 w-4" />
                <a href={`tel:${supplier.phone}`} className="text-sky-600 hover:underline">{supplier.phone}</a>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2 text-sm">
                <FiMail className="text-gray-400 w-4" />
                <a href={`mailto:${supplier.email}`} className="text-sky-600 hover:underline">{supplier.email}</a>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-2 text-sm">
                <FiMapPin className="text-gray-400 w-4 mt-0.5" />
                <span className="text-gray-700">{supplier.address}</span>
              </div>
            )}
            {supplier.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FiFileText className="text-gray-400 w-4 mt-0.5" />
                <span className="text-gray-600 italic">{supplier.notes}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="text-center">
            <FiShoppingCart className="mx-auto text-blue-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-800">{supplierPurchases.length}</p>
            <p className="text-xs text-gray-500">Total Purchases</p>
          </Card>
          <Card className="text-center">
            <FiDollarSign className="mx-auto text-green-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-green-600">NPR {summary.totalPurchases.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Value</p>
          </Card>
          <Card className="text-center">
            <FiCreditCard className="mx-auto text-sky-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-sky-600">NPR {summary.totalPaid.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Paid</p>
          </Card>
          <Card className="text-center">
            <FiDollarSign className={`mx-auto mb-2 ${summary.totalDue > 0 ? 'text-red-500' : 'text-green-500'}`} size={24} />
            <p className={`text-2xl font-bold ${summary.totalDue > 0 ? 'text-red-600' : 'text-green-600'}`}>NPR {summary.totalDue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Due</p>
          </Card>
        </div>
      </div>

      {/* Purchase History */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FiShoppingCart className="mr-2 text-sky-600" /> Purchase History
        </h2>
        {supplierPurchases.length === 0 ? (
          <div className="text-center py-8">
            <FiShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No purchases found for this supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase #</th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-gray-500 uppercase">Due</th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {supplierPurchases.map(purchase => {
                  const paidFromPayments = (purchase.payments || []).reduce((sum, p) => sum + (p.amountPaid || 0), 0);
                  const totalPaid = (purchase.paidAmount || 0) + paidFromPayments;
                  const due = Math.max(0, purchase.grandTotalAmount - totalPaid);
                  const status = due <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';
                  const statusColor = due <= 0 ? 'bg-green-100 text-green-700' : totalPaid > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-sm font-medium text-sky-600">{purchase.purchaseNumber}</td>
                      <td className="py-2.5 px-3 text-sm text-gray-600">{new Date(purchase.date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 text-sm text-gray-600">{purchase.supplierInvoiceNumber || '-'}</td>
                      <td className="py-2.5 px-3 text-sm text-gray-800 text-right font-medium">NPR {purchase.grandTotalAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-sm text-green-600 text-right">NPR {totalPaid.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-sm text-right font-medium">{due > 0 ? <span className="text-red-600">NPR {due.toLocaleString()}</span> : <span className="text-green-600">NPR 0</span>}</td>
                      <td className="py-2.5 px-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Transaction / Payment History */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FiCreditCard className="mr-2 text-sky-600" /> Payment History
        </h2>
        {allTransactions.length === 0 ? (
          <div className="text-center py-8">
            <FiCreditCard size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No transactions found for this supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase #</th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {allTransactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-sm text-gray-600">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 text-sm text-sky-600 font-medium">{txn.purchaseNumber}</td>
                    <td className="py-2.5 px-3 text-sm text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{txn.method}</span>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-green-600 text-right font-medium">NPR {txn.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-sm text-gray-500">{txn.reference || '-'}</td>
                    <td className="py-2.5 px-3 text-sm text-gray-500 max-w-[200px] truncate">{txn.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SupplierProfilePage;
