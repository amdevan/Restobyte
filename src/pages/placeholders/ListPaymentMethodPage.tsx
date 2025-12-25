
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { PaymentMethod } from '@/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { FiCreditCard, FiSave, FiCheckCircle } from 'react-icons/fi';

const ListPaymentMethodPage: React.FC = () => {
    const { paymentMethods, updatePaymentMethod } = useRestaurantData();
    const [localMethods, setLocalMethods] = useState<PaymentMethod[]>(paymentMethods);
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        setLocalMethods(paymentMethods);
    }, [paymentMethods]);

    const handleToggle = (id: string) => {
        setLocalMethods(prev => prev.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m));
    };

    const handleSave = () => {
        localMethods.forEach(method => {
            const originalMethod = paymentMethods.find(m => m.id === method.id);
            if (JSON.stringify(method) !== JSON.stringify(originalMethod)) {
                updatePaymentMethod(method);
            }
        });
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2000);
    };

    const isDirty = JSON.stringify(localMethods) !== JSON.stringify(paymentMethods);

    return (
        <div className="p-6">
            <Card>
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiCreditCard className="mr-3 text-sky-600"/>Payment Methods</h2>
                        <div className="flex items-center space-x-3 h-10">
                            {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                            <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Enable or disable payment methods available throughout the application (e.g., POS, Expense recording).</p>
                    <div className="space-y-3 border-t pt-6">
                        {localMethods.map(method => (
                            <div key={method.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">{method.name}</span>
                                <button
                                    onClick={() => handleToggle(method.id)}
                                    role="switch"
                                    aria-checked={method.isEnabled}
                                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${method.isEnabled ? 'bg-sky-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${method.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ListPaymentMethodPage;
