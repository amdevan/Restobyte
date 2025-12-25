
import React from 'react';
import { WasteRecord, WasteItem } from '../../types';
import Button from '../common/Button';
import { FiXCircle, FiCalendar, FiUser, FiInfo, FiTag, FiDollarSign, FiEdit3, FiList } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons'; // Import IconBaseProps

interface ViewWasteRecordDetailsModalProps {
  wasteRecord: WasteRecord | null;
  onClose: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; icon?: React.ReactElement<IconBaseProps>; className?: string }> = ({ label, value, icon, className = '' }) => (
  <div className={`py-1.5 ${className}`}>
    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
      {icon && React.cloneElement(icon, { size: 13, className: "mr-1.5 text-sky-600"})}
      {label}
    </span>
    <p className="text-gray-800 text-sm mt-0.5">{value === undefined || value === null || String(value).trim() === '' ? '-' : String(value)}</p>
  </div>
);

const ViewWasteRecordDetailsModal: React.FC<ViewWasteRecordDetailsModalProps> = ({ wasteRecord, onClose }) => {
  if (!wasteRecord) return null;

  return (
    <div className="text-sm text-gray-700 max-h-[80vh] flex flex-col">
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4">
        <h3 className="text-xl font-semibold text-sky-700 mb-3 flex items-center">
          <FiInfo size={22} className="mr-2"/> Waste Record Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 bg-gray-50 rounded-lg border">
          <DetailItem label="Record ID" value={wasteRecord.id.slice(-8).toUpperCase()} icon={<FiInfo />} />
          <DetailItem label="Date" value={new Date(wasteRecord.date).toLocaleDateString()} icon={<FiCalendar />} />
          <DetailItem label="Overall Reason" value={wasteRecord.reason} icon={<FiTag />} />
          <DetailItem label="Responsible Person" value={wasteRecord.responsiblePerson} icon={<FiUser />} />
        </div>
        
        {wasteRecord.notes && (
          <div className="mt-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                <FiList size={13} className="mr-1.5 text-sky-600"/> Overall Notes
            </h4>
            <p className="text-gray-700 bg-gray-100 p-2 rounded-md mt-1 text-xs whitespace-pre-wrap">{wasteRecord.notes}</p>
          </div>
        )}

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2 border-b pb-1">Items Wasted ({wasteRecord.items.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {wasteRecord.items.map((item, index) => (
              <div key={item.stockItemId + '-' + index} className="p-2.5 border rounded-md hover:bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-800">{item.stockItemName}</span>
                  {item.costAtTimeOfWaste !== undefined && (
                    <span className="text-xs text-red-500">
                      Est. Item Loss: ${(item.quantityWasted * item.costAtTimeOfWaste).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Qty Wasted: {item.quantityWasted} {item.unit}
                  {item.costAtTimeOfWaste !== undefined && ` @ $${item.costAtTimeOfWaste.toFixed(2)}/${item.unit}`}
                </div>
                {item.reasonForItem && (
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                        <FiEdit3 size={11} className="mr-1 text-gray-400"/> Reason: {item.reasonForItem}
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {wasteRecord.totalEstimatedLoss !== undefined && (
          <div className="mt-4 pt-3 border-t text-right">
            <DetailItem 
                label="Total Estimated Loss" 
                value={`$${wasteRecord.totalEstimatedLoss.toFixed(2)}`} 
                className="flex justify-between items-center text-lg font-bold text-red-600" 
                icon={<FiDollarSign size={16}/>}
            />
          </div>
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

export default ViewWasteRecordDetailsModal;
