import React, { useState } from 'react';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiSave, FiX } from 'react-icons/fi';
import { COUNTRIES, CURRENCIES, DEFAULT_CURRENCY_BY_COUNTRY } from '@/constants/geo';
import { API_BASE_URL } from '@/config';

interface AddTenantModalProps {
    onClose: () => void;
}

const AddTenantModal: React.FC<AddTenantModalProps> = ({ onClose }) => {
    const [formData, setFormData] = useState({
        restaurantName: '',
        username: '',
        password: '',
        fullName: '',
        mobile: '',
        address: '',
        countryCode: '',
        currencyCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/tenants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantName: formData.restaurantName,
                    username: formData.username,
                    password: formData.password,
                    fullName: formData.fullName,
                    mobile: formData.mobile,
                    address: formData.address,
                    countryCode: formData.countryCode,
                    currencyCode: formData.currencyCode
                })
            });
            if (res.ok) {
                onClose();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Failed to create tenant.');
            }
        } catch (err) {
            setError("Failed to create tenant.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
                Create a new tenant restaurant. This will create a new Outlet and an Admin User for it.
            </p>

            {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Restaurant Name"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Burger King"
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Admin Full Name"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                    />
                    <Input
                        label="Mobile Number"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                        placeholder="+1234567890"
                    />
                </div>

                <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="123 Main St, City"
                />

                <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Account Credentials</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="admin_username"
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="******"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, countryCode: val, currencyCode: DEFAULT_CURRENCY_BY_COUNTRY[val] || prev.currencyCode }));
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select name="currencyCode" value={formData.currencyCode} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Select currency</option>
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                    <Button variant="primary" type="submit" disabled={loading} leftIcon={<FiSave />}>
                        {loading ? 'Creating...' : 'Create Tenant'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddTenantModal;
