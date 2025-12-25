
import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Outlet, Tax } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiPercent, FiSave, FiRefreshCw, FiCheckCircle, FiTool, FiHome, FiTrash2, FiPlus } from 'react-icons/fi';

// Local state type to handle string inputs for numbers in the form
interface LocalTax extends Omit<Tax, 'rate'> {
    rate: string;
}
interface LocalOutlet extends Omit<Outlet, 'taxes'> {
    taxes: LocalTax[];
}

const TaxSettingPage: React.FC = () => {
    const { outlets, updateOutlet } = useRestaurantData();
    const [localOutlets, setLocalOutlets] = useState<LocalOutlet[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>('');
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        // Map the global outlets state to a local, form-friendly state
        setLocalOutlets(outlets.map(o => ({
            ...o,
            taxes: o.taxes.map(t => ({...t, rate: String(t.rate)}))
        })));

        if (outlets.length > 0 && !outlets.some(o => o.id === selectedOutletId)) {
            setSelectedOutletId(outlets[0].id);
        } else if (outlets.length === 0) {
            setSelectedOutletId('');
        }
    }, [outlets, selectedOutletId]); // Added selectedOutletId dependency to re-sync if it becomes invalid

    const isDirty = useMemo(() => {
        if (!outlets.length && !localOutlets.length) return false;
        return JSON.stringify(
            outlets.map(o => ({ ...o, taxes: o.taxes.map(t => ({...t, rate: String(t.rate)})) }))
        ) !== JSON.stringify(localOutlets);
    }, [localOutlets, outlets]);

    const handleTaxInputChange = (outletId: string, taxId: string, field: 'name' | 'rate', value: string) => {
        setLocalOutlets(prevOutlets =>
            prevOutlets.map(outlet =>
                outlet.id === outletId
                    ? { ...outlet, taxes: outlet.taxes.map(tax => tax.id === taxId ? {...tax, [field]: value } : tax) }
                    : outlet
            )
        );
    };

    const handleAddTax = (outletId: string) => {
        setLocalOutlets(prev => prev.map(o => {
            if (o.id === outletId) {
                const newTax: LocalTax = { id: `new-tax-${Date.now()}`, name: '', rate: '0' };
                return { ...o, taxes: [...o.taxes, newTax] };
            }
            return o;
        }));
    };

    const handleDeleteTax = (outletId: string, taxId: string) => {
        setLocalOutlets(prev => prev.map(o => {
            if (o.id === outletId) {
                return { ...o, taxes: o.taxes.filter(t => t.id !== taxId) };
            }
            return o;
        }));
    };

    const handleSaveAll = () => {
        for (const localOutlet of localOutlets) {
            const originalOutlet = outlets.find(o => o.id === localOutlet.id);
            if (!originalOutlet) continue;

            const updatedTaxes: Tax[] = [];
            for (const localTax of localOutlet.taxes) {
                if (!localTax.name.trim()) {
                    alert(`Tax name cannot be empty for outlet "${localOutlet.name}".`);
                    return;
                }
                const rate = parseFloat(localTax.rate);
                if (isNaN(rate) || rate < 0) {
                    alert(`Invalid tax rate for "${localTax.name}" in outlet "${localOutlet.name}". Please enter a valid non-negative number.`);
                    return;
                }
                updatedTaxes.push({
                    id: localTax.id.startsWith('new-tax-') ? `tax-${Date.now()}-${Math.random().toString(16).slice(2)}` : localTax.id,
                    name: localTax.name,
                    rate: rate,
                });
            }

            const updatedOutlet: Outlet = {
                ...originalOutlet,
                taxes: updatedTaxes
            };
            updateOutlet(updatedOutlet);
        }

        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    const handleReset = () => {
        setLocalOutlets(outlets.map(o => ({
            ...o,
            taxes: o.taxes.map(t => ({...t, rate: String(t.rate)}))
        })));
    };

    const selectedLocalOutlet = useMemo(() => {
        return localOutlets.find(o => o.id === selectedOutletId);
    }, [localOutlets, selectedOutletId]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <FiTool className="mr-3 text-sky-600" /> Tax Settings
                </h1>
                <div className="flex items-center space-x-4">
                    {showSavedMessage && (
                        <span className="text-green-600 flex items-center text-sm transition-opacity duration-300">
                            <FiCheckCircle className="mr-1.5" /> Saved!
                        </span>
                    )}
                    <Button onClick={handleReset} variant="secondary" leftIcon={<FiRefreshCw />} disabled={!isDirty}>
                        Reset Changes
                    </Button>
                    <Button onClick={handleSaveAll} leftIcon={<FiSave />} disabled={!isDirty}>
                        Save All Changes
                    </Button>
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="outlet-selector" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiHome className="mr-2 text-gray-500" /> Select Outlet/Branch
                </label>
                <select
                    id="outlet-selector"
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                    disabled={outlets.length === 0}
                >
                    {outlets.map(outlet => (
                        <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                    ))}
                </select>
            </div>


            <div className="space-y-6">
                {!selectedLocalOutlet ? (
                    <Card>
                        <p className="text-center text-gray-500 py-8">
                            {outlets.length === 0 
                             ? <>No outlets found. Please add an outlet first in <a href="#/outlet-setting" className="text-sky-600 hover:underline">Outlet Settings</a>.</>
                             : 'Select an outlet to configure its tax settings.'
                            }
                        </p>
                    </Card>
                ) : (
                    <Card key={selectedLocalOutlet.id} title={`Tax Configuration for: ${selectedLocalOutlet.name}`}>
                        <div className="p-4 space-y-4">
                            {selectedLocalOutlet.taxes.map((tax, index) => (
                                <div key={tax.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end p-3 border rounded-md bg-gray-50/70">
                                    <div className="md:col-span-5">
                                        <Input
                                            label={`Tax ${index + 1} Name`}
                                            name="name"
                                            value={tax.name}
                                            onChange={e => handleTaxInputChange(selectedLocalOutlet.id, tax.id, 'name', e.target.value)}
                                            placeholder="e.g., VAT"
                                            containerClassName="mb-0"
                                        />
                                    </div>
                                    <div className="md:col-span-5">
                                        <Input
                                            label="Tax Rate (%)"
                                            name="rate"
                                            type="number"
                                            value={tax.rate}
                                            onChange={e => handleTaxInputChange(selectedLocalOutlet.id, tax.id, 'rate', e.target.value)}
                                            leftIcon={<FiPercent />}
                                            step="any"
                                            min="0"
                                            containerClassName="mb-0"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="danger"
                                            onClick={() => handleDeleteTax(selectedLocalOutlet.id, tax.id)}
                                            leftIcon={<FiTrash2 />}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleAddTax(selectedLocalOutlet.id)}
                                leftIcon={<FiPlus/>}
                            >
                                Add Tax
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default TaxSettingPage;
