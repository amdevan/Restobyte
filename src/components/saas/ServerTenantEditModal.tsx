import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { COUNTRIES, CURRENCIES, DEFAULT_CURRENCY_BY_COUNTRY } from '@/constants/geo';

interface ServerTenantEditModalProps {
  initialData: any; // Tenant object from server
  onUpdate: (data: any) => void;
  onClose: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS = ['active', 'inactive', 'trialing'];

const ServerTenantEditModal: React.FC<ServerTenantEditModalProps> = ({ initialData, onUpdate, onClose, loading }) => {
    const { plans } = useRestaurantData();
    const [name, setName] = useState('');
    const [plan, setPlan] = useState<string>('');
    const [status, setStatus] = useState<string>('inactive');
    const [countryCode, setCountryCode] = useState<string>('');
    const [currencyCode, setCurrencyCode] = useState<string>('');
    
    // User credentials
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const PLAN_OPTIONS = plans.filter(p => p.isActive).map(p => p.name);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPlan(initialData.plan || (PLAN_OPTIONS.length > 0 ? PLAN_OPTIONS[0] : 'Basic'));
            setStatus(initialData.subscriptionStatus || 'inactive');
            setUsername(initialData.adminUsername || '');
            setCountryCode(initialData.countryCode || '');
            setCurrencyCode(initialData.currencyCode || '');
        }
    }, [initialData, plans]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate({
            name,
            plan,
            subscriptionStatus: status,
            countryCode,
            currencyCode,
            username,
            password
        });
    };

    if (!initialData) return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Restaurant Details</h3>
            <Input
                label="Restaurant Name *"
                value={name}
                onChange={e => setName(e.target.value)}
                required
            />
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <select 
                    value={plan} 
                    onChange={e => setPlan(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                >
                    {PLAN_OPTIONS.map(pName => <option key={pName} value={pName}>{pName}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select value={countryCode} onChange={e => { const val = e.target.value; setCountryCode(val); const auto = DEFAULT_CURRENCY_BY_COUNTRY[val]; if (auto) setCurrencyCode(auto); }} className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={currencyCode} onChange={e => setCurrencyCode(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Select currency</option>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </select>
              </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
                <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                >
                     {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
            </div>

            <h3 className="font-semibold text-gray-700 border-b pb-2 pt-4">Admin Credentials</h3>
            <Input
                label="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
            />
             <Input
                label="New Password (leave blank to keep current)"
                type="text" 
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle/>}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" leftIcon={<FiSave/>} disabled={loading}>
                    {loading ? 'Saving...' : 'Update Tenant'}
                </Button>
            </div>
        </form>
    );
};

export default ServerTenantEditModal;
