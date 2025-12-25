

import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import FeatureDisabledPage from '@/components/common/FeatureDisabledPage';
import { FiSave, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';

const WhatsappSettingsPage: React.FC = () => {
    const { getSingleActiveOutlet, updateOutlet } = useRestaurantData();
    const outlet = getSingleActiveOutlet();

    const [isEnabled, setIsEnabled] = useState(false);
    const [number, setNumber] = useState('');
    const [message, setMessage] = useState('');
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        if (outlet) {
            setIsEnabled(outlet.whatsappOrderingEnabled || false);
            setNumber(outlet.whatsappNumber || outlet.phone || '');
            setMessage(outlet.whatsappDefaultMessage || `Hello! I would like to place an order from {restaurantName}.`);
        }
    }, [outlet]);

    const handleSave = () => {
        if (!outlet) return;
        updateOutlet({
            ...outlet,
            whatsappOrderingEnabled: isEnabled,
            whatsappNumber: number,
            whatsappDefaultMessage: message,
        });
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    if (!outlet) {
        return <FeatureDisabledPage type="selectOutlet" featureName="WhatsApp Settings" />;
    }
    
    const isDirty = (isEnabled !== (outlet.whatsappOrderingEnabled || false)) || 
                    (number !== (outlet.whatsappNumber || outlet.phone || '')) || 
                    (message !== (outlet.whatsappDefaultMessage || `Hello! I would like to place an order from {restaurantName}.`));

    return (
        <div className="p-6">
            <Card>
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiMessageSquare className="mr-3 text-sky-600"/>WhatsApp Settings</h2>
                        <div className="flex items-center space-x-3 h-10">
                            {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                            <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Manage settings for receiving orders via WhatsApp.</p>
                    
                    <div className="space-y-6 border-t pt-6">
                        {/* Enable/Disable Toggle */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <h3 className="font-medium text-gray-800">Enable WhatsApp Ordering</h3>
                                <p className="text-xs text-gray-500">Allow customers to place orders directly through WhatsApp.</p>
                            </div>
                            <button
                                onClick={() => setIsEnabled(!isEnabled)}
                                role="switch"
                                aria-checked={isEnabled}
                                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${isEnabled ? 'bg-sky-600' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        
                        <div className={`space-y-4 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <Input
                                label="WhatsApp Number (with country code)"
                                value={number}
                                onChange={e => setNumber(e.target.value)}
                                placeholder="e.g., +15551234567"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Default Message Template</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={4}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">Use <code className="bg-gray-200 px-1 rounded">{'{restaurantName}'}</code> as a placeholder for the restaurant's name.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default WhatsappSettingsPage;
