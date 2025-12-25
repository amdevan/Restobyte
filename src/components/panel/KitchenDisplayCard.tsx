import React, { useState, useEffect, useMemo } from 'react';
import { Sale, SaleItem } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { FiClock, FiShoppingBag, FiCoffee, FiMoreHorizontal, FiPause, FiPlay, FiRefreshCw } from 'react-icons/fi';

const formatTimeDifference = (isoTimestamp: string, now: Date): string => {
  const orderDate = new Date(isoTimestamp);
  let diffMs = now.getTime() - orderDate.getTime();
  if (diffMs < 0) diffMs = 0;

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(diffHours)}:${pad(diffMins)}:${pad(diffSecs)}`;
};

const getOrderTime = (isoTimestamp: string): string => {
    return new Date(isoTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const parseExtras = (notes?: string) => {
    if (!notes) return [];
    const addonRegex = /\+\s*([^($]+)/g;
    const matches = notes.match(addonRegex);
    return matches ? matches.map(match => match.replace('+', '').trim()) : [];
};

const generateItemId = (item: SaleItem, index: number) => `item-${item.id}-${index}-${item.name}`;
const generateExtraId = (itemId: string, extra: string, extraIndex: number) => `${itemId}-extra-${extraIndex}-${extra}`;

interface KitchenDisplayCardProps {
  order: Sale;
  onAction: (orderId: string, status: 'new' | 'ready' | 'served' | 'in-progress' | 'on-hold') => void;
}

const KitchenDisplayCard: React.FC<KitchenDisplayCardProps> = ({ order, onAction }) => {
  const { menuItems } = useRestaurantData();
  const [now, setNow] = useState(() => new Date());
  const [checkedItemIds, setCheckedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timer = useMemo(() => formatTimeDifference(order.saleDate, now), [order.saleDate, now]);
  
  const minutesElapsed = useMemo(() => {
      const diffMs = now.getTime() - new Date(order.saleDate).getTime();
      return Math.floor(diffMs / 60000);
  }, [order.saleDate, now]);

  const headerColorClass = useMemo(() => {
    if (order.kdsStatus === 'ready') return 'bg-sky-500';
    if (order.kdsStatus === 'on-hold') return 'bg-gray-500';
    if (minutesElapsed >= 15) return 'bg-red-600';
    if (minutesElapsed >= 5) return 'bg-orange-500';
    return 'bg-green-500';
  }, [minutesElapsed, order.kdsStatus]);
  
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, SaleItem[]> = {};
    order.items.forEach(item => {
        const menuItem = menuItems.find(mi => mi.id === item.id);
        const category = menuItem?.category || 'Uncategorized';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(item);
    });
    return grouped;
  }, [order.items, menuItems]);

  const totalCheckableItems = useMemo(() => {
      let count = 0;
      order.items.forEach((item, itemIndex) => {
          const extras = parseExtras(item.notes);
          if (extras.length > 0) {
              count += extras.length; // Only extras are checkable if they exist
          } else {
              count += 1; // The main item is checkable
          }
      });
      return count;
  }, [order.items]);
  
  const allItemsChecked = useMemo(() => {
    return checkedItemIds.size === totalCheckableItems;
  }, [checkedItemIds.size, totalCheckableItems]);


  const toggleCheckItem = (id: string) => {
      setCheckedItemIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
              newSet.delete(id);
          } else {
              newSet.add(id);
          }
          return newSet;
      });
  };

  const getOrderTypeIcon = () => {
      if (order.orderType === 'Dine In') return <FiCoffee size={16}/>;
      if (order.orderType === 'Delivery' || order.orderType === 'Pickup' || order.orderType === 'WhatsApp') return <FiShoppingBag size={16}/>;
      return <FiShoppingBag size={16}/>;
  }
  
  const renderFooter = () => {
    switch (order.kdsStatus) {
        case 'in-progress':
            return (
                 <div className="flex items-center space-x-2">
                    <button onClick={() => onAction(order.id, 'on-hold')} className="py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors flex items-center space-x-2">
                        <FiPause size={14}/> <span>Hold</span>
                    </button>
                    <button 
                        onClick={() => onAction(order.id, 'ready')} 
                        disabled={!allItemsChecked}
                        className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg transition-colors flex-grow flex items-center justify-center space-x-2 disabled:bg-sky-800 disabled:cursor-not-allowed">
                        <span>Mark Ready</span>
                    </button>
                </div>
            );
        case 'on-hold':
            return (
                <button onClick={() => onAction(order.id, 'in-progress')} className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2">
                   <FiPlay size={14}/> <span>Resume Order</span>
                </button>
            );
        case 'ready':
             return (
                <button onClick={() => onAction(order.id, 'in-progress')} className="w-full py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2">
                   <FiRefreshCw size={14}/> <span>Recall Order</span>
                </button>
            );
        case 'new':
        default:
            return (
                <div className="flex items-center space-x-2">
                    <button onClick={() => onAction(order.id, 'on-hold')} className="py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors flex items-center space-x-2">
                        <FiPause size={14}/> <span>Hold</span>
                    </button>
                    <button onClick={() => onAction(order.id, 'in-progress')} className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex-grow flex items-center justify-center space-x-2">
                        <FiPlay size={14}/> <span>Start Order</span>
                    </button>
                </div>
            );
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col w-80 flex-shrink-0 text-gray-800 max-h-full">
      {/* Card Header */}
      <header className={`p-2 rounded-t-lg text-white ${headerColorClass}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-2xl">{getOrderTime(order.saleDate)}</span>
            <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded-full font-mono">{timer}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {getOrderTypeIcon()}
            <span className="font-bold text-sm">#{order.id.slice(-4)}</span>
            <FiMoreHorizontal size={20}/>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1 text-xs">
            <span>{order.waiterName || 'N/A'}</span>
        </div>
      </header>

      {/* Card Body */}
      <div className="flex-grow p-3 overflow-y-auto custom-scrollbar space-y-2">
        {Object.entries(itemsByCategory).map(([category, items]) => (
            <details key={category} open className="w-full">
                <summary className="font-bold text-sm uppercase py-1 cursor-pointer select-none text-gray-700 list-none flex justify-between items-center">
                    {category}
                    <span className="text-xs transform transition-transform duration-200">▼</span>
                </summary>
                <ul className="pl-1 pt-1 space-y-2">
                    {items.map((item, index) => {
                        const itemId = generateItemId(item, index);
                        const extras = parseExtras(item.notes);
                        const hasExtras = extras.length > 0;
                         const isItemChecked = checkedItemIds.has(itemId);
                        
                        return (
                         <li key={itemId} className={`p-2 rounded-md transition-colors ${isItemChecked && !hasExtras ? 'bg-green-100' : ''}`}>
                            <label className={`flex items-start space-x-2 ${hasExtras ? '' : 'cursor-pointer'}`}>
                                <input 
                                    type="checkbox" 
                                    className={`mt-1 flex-shrink-0 ${hasExtras ? 'opacity-25' : ''}`}
                                    checked={isItemChecked}
                                    onChange={() => !hasExtras && toggleCheckItem(itemId)}
                                    disabled={order.kdsStatus !== 'in-progress'}
                                />
                                <div className="flex-1">
                                    <p className={`text-sm ${isItemChecked && !hasExtras ? 'line-through text-gray-500' : ''}`}>{item.quantity}x {item.name}</p>
                                    {hasExtras && (
                                        <ul className="text-xs text-blue-600 pl-4 mt-1 space-y-1">
                                            {extras.map((extra, extraIndex) => {
                                                const extraId = generateExtraId(itemId, extra, extraIndex);
                                                const isExtraChecked = checkedItemIds.has(extraId);
                                                return (
                                                    <li key={extraId}>
                                                        <label className="flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox"
                                                                className="mr-2"
                                                                checked={isExtraChecked}
                                                                onChange={() => toggleCheckItem(extraId)}
                                                                disabled={order.kdsStatus !== 'in-progress'}
                                                            />
                                                            <span className={isExtraChecked ? 'line-through text-gray-500' : ''}>
                                                                Extras: {extra}
                                                            </span>
                                                        </label>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </label>
                        </li>
                    )})}
                </ul>
            </details>
        ))}
      </div>

      {/* Card Footer */}
      <footer className="p-3 mt-auto flex-shrink-0 border-t">
        {renderFooter()}
      </footer>
    </div>
  );
};

export default KitchenDisplayCard;
