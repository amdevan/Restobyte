import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { StockItem as StockItemType, StockAdjustmentItem as StockAdjustmentItemType, StockAdjustmentType } from '@/types';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiTrendingUp, FiTrendingDown, FiSliders, FiInfo, FiAlertTriangle, FiCheck, FiSearch, FiCheckCircle } from 'react-icons/fi';

interface StockAdjustmentLine {
  id: string;
  stockItemId: string;
  adjustmentType: StockAdjustmentType;
  quantity: string;
  reasonForItem?: string;
  showDropdown: boolean;
}

const ADJUSTMENT_TYPES: { value: StockAdjustmentType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'Increase', label: 'Increase', icon: <FiTrendingUp size={13} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-300 shadow-sm' },
  { value: 'Decrease', label: 'Decrease', icon: <FiTrendingDown size={13} />, color: 'text-red-600 bg-red-50 border-red-300 shadow-sm' },
  { value: 'SetTo', label: 'Set To', icon: <FiSliders size={13} />, color: 'text-blue-600 bg-blue-50 border-blue-300 shadow-sm' },
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
  const [showSuccess, setShowSuccess] = useState(false);

  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      dropdownRefs.current.forEach((ref, id) => {
        if (ref && !ref.contains(target)) {
          setAdjustmentLines(prev => prev.map(l => l.id === id ? { ...l, showDropdown: false } : l));
        }
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddLine = () => {
    if (stockItems.length === 0) {
      alert("No stock items available. Please add stock items first via 'Add Stock Entry'.");
      return;
    }
    setAdjustmentLines([
      ...adjustmentLines,
      {
        id: Date.now().toString(),
        stockItemId: stockItems[0]?.id || '',
        adjustmentType: 'Decrease',
        quantity: '',
        reasonForItem: '',
        showDropdown: false,
      },
    ]);
  };

  const handleRemoveLine = (lineId: string) => {
    setAdjustmentLines(adjustmentLines.filter(line => line.id !== lineId));
  };

  const handleLineChange = (lineId: string, field: keyof StockAdjustmentLine, value: string | boolean) => {
    setAdjustmentLines(
      adjustmentLines.map(line => (line.id === lineId ? { ...line, [field]: value } : line))
    );
  };

  const selectStockItem = (lineId: string, stockItem: StockItemType) => {
    setAdjustmentLines(prev => prev.map(l =>
      l.id === lineId ? { ...l, stockItemId: stockItem.id, showDropdown: false } : l
    ));
  };

  const getStockItemInfo = (stockItemId: string): StockItemType | undefined => {
    return stockItems.find(item => item.id === stockItemId);
  };

  const getProjectedQuantity = (line: StockAdjustmentLine): number | null => {
    const item = getStockItemInfo(line.stockItemId);
    const qty = parseFloat(line.quantity);
    if (!item || isNaN(qty)) return null;
    switch (line.adjustmentType) {
      case 'Increase': return item.quantity + qty;
      case 'Decrease': return Math.max(0, item.quantity - qty);
      case 'SetTo': return qty;
      default: return null;
    }
  };

  const getStockLevel = (item: StockItemType) => {
    if (item.quantity <= 0) return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Out' };
    if (item.quantity <= (item.lowStockThreshold || 0)) return { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Low' };
    return { color: 'bg-green-100 text-green-700 border-green-200', label: 'OK' };
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
        alert(`Please enter a valid quantity for ${line.adjustmentType === 'SetTo' ? 'Set To' : line.adjustmentType}.`);
        return;
      }

      const stockItemInfo = getStockItemInfo(line.stockItemId);
      if (!stockItemInfo) {
        alert('Invalid stock item selected.');
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

    setAdjustmentDate(new Date().toISOString().split('T')[0]);
    setOverallReason(OVERALL_REASONS[0]);
    setOverallNotes('');
    setAdjustmentLines([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-200">
              <FiSliders className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stock Adjustments</h1>
              <p className="text-sm text-gray-500">Manually adjust stock quantities for corrections, damage, or other reasons.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 animate-slide-in">
            <FiCheckCircle className="text-green-600 w-5 h-5" />
            <span className="text-green-800 font-medium">Stock adjustment saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Adjustment Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <FiInfo className="w-3.5 h-3.5" />
                Adjustment Details
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                    required
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={overallReason}
                    onChange={(e) => setOverallReason(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                    required
                  >
                    {OVERALL_REASONS.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
                  <input
                    type="text"
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    placeholder="e.g., Monthly stock count"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items to Adjust */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <FiSliders className="w-3.5 h-3.5" />
                Items to Adjust
                {adjustmentLines.length > 0 && (
                  <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                    {adjustmentLines.length}
                  </span>
                )}
              </h2>
            </div>

            {stockItems.length === 0 && (
              <div className="mx-6 mt-4 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <FiAlertTriangle className="text-amber-500 shrink-0" size={20} />
                <p className="text-sm text-amber-700">No stock items found. Please add items via <strong>Stock Entry</strong> first.</p>
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {adjustmentLines.map((line) => {
                const selectedStockItem = getStockItemInfo(line.stockItemId);
                const projected = getProjectedQuantity(line);
                const level = selectedStockItem ? getStockLevel(selectedStockItem) : null;

                return (
                  <div key={line.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    {/* Main row: Item | Type | Qty | Delete */}
                    <div className="flex items-center gap-2">
                      {/* Item Selector with Search */}
                      <div
                        className="flex-1 min-w-0 relative"
                        ref={(el) => { if (el) dropdownRefs.current.set(line.id, el); }}
                      >
                        <div className="relative">
                          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <button
                            type="button"
                            onClick={() => handleLineChange(line.id, 'showDropdown', !line.showDropdown)}
                            className="w-full pl-8 pr-8 py-2.5 text-sm text-left border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white truncate"
                          >
                            {selectedStockItem ? (
                              <span className="text-gray-900">
                                {selectedStockItem.name} <span className="text-gray-400">({selectedStockItem.category})</span> — <span className="font-medium">{selectedStockItem.quantity} {selectedStockItem.unit}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">Select item...</span>
                            )}
                          </button>
                          <FiSliders className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        {line.showDropdown && (
                          <div className="absolute z-30 left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {stockItems.map(item => {
                              const lv = getStockLevel(item);
                              return (
                                <div
                                  key={item.id}
                                  className={`px-3 py-2.5 cursor-pointer hover:bg-sky-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors ${
                                    line.stockItemId === item.id ? 'bg-sky-50' : ''
                                  }`}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectStockItem(line.id, item);
                                  }}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FiSearch className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                                    <span className="text-xs text-gray-400 hidden sm:inline">({item.category})</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${lv.color}`}>
                                      {item.quantity} {item.unit}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Adjustment Type Toggle */}
                      <div className="flex gap-1 flex-shrink-0">
                        {ADJUSTMENT_TYPES.map(type => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleLineChange(line.id, 'adjustmentType', type.value)}
                            className={`flex items-center gap-1 px-2.5 py-2.5 text-xs font-medium rounded-xl border transition-all ${
                              line.adjustmentType === type.value
                                ? type.color
                                : 'text-gray-400 bg-white border-gray-200 hover:border-gray-300 hover:text-gray-600'
                            }`}
                            title={type.label}
                          >
                            {type.icon}
                            <span className="hidden md:inline">{type.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Quantity */}
                      <div className="w-20 flex-shrink-0">
                        <input
                          type="number"
                          value={line.quantity}
                          min={line.adjustmentType === 'SetTo' ? "0" : "0.01"}
                          step="0.01"
                          onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white text-center font-medium"
                          required
                        />
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remove item"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                    {/* Sub row: Current stock + Projected + Reason */}
                    <div className="flex items-center gap-3 mt-2 ml-8 flex-wrap">
                      {/* Current stock */}
                      {selectedStockItem && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">Current:</span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${level?.color || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {selectedStockItem.quantity} {selectedStockItem.unit}
                          </span>
                        </div>
                      )}

                      {/* Arrow + Projected */}
                      {projected !== null && (
                        <div className="flex items-center gap-1.5">
                          <FiCheck size={11} className="text-gray-400" />
                          <span className="text-xs text-gray-400">After:</span>
                          <span className={`text-xs font-bold ${
                            projected <= 0 ? 'text-red-600' :
                            projected <= (selectedStockItem?.lowStockThreshold || 0) ? 'text-amber-600' :
                            'text-green-600'
                          }`}>
                            {projected} {selectedStockItem?.unit}
                          </span>
                        </div>
                      )}

                      {/* Reason input */}
                      <input
                        type="text"
                        value={line.reasonForItem || ''}
                        onChange={(e) => handleLineChange(line.id, 'reasonForItem', e.target.value)}
                        placeholder="Reason (optional)"
                        className="flex-1 min-w-[150px] px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {adjustmentLines.length === 0 && stockItems.length > 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-400 mb-3">No items added yet. Click below to start adjusting stock.</p>
              </div>
            )}

            {/* Add Item Button */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
              <button
                type="button"
                onClick={handleAddLine}
                disabled={stockItems.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPlus className="w-4 h-4" />
                Add Item Line
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={stockItems.length === 0 || adjustmentLines.length === 0}
              className="flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-600 rounded-xl hover:from-sky-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-200 transition-all"
            >
              <FiSave className="w-4 h-4" />
              {`Save Adjustment (${adjustmentLines.length} item${adjustmentLines.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentsPage;
