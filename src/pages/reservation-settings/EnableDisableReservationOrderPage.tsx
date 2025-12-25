import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import { FiBookmark, FiCheckCircle } from 'react-icons/fi';

const EnableDisableReservationOrderPage: React.FC = () => {
  const { isReservationOrderEnabled, setReservationOrderStatus } = useRestaurantData();
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const handleToggle = () => {
    const newStatus = !isReservationOrderEnabled;
    setReservationOrderStatus(newStatus);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card title="Reservation Order Settings" icon={<FiBookmark />}>
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Enable Orders via Reservations</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                When enabled, customers with a reservation can pre-order food items. This setting works in conjunction with the main Reservation system.
              </p>
            </div>
            
            {/* Custom Toggle Switch */}
            <button
              onClick={handleToggle}
              role="switch"
              aria-checked={isReservationOrderEnabled}
              className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
                isReservationOrderEnabled ? 'bg-sky-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
                  isReservationOrderEnabled ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="mt-4 h-6">
            {showSavedMessage && (
              <div className="flex items-center text-green-600 transition-opacity duration-300 ease-in-out opacity-100">
                <FiCheckCircle size={16} className="mr-2" />
                <span className="text-sm font-medium">Settings saved!</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EnableDisableReservationOrderPage;