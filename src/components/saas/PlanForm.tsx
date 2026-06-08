import React, { useState, useEffect } from 'react';
import { Plan, PlanFeatureKey } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiPlus, FiTrash2 } from 'react-icons/fi';

interface PlanFormProps {
  initialData?: Plan | null;
  onSubmit: (data: Omit<Plan, 'id'>) => Promise<void>;
  onUpdate: (data: Plan) => Promise<void>;
  onClose: () => void;
}

const FEATURE_OPTIONS: Array<{ key: PlanFeatureKey; label: string }> = [
  { key: 'pos', label: 'POS' },
  { key: 'kds', label: 'Kitchen Display' },
  { key: 'customerDisplay', label: 'Customer Display' },
  { key: 'menu', label: 'Food Menu' },
  { key: 'tables', label: 'Tables' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'customers', label: 'Customers' },
  { key: 'purchase', label: 'Purchase & Expense' },
  { key: 'reports', label: 'Reports' },
  { key: 'website', label: 'Website' },
  { key: 'selfOrder', label: 'Self Order' },
  { key: 'subscription', label: 'Subscription' },
];

const PlanForm: React.FC<PlanFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [formData, setFormData] = useState<Omit<Plan, 'id'>>({
    name: '',
    price: 0,
    period: 'monthly',
    features: [''],
    featureKeys: ['subscription'],
    trialDays: 14,
    limits: { maxTables: 25 },
    isActive: true,
    isPublic: true,
    isFeatured: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', price: 0, period: 'monthly', features: [''], featureKeys: ['subscription'], trialDays: 14, limits: { maxTables: 25 }, isActive: true, isPublic: true, isFeatured: false });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checkedValue : (name === 'price' || name === 'trialDays') ? parseFloat(value) || 0 : value,
    }));
  };
  
  const handleFeatureChange = (index: number, value: string) => {
      const newFeatures = [...formData.features];
      newFeatures[index] = value;
      setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const handleAddFeature = () => {
      setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const handleRemoveFeature = (index: number) => {
      if (formData.features.length <= 1) return;
      setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void (async () => {
    if (!formData.name.trim()) {
      alert('Plan Name is required.');
      return;
    }
    
    const finalData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
        limits: {
          maxTables: Math.max(1, Number(formData.limits?.maxTables || 0)),
        },
        featureKeys: Array.from(new Set(formData.featureKeys)),
    };

    try {
      setIsSaving(true);
      if (initialData) {
        await onUpdate({ ...initialData, ...finalData });
      } else {
        await onSubmit(finalData);
      }
      onClose();
    } catch (error) {
      alert('Failed to save plan');
    } finally {
      setIsSaving(false);
    }
    })();
  };

  const toggleFeatureKey = (featureKey: PlanFeatureKey) => {
    setFormData(prev => {
      const exists = prev.featureKeys.includes(featureKey);
      return {
        ...prev,
        featureKeys: exists ? prev.featureKeys.filter(key => key !== featureKey) : [...prev.featureKeys, featureKey],
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Plan Name *" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Price *" name="price" type="number" value={formData.price} onChange={handleChange} required min="0" step="0.01" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period</label>
            <select name="period" value={formData.period} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
            </select>
            </div>
            <Input label="Trial Days" name="trialDays" type="number" value={formData.trialDays} onChange={handleChange} min="0" />
            <Input label="Max Tables" name="maxTables" type="number" value={formData.limits?.maxTables || 0} onChange={(e) => setFormData(prev => ({ ...prev, limits: { maxTables: parseInt(e.target.value || '0', 10) || 0 } }))} min="1" />
        </div>
        
        <div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Features</h4>
            <div className="space-y-2">
                {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <Input value={feature} onChange={e => handleFeatureChange(index, e.target.value)} containerClassName="flex-grow mb-0" placeholder={`Feature ${index + 1}`}/>
                        {formData.features.length > 1 && (
                            <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveFeature(index)} className="p-2"><FiTrash2/></Button>
                        )}
                    </div>
                ))}
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddFeature} leftIcon={<FiPlus />} className="mt-2">Add Feature</Button>
        </div>

        <div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Restaurant Panel Access</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-lg border border-gray-200 p-3">
                {FEATURE_OPTIONS.map((feature) => (
                    <label key={feature.key} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={formData.featureKeys.includes(feature.key)}
                            onChange={() => toggleFeatureKey(feature.key)}
                        />
                        <span>{feature.label}</span>
                    </label>
                ))}
            </div>
        </div>

        <div className="flex space-x-6 pt-4">
            <label className="flex items-center space-x-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /> <span>Active (can be assigned)</span></label>
            <label className="flex items-center space-x-2"><input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} /> <span>Public (on landing page)</span></label>
            <label className="flex items-center space-x-2"><input type="checkbox" name="isFeatured" checked={formData.isFeatured || false} onChange={handleChange} /> <span>Featured (highlighted)</span></label>
        </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>Cancel</Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />} disabled={isSaving}>{isSaving ? 'Saving...' : (initialData ? 'Update Plan' : 'Create Plan')}</Button>
      </div>
    </form>
  );
};

export default PlanForm;
