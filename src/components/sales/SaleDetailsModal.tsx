import React from 'react';
import { Sale } from '../../types';
import Button from '../common/Button';
import { FiXCircle, FiPrinter, FiUser, FiGrid, FiClock, FiTag, FiDollarSign, FiList, FiTruck } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons'; // Import IconBaseProps

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

const DetailRow: React.FC<{ label: string; value?: string | number | null; icon?: React.ReactElement<IconBaseProps>; className?: string }> = ({ label, value, icon, className = '' }) => (
  <div className={`flex items-start py-1.5 ${className}`}>
    {icon && <span className="mr-2 text-sky-600 mt-0.5">{React.cloneElement(icon, { size: icon.props.size || 15 })}</span>}
    <span className="font-medium text-gray-600 w-32">{label}:</span>
    <span className="text-gray-800 flex-1">{value || '-'}</span>
  </div>
);


const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({ isOpen, onClose, sale }) => {
  if (!isOpen || !sale) return null;

  const handlePrintReceipt = () => {
    alert("Printing receipt (simulated)...");
    // This would typically use the ReceiptModal logic or a direct print CSS and window.print()
  };

  return (
    <div className="text-sm text-gray-700 max-h-[75vh] flex flex-col">
      <div className="space-y-3 pb-4 border-b mb-4 flex-grow overflow-y-auto custom-scrollbar pr-2">
        <h4 className="text-lg font-semibold text-sky-700 mb-2">Order Summary - #{sale.id.slice(-6).toUpperCase()}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <DetailRow label="Date & Time" value={new Date(sale.saleDate).toLocaleString()} icon={<FiClock />} />
            <DetailRow label="Order Type" value={sale.orderType} icon={<FiTag />} />
            <DetailRow label="Customer" value={sale.customerName || 'Walk-in'} icon={<FiUser />} />
            {sale.orderType === "Dine In" && (
                <>
                    <DetailRow label="Table" value={sale.assignedTableName} icon={<FiGrid />} />
                    <DetailRow label="PAX" value={String(sale.pax || '-')} icon={<FiUser />} />
                    <DetailRow label="Waiter" value={sale.waiterName} icon={<FiUser />} />
                </>
            )}
             {sale.orderType === "Delivery" && (
                <DetailRow label="Delivery Partner" value={sale.deliveryPartnerName} icon={<FiTruck />} />
            )}
            <DetailRow label="Payment Method" value={sale.paymentMethod} icon={<FiDollarSign />} />
        </div>

        {sale.orderNotes && (
            <div className="mt-2">
                <p className="font-medium text-gray-600 flex items-center"><FiList className="mr-2 text-sky-600"/>Order Notes:</p>
                <p className="text-gray-700 bg-gray-50 p-2 rounded-md mt-1 text-xs whitespace-pre-wrap">{sale.orderNotes}</p>
            </div>
        )}

        <h5 className="text-md font-semibold text-sky-600 mt-4 pt-3 border-t">Items Sold ({sale.items.length})</h5>
        <div className="flow-root">
            <ul className="-my-2 divide-y divide-gray-200">
            {sale.items.map((item, index) => (
                <li key={`${item.id}-${index}`} className="py-2.5 flex justify-between items-center">
                    <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">
                        {item.quantity} x ${item.price.toFixed(2)}
                        </p>
                    </div>
                    <p className="font-medium text-gray-700">${(item.price * item.quantity).toFixed(2)}</p>
                </li>
            ))}
            </ul>
        </div>
        
        <div className="mt-4 pt-4 border-t space-y-1">
            <DetailRow label="Subtotal" value={`$${sale.subTotal.toFixed(2)}`} className="font-medium"/>
            {sale.taxDetails.map(tax => (
                <DetailRow key={tax.id} label={`${tax.name} (${tax.rate}%)`} value={`$${tax.amount.toFixed(2)}`} />
            ))}
            <DetailRow label="Grand Total" value={`$${sale.totalAmount.toFixed(2)}`} className="text-lg font-bold text-sky-700" icon={<FiDollarSign size={16}/>}/>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t flex justify-end space-x-3">
        <Button onClick={handlePrintReceipt} variant="secondary" leftIcon={<FiPrinter />}>
          Print Receipt
        </Button>
        <Button onClick={onClose} variant="primary" leftIcon={<FiXCircle />}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default SaleDetailsModal;
