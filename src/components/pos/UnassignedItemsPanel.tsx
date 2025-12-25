import React, { useState } from 'react';
import { SaleItem, Split } from '../../types';
import Button from '../common/Button';
import { FiPlusCircle, FiArrowRight } from 'react-icons/fi';

interface UnassignedItemsPanelProps {
  items: SaleItem[];
  splits: Split[];
  onMoveItem: (item: SaleItem, targetSplitId: string) => void;
  onAddSplit: () => void;
}

const UnassignedItemsPanel: React.FC<UnassignedItemsPanelProps> = ({ items, splits, onMoveItem, onAddSplit }) => {
  const [targetSplits, setTargetSplits] = useState<Record<string, string>>({});

  const handleSelectChange = (itemKey: string, targetSplitId: string) => {
    setTargetSplits(prev => ({ ...prev, [itemKey]: targetSplitId }));
  };

  const handleMoveClick = (itemKey: string, item: SaleItem) => {
    const targetSplitId = targetSplits[itemKey];
    if (targetSplitId) {
      onMoveItem(item, targetSplitId);
      setTargetSplits(prev => {
        const newTargets = { ...prev };
        delete newTargets[itemKey];
        return newTargets;
      });
    }
  };


  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Unassigned Items</h3>
      <div className="space-y-2 max-h-[25vh] overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <p className="text-sm text-green-600 p-4 text-center bg-green-50 rounded-lg">All items assigned!</p>
        ) : (
          items.map((item, index) => {
            const itemKey = `${item.id}-${item.notes || 'none'}-${index}`;
            return (
              <div key={itemKey} className="p-2 border rounded-md bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{item.quantity}x {item.name}</p>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                  </div>
                  {splits.length > 0 && (
                    <div className="flex items-center space-x-2">
                       <select
                        value={targetSplits[itemKey] || ''}
                        onChange={(e) => handleSelectChange(itemKey, e.target.value)}
                        className="p-1 border rounded-md text-xs bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="" disabled>Move to...</option>
                        {splits.map((split, splitIndex) => (
                          <option key={split.id} value={split.id}>
                            Split {splitIndex + 1}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="!p-1.5 aspect-square"
                        onClick={() => handleMoveClick(itemKey, item)}
                        disabled={!targetSplits[itemKey]}
                        title="Move item"
                      >
                        <FiArrowRight size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <Button onClick={onAddSplit} leftIcon={<FiPlusCircle />} className="w-full mt-4">
        Add New Split
      </Button>
    </div>
  );
};

export default UnassignedItemsPanel;