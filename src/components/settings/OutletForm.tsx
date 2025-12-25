
import React, { useState, useEffect } from 'react';
import { Outlet, Tax } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiHome, FiMap, FiPhone, FiMail, FiPercent, FiTrash2, FiPlus, FiBox, FiMessageSquare, FiImage } from 'react-icons/fi';

// Local state type for form handling
interface LocalTax extends Omit<Tax, 'rate'> {
    rate: string;
}

interface OutletFormProps {
  initialData?: Outlet | null;
  onSubmit: (data: Omit<Outlet, 'id'>) => void;
  onUpdate: (data: Outlet) => void;
  onClose: () => void;
}

const OutletForm: React.FC<OutletFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
    const [name, setName] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [outletType, setOutletType] = useState<'Restaurant' | 'CloudKitchen'>('Restaurant');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [taxes, setTaxes] = useState<LocalTax[]>([]);
    // Fonepay settings
    const [fonepayIsEnabled, setFonepayIsEnabled] = useState(false);
    const [fonepayMerchantCode, setFonepayMerchantCode] = useState('');
    const [fonepayTerminalId, setFonepayTerminalId] = useState('');
    const [fonepayCurrency, setFonepayCurrency] = useState('NPR');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setRestaurantName(initialData.restaurantName);
            setOutletType(initialData.outletType || 'Restaurant');
            setAddress(initialData.address);
            setPhone(initialData.phone);
            setEmail(initialData.email || '');
            setLogoUrl(initialData.logoUrl || '');
            setWhatsappNumber(initialData.whatsappNumber || '');
            setTaxes(initialData.taxes.map(t => ({ ...t, rate: String(t.rate) })));
            setFonepayIsEnabled(initialData.fonepayIsEnabled || false);
            setFonepayMerchantCode(initialData.fonepayMerchantCode || '');
            setFonepayTerminalId(initialData.fonepayTerminalId || '');
            setFonepayCurrency(initialData.fonepayCurrency || 'NPR');
        } else {
            // Reset for new entry
            setName('');
            setRestaurantName('');
            setOutletType('Restaurant');
            setAddress('');
            setPhone('');
            setEmail('');
            setLogoUrl('');
            setWhatsappNumber('');
            setTaxes([]); // Start with no taxes, user can add them
            setFonepayIsEnabled(false);
            setFonepayMerchantCode('');
            setFonepayTerminalId('');
            setFonepayCurrency('NPR');
        }
    }, [initialData]);

    const handleTaxChange = (id: string, field: 'name' | 'rate', value: string) => {
        setTaxes(prevTaxes => prevTaxes.map(tax => tax.id === id ? { ...tax, [field]: value } : tax));
    };

    const handleAddTax = () => {
        setTaxes(prev => [...prev, { id: `new-${Date.now()}`, name: '', rate: '0' }]);
    };

    const handleRemoveTax = (id: string) => {
        setTaxes(prev => prev.filter(tax => tax.id !== id));
    };
    
    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim() || !restaurantName.trim() || !address.trim() || !phone.trim()) {
            alert('Outlet Name, Restaurant Name, Address, and Phone are required.');
            return;
        }

        const finalTaxes: Tax[] = [];
        for (const localTax of taxes) {
            if (!localTax.name.trim()) {
                alert(`Tax name cannot be empty.`);
                return;
            }
            const rate = parseFloat(localTax.rate);
            if (isNaN(rate) || rate < 0) {
                alert(`Invalid tax rate for "${localTax.name}". Please enter a valid non-negative number.`);
                return;
            }
            finalTaxes.push({
                id: localTax.id.startsWith('new-') ? `tax-${Date.now()}-${Math.random()}` : localTax.id,
                name: localTax.name,
                rate: rate,
            });
        }
        
        const outletData: Omit<Outlet, 'id'> = {
            name,
            restaurantName,
            outletType,
            address,
            phone,
            email: email || undefined,
            logoUrl: logoUrl || undefined,
            whatsappNumber: whatsappNumber || undefined,
            taxes: finalTaxes,
            fonepayIsEnabled,
            fonepayMerchantCode: fonepayMerchantCode || undefined,
            fonepayTerminalId: fonepayTerminalId || undefined,
            fonepayCurrency: fonepayCurrency || undefined,
        };

        if (initialData) {
            onUpdate({ ...initialData, ...outletData });
        } else {
            onSubmit(outletData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Outlet Name *" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Downtown Branch" required />
                <Input label="Restaurant Name (on receipts) *" name="restaurantName" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="e.g., The Grand Bistro" required />
             </div>
              <div>
                <label htmlFor="outletType" className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FiBox className="mr-2"/>Outlet Type *</label>
                <select 
                    id="outletType" 
                    name="outletType" 
                    value={outletType} 
                    onChange={e => setOutletType(e.target.value as 'Restaurant' | 'CloudKitchen')} 
                    required 
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                >
                    <option value="Restaurant">Restaurant (with Dine-in)</option>
                    <option value="CloudKitchen">Cloud Kitchen (Delivery/Pickup only)</option>
                </select>
            </div>
             <Input label="Address *" name="address" value={address} onChange={(e) => setAddress(e.target.value)} leftIcon={<FiMap />} required />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Phone *" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} leftIcon={<FiPhone />} required />
                <Input label="Email (Optional)" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<FiMail />} />
             </div>
             <Input label="WhatsApp Number (for orders)" name="whatsappNumber" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} leftIcon={<FiMessageSquare />} placeholder="e.g. +15551234567"/>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Optional)</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-sky-50 file:text-sky-700
                        hover:file:bg-sky-100"
                />
                 {logoUrl && <img src={logoUrl} alt="Logo Preview" className="mt-2 h-20 w-20 object-contain rounded-md border p-1 bg-white" />}
             </div>

            <h3 className="text-md font-medium text-gray-700 pt-4 border-t">Tax Settings</h3>
            <div className="space-y-3">
                {taxes.map((tax, index) => (
                    <div key={tax.id} className="p-3 border rounded-lg grid grid-cols-12 gap-3 items-center bg-gray-50/50">
                        <div className="col-span-12 md:col-span-5">
                            <Input label={`Tax ${index + 1} Name`} value={tax.name} onChange={e => handleTaxChange(tax.id, 'name', e.target.value)} placeholder="e.g., CGST" containerClassName="mb-0" />
                        </div>
                        <div className="col-span-12 md:col-span-5">
                             <Input label="Rate (%)" type="number" value={tax.rate} onChange={e => handleTaxChange(tax.id, 'rate', e.target.value)} leftIcon={<FiPercent />} step="any" min="0" containerClassName="mb-0" />
                        </div>
                        <div className="col-span-12 md:col-span-2 flex justify-end">
                             <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveTax(tax.id)} className="p-2" aria-label="Remove Tax">
                                <FiTrash2 />
                             </Button>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="secondary" onClick={handleAddTax} leftIcon={<FiPlus />} size="sm">Add Tax</Button>
            </div>

            <h3 className="text-md font-medium text-gray-700 pt-4 border-t">Fonepay Settings</h3>
            <div className="space-y-3">
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={fonepayIsEnabled}
                        onChange={(e) => setFonepayIsEnabled(e.target.checked)}
                        className="h-5 w-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    />
                    <span className="text-sm">Enable Fonepay (QR) for this outlet</span>
                </label>
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${fonepayIsEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                    <Input label="Merchant Code" name="fonepayMerchantCode" value={fonepayMerchantCode} onChange={(e) => setFonepayMerchantCode(e.target.value)} placeholder="e.g., 123456" />
                    <Input label="Terminal ID" name="fonepayTerminalId" value={fonepayTerminalId} onChange={(e) => setFonepayTerminalId(e.target.value)} placeholder="e.g., T01" />
                    <div>
                        <label htmlFor="fonepayCurrency" className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select
                            id="fonepayCurrency"
                            name="fonepayCurrency"
                            value={fonepayCurrency}
                            onChange={(e) => setFonepayCurrency(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value="NPR">NPR</option>
                            <option value="USD">USD</option>
                            <option value="INR">INR</option>
                        </select>
                    </div>
                </div>
                <p className="text-xs text-gray-500">Note: For production, generate signed EMVCo payloads server-side.</p>
            </div>
           
            <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
                Cancel
                </Button>
                <Button type="submit" variant="primary" leftIcon={<FiSave />}>
                {initialData ? 'Update Outlet' : 'Save Outlet'}
                </Button>
            </div>
        </form>
    );
};

export default OutletForm;
