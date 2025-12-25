
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { FiUsers, FiSave, FiCheckCircle } from 'react-icons/fi';

const OrderReceivingUserPage: React.FC = () => {
  const { employees, websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const { orderReceivingUserIds } = websiteSettings;
  
  const [selectedIds, setSelectedIds] = useState<string[]>(orderReceivingUserIds);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setSelectedIds(orderReceivingUserIds);
  }, [orderReceivingUserIds]);

  const activeEmployees = employees.filter(emp => emp.isActive).sort((a,b) => a.name.localeCompare(b.name));

  const handleSelectionChange = (employeeId: string) => {
    setSelectedIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => setSelectedIds(activeEmployees.map(emp => emp.id));
  const handleDeselectAll = () => setSelectedIds([]);

  const handleSave = () => {
    updateWebsiteSettings({ orderReceivingUserIds: selectedIds });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };
  
  const isDirty = JSON.stringify([...selectedIds].sort()) !== JSON.stringify([...orderReceivingUserIds].sort());

  return (
    <div className="p-6">
      <Card title="Online Order Receiving Users" icon={<FiUsers />}>
        <div className="p-4 border-t">
          <p className="text-sm text-gray-500 mb-4">
            Select which employees should be notified when a new online order is received.
          </p>
          <div className="flex justify-between items-center mb-4">
            <div className="space-x-2">
                 <Button onClick={handleSelectAll} variant="secondary" size="sm">Select All</Button>
                 <Button onClick={handleDeselectAll} variant="secondary" size="sm">Deselect All</Button>
            </div>
            <div className="h-6">
                {showSavedMessage && (
                  <div className="flex items-center text-green-600">
                    <FiCheckCircle size={16} className="mr-2" />
                    <span className="text-sm font-medium">Changes saved!</span>
                  </div>
                )}
            </div>
            <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
          <div className="space-y-2 border rounded-lg p-2 max-h-[50vh] overflow-y-auto">
            {activeEmployees.length > 0 ? (
              activeEmployees.map(emp => (
                <label key={emp.id} className="flex items-center p-3 hover:bg-gray-100 rounded-md cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    checked={selectedIds.includes(emp.id)}
                    onChange={() => handleSelectionChange(emp.id)}
                  />
                  <img 
                    src={emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`}
                    alt={emp.name}
                    className="w-10 h-10 rounded-full object-cover ml-4 mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.designation}</p>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">No active employees found.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderReceivingUserPage;
