

import React from 'react';
import { Customer, Table, Waiter, DeliveryPartner } from '../../types';
import Button from '../common/Button';
import { FiUser, FiGrid, FiTruck, FiShoppingBag, FiEdit2, FiUsers, FiMessageSquare } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';

type OrderType = 'Dine In' | 'Delivery' | 'Pickup' | 'WhatsApp';

interface CartHeaderProps {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  selectedCustomer: Customer | null;
  selectedTable: Table | null;
  selectedWaiter: Waiter | null;
  onCustomerSelectClick: () => void;
  onTableSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onWaiterSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  tables: Table[];
  waiters: Waiter[];
  deliveryPartners: DeliveryPartner[];
  selectedDeliveryPartner: DeliveryPartner | null;
  onDeliveryPartnerSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const CartHeader: React.FC<CartHeaderProps> = ({
  orderType,
  setOrderType,
  selectedCustomer,
  selectedTable,
  selectedWaiter,
  onCustomerSelectClick,
  onTableSelect,
  onWaiterSelect,
  tables,
  waiters,
  deliveryPartners,
  selectedDeliveryPartner,
  onDeliveryPartnerSelect
}) => {
    const { getSingleActiveOutlet } = useRestaurantData();
    const currentOutlet = getSingleActiveOutlet();
    const isCloudKitchen = currentOutlet?.outletType === 'CloudKitchen';

  return (
    <div className="flex-shrink-0">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
        {!isCloudKitchen && <Button size="sm" variant={orderType === 'Dine In' ? 'primary' : 'secondary'} className="!rounded-md flex-1" onClick={() => setOrderType('Dine In')} leftIcon={<FiGrid size={14}/>}>Dine In</Button>}
        <Button size="sm" variant={orderType === 'Delivery' ? 'primary' : 'secondary'} className="!rounded-md flex-1" onClick={() => setOrderType('Delivery')} leftIcon={<FiTruck size={14}/>}>Delivery</Button>
        <Button size="sm" variant={orderType === 'Pickup' ? 'primary' : 'secondary'} className="!rounded-md flex-1" onClick={() => setOrderType('Pickup')} leftIcon={<FiShoppingBag size={14}/>}>Pickup</Button>
        <Button size="sm" variant={orderType === 'WhatsApp' ? 'primary' : 'secondary'} className="!rounded-md flex-1" onClick={() => setOrderType('WhatsApp')} leftIcon={<FiMessageSquare size={14}/>}>WhatsApp</Button>
      </div>

      <div className="p-3 bg-sky-50 rounded-lg mb-3 border border-sky-100">
        <div className="flex justify-between items-center">
            <div className="flex items-center">
                <FiUser className="mr-2 text-sky-700"/>
                <span className="font-semibold text-sky-800 text-sm">{selectedCustomer?.name || 'Walk-in Customer'}</span>
            </div>
            <button onClick={onCustomerSelectClick} className="text-xs text-sky-600 hover:underline">Change</button>
        </div>
      </div>

      {orderType === 'Dine In' && !isCloudKitchen && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select value={selectedTable?.id || ''} onChange={onTableSelect} className="p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500">
            <option value="">Select Table</option>
            {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={selectedWaiter?.id || ''} onChange={onWaiterSelect} className="w-full p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500">
            <option value="">Select Waiter</option>
            {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      )}

      {orderType === 'Delivery' && (
         <div className="mb-3">
            <select value={selectedDeliveryPartner?.id || ''} onChange={onDeliveryPartnerSelect} className="w-full p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500">
              <option value="">Select Delivery Partner</option>
              {deliveryPartners.map(dp => <option key={dp.id} value={dp.id}>{dp.name}</option>)}
            </select>
         </div>
      )}
    </div>
  );
};

export default CartHeader;
