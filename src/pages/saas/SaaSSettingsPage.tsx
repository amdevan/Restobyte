

import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaaSSettings } from '@/types';
import { FiSliders, FiKey, FiFileText, FiCreditCard, FiSave, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

const SaaSSettingsPage: React.FC = () => {
    const { saasSettings, updateSaaSSettings } = useRestaurantData();
    const [localSettings, setLocalSettings] = useState<SaaSSettings>(saasSettings);
    const [showSavedMessage, setShowSavedMessage] = useState(false);
    const [activeTab, setActiveTab] = useState<'billing'|'integrations'|'legal'|'maintenance'>('billing');
    const [testEmail, setTestEmail] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

    useEffect(() => {
        setLocalSettings(saasSettings);
    }, [saasSettings]);

    useEffect(() => {
        const loadEmail = async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/email/settings`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
            });
            if (!res.ok) return;
            const cfg = await res.json();
            if (cfg) {
              setLocalSettings(prev => ({
                ...prev,
                email: {
                  provider: (cfg.provider || '') as any,
                  smtpHost: cfg.smtpHost || '',
                  smtpPort: cfg.smtpPort || 587,
                  smtpSecure: !!cfg.smtpSecure,
                  smtpUser: cfg.smtpUser || '',
                  smtpPass: cfg.smtpPass || '',
                  fromName: cfg.fromName || 'RestoByte',
                  fromEmail: cfg.fromEmail || '',
                }
              }));
            }
          } catch {}
        };
        loadEmail();
    }, []);

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

    const handleSave = async () => {
        updateSaaSSettings(localSettings);
        try {
          if (localSettings.email?.provider === 'smtp') {
            await fetch(`${API_BASE_URL}/email/settings`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
              },
              body: JSON.stringify({
                provider: 'smtp',
                smtpHost: localSettings.email.smtpHost,
                smtpPort: localSettings.email.smtpPort,
                smtpSecure: localSettings.email.smtpSecure,
                smtpUser: localSettings.email.smtpUser,
                smtpPass: localSettings.email.smtpPass,
                fromName: localSettings.email.fromName,
                fromEmail: localSettings.email.fromEmail
              })
            });
          }
        } catch {}
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

            <div className="flex gap-2">
              <button onClick={() => setActiveTab('billing')} className={`px-4 py-2 rounded border ${activeTab==='billing'?'bg-sky-50 border-sky-300 text-sky-700':'bg-white border-gray-300 text-gray-700'}`}>Billing</button>
              <button onClick={() => setActiveTab('integrations')} className={`px-4 py-2 rounded border ${activeTab==='integrations'?'bg-sky-50 border-sky-300 text-sky-700':'bg-white border-gray-300 text-gray-700'}`}>Integrations</button>
              <button onClick={() => setActiveTab('legal')} className={`px-4 py-2 rounded border ${activeTab==='legal'?'bg-sky-50 border-sky-300 text-sky-700':'bg-white border-gray-300 text-gray-700'}`}>Legal</button>
              <button onClick={() => setActiveTab('maintenance')} className={`px-4 py-2 rounded border ${activeTab==='maintenance'?'bg-sky-50 border-sky-300 text-sky-700':'bg-white border-gray-300 text-gray-700'}`}>Maintenance</button>
            </div>

            {activeTab === 'billing' && (
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
                            <p className="text-xs text-gray-500">Keys are stored in settings; avoid using real live keys in development.</p>
                        </div>
                    </div>
                </div>
            </Card>
            )}

            {activeTab === 'integrations' && (
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
                     <div className="border-t pt-4 mt-4">
                       <h3 className="text-md font-semibold text-gray-700 mb-3">Email (SMTP)</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                           <select
                             value={localSettings.email?.provider || ''}
                             onChange={(e) => setLocalSettings(prev => ({ ...prev, email: { ...(prev.email || {} as any), provider: e.target.value as any } }))}
                             className="w-full p-2 border border-gray-300 rounded-md"
                           >
                             <option value="">None</option>
                             <option value="smtp">SMTP</option>
                           </select>
                         </div>
                         <Input
                           label="SMTP Host"
                           value={localSettings.email?.smtpHost || ''}
                           onChange={(e) => setLocalSettings(prev => ({ ...prev, email: { ...(prev.email || {} as any), smtpHost: e.target.value } }))}
                         />
                         <Input
                           label="SMTP Port"
                           type="number"
                           value={String(localSettings.email?.smtpPort ?? 587)}
                           onChange={(e) => setLocalSettings(prev => ({ ...prev, email: { ...(prev.email || {} as any), smtpPort: Number(e.target.value) } }))}
                         />
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Secure (TLS)</label>
                           <select
                             value={String(localSettings.email?.smtpSecure ?? false)}
                             onChange={(e) => setLocalSettings(prev => ({ ...prev, email: { ...(prev.email || {} as any), smtpSecure: e.target.value === 'true' } }))}
                             className="w-full p-2 border border-gray-300 rounded-md"
                           >
                             <option value="false">No</option>
                             <option value="true">Yes</option>
                           </select>
                         </div>
                         <Input
                           label="SMTP Username"
                           value={localSettings.email?.smtpUser || ''}
                           onChange={(e) => setLocalSettings(prev => ({ ...prev, email: { ...(prev.email || {} as any), smtpUser: e.target.value } }))}
                         />
                         <Input
                           label="SMTP Password"
                           type="password"
                           value={localSettings.email?.smtpPass || ''}
                           onChange={(e) => setLocalSettings(prev => ({ ...prev, email: { ...(prev.email || {} as any), smtpPass: e.target.value } }))}
                         />
                         <Input
                           label="From Name"
                           value={localSettings.email?.fromName || ''}
                           onChange={(e) => setLocalSettings(prev => ({ ...prev, email: { ...(prev.email || {} as any), fromName: e.target.value } }))}
                         />
                         <Input
                           label="From Email"
                           value={localSettings.email?.fromEmail || ''}
                           onChange={(e) => setLocalSettings(prev => ({ ...prev, email: { ...(prev.email || {} as any), fromEmail: e.target.value } }))}
                         />
                       </div>
                       <p className="text-xs text-gray-500 mt-2">Configure SMTP to send onboarding emails and notifications. Keys are stored in settings only for demo; use environment variables in production.</p>
                       <div className="mt-4 border-t pt-4">
                         <h4 className="text-sm font-semibold text-gray-700 mb-2">Send Test Email</h4>
                         <div className="flex gap-2 items-end">
                           <div className="flex-1">
                             <Input label="Recipient Email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" />
                           </div>
                           <Button
                             onClick={async () => {
                               setTesting(true);
                               setTestResult(null);
                               try {
                                 const res = await fetch(`${API_BASE_URL}/email/test`, {
                                   method: 'POST',
                                   headers: {
                                     'Content-Type': 'application/json',
                                     Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
                                   },
                                   body: JSON.stringify({
                                     to: testEmail,
                                     smtp: {
                                       host: localSettings.email?.smtpHost,
                                       port: localSettings.email?.smtpPort,
                                       secure: localSettings.email?.smtpSecure,
                                       user: localSettings.email?.smtpUser,
                                       pass: localSettings.email?.smtpPass,
                                       fromName: localSettings.email?.fromName,
                                       fromEmail: localSettings.email?.fromEmail,
                                     }
                                   })
                                 });
                                 const data = await res.json().catch(() => ({}));
                                 if (res.ok && data?.ok) {
                                   setTestResult({ ok: true, message: 'Email sent successfully.' });
                                 } else {
                                   setTestResult({ ok: false, message: data?.error || 'Failed to send email.' });
                                 }
                               } catch (e) {
                                 setTestResult({ ok: false, message: 'Network error' });
                               } finally {
                                 setTesting(false);
                               }
                             }}
                             isLoading={testing}
                             disabled={!testEmail || !localSettings.email?.smtpHost || !localSettings.email?.smtpUser}
                           >
                             Send Test
                           </Button>
                         </div>
                         {testResult && (
                           <div className={`text-sm mt-2 ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                             {testResult.message}
                           </div>
                         )}
                       </div>
                     </div>
                 </div>
            </Card>
            )}
            
            {activeTab === 'legal' && (
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
            )}

            {activeTab === 'maintenance' && (
            <Card title="Maintenance Mode" icon={<FiAlertTriangle />}>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="text-md font-semibold text-gray-700">Enable Maintenance</h3>
                      <p className="text-xs text-gray-500">Shows a maintenance banner to all tenant admins.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNestedChange('maintenance','isEnabled', !localSettings.maintenance.isEnabled)}
                      role="switch"
                      aria-checked={localSettings.maintenance.isEnabled}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${localSettings.maintenance.isEnabled ? 'bg-sky-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${localSettings.maintenance.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className={`space-y-3 ${!localSettings.maintenance.isEnabled && 'opacity-50 pointer-events-none'}`}>
                    <Input
                      label="Maintenance Message"
                      value={localSettings.maintenance.message}
                      onChange={e => handleNestedChange('maintenance','message', e.target.value)}
                      placeholder="We'll be back soon while we perform scheduled maintenance."
                    />
                    <div className="text-xs text-gray-500">Message appears across SaaS admin pages.</div>
                  </div>
                </div>
            </Card>
            )}

            {isDirty && (
              <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
                <span className="text-sm text-gray-600">You have unsaved changes</span>
                <Button onClick={handleSave} leftIcon={<FiSave />}>Save</Button>
              </div>
            )}
        </div>
    );
};

export default SaaSSettingsPage;
