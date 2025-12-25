import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { ApplicationSettings } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiSave, FiCheckCircle, FiSettings, FiGlobe, FiPrinter, FiShoppingCart } from 'react-icons/fi';

const AppSettingsPage: React.FC = () => {
    const { applicationSettings, updateApplicationSettings, customers } = useRestaurantData();
    const [localSettings, setLocalSettings] = useState<ApplicationSettings>(applicationSettings);
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        setLocalSettings(applicationSettings);
    }, [applicationSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Handle number inputs specifically
        const numericFields = ['decimalPlaces', 'kotCharactersPerLine'];
        if (numericFields.includes(name)) {
            setLocalSettings(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setLocalSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = () => {
        updateApplicationSettings(localSettings);
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    const isDirty = JSON.stringify(localSettings) !== JSON.stringify(applicationSettings);
    
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <FiSettings className="mr-3 text-sky-600"/> Application Settings
                </h1>
                <div className="flex items-center space-x-3 h-10">
                    {showSavedMessage && (
                        <span className="text-green-600 flex items-center text-sm">
                            <FiCheckCircle className="mr-1.5"/>Saved!
                        </span>
                    )}
                    <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Localization Settings Card */}
            <Card title="Localization & Formatting" icon={<FiGlobe />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                    <div>
                        <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                        <select id="dateFormat" name="dateFormat" value={localSettings.dateFormat} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                            <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
                        <select id="timeFormat" name="timeFormat" value={localSettings.timeFormat} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="12h">12-hour</option>
                            <option value="24h">24-hour</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="currencySymbolPosition" className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol Position</label>
                        <select id="currencySymbolPosition" name="currencySymbolPosition" value={localSettings.currencySymbolPosition} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="before">Before Amount (e.g., $100)</option>
                            <option value="after">After Amount (e.g., 100$)</option>
                        </select>
                    </div>
                    <Input label="Decimal Places" name="decimalPlaces" type="number" value={localSettings.decimalPlaces} onChange={handleInputChange} min="0" max="4" containerClassName="mb-0"/>
                </div>
            </Card>

            {/* Print Settings Card */}
            <Card title="Print Settings" icon={<FiPrinter />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                     <Input label="KOT Characters Per Line" name="kotCharactersPerLine" type="number" value={localSettings.kotCharactersPerLine} onChange={handleInputChange} min="20" max="80" containerClassName="mb-0"/>
                </div>
                <p className="text-xs text-gray-500 p-4 pt-0">Set the number of characters per line for Kitchen Order Ticket (KOT) printers to ensure proper formatting.</p>
            </Card>
            
            {/* POS Default Settings */}
            <Card title="POS Defaults" icon={<FiShoppingCart />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    <div>
                        <label htmlFor="defaultWalkInCustomerId" className="block text-sm font-medium text-gray-700 mb-1">Default Customer</label>
                        <select id="defaultWalkInCustomerId" name="defaultWalkInCustomerId" value={localSettings.defaultWalkInCustomerId} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                           {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select the customer to be used by default for new POS orders.</p>
                    </div>
                    <div>
                        <label htmlFor="defaultOrderType" className="block text-sm font-medium text-gray-700 mb-1">Default Order Type</label>
                        <select id="defaultOrderType" name="defaultOrderType" value={localSettings.defaultOrderType} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                           <option value="Dine In">Dine In</option>
                           <option value="Delivery">Delivery</option>
                           <option value="Pickup">Pickup</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">The default order type when the POS screen is opened.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default AppSettingsPage;