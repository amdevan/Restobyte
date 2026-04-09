import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, User } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';

interface TenantEditModalProps {
  initialData: Outlet | null;
  adminUser: User | undefined;
  onUpdate: (data: Outlet) => void;
  onUpdateUser: (data: User) => void;
  onClose: () => void;
}

type Status = 'active' | 'inactive' | 'trialing';

const STATUS_OPTIONS: Status[] = ['active', 'inactive', 'trialing'];


const TenantEditModal: React.FC<TenantEditModalProps> = ({ initialData, adminUser, onUpdate, onUpdateUser, onClose }) => {
    const { plans } = useRestaurantData();
    const [name, setName] = useState('');
    const [plan, setPlan] = useState<string>('');
    const [status, setStatus] = useState<Status>('inactive');
    const [planExpiryDate, setPlanExpiryDate] = useState('');
    
    // User credentials
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const PLAN_OPTIONS = useMemo(() => plans.filter(p => p.isActive).map(p => p.name), [plans]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.restaurantName);
            setPlan(initialData.plan || (PLAN_OPTIONS.length > 0 ? PLAN_OPTIONS[0] : ''));
            setStatus(initialData.subscriptionStatus || 'inactive');
            setPlanExpiryDate(initialData.planExpiryDate ? initialData.planExpiryDate.split('T')[0] : '');
        }
        if (adminUser) {
            setUsername(adminUser.username);
            setPassword(adminUser.passwordHash);
        }
    }, [initialData, adminUser, PLAN_OPTIONS]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!initialData) return;

        const updatedData: Outlet = {
            ...initialData,
            restaurantName: name,
            plan,
            subscriptionStatus: status,
            planExpiryDate: planExpiryDate || undefined,
        };
        onUpdate(updatedData);

        if (adminUser) {
            const updatedUser: User = {
                ...adminUser,
                username,
                passwordHash: password
            };
            onUpdateUser(updatedUser);
        }

        onClose();
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

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
                <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as Status)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                >
                     {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
            </div>

            <Input
                label="Registration Date"
                type="text"
                value={initialData.registrationDate ? new Date(initialData.registrationDate).toLocaleDateString() : 'N/A'}
                readOnly
                disabled
            />

            <Input
                label="Plan Expiry Date"
                type="date"
                value={planExpiryDate}
                onChange={e => setPlanExpiryDate(e.target.value)}
            />
            
            <h3 className="font-semibold text-gray-700 border-b pb-2 pt-4">Admin Credentials</h3>
            <Input
                label="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
            />
             <Input
                label="Password"
                type="text" // Show as text for easier editing in admin panel
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />

            <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle/>}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" leftIcon={<FiSave/>}>
                    Update Tenant
                </Button>
            </div>
        </form>
    );
};

export default TenantEditModal;
