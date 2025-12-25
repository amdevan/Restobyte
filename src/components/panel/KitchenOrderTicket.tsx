import React, { useState, useEffect, useMemo } from 'react';
import { Sale } from '../../types';
import { FiClock, FiFileText, FiCoffee, FiTruck, FiShoppingBag } from 'react-icons/fi';

const formatTimeDifference = (isoTimestamp: string): string => {
  const orderDate = new Date(isoTimestamp);
  const now = new Date();
  let diffMs = now.getTime() - orderDate.getTime();
  if (diffMs < 0) diffMs = 0;

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(diffHours)}:${pad(diffMins)}:${pad(diffSecs)}`;
};

interface KitchenOrderTicketProps {
  order: Sale;
  onAction: (orderId: string, status: 'new' | 'ready' | 'served') => void;
  isNew?: boolean;
}

const KitchenOrderTicket: React.FC<KitchenOrderTicketProps> = ({ order, onAction, isNew = false }) => {
  const [timer, setTimer] = useState(formatTimeDifference(order.saleDate));
  const [minutesElapsed, setMinutesElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(formatTimeDifference(order.saleDate));
      const diffMs = new Date().getTime() - new Date(order.saleDate).getTime();
      setMinutesElapsed(Math.floor(diffMs / 60000));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.saleDate]);

  const borderColorClass = useMemo(() => {
    if (minutesElapsed >= 10) return 'border-red-500';
    if (minutesElapsed >= 5) return 'border-amber-500';
    return 'border-green-500';
  }, [minutesElapsed]);

  const orderTypeConfig = {
    'Dine In': { icon: <FiCoffee size={14} />, text: order.assignedTableName || 'Dine In' },
    'Delivery': { icon: <FiTruck size={14} />, text: 'Delivery' },
    'Pickup': { icon: <FiShoppingBag size={14} />, text: 'Pickup' },
    'WhatsApp': { icon: <FiShoppingBag size={14} />, text: 'WhatsApp' },
  };

  const { icon, text } = orderTypeConfig[order.orderType as keyof typeof orderTypeConfig] || orderTypeConfig['Pickup'];
  
  const isReadyState = order.kdsStatus === 'ready';
  
  const actionButton = {
      ready: {
          text: 'Mark as Served',
          handler: () => onAction(order.id, 'served'),
          className: 'bg-sky-600 hover:bg-sky-700',
      },
      new: {
          text: 'Mark as Ready',
          handler: () => onAction(order.id, 'ready'),
          className: 'bg-green-600 hover:bg-green-700',
      },
  };
  
  const currentAction = isReadyState ? actionButton.ready : actionButton.new;

  return (
    <div className={`bg-gray-50 rounded-lg shadow-lg flex flex-col h-full border-l-[3px] ${borderColorClass} text-gray-800 ${isNew ? 'new-order-pulse' : ''}`}>
      <header className="bg-gray-100 p-1.5 rounded-t-md border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm font-bold text-gray-900">
            <span className="mr-2">{icon}</span>
            <h3 className="truncate">{text}</h3>
          </div>
          <div className="flex items-center text-xs font-semibold text-gray-700 bg-white px-1.5 py-0.5 rounded-full shadow-sm">
            <FiClock size={12} className="mr-1.5" />
            <span className="font-mono">{timer}</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-0.5">
          <span>Order #{order.id.slice(-6).toUpperCase()}</span>
          <span>Waiter: {order.waiterName || 'N/A'}</span>
        </div>
      </header>

      <ul className="flex-grow p-1.5 space-y-1 overflow-y-auto custom-scrollbar">
        {order.items.map((item, index) => (
          <li key={`${item.id}-${index}`} className="p-1.5 bg-white rounded-md shadow-sm border border-gray-200">
            <div className="flex items-start">
              <span className="text-lg font-bold text-sky-700 mr-2">{item.quantity}x</span>
              <div className="flex-grow">
                <p className="font-medium text-xs text-gray-900 leading-tight">{item.name}</p>
                {item.notes && (
                  <p className="text-xs text-red-600 italic flex items-start mt-1 bg-red-50 p-1 rounded">
                    <FiFileText size={12} className="mr-1.5 mt-0.5 flex-shrink-0" />
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <footer className="p-1.5 mt-auto flex-shrink-0">
        <button
          onClick={currentAction.handler}
          className={`w-full py-1.5 text-white font-bold rounded-lg transition-colors text-sm ${currentAction.className}`}
        >
          {currentAction.text}
        </button>
      </footer>
    </div>
  );
};

export default KitchenOrderTicket;
