
import React from 'react';
import { Purchase, PurchaseItem } from '../../types';
import Button from '../common/Button';
import { FiXCircle, FiInfo, FiList, FiUser, FiCalendar, FiFileText, FiHash, FiDollarSign } from 'react-icons/fi';

interface ViewPurchaseDetailsModalProps {
  purchase: Purchase | null;
  onClose: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number; icon?: React.ReactElement<{ size?: number | string; className?: string }>; className?: string }> = ({ label, value, icon, className = '' }) => (
  <div className={`py-1.5 ${className}`}>
    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
      {icon && React.cloneElement(icon, { size: 13, className: "mr-1.5 text-sky-600"})}
      {label}
    </span>
    <p className="text-gray-800 text-sm mt-0.5">{value || '-'}</p>
  </div>
);

const ViewPurchaseDetailsModal: React.FC<ViewPurchaseDetailsModalProps> = ({ purchase, onClose }) => {
  if (!purchase) return null;

  return (
    <div className="text-sm text-gray-700 max-h-[80vh] flex flex-col">
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4">
        <h3 className="text-xl font-semibold text-sky-700 mb-3 flex items-center">
          <FiInfo size={22} className="mr-2"/> Purchase Order Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 bg-gray-50 rounded-lg border">
          <DetailItem label="Purchase Order #" value={purchase.purchaseNumber} icon={<FiHash />} />
          <DetailItem label="Date" value={new Date(purchase.date).toLocaleDateString()} icon={<FiCalendar />} />
          <DetailItem label="Supplier" value={purchase.supplierName || 'N/A'} icon={<FiUser />} />
          <DetailItem label="Supplier Invoice #" value={purchase.supplierInvoiceNumber} icon={<FiFileText />} />
        </div>
        
        {purchase.notes && (
          <div className="mt-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                <FiList size={13} className="mr-1.5 text-sky-600"/> Notes
            </h4>
            <p className="text-gray-700 bg-gray-100 p-2 rounded-md mt-1 text-xs whitespace-pre-wrap">{purchase.notes}</p>
          </div>
        )}

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2 border-b pb-1">Items Purchased ({purchase.items.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {purchase.items.map((item, index) => (
              <div key={item.id || index} className="p-2.5 border rounded-md hover:bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-800">{item.itemName}</span>
                  <span className="text-xs text-gray-500">Subtotal: ${item.subTotal.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Qty: {item.quantityPurchased} {item.unit} &nbsp;&bull;&nbsp; Cost/Unit: ${item.costPerUnit.toFixed(2)}
                </div>
                 <div className="text-xs text-gray-500 mt-0.5">
                  Category: {item.category} &nbsp;&bull;&nbsp; Low Stock Th.: {item.lowStockThreshold} {item.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t text-right space-y-1">
          <DetailItem label="Subtotal" value={`$${purchase.subTotalAmount.toFixed(2)}`} className="flex justify-between items-center" />
          {purchase.taxAmount !== undefined && (
            <DetailItem label="Tax" value={`$${purchase.taxAmount.toFixed(2)}`} className="flex justify-between items-center" />
          )}
          {purchase.discountAmount !== undefined && (
            <DetailItem label="Discount" value={`-$${purchase.discountAmount.toFixed(2)}`} className="flex justify-between items-center text-green-600" />
          )}
          <DetailItem label="Grand Total" value={`$${purchase.grandTotalAmount.toFixed(2)}`} className="flex justify-between items-center text-lg font-bold text-sky-700" icon={<FiDollarSign size={16}/>}/>
        </div>
        
        {purchase.stockEntryId && (
            <p className="text-xs text-gray-500 mt-3 text-center">
                Corresponds to Stock Entry ID: <code className="bg-gray-200 px-1 rounded">{purchase.stockEntryId.slice(0,15)}...</code>
            </p>
        )}

      </div>
      <div className="mt-auto pt-4 border-t flex justify-end">
        <Button onClick={onClose} variant="primary" leftIcon={<FiXCircle />}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default ViewPurchaseDetailsModal;
