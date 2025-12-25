
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import FeatureDisabledPage from '@/components/common/FeatureDisabledPage';
import { FiSave, FiCheckCircle, FiEye, FiImage, FiType } from 'react-icons/fi';

const WhiteLabelPage: React.FC = () => {
    const { getSingleActiveOutlet, updateOutlet } = useRestaurantData();
    const outlet = getSingleActiveOutlet();

    const [restaurantName, setRestaurantName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        if (outlet) {
            setRestaurantName(outlet.restaurantName || '');
            setLogoUrl(outlet.logoUrl || '');
            setIsDirty(false); // Reset dirty state when outlet changes
        }
    }, [outlet]);

    useEffect(() => {
        if (!outlet) return;
        const dirty = (restaurantName !== (outlet.restaurantName || '')) || (logoUrl !== (outlet.logoUrl || ''));
        setIsDirty(dirty);
    }, [restaurantName, logoUrl, outlet]);


    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            // If the user cancels file selection, we don't want to clear the existing logo
            // so we don't do anything here.
        }
    };

    const handleSave = () => {
        if (!outlet) {
            alert('No outlet selected!');
            return;
        }
        
        const updatedOutlet = {
            ...outlet,
            restaurantName: restaurantName,
            logoUrl: logoUrl,
        };
        
        updateOutlet(updatedOutlet);
        setShowSavedMessage(true);
        setIsDirty(false);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    if (!outlet) {
        return <FeatureDisabledPage type="selectOutlet" featureName="White Label Settings" />;
    }

    return (
        <div className="p-6">
            <Card>
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiEye className="mr-3 text-sky-600"/>White Label Settings</h2>
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
                    <p className="text-sm text-gray-500 mb-6">Customize the application's branding for this outlet. This will appear on receipts and other user-facing components.</p>
                    <div className="space-y-6 border-t pt-6">
                        <Input 
                            label="Restaurant Name (for Receipts)" 
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            leftIcon={<FiType />}
                        />
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FiImage className="mr-2"/>Logo</label>
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
                        </div>
                         {logoUrl && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo Preview</label>
                                <div className="mt-1 p-4 border border-gray-200 rounded-md inline-block">
                                    <img src={logoUrl} alt="Logo Preview" className="h-20 max-w-xs object-contain" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default WhiteLabelPage;
