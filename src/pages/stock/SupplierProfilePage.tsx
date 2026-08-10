
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Purchase } from '@/types';
import Money from '@/components/common/Money';
import { FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, FiFileText, FiShoppingCart, FiCreditCard, FiDollarSign, FiArchive, FiX, FiCalendar, FiCheckCircle } from 'react-icons/fi';

const SupplierProfilePage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { suppliers, purchases, recordSupplierPayment, paymentMethods } = useRestaurantData();

  const paymentMethodOptions = useMemo(() => paymentMethods.filter(pm => pm.isEnabled).map(pm => pm.name), [paymentMethods]);

  const supplier = useMemo(() => suppliers.find(s => s.id === supplierId), [suppliers, supplierId]);

  const supplierPurchases = useMemo(() =>
    purchases.filter(p => p.supplierId === supplierId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [purchases, supplierId]
  );

  // Due = grandTotal - paidAmount
  const summary = useMemo(() => {
    const totalValue = supplierPurchases.reduce((sum, p) => sum + (p.grandTotalAmount || 0), 0);
    const totalPaid = supplierPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalDue = Math.max(0, totalValue - totalPaid);
    return { totalValue, totalPaid, totalDue };
  }, [supplierPurchases]);

  // Purchase History
  const purchaseHistory = useMemo(() => {
    return supplierPurchases.map(purchase => {
      const paid = purchase.paidAmount || 0;
      const due = Math.max(0, purchase.grandTotalAmount - paid);
      const status = due <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
      return { ...purchase, paid, due, status };
    });
  }, [supplierPurchases]);

  // Payment History
  const allPayments = useMemo(() => {
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

  // Payment Modal State
  const [payingPurchase, setPayingPurchase] = useState<Purchase | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState(paymentMethodOptions[0] || 'Cash');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleOpenPayModal = (purchase: Purchase) => {
    const due = purchase.grandTotalAmount - (purchase.paidAmount || 0);
    setPayingPurchase(purchase);
    setPayAmount(due > 0 ? due.toFixed(2) : '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod(paymentMethodOptions[0] || 'Cash');
    setPayReference('');
    setPayNotes('');
  };

  const handleClosePayModal = () => {
    setPayingPurchase(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPurchase) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    setIsSubmitting(true);
    try {
      await recordSupplierPayment(payingPurchase.id, amount, payDate, payMethod, payReference || undefined, payNotes || undefined);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      handleClosePayModal();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const payingDue = payingPurchase ? payingPurchase.grandTotalAmount - (payingPurchase.paidAmount || 0) : 0;

  if (!supplier) {
    return (
      <div className="p-6 text-center">
        <FiArchive size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg font-medium">Supplier not found.</p>
        <button
          onClick={() => navigate('/app/stock/suppliers')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors"
        >
          <FiArrowLeft size={14} /> Back to Suppliers
        </button>
      </div>
    );
  }

  const statusColor = (status: string) => {
    if (status === 'Paid') return 'bg-green-100 text-green-700';
    if (status === 'Partial') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
          <FiCheckCircle className="text-green-600 w-5 h-5" />
          <span className="text-green-800 font-medium">Payment recorded successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/stock/suppliers')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiUser className="mr-3 text-sky-600" /> {supplier.name}
          </h1>
        </div>
        {summary.totalDue > 0 && (
          <button
            onClick={() => {
              // Find first purchase with dues
              const duePurchase = purchaseHistory.find(p => p.due > 0);
              if (duePurchase) handleOpenPayModal(duePurchase as Purchase);
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
          >
            <FiDollarSign className="w-4 h-4" />
            Pay Due (<Money amount={summary.totalDue} />)
          </button>
        )}
      </div>

      {/* Supplier Info + Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FiUser size={14} className="text-sky-600" /> Supplier Details
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
        </div>

        {/* Summary Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center mx-auto mb-2">
              <FiShoppingCart className="w-5 h-5 text-sky-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{supplierPurchases.length}</p>
            <p className="text-xs text-gray-500">Total Purchases</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
              <FiDollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600"><Money amount={summary.totalValue} /></p>
            <p className="text-xs text-gray-500">Total Value</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <FiCreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600"><Money amount={summary.totalPaid} /></p>
            <p className="text-xs text-gray-500">Total Paid</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${summary.totalDue > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <FiDollarSign className={`w-5 h-5 ${summary.totalDue > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${summary.totalDue > 0 ? 'text-red-600' : 'text-green-600'}`}><Money amount={summary.totalDue} /></p>
            <p className="text-xs text-gray-500">Total Due</p>
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <FiShoppingCart size={14} className="text-sky-600" /> Purchase History
          </h2>
        </div>
        {purchaseHistory.length === 0 ? (
          <div className="text-center py-12">
            <FiArchive size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No purchases found for this supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Purchase #</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase">Total</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase">Paid</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase">Due</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchaseHistory.map(p => (
                  <tr key={p.id} className="hover:bg-sky-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-sky-600">{p.purchaseNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 text-right font-medium"><Money amount={p.grandTotalAmount} /></td>
                    <td className="py-3 px-4 text-sm text-green-600 text-right font-medium"><Money amount={p.paid} /></td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      {p.due > 0 ? <span className="text-red-600"><Money amount={p.due} /></span> : <span className="text-green-600 text-xs">Clear</span>}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.due > 0 && (
                        <button
                          onClick={() => handleOpenPayModal(p as Purchase)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <FiDollarSign size={12} /> Pay Due
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <FiCreditCard size={14} className="text-sky-600" /> Payment History
          </h2>
        </div>
        {allPayments.length === 0 ? (
          <div className="text-center py-12">
            <FiArchive size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No payments recorded for this supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Purchase #</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Method</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase">Amount</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Reference</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allPayments.map(txn => (
                  <tr key={txn.id} className="hover:bg-sky-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm text-sky-600 font-medium">{txn.purchaseNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium">{txn.method}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-green-600 text-right font-medium"><Money amount={txn.amount} /></td>
                    <td className="py-3 px-4 text-sm text-gray-500">{txn.reference || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 max-w-[200px] truncate">{txn.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Due Modal */}
      {payingPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClosePayModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiDollarSign size={18} className="text-green-600" />
                Pay Supplier Due
              </h2>
              <button onClick={handleClosePayModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={18} />
              </button>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Purchase</span>
                <span className="font-medium text-sky-600">{payingPurchase.purchaseNumber}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Total</span>
                <span className="font-medium"><Money amount={payingPurchase.grandTotalAmount} /></span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Already Paid</span>
                <span className="font-medium text-green-600"><Money amount={payingPurchase.paidAmount || 0} /></span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-red-600 pt-1 border-t border-gray-200">
                <span>Due Amount</span>
                <Money amount={payingDue} />
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  max={payingDue}
                  step="0.01"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                  required
                  autoFocus
                />
                {parseFloat(payAmount) > 0 && parseFloat(payAmount) < payingDue && (
                  <p className="text-xs text-gray-500 mt-1">
                    Remaining after payment: <Money amount={payingDue - (parseFloat(payAmount) || 0)} />
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <FiCalendar className="inline w-3.5 h-3.5 mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                    required
                  >
                    {paymentMethodOptions.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference</label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="e.g., Transaction ID, Cheque #"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional payment notes"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClosePayModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg shadow-green-200"
                >
                  <FiCheckCircle size={14} />
                  {isSubmitting ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierProfilePage;
