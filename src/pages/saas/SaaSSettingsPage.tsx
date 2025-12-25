

import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaaSSettings } from '@/types';
import { FiSliders, FiKey, FiFileText, FiCreditCard, FiSave, FiCheckCircle } from 'react-icons/fi';

const SaaSSettingsPage: React.FC = () => {
    const { saasSettings, updateSaaSSettings } = useRestaurantData();
    const [localSettings, setLocalSettings] = useState<SaaSSettings>(saasSettings);
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        setLocalSettings(saasSettings);
    }, [saasSettings]);

    const handleNestedChange = <
        S extends keyof SaaSSettings, 
        F extends keyof SaaSSettings[S]
    >(
        section: S,
        field: F,
        value: string | boolean,
        subField?: keyof SaaSSettings[S][F]
    ) => {
        setLocalSettings(prev => {
            const newSection = { ...prev[section] };
            if (subField) {
                // This structure assumes a two-level nesting like paymentGateways -> stripe -> publicKey
                const newField = { ...(newSection as any)[field] };
                newField[subField] = value;
                (newSection as any)[field] = newField;
            } else {
                (newSection as any)[field] = value;
            }
            return { ...prev, [section]: newSection };
        });
    };

    const handleSave = () => {
        updateSaaSSettings(localSettings);
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    const isDirty = JSON.stringify(localSettings) !== JSON.stringify(saasSettings);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FiSliders className="mr-3" /> SaaS Platform Settings
                </h1>
                 <div className="flex items-center space-x-3">
                    {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                    <Button onClick={handleSave} disabled={!isDirty} leftIcon={<FiSave/>}>
                        Save All Changes
                    </Button>
                </div>
            </div>

            <Card title="Billing & Subscriptions" icon={<FiCreditCard />}>
                <div className="p-4 space-y-6">
                    <div>
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h3 className="text-md font-semibold text-gray-700">Stripe</h3>
                            <button
                                type="button"
                                onClick={() => handleNestedChange('paymentGateways', 'stripe', !localSettings.paymentGateways.stripe.isEnabled, 'isEnabled')}
                                role="switch"
                                aria-checked={localSettings.paymentGateways.stripe.isEnabled}
                                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${localSettings.paymentGateways.stripe.isEnabled ? 'bg-sky-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${localSettings.paymentGateways.stripe.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className={`space-y-4 transition-opacity ${!localSettings.paymentGateways.stripe.isEnabled && 'opacity-50 pointer-events-none'}`}>
                            <Input
                                label="Stripe Public Key"
                                value={localSettings.paymentGateways.stripe.publicKey}
                                onChange={(e) => handleNestedChange('paymentGateways', 'stripe', e.target.value, 'publicKey')}
                                placeholder="pk_live_..."
                                disabled={!localSettings.paymentGateways.stripe.isEnabled}
                            />
                            <Input
                                label="Stripe Secret Key"
                                type="password"
                                value={localSettings.paymentGateways.stripe.secretKey}
                                onChange={(e) => handleNestedChange('paymentGateways', 'stripe', e.target.value, 'secretKey')}
                                placeholder="sk_live_..."
                                disabled={!localSettings.paymentGateways.stripe.isEnabled}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                             <h3 className="text-md font-semibold text-gray-700">Khalti</h3>
                            <button
                                type="button"
                                onClick={() => handleNestedChange('paymentGateways', 'khalti', !localSettings.paymentGateways.khalti.isEnabled, 'isEnabled')}
                                role="switch"
                                aria-checked={localSettings.paymentGateways.khalti.isEnabled}
                                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${localSettings.paymentGateways.khalti.isEnabled ? 'bg-sky-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${localSettings.paymentGateways.khalti.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className={`space-y-4 transition-opacity ${!localSettings.paymentGateways.khalti.isEnabled && 'opacity-50 pointer-events-none'}`}>
                            <Input
                                label="Khalti Public Key"
                                value={localSettings.paymentGateways.khalti.publicKey}
                                onChange={(e) => handleNestedChange('paymentGateways', 'khalti', e.target.value, 'publicKey')}
                                placeholder="khalti_public_key"
                                disabled={!localSettings.paymentGateways.khalti.isEnabled}
                            />
                            <Input
                                label="Khalti Secret Key"
                                type="password"
                                value={localSettings.paymentGateways.khalti.secretKey}
                                onChange={(e) => handleNestedChange('paymentGateways', 'khalti', e.target.value, 'secretKey')}
                                placeholder="khalti_secret_key"
                                disabled={!localSettings.paymentGateways.khalti.isEnabled}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="API Keys & Integrations" icon={<FiKey />}>
                 <div className="p-4 space-y-4">
                     <h3 className="text-md font-semibold text-gray-700">SMS Gateway</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                            <select 
                                value={localSettings.sms.provider}
                                onChange={(e) => handleNestedChange('sms', 'provider', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="">None</option>
                                <option value="twilio">Twilio</option>
                                <option value="nexmo">Nexmo</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <Input
                            label="API Key / Token"
                            value={localSettings.sms.apiKey}
                            onChange={(e) => handleNestedChange('sms', 'apiKey', e.target.value)}
                        />
                         <Input
                            label="Sender ID"
                            value={localSettings.sms.senderId}
                            onChange={(e) => handleNestedChange('sms', 'senderId', e.target.value)}
                        />
                     </div>
                 </div>
            </Card>
            
            <Card title="Legal Documents" icon={<FiFileText />}>
                <div className="p-4 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Terms of Service</label>
                        <textarea
                            value={localSettings.legal.termsOfService}
                            onChange={(e) => handleNestedChange('legal', 'termsOfService', e.target.value)}
                            rows={8}
                            className="w-full p-2 border border-gray-300 rounded-md font-mono text-xs"
                            placeholder="Paste your terms of service content here. Supports plain text."
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy</label>
                        <textarea
                            value={localSettings.legal.privacyPolicy}
                            onChange={(e) => handleNestedChange('legal', 'privacyPolicy', e.target.value)}
                            rows={8}
                            className="w-full p-2 border border-gray-300 rounded-md font-mono text-xs"
                             placeholder="Paste your privacy policy content here. Supports plain text."
                        />
                    </div>
                </div>
            </Card>

            <Card title="System Maintenance" icon={<FiSliders />}>
                <div className="p-4 space-y-4">
                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                            <h3 className="font-medium text-gray-800">Enable Maintenance Mode</h3>
                            <p className="text-xs text-gray-500">When enabled, tenants cannot log in and will see the maintenance message.</p>
                        </div>
                        <button
                            onClick={() => handleNestedChange('maintenance', 'isEnabled', !localSettings.maintenance.isEnabled)}
                            role="switch"
                            aria-checked={localSettings.maintenance.isEnabled}
                            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${localSettings.maintenance.isEnabled ? 'bg-red-600' : 'bg-gray-300'}`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${localSettings.maintenance.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Message</label>
                        <textarea
                            value={localSettings.maintenance.message}
                            onChange={(e) => handleNestedChange('maintenance', 'message', e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Enter the message to display to users during maintenance."
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SaaSSettingsPage;
