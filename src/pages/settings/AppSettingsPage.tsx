import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { ApplicationSettings, PaperSize } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiSave, FiCheckCircle, FiSettings, FiGlobe, FiPrinter, FiShoppingCart, FiChevronRight, FiVolume2, FiTool, FiMonitor, FiPercent, FiDollarSign, FiTag, FiCreditCard, FiArchive, FiTruck, FiMapPin, FiGrid, FiLayout, FiCoffee, FiUsers } from 'react-icons/fi';
import { clampCharsPerLine, getPaperSizeConfig } from '@/utils/printSettings';

// Quick links to every settings sub-page so the native Settings tab becomes a
// single hub from which all configuration is reachable.
const SETTINGS_LINK_GROUPS: { title: string; items: { label: string; path: string; icon: React.ReactElement }[] }[] = [
  {
    title: 'General',
    items: [
      { label: 'Sound Settings', path: '/app/settings/sound-settings', icon: <FiVolume2 /> },
      { label: 'White Label', path: '/app/settings/white-label', icon: <FiTool /> },
      { label: 'Tax Setting', path: '/app/settings/tax-setting', icon: <FiPercent /> },
      { label: 'Payment Methods', path: '/app/settings/list-payment-method', icon: <FiCreditCard /> },
    ],
  },
  {
    title: 'Hardware & Money',
    items: [
      { label: 'Printer', path: '/app/settings/list-printer', icon: <FiPrinter /> },
      { label: 'Counter', path: '/app/settings/list-counter', icon: <FiMonitor /> },
      { label: 'Multiple Currencies', path: '/app/settings/list-multiple-currency', icon: <FiDollarSign /> },
      { label: 'Expense Categories', path: '/app/settings/expense-categories', icon: <FiTag /> },
      { label: 'Denominations', path: '/app/settings/list-denomination', icon: <FiArchive /> },
      { label: 'Delivery Partners', path: '/app/settings/list-delivery-partner', icon: <FiTruck /> },
    ],
  },
  {
    title: 'Floor & Staff',
    items: [
      { label: 'Areas/Floors', path: '/app/settings/list-area-floor', icon: <FiMapPin /> },
      { label: 'Table', path: '/app/settings/list-table', icon: <FiGrid /> },
      { label: 'Floor/Area Plan Design', path: '/app/settings/floor-area-plan-design', icon: <FiLayout /> },
      { label: 'Manage Kitchens', path: '/app/settings/kitchens', icon: <FiCoffee /> },
      { label: 'Manage Waiters', path: '/app/settings/waiters', icon: <FiUsers /> },
    ],
  },
];

const AppSettingsPage: React.FC = () => {
    const { applicationSettings, updateApplicationSettings, customers } = useRestaurantData();
    const [localSettings, setLocalSettings] = useState<ApplicationSettings>(applicationSettings);
    const [showSavedMessage, setShowSavedMessage] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'print' | 'pos' | 'invoice'>('general');

    useEffect(() => {
        setLocalSettings(applicationSettings);
    }, [applicationSettings]);

    const kotPaperSizeConfig = getPaperSizeConfig(localSettings.kotPaperSize);
    const invoicePaperSizeConfig = getPaperSizeConfig(localSettings.invoicePaperSize);
    const saleDetailsPaperSizeConfig = getPaperSizeConfig(localSettings.saleDetailsPaperSize);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setLocalSettings(prev => ({ ...prev, [name]: checked }));
        } else {
            if (name === 'kotPaperSize') {
                const nextPaperSize = value as PaperSize;
                setLocalSettings(prev => ({
                    ...prev,
                    kotPaperSize: nextPaperSize,
                    kotCharactersPerLine: clampCharsPerLine(prev.kotCharactersPerLine, nextPaperSize),
                }));
                return;
            }

            // Handle number inputs specifically
            const numericFields = [
                'decimalPlaces',
                'kotCharactersPerLine',
                'invoiceCharactersPerLine',
                'saleDetailsCharactersPerLine',
                'invoiceFontSize',
                'invoiceSideMarginMm',
            ];
            if (numericFields.includes(name)) {
                if (name === 'kotCharactersPerLine') {
                    setLocalSettings(prev => ({
                        ...prev,
                        kotCharactersPerLine: clampCharsPerLine(Number(value), prev.kotPaperSize),
                    }));
                    return;
                }
                if (name === 'invoiceCharactersPerLine') {
                    setLocalSettings(prev => ({
                        ...prev,
                        invoiceCharactersPerLine: clampCharsPerLine(Number(value), prev.invoicePaperSize),
                    }));
                    return;
                }
                if (name === 'saleDetailsCharactersPerLine') {
                    setLocalSettings(prev => ({
                        ...prev,
                        saleDetailsCharactersPerLine: clampCharsPerLine(Number(value), prev.saleDetailsPaperSize),
                    }));
                    return;
                }
                setLocalSettings(prev => ({ ...prev, [name]: Number(value) }));
            } else {
                if (name === 'invoicePaperSize') {
                    const nextPaperSize = value as PaperSize;
                    setLocalSettings(prev => ({
                        ...prev,
                        invoicePaperSize: nextPaperSize,
                        invoiceCharactersPerLine: clampCharsPerLine(prev.invoiceCharactersPerLine, nextPaperSize),
                    }));
                    return;
                }
                if (name === 'saleDetailsPaperSize') {
                    const nextPaperSize = value as PaperSize;
                    setLocalSettings(prev => ({
                        ...prev,
                        saleDetailsPaperSize: nextPaperSize,
                        saleDetailsCharactersPerLine: clampCharsPerLine(prev.saleDetailsCharactersPerLine, nextPaperSize),
                    }));
                    return;
                }
                setLocalSettings(prev => ({ ...prev, [name]: value }));
            }
        }
    };

    const handleSave = () => {
        updateApplicationSettings(localSettings);
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    const isDirty = JSON.stringify(localSettings) !== JSON.stringify(applicationSettings);
    
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <FiSettings className="mr-3 text-sky-600"/> Application Settings
                </h1>
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

            <div className="flex gap-2">
              <button onClick={() => setActiveTab('general')} className={`px-4 py-2 rounded border ${activeTab==='general'?'bg-sky-50 border-sky-300 text-sky-700':'bg-white border-gray-300 text-gray-700'}`}>General</button>
              <button onClick={() => setActiveTab('print')} className={`px-4 py-2 rounded border ${activeTab==='print'?'bg-sky-50 border-sky-300 text-sky-700':'bg-white border-gray-300 text-gray-700'}`}>Print</button>
              <button onClick={() => setActiveTab('invoice')} className={`px-4 py-2 rounded border ${activeTab==='invoice'?'bg-sky-50 border-sky-300 text-sky-700':'bg-white border-gray-300 text-gray-700'}`}>Invoice</button>
              <button onClick={() => setActiveTab('pos')} className={`px-4 py-2 rounded border ${activeTab==='pos'?'bg-sky-50 border-sky-300 text-sky-700':'bg-white border-gray-300 text-gray-700'}`}>POS</button>
              {JSON.stringify(localSettings) !== JSON.stringify(applicationSettings) && (
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setLocalSettings(applicationSettings)}>Discard</Button>
                  <Button onClick={handleSave} leftIcon={<FiSave />}>Save</Button>
                </div>
              )}
            </div>

            <Card title="All Settings" icon={<FiSettings />}>
                <div className="p-4 space-y-5">
                    {SETTINGS_LINK_GROUPS.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{group.title}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className="rb-settings-link flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                                        >
                                            <span className="rb-settings-link-icon flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-600">
                                                {Icon}
                                            </span>
                                            <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                                            <FiChevronRight className="text-gray-400" size={18} />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {activeTab === 'general' && (
            <Card title="Localization & Formatting" icon={<FiGlobe />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                    <div>
                        <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                        <select id="dateFormat" name="dateFormat" value={localSettings.dateFormat} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                            <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
                        <select id="timeFormat" name="timeFormat" value={localSettings.timeFormat} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="12h">12-hour</option>
                            <option value="24h">24-hour</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="currencySymbolPosition" className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol Position</label>
                        <select id="currencySymbolPosition" name="currencySymbolPosition" value={localSettings.currencySymbolPosition} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="before">Before Amount (e.g., $100)</option>
                            <option value="after">After Amount (e.g., 100$)</option>
                        </select>
                    </div>
                    <Input label="Decimal Places" name="decimalPlaces" type="number" value={localSettings.decimalPlaces} onChange={handleInputChange} min="0" max="4" containerClassName="mb-0"/>
                </div>
            </Card>
            )}

            {activeTab === 'print' && (
            <Card title="Print Settings" icon={<FiPrinter />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    <div>
                        <label htmlFor="kotPaperSize" className="block text-sm font-medium text-gray-700 mb-1">KOT Paper Size</label>
                        <select
                            id="kotPaperSize"
                            name="kotPaperSize"
                            value={localSettings.kotPaperSize}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value={PaperSize['58mm']}>58mm</option>
                            <option value={PaperSize['80mm']}>80mm</option>
                            <option value={PaperSize.A4}>A4</option>
                            <option value={PaperSize.Label}>Label</option>
                        </select>
                    </div>
                    <Input
                        label="KOT Characters Per Line"
                        name="kotCharactersPerLine"
                        type="number"
                        value={localSettings.kotCharactersPerLine}
                        onChange={handleInputChange}
                        min={String(kotPaperSizeConfig.minCharsPerLine)}
                        max={String(kotPaperSizeConfig.maxCharsPerLine)}
                        containerClassName="mb-0"
                    />
                    <div>
                        <label htmlFor="receiptPaperSize" className="block text-sm font-medium text-gray-700 mb-1">Receipt Paper Size</label>
                        <select
                            id="receiptPaperSize"
                            name="receiptPaperSize"
                            value={localSettings.receiptPaperSize}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value={PaperSize['58mm']}>58mm</option>
                            <option value={PaperSize['80mm']}>80mm</option>
                            <option value={PaperSize.A4}>A4</option>
                            <option value={PaperSize.Label}>Label</option>
                        </select>
                    </div>
                </div>
                <p className="text-xs text-gray-500 p-4 pt-0">
                    KOT width now follows the selected paper size. Recommended characters per line for {localSettings.kotPaperSize}: {kotPaperSizeConfig.recommendedCharsPerLine}
                    {' '}({kotPaperSizeConfig.minCharsPerLine}-{kotPaperSizeConfig.maxCharsPerLine} supported).
                </p>
            </Card>
            )}

            {activeTab === 'invoice' && (
            <Card title="Invoice Customization" icon={<FiPrinter />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                     <Input label="Invoice Title" name="invoiceTitle" type="text" value={localSettings.invoiceTitle || ''} onChange={handleInputChange} containerClassName="mb-0"/>
                     <Input label="Footer Text" name="invoiceFooterText" type="text" value={localSettings.invoiceFooterText || ''} onChange={handleInputChange} containerClassName="mb-0"/>
                     <div>
                        <label htmlFor="invoicePaperSize" className="block text-sm font-medium text-gray-700 mb-1">Invoice Paper Size</label>
                        <select
                            id="invoicePaperSize"
                            name="invoicePaperSize"
                            value={localSettings.invoicePaperSize}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value={PaperSize['58mm']}>58mm</option>
                            <option value={PaperSize['80mm']}>80mm</option>
                            <option value={PaperSize.A4}>A4</option>
                            <option value={PaperSize.Label}>Label</option>
                        </select>
                    </div>
                    <Input
                        label="Invoice Characters Per Line"
                        name="invoiceCharactersPerLine"
                        type="number"
                        value={localSettings.invoiceCharactersPerLine}
                        onChange={handleInputChange}
                        min={String(invoicePaperSizeConfig.minCharsPerLine)}
                        max={String(invoicePaperSizeConfig.maxCharsPerLine)}
                        containerClassName="mb-0"
                    />
                    <div>
                        <label htmlFor="saleDetailsPaperSize" className="block text-sm font-medium text-gray-700 mb-1">Sale Details Paper Size</label>
                        <select
                            id="saleDetailsPaperSize"
                            name="saleDetailsPaperSize"
                            value={localSettings.saleDetailsPaperSize}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value={PaperSize['58mm']}>58mm</option>
                            <option value={PaperSize['80mm']}>80mm</option>
                            <option value={PaperSize.A4}>A4</option>
                            <option value={PaperSize.Label}>Label</option>
                        </select>
                    </div>
                    <Input
                        label="Sale Details Characters Per Line"
                        name="saleDetailsCharactersPerLine"
                        type="number"
                        value={localSettings.saleDetailsCharactersPerLine}
                        onChange={handleInputChange}
                        min={String(saleDetailsPaperSizeConfig.minCharsPerLine)}
                        max={String(saleDetailsPaperSizeConfig.maxCharsPerLine)}
                        containerClassName="mb-0"
                    />
                    <Input
                        label="Invoice Font Size"
                        name="invoiceFontSize"
                        type="number"
                        value={localSettings.invoiceFontSize}
                        onChange={handleInputChange}
                        min="8"
                        max="24"
                        containerClassName="mb-0"
                    />
                    <Input
                        label="Invoice Side Margin (mm)"
                        name="invoiceSideMarginMm"
                        type="number"
                        value={localSettings.invoiceSideMarginMm}
                        onChange={handleInputChange}
                        min="0"
                        max="20"
                        containerClassName="mb-0"
                    />
                    <div>
                        <label htmlFor="invoiceDividerStyle" className="block text-sm font-medium text-gray-700 mb-1">Divider Style</label>
                        <select
                            id="invoiceDividerStyle"
                            name="invoiceDividerStyle"
                            value={localSettings.invoiceDividerStyle}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="dashed">Dashed</option>
                            <option value="solid">Solid</option>
                        </select>
                    </div>
                     
                     <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="invoiceShowLogo" 
                            name="invoiceShowLogo" 
                            checked={localSettings.invoiceShowLogo} 
                            onChange={handleInputChange} 
                            className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                        />
                        <label htmlFor="invoiceShowLogo" className="text-sm font-medium text-gray-700">Show Logo</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="invoiceShowQrCode" 
                            name="invoiceShowQrCode" 
                            checked={localSettings.invoiceShowQrCode} 
                            onChange={handleInputChange} 
                            className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                        />
                        <label htmlFor="invoiceShowQrCode" className="text-sm font-medium text-gray-700">Show QR Code</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="invoiceShowRestaurantDetails"
                            name="invoiceShowRestaurantDetails"
                            checked={localSettings.invoiceShowRestaurantDetails ?? true}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                        />
                        <label htmlFor="invoiceShowRestaurantDetails" className="text-sm font-medium text-gray-700">Show Restaurant Information</label>
                    </div>

                    {localSettings.invoiceShowRestaurantDetails && (
                        <div className="col-span-1 md:col-span-2 ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="invoiceShowRestaurantName"
                                        name="invoiceShowRestaurantName"
                                        checked={localSettings.invoiceShowRestaurantName ?? true}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                    />
                                    <label htmlFor="invoiceShowRestaurantName" className="text-sm font-medium text-gray-700">Show Restaurant Name</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="invoiceShowRestaurantAddress"
                                        name="invoiceShowRestaurantAddress"
                                        checked={localSettings.invoiceShowRestaurantAddress ?? true}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                    />
                                    <label htmlFor="invoiceShowRestaurantAddress" className="text-sm font-medium text-gray-700">Show Restaurant Address</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="invoiceShowRestaurantPhone"
                                        name="invoiceShowRestaurantPhone"
                                        checked={localSettings.invoiceShowRestaurantPhone ?? true}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                    />
                                    <label htmlFor="invoiceShowRestaurantPhone" className="text-sm font-medium text-gray-700">Show Restaurant Phone</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="invoiceShowRestaurantEmail"
                                        name="invoiceShowRestaurantEmail"
                                        checked={localSettings.invoiceShowRestaurantEmail ?? true}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                    />
                                    <label htmlFor="invoiceShowRestaurantEmail" className="text-sm font-medium text-gray-700">Show Restaurant Email</label>
                                </div>
                            </div>
                            <Input
                                label="Custom Section"
                                name="invoiceRestaurantSectionTitle"
                                type="text"
                                value={localSettings.invoiceRestaurantSectionTitle || ''}
                                onChange={handleInputChange}
                                placeholder="Optional custom text for restaurant info"
                                containerClassName="mb-0"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="invoiceShowCustomerDetails" 
                            name="invoiceShowCustomerDetails" 
                            checked={localSettings.invoiceShowCustomerDetails} 
                            onChange={handleInputChange} 
                            className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                        />
                        <label htmlFor="invoiceShowCustomerDetails" className="text-sm font-medium text-gray-700">Show Customer Details</label>
                    </div>

                    {localSettings.invoiceShowCustomerDetails && (
                        <div className="col-span-1 md:col-span-2 ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                            <Input
                                label="Customer Section Title"
                                name="invoiceCustomerSectionTitle"
                                type="text"
                                value={localSettings.invoiceCustomerSectionTitle || ''}
                                onChange={handleInputChange}
                                containerClassName="mb-0"
                            />
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowCustomerName" 
                                    name="invoiceShowCustomerName" 
                                    checked={localSettings.invoiceShowCustomerName} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowCustomerName" className="text-sm font-medium text-gray-700">Show Customer Name</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowCustomerPhone" 
                                    name="invoiceShowCustomerPhone" 
                                    checked={localSettings.invoiceShowCustomerPhone} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowCustomerPhone" className="text-sm font-medium text-gray-700">Show Customer Phone</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowCustomerEmail" 
                                    name="invoiceShowCustomerEmail" 
                                    checked={localSettings.invoiceShowCustomerEmail} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowCustomerEmail" className="text-sm font-medium text-gray-700">Show Customer Email</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowCustomerAddress" 
                                    name="invoiceShowCustomerAddress" 
                                    checked={localSettings.invoiceShowCustomerAddress} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowCustomerAddress" className="text-sm font-medium text-gray-700">Show Customer Address</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowCustomerCompany" 
                                    name="invoiceShowCustomerCompany" 
                                    checked={localSettings.invoiceShowCustomerCompany} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowCustomerCompany" className="text-sm font-medium text-gray-700">Show Customer Company</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowCustomerVatPan" 
                                    name="invoiceShowCustomerVatPan" 
                                    checked={localSettings.invoiceShowCustomerVatPan} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowCustomerVatPan" className="text-sm font-medium text-gray-700">Show Customer VAT/PAN</label>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="invoiceShowTaxBreakdown" 
                            name="invoiceShowTaxBreakdown" 
                            checked={localSettings.invoiceShowTaxBreakdown} 
                            onChange={handleInputChange} 
                            className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                        />
                        <label htmlFor="invoiceShowTaxBreakdown" className="text-sm font-medium text-gray-700">Show Tax Breakdown</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="invoiceShowPaymentDetails" 
                            name="invoiceShowPaymentDetails" 
                            checked={localSettings.invoiceShowPaymentDetails} 
                            onChange={handleInputChange} 
                            className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                        />
                        <label htmlFor="invoiceShowPaymentDetails" className="text-sm font-medium text-gray-700">Show Payment Details</label>
                    </div>

                    {localSettings.invoiceShowPaymentDetails && (
                        <div className="col-span-1 md:col-span-2 ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowPaymentMethod" 
                                    name="invoiceShowPaymentMethod" 
                                    checked={localSettings.invoiceShowPaymentMethod} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowPaymentMethod" className="text-sm font-medium text-gray-700">Show Payment Method</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowPaymentDate" 
                                    name="invoiceShowPaymentDate" 
                                    checked={localSettings.invoiceShowPaymentDate} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowPaymentDate" className="text-sm font-medium text-gray-700">Show Payment Date</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowPaymentReference" 
                                    name="invoiceShowPaymentReference" 
                                    checked={localSettings.invoiceShowPaymentReference} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowPaymentReference" className="text-sm font-medium text-gray-700">Show Payment Reference</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowReceivedAmount" 
                                    name="invoiceShowReceivedAmount" 
                                    checked={localSettings.invoiceShowReceivedAmount} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowReceivedAmount" className="text-sm font-medium text-gray-700">Show Received Amount</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="invoiceShowReturnAmount" 
                                    name="invoiceShowReturnAmount" 
                                    checked={localSettings.invoiceShowReturnAmount} 
                                    onChange={handleInputChange} 
                                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                />
                                <label htmlFor="invoiceShowReturnAmount" className="text-sm font-medium text-gray-700">Show Return/Change Amount</label>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="invoiceShowReturnInformation" 
                            name="invoiceShowReturnInformation" 
                            checked={localSettings.invoiceShowReturnInformation} 
                            onChange={handleInputChange} 
                            className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                        />
                        <label htmlFor="invoiceShowReturnInformation" className="text-sm font-medium text-gray-700">Show Return Information</label>
                    </div>

                    {localSettings.invoiceShowReturnInformation && (
                        <div className="col-span-1 md:col-span-2">
                            <Input 
                                label="Return Policy Text" 
                                name="invoiceReturnPolicyText" 
                                type="text" 
                                value={localSettings.invoiceReturnPolicyText || ''} 
                                onChange={handleInputChange} 
                                containerClassName="mb-0"
                            />
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 px-4 pb-4">
                    Invoice width follows {localSettings.invoicePaperSize} with {invoicePaperSizeConfig.minCharsPerLine}-{invoicePaperSizeConfig.maxCharsPerLine} supported characters.
                    {' '}Sale Details uses {localSettings.saleDetailsPaperSize} with {saleDetailsPaperSizeConfig.minCharsPerLine}-{saleDetailsPaperSizeConfig.maxCharsPerLine} supported characters.
                </p>
            </Card>
            )}
            
            {activeTab === 'pos' && (
            <Card title="POS Defaults" icon={<FiShoppingCart />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    <div>
                        <label htmlFor="defaultWalkInCustomerId" className="block text-sm font-medium text-gray-700 mb-1">Default Customer</label>
                        <select id="defaultWalkInCustomerId" name="defaultWalkInCustomerId" value={localSettings.defaultWalkInCustomerId} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                           {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select the customer to be used by default for new POS orders.</p>
                    </div>
                    <div>
                        <label htmlFor="defaultOrderType" className="block text-sm font-medium text-gray-700 mb-1">Default Order Type</label>
                        <select id="defaultOrderType" name="defaultOrderType" value={localSettings.defaultOrderType} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                           <option value="Dine In">Dine In</option>
                           <option value="Delivery">Delivery</option>
                           <option value="Pickup">Pickup</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">The default order type when the POS screen is opened.</p>
                    </div>
                </div>
            </Card>
            )}

            {isDirty && (
              <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
                <span className="text-sm text-gray-600">You have unsaved changes</span>
                <Button variant="secondary" onClick={() => setLocalSettings(applicationSettings)}>Discard</Button>
                <Button onClick={handleSave} leftIcon={<FiSave />}>Save</Button>
              </div>
            )}
        </div>
    );
}

export default AppSettingsPage;
