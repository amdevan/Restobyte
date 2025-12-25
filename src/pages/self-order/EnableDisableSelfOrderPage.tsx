
import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import { FiSmartphone, FiCheckCircle } from 'react-icons/fi';

const EnableDisableSelfOrderPage: React.FC = () => {
  const { isSelfOrderEnabled, setSelfOrderStatus } = useRestaurantData();
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const handleToggle = () => {
    const newStatus = !isSelfOrderEnabled;
    setSelfOrderStatus(newStatus);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card title="Self-Order Settings" icon={<FiSmartphone />}>
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Enable Self-Ordering</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                When enabled, customers can scan table QR codes to view the menu and place orders directly from their own devices.
              </p>
            </div>
            
            {/* Custom Toggle Switch */}
            <button
              onClick={handleToggle}
              role="switch"
              aria-checked={isSelfOrderEnabled}
              className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
                isSelfOrderEnabled ? 'bg-sky-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
                  isSelfOrderEnabled ? 'translate-x-8' : 'translate-x-1'
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

export default EnableDisableSelfOrderPage;
