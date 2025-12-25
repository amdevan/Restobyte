


import React, { useState } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { StockItem as StockItemType, StockAdjustmentItem as StockAdjustmentItemType, StockAdjustmentType } from '@/types';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiEdit3, FiTrendingUp, FiTrendingDown, FiSliders } from 'react-icons/fi';

interface StockAdjustmentLine {
  id: string; // Temporary client-side ID
  stockItemId: string;
  adjustmentType: StockAdjustmentType;
  quantity: string;
  reasonForItem?: string;
}

const ADJUSTMENT_TYPES: { value: StockAdjustmentType; label: string }[] = [
  { value: 'Increase', label: 'Increase Quantity By' },
  { value: 'Decrease', label: 'Decrease Quantity By' },
  { value: 'SetTo', label: 'Set Quantity To' },
];

const OVERALL_REASONS = ["Spoilage", "Damage", "Theft", "Internal Use", "Count Correction", "Promotion", "Other"];

const StockAdjustmentsPage: React.FC = () => {
  const { stockItems, addStockAdjustment, getSingleActiveOutlet } = useRestaurantData();
  const navigate = useNavigate();
  const outlet = getSingleActiveOutlet();

  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [overallReason, setOverallReason] = useState(OVERALL_REASONS[0]);
  const [overallNotes, setOverallNotes] = useState('');
  const [adjustmentLines, setAdjustmentLines] = useState<StockAdjustmentLine[]>([]);

  const handleAddLine = () => {
    if (stockItems.length === 0) {
      alert("No stock items available to adjust. Please add stock items first through 'Add Stock Entry'.");
      return;
    }
    setAdjustmentLines([
      ...adjustmentLines,
      {
        id: Date.now().toString(),
        stockItemId: stockItems[0]?.id || '', // Default to first stock item or empty if none
        adjustmentType: 'Decrease',
        quantity: '',
        reasonForItem: '',
      },
    ]);
  };

  const handleRemoveLine = (lineId: string) => {
    setAdjustmentLines(adjustmentLines.filter(line => line.id !== lineId));
  };

  const handleLineChange = (lineId: string, field: keyof StockAdjustmentLine, value: string) => {
    setAdjustmentLines(
      adjustmentLines.map(line => (line.id === lineId ? { ...line, [field]: value } : line))
    );
  };

  const getStockItemInfo = (stockItemId: string): StockItemType | undefined => {
    return stockItems.find(item => item.id === stockItemId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!outlet) {
      alert('An active outlet must be selected to perform this action.');
      return;
    }

    if (adjustmentLines.length === 0) {
      alert('Please add at least one item to adjust.');
      return;
    }

    const processedAdjustmentItems: StockAdjustmentItemType[] = [];
    for (const line of adjustmentLines) {
      if (!line.stockItemId || !line.quantity.trim()) {
        alert('Please select a stock item and enter a quantity for all lines.');
        return;
      }
      const quantityValue = parseFloat(line.quantity);
      if (isNaN(quantityValue) || (line.adjustmentType !== 'SetTo' && quantityValue <= 0) || (line.adjustmentType === 'SetTo' && quantityValue < 0)) {
        alert(`Please enter a valid positive quantity for ${line.adjustmentType === 'SetTo' ? 'Set Quantity To' : 'Increase/Decrease'}.`);
        return;
      }
      
      const stockItemInfo = getStockItemInfo(line.stockItemId);
      if (!stockItemInfo) {
        alert(`Invalid stock item selected for one of the lines.`);
        return;
      }

      processedAdjustmentItems.push({
        stockItemId: line.stockItemId,
        stockItemName: stockItemInfo.name,
        unit: stockItemInfo.unit,
        adjustmentType: line.adjustmentType,
        quantity: quantityValue,
        reasonForItem: line.reasonForItem?.trim() || undefined,
      });
    }

    addStockAdjustment({
      overallReason,
      overallNotes: overallNotes.trim() || undefined,
      items: processedAdjustmentItems,
      outletId: outlet.id,
    });

    alert('Stock adjustment saved successfully!');
    setAdjustmentDate(new Date().toISOString().split('T')[0]);
    setOverallReason(OVERALL_REASONS[0]);
    setOverallNotes('');
    setAdjustmentLines([]);
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <div className="p-5">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <FiSliders className="mr-3 text-sky-600" /> Stock Adjustments
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Adjustment Date"
                type="date"
                value={adjustmentDate}
                onChange={(e) => setAdjustmentDate(e.target.value)}
                required
              />
              <div>
                <label htmlFor="overallReason" className="block text-sm font-medium text-gray-700 mb-1">Overall Reason *</label>
                <select
                  id="overallReason"
                  value={overallReason}
                  onChange={(e) => setOverallReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  required
                >
                  {OVERALL_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            </div>
             <div>
                <label htmlFor="overallNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Notes (Optional)
                </label>
                <textarea
                    id="overallNotes"
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    placeholder="e.g., Monthly check, End of day reconciliation"
                />
            </div>


            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Items to Adjust</h3>
              {adjustmentLines.map((line, index) => {
                const selectedStockItem = getStockItemInfo(line.stockItemId);
                return (
                  <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end p-3 border rounded-md bg-gray-50/50">
                    <div className="md:col-span-4">
                      <label htmlFor={`stockItem-${line.id}`} className="block text-xs font-medium text-gray-600 mb-0.5">Stock Item *</label>
                      <select
                        id={`stockItem-${line.id}`}
                        value={line.stockItemId}
                        onChange={(e) => handleLineChange(line.id, 'stockItemId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
                        required
                      >
                        <option value="" disabled>Select Item</option>
                        {stockItems.map(item => (
                          <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
                        ))}
                      </select>
                      {selectedStockItem && <p className="text-xs text-gray-500 mt-0.5">Current: {selectedStockItem.quantity} {selectedStockItem.unit}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor={`adjustmentType-${line.id}`} className="block text-xs font-medium text-gray-600 mb-0.5">Adjustment Type *</label>
                        <select
                            id={`adjustmentType-${line.id}`}
                            value={line.adjustmentType}
                            onChange={(e) => handleLineChange(line.id, 'adjustmentType', e.target.value as StockAdjustmentType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
                            required
                        >
                            {ADJUSTMENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <Input
                            label="Quantity *"
                            type="number"
                            id={`quantity-${line.id}`}
                            value={line.quantity}
                            min={line.adjustmentType === 'SetTo' ? "0" : "0.01"}
                            step="0.01"
                            onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)}
                            placeholder="e.g., 2 or 5.5"
                            containerClassName="mb-0"
                            required
                        />
                    </div>
                     <div className="md:col-span-3">
                        <Input
                            label="Reason for Item (Opt.)"
                            value={line.reasonForItem || ''}
                            onChange={(e) => handleLineChange(line.id, 'reasonForItem', e.target.value)}
                            placeholder="e.g., Damaged, Used for testing"
                            containerClassName="mb-0"
                        />
                    </div>
                    <div className="md:col-span-1 flex items-center justify-end pt-3 md:pt-0">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-2"
                        aria-label="Remove item line"
                      >
                        <FiTrash2 size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Button type="button" variant="secondary" onClick={handleAddLine} leftIcon={<FiPlus />} className="mt-2" disabled={stockItems.length === 0}>
                Add Item Line
              </Button>
               {stockItems.length === 0 && <p className="text-sm text-amber-600">No stock items found. Please add items via 'Add Stock Entry' first.</p>}
            </div>

            <div className="flex items-center justify-start space-x-3 pt-4 border-t mt-6">
              <Button type="submit" variant="primary" leftIcon={<FiSave size={18}/>} disabled={stockItems.length === 0 && adjustmentLines.length === 0}>
                Save Adjustment
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} leftIcon={<FiArrowLeft size={18}/>}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default StockAdjustmentsPage;