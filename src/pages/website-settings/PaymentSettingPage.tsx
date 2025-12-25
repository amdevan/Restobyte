
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WebsitePaymentSettings } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiCreditCard, FiSave, FiCheckCircle } from 'react-icons/fi';

const PaymentSettingPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [settings, setSettings] = useState<WebsitePaymentSettings>(websiteSettings.paymentSettings);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setSettings(websiteSettings.paymentSettings);
  }, [websiteSettings.paymentSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    updateWebsiteSettings({ paymentSettings: settings });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(websiteSettings.paymentSettings);

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiCreditCard className="mr-3 text-sky-600"/>Payment Settings</h2>
            <div className="flex items-center space-x-3 h-10">
              {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
              <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Configure your payment gateways for online orders.</p>
          <div className="space-y-6 divide-y divide-gray-200">
            {/* Stripe Settings */}
            <div className="pt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-700">Stripe</h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-sm font-medium">Enable</span>
                  <input type="checkbox" name="stripeEnabled" checked={settings.stripeEnabled} onChange={handleChange} className="h-5 w-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
                </label>
              </div>
              <div className={`space-y-4 transition-opacity duration-300 ${settings.stripeEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <Input label="Publishable Key" name="stripePublicKey" value={settings.stripePublicKey || ''} onChange={handleChange} placeholder="pk_test_..." />
                <Input label="Secret Key" name="stripeSecretKey" type="password" value={settings.stripeSecretKey || ''} onChange={handleChange} placeholder="sk_test_..." />
              </div>
            </div>
            {/* PayPal Settings */}
            <div className="pt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-700">PayPal</h3>
                 <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-sm font-medium">Enable</span>
                  <input type="checkbox" name="paypalEnabled" checked={settings.paypalEnabled} onChange={handleChange} className="h-5 w-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
                </label>
              </div>
              <div className={`space-y-4 transition-opacity duration-300 ${settings.paypalEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <Input label="Client ID" name="paypalClientId" value={settings.paypalClientId || ''} onChange={handleChange} placeholder="Your PayPal Client ID" />
              </div>
            </div>
            {/* Fonepay Settings */}
            <div className="pt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-700">Fonepay</h3>
                 <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-sm font-medium">Enable</span>
                  <input type="checkbox" name="fonepayEnabled" checked={settings.fonepayEnabled || false} onChange={handleChange} className="h-5 w-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
                </label>
              </div>
              <div className={`space-y-4 transition-opacity duration-300 ${settings.fonepayEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <Input label="Merchant ID" name="fonepayMerchantId" value={settings.fonepayMerchantId || ''} onChange={handleChange} placeholder="Your Fonepay Merchant ID" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSettingPage;
