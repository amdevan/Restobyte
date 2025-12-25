

import React, { useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { FiCopy, FiSettings, FiMessageSquare } from 'react-icons/fi';
import FeatureDisabledPage from '@/components/common/FeatureDisabledPage';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Link } from 'react-router-dom';
import { Variation } from '@/types';

const WhatsappOrderMenuPage: React.FC = () => {
    const { menuItems, foodMenuCategories, getSingleActiveOutlet } = useRestaurantData();
    const outlet = getSingleActiveOutlet();

    const menuByCategory = useMemo(() => {
        if (!menuItems) return {};
        return menuItems.reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as Record<string, typeof menuItems>);
    }, [menuItems]);
    
    const sortedCategories = useMemo(() => {
        return foodMenuCategories
          .map(c => c.name)
          .filter(name => menuByCategory[name] && menuByCategory[name].length > 0)
          .sort((a,b) => a.localeCompare(b));
    }, [foodMenuCategories, menuByCategory]);

    const getPriceDisplay = (variations: Variation[]): string => {
        if (!variations || variations.length === 0) {
            return '--.--';
        }
        if (variations.length === 1) {
            return variations[0].price.toFixed(2);
        }
        const prices = variations.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
            return minPrice.toFixed(2);
        }
        return `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
    };

    if (!outlet) {
        return <FeatureDisabledPage type="selectOutlet" featureName="WhatsApp Order Menu" />;
    }

    if (!outlet.whatsappOrderingEnabled) {
        return (
            <div className="p-6">
                 <Card title="WhatsApp Ordering Disabled" icon={<FiMessageSquare />}>
                    <div className="p-6 text-center">
                        <p className="text-gray-600 mb-4">WhatsApp ordering is currently disabled for this outlet.</p>
                        <p className="text-gray-500 text-sm mb-4">You can enable it in the WhatsApp settings.</p>
                        <Link to="/app/whatsapp/settings">
                            <Button>Go to WhatsApp Settings</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        )
    }

    const whatsappNumber = outlet.whatsappNumber || outlet.phone;
    if (!whatsappNumber) {
        return (
            <div className="p-6">
                 <Card title="Configuration Required" icon={<FiSettings />}>
                    <div className="p-6 text-center">
                        <p className="text-gray-600 mb-4">Please set a WhatsApp or Phone number for this outlet in the settings to enable this feature.</p>
                        <Link to="/app/whatsapp/settings">
                            <Button>Go to WhatsApp Settings</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }
    
    const cleanNumber = whatsappNumber.replace(/[^0-9+]/g, '');
    const prefilledText = encodeURIComponent(
        (outlet.whatsappDefaultMessage || "I would like to place an order from {restaurantName}.").replace('{restaurantName}', outlet.restaurantName)
    );
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${prefilledText}`;
    
    const copyToClipboard = () => {
        const urlToCopy = `${window.location.origin}${window.location.pathname}#/whatsapp/order-menu`;
        navigator.clipboard.writeText(urlToCopy).then(() => {
            alert('Menu link copied to clipboard!');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <div className="max-w-3xl mx-auto p-4 bg-white font-sans rounded-lg shadow-lg">
             <header className="text-center py-6 border-b-2 border-gray-100">
                {outlet.logoUrl && <img src={outlet.logoUrl} alt={`${outlet.restaurantName} logo`} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />}
                <h1 className="text-4xl font-extrabold text-gray-800">{outlet.restaurantName}</h1>
                <p className="text-gray-500 mt-2">{outlet.address}</p>
                <div className="mt-4 flex justify-center items-center space-x-4">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                       <Button variant="primary" leftIcon={<FiMessageSquare/>}>Order on WhatsApp</Button>
                    </a>
                     <Button variant="secondary" leftIcon={<FiCopy />} onClick={copyToClipboard}>Copy Menu Link</Button>
                </div>
             </header>

            <main className="py-8">
                 {sortedCategories.length === 0 && <p className="text-center text-gray-500">No menu items have been added yet.</p>}
                 {sortedCategories.map(categoryName => (
                    <div key={categoryName} className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-sky-500 inline-block pb-1 mb-6">{categoryName}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {menuByCategory[categoryName].map(item => (
                                <div key={item.id} className="flex space-x-4">
                                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0"/>}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                            <p className="text-lg font-bold text-sky-600">${getPriceDisplay(item.variations)}</p>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                        {item.isVeg !== undefined && (
                                            <span className={`mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${item.isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.isVeg ? 'Veg' : 'Non-Veg'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 ))}
            </main>
        </div>
    );
};

export default WhatsappOrderMenuPage;
