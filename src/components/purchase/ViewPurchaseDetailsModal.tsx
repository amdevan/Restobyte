
import React from 'react';
import { Purchase } from '../../types';
import Money from '../common/Money';
import { FiUser, FiCalendar, FiFileText, FiHash, FiPackage, FiX } from 'react-icons/fi';

interface ViewPurchaseDetailsModalProps {
  purchase: Purchase | null;
  onClose: () => void;
}

const ViewPurchaseDetailsModal: React.FC<ViewPurchaseDetailsModalProps> = ({ purchase, onClose }) => {
  if (!purchase) return null;

  return (
    <div className="space-y-5">
      {/* Order Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <FiHash size={12} className="text-sky-600" /> PO #
          </span>
          <p className="text-sm font-semibold text-sky-700 mt-1">{purchase.purchaseNumber}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <FiCalendar size={12} className="text-sky-600" /> Date
          </span>
          <p className="text-sm font-medium text-gray-800 mt-1">{new Date(purchase.date).toLocaleDateString()}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <FiUser size={12} className="text-sky-600" /> Supplier
          </span>
          <p className="text-sm font-medium text-gray-800 mt-1">{purchase.supplierName || 'N/A'}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <FiFileText size={12} className="text-sky-600" /> Invoice #
          </span>
          <p className="text-sm font-medium text-gray-800 mt-1">{purchase.supplierInvoiceNumber || '-'}</p>
        </div>
      </div>

      {/* Notes */}
      {purchase.notes && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
          <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Notes</span>
          <p className="text-sm text-amber-800 mt-1 whitespace-pre-wrap">{purchase.notes}</p>
        </div>
      )}

      {/* Payment Info */}
      {(purchase.paymentMethod || purchase.paymentStatus) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {purchase.paymentMethod && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</span>
              <p className="text-sm font-medium text-gray-800 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                  {purchase.paymentMethod}
                </span>
              </p>
            </div>
          )}
          {purchase.paymentStatus && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
              <p className="text-sm font-medium mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  purchase.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                  purchase.paymentStatus === 'Partial' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {purchase.paymentStatus}
                </span>
              </p>
            </div>
          )}
          {purchase.paidAmount !== undefined && purchase.paidAmount > 0 && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</span>
              <p className="text-sm font-medium text-gray-800 mt-1"><Money amount={purchase.paidAmount} /></p>
            </div>
          )}
        </div>
      )}

      {/* Items Table */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FiPackage size={13} className="text-sky-600" />
          Items Purchased
          <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {purchase.items.length}
          </span>
        </h4>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase">#</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase">Item</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase hidden sm:table-cell">Category</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-600 uppercase">Qty</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-600 uppercase hidden sm:table-cell">Cost/Unit</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-600 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchase.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{index + 1}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-gray-800">{item.itemName}</span>
                    <span className="text-xs text-gray-500 ml-1 hidden sm:inline">({item.unit})</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-gray-700">{item.quantityPurchased}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600 hidden sm:table-cell"><Money amount={item.costPerUnit} /></td>
                  <td className="py-2.5 px-3 text-right font-semibold text-gray-800"><Money amount={item.subTotal} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Summary */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <Money amount={purchase.subTotalAmount} />
        </div>
        {purchase.taxAmount !== undefined && purchase.taxAmount > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span>+ <Money amount={purchase.taxAmount} /></span>
          </div>
        )}
        {purchase.discountAmount !== undefined && purchase.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>- <Money amount={purchase.discountAmount} /></span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-sky-700 pt-2 border-t border-gray-200">
          <span>Grand Total</span>
          <Money amount={purchase.grandTotalAmount} />
        </div>
      </div>

      {/* Close Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200"
        >
          <FiX size={14} />
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewPurchaseDetailsModal;
