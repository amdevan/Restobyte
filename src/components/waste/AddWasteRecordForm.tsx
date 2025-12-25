
import React, { useState, useEffect } from 'react';
import { StockItem, WasteItem } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2, FiSave, FiXCircle, FiCalendar, FiUser, FiInfo, FiDollarSign, FiEdit } from 'react-icons/fi';

interface AddWasteRecordFormProps {
  onClose: () => void;
  onSubmit: (data: {
    reason: string;
    responsiblePerson?: string;
    notes?: string;
    items: WasteItem[];
  }) => void;
}

const WASTE_REASONS = ["Spoilage", "Expired", "Damaged Goods", "Cooking Error", "Contamination", "Over Production", "Customer Complaint", "Testing", "Other"];

const AddWasteRecordForm: React.FC<AddWasteRecordFormProps> = ({ onClose, onSubmit }) => {
  const { stockItems } = useRestaurantData();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState(WASTE_REASONS[0]);
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [overallNotes, setOverallNotes] = useState('');
  const [wasteItems, setWasteItems] = useState<Array<Partial<WasteItem> & { id: string; stockItemDetails?: StockItem }>>([]);
  
  const [customReason, setCustomReason] = useState('');


  useEffect(() => {
    if (stockItems.length > 0 && wasteItems.length === 0) {
        // Optionally add an initial empty line if desired UX
        // handleAddWasteItemLine(); 
    }
  }, [stockItems, wasteItems.length]);

  const handleAddWasteItemLine = () => {
    setWasteItems([...wasteItems, { id: Date.now().toString() }]);
  };

  const handleRemoveWasteItemLine = (lineId: string) => {
    setWasteItems(wasteItems.filter(line => line.id !== lineId));
  };

  const handleWasteItemChange = (lineId: string, field: keyof WasteItem, value: string | number) => {
    setWasteItems(prevLines => prevLines.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value };
        if (field === 'stockItemId') {
          const selectedStockItem = stockItems.find(si => si.id === value);
          updatedLine.stockItemDetails = selectedStockItem;
          updatedLine.stockItemName = selectedStockItem?.name;
          updatedLine.unit = selectedStockItem?.unit;
          // Auto-fill cost if available, but allow override
          if (selectedStockItem?.costPerUnit !== undefined && updatedLine.costAtTimeOfWaste === undefined) {
            updatedLine.costAtTimeOfWaste = selectedStockItem.costPerUnit;
          }
        }
        return updatedLine;
      }
      return line;
    }));
  };
  
  const totalEstimatedLoss = wasteItems.reduce((sum, item) => {
    const qty = Number(item.quantityWasted) || 0;
    const cost = Number(item.costAtTimeOfWaste) || 0;
    return sum + (qty * cost);
  }, 0);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wasteItems.length === 0) {
      alert('Please add at least one item to the waste record.');
      return;
    }

    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
        alert('Please provide a reason for the waste.');
        return;
    }

    const processedItems: WasteItem[] = [];
    for (const line of wasteItems) {
      if (!line.stockItemId || !line.stockItemName || !line.unit || !line.quantityWasted || Number(line.quantityWasted) <= 0) {
        alert('Please ensure all waste items have a selected stock item and a valid positive quantity.');
        return;
      }
      const selectedStockItem = stockItems.find(si => si.id === line.stockItemId);
      if (selectedStockItem && Number(line.quantityWasted) > selectedStockItem.quantity) {
        alert(`Quantity wasted for "${line.stockItemName}" (${line.quantityWasted}) cannot exceed available stock (${selectedStockItem.quantity}).`);
        return;
      }
      processedItems.push({
        stockItemId: line.stockItemId,
        stockItemName: line.stockItemName,
        quantityWasted: Number(line.quantityWasted),
        unit: line.unit,
        costAtTimeOfWaste: line.costAtTimeOfWaste !== undefined && String(line.costAtTimeOfWaste).trim() !== '' ? Number(line.costAtTimeOfWaste) : selectedStockItem?.costPerUnit,
        reasonForItem: line.reasonForItem?.trim() || undefined,
      });
    }

    onSubmit({
      reason: finalReason,
      responsiblePerson: responsiblePerson.trim() || undefined,
      notes: overallNotes.trim() || undefined,
      items: processedItems,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date of Waste"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          leftIcon={<FiCalendar />}
        />
        <div>
          <label htmlFor="wasteReason" className="block text-sm font-medium text-gray-700 mb-1">Overall Reason *</label>
          <select
            id="wasteReason"
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (e.target.value !== 'Other') setCustomReason(''); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            required
          >
            {WASTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {reason === 'Other' && (
             <Input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify other reason"
                className="mt-2"
                required
            />
          )}
        </div>
      </div>
      
      <Input
        label="Responsible Person (Optional)"
        value={responsiblePerson}
        onChange={(e) => setResponsiblePerson(e.target.value)}
        placeholder="e.g., Chef John, Manager Sarah"
        leftIcon={<FiUser />}
      />

      <div>
        <h4 className="text-md font-medium text-gray-700 mb-2 border-b pb-1">Wasted Items</h4>
        {wasteItems.map((line, index) => (
          <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-3 gap-y-2 items-start p-3 border rounded-md mb-3 bg-gray-50/50">
            <div className="md:col-span-3">
              <label htmlFor={`stockItem-${line.id}`} className="block text-xs font-medium text-gray-600 mb-0.5">Stock Item *</label>
              <select
                id={`stockItem-${line.id}`}
                value={line.stockItemId || ''}
                onChange={(e) => handleWasteItemChange(line.id, 'stockItemId', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required
              >
                <option value="" disabled>Select item</option>
                {stockItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category}) - Avail: {item.quantity} {item.unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Qty Wasted *"
                type="number"
                id={`qtyWasted-${line.id}`}
                value={String(line.quantityWasted || '')}
                onChange={(e) => handleWasteItemChange(line.id, 'quantityWasted', e.target.value)}
                min="0.01"
                step="any"
                placeholder="e.g., 2.5"
                containerClassName="mb-0 text-xs"
                className="py-1.5"
                required
              />
            </div>
            <div className="md:col-span-1 pt-5 text-xs text-gray-600">
              {line.stockItemDetails?.unit || 'Unit'}
            </div>
            <div className="md:col-span-2">
              <Input
                label="Cost/Unit (Est.)"
                type="number"
                id={`costWasted-${line.id}`}
                value={String(line.costAtTimeOfWaste === undefined ? '' : line.costAtTimeOfWaste)}
                onChange={(e) => handleWasteItemChange(line.id, 'costAtTimeOfWaste', e.target.value)}
                min="0"
                step="0.01"
                placeholder={line.stockItemDetails?.costPerUnit?.toFixed(2) || "e.g., 1.50"}
                containerClassName="mb-0 text-xs"
                className="py-1.5"
              />
            </div>
            <div className="md:col-span-3">
               <Input
                label="Item Reason (Opt.)"
                id={`itemReason-${line.id}`}
                value={line.reasonForItem || ''}
                onChange={(e) => handleWasteItemChange(line.id, 'reasonForItem', e.target.value)}
                placeholder="e.g., Dropped"
                containerClassName="mb-0 text-xs"
                className="py-1.5"
              />
            </div>
            <div className="md:col-span-1 flex items-center justify-end pt-4">
              <Button
                type="button" variant="danger" size="sm"
                onClick={() => handleRemoveWasteItemLine(line.id)}
                className="p-1.5 aspect-square" aria-label="Remove Item"
              >
                <FiTrash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={handleAddWasteItemLine} leftIcon={<FiPlus />} size="sm" disabled={stockItems.length === 0}>
          Add Wasted Item
        </Button>
        {stockItems.length === 0 && <p className="text-xs text-amber-600 mt-1">No stock items available to record as waste. Add stock entries first.</p>}
      </div>
      
      <div className="pt-2 border-t">
        <p className="text-sm font-medium text-right">Total Estimated Loss: <span className="text-red-600">${totalEstimatedLoss.toFixed(2)}</span></p>
      </div>

      <div>
        <label htmlFor="wasteNotes" className="block text-sm font-medium text-gray-700 mb-1">Overall Notes (Optional)</label>
        <textarea
          id="wasteNotes"
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="e.g., Power outage caused spoilage in fridge."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />} disabled={stockItems.length === 0 && wasteItems.length === 0}>
          Record Waste
        </Button>
      </div>
    </form>
  );
};

export default AddWasteRecordForm;
