

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { formatMoney, getDefaultCurrency } from '@/utils/currency';
import { Sale, MenuItem as MenuItemType } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiDollarSign, FiShoppingCart, FiList, FiPrinter, FiPieChart, FiCreditCard, FiTag, FiArrowLeft } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';

interface SummaryLineProps {
    label: string;
    value: string | number;
    icon?: React.ReactElement<IconBaseProps>;
    isTotal?: boolean;
}

const SummaryLine: React.FC<SummaryLineProps> = ({ label, value, icon, isTotal = false }) => (
    <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t-2 border-dashed font-bold text-lg' : 'border-b border-dashed'}`}>
        <span className="flex items-center text-gray-600">
            {icon && React.cloneElement(icon, { className: "mr-2 text-sky-600" })}
            {label}
        </span>
        <span className="font-mono text-gray-800">{value}</span>
    </div>
);

const RegisterReportPage: React.FC = () => {
    const { sales, currencies, applicationSettings } = useRestaurantData();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const dailyData = useMemo(() => {
        const filteredSales = sales.filter(sale => sale.saleDate.startsWith(selectedDate));
        
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const subTotal = filteredSales.reduce((sum, sale) => sum + sale.subTotal, 0);
        const orderCount = filteredSales.length;

        const totalTax = filteredSales.reduce((sum, sale) => {
            const saleTax = sale.taxDetails?.reduce((taxSum, tax) => taxSum + tax.amount, 0) || 0;
            return sum + saleTax;
        }, 0);

        const taxBreakdown = filteredSales.reduce((acc, sale) => {
            sale.taxDetails?.forEach(tax => {
                acc[tax.name] = (acc[tax.name] || 0) + tax.amount;
            });
            return acc;
        }, {} as Record<string, number>);

        const paymentMethodBreakdown = filteredSales.reduce((acc, sale) => {
            const method = sale.paymentMethod || 'Other';
            acc[method] = (acc[method] || 0) + sale.totalAmount;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalSales,
            subTotal,
            totalTax,
            taxBreakdown,
            orderCount,
            paymentMethodBreakdown
        };
    }, [selectedDate, sales]);

    const formatAmount = (amount: number): string => {
        const cur = getDefaultCurrency(currencies);
        if (cur) return formatMoney(amount, cur, applicationSettings);
        const decimals = applicationSettings?.decimalPlaces ?? 2;
        const symbol = applicationSettings?.currencySymbol ?? '$';
        const position = applicationSettings?.currencySymbolPosition ?? 'before';
        const fixed = amount.toFixed(decimals);
        return position === 'before' ? `${symbol}${fixed}` : `${fixed}${symbol}`;
    };

    const handlePrint = () => {
        // This is a simplified print. A real implementation would use CSS print styles.
        const printContent = document.getElementById('report-content')?.innerHTML;
        const originalContent = document.body.innerHTML;
        if (printContent) {
            document.body.innerHTML = printContent;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload(); // Reload to restore React state
        }
    };

    const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
        alert(`Downloading Register Report as ${format}... (This is a simulation)`);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
                    <FiList className="mr-3 text-sky-600" /> Register Report
                </h1>
                <div className="flex items-center space-x-3">
                    <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
                        Back to Dashboard
                    </Button>
                    <Input
                        type="date"
                        label="Report Date:"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        containerClassName="mb-0"
                    />
                    <DownloadReportButton onDownload={handleDownload} />
                    <Button onClick={handlePrint} variant="secondary" leftIcon={<FiPrinter />}>
                        Print
                    </Button>
                </div>
            </div>

            <Card>
                <div id="report-content" className="p-6 max-w-md mx-auto font-sans">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold">End of Day Register Report</h2>
                        <p className="text-sm text-gray-600">For Date: {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-1 mb-4">
                       <SummaryLine label="Total Orders" value={dailyData.orderCount} icon={<FiShoppingCart />}/>
                       <SummaryLine label="Gross Sales (Subtotal)" value={formatAmount(dailyData.subTotal)} icon={<FiDollarSign />}/>
                       <SummaryLine label="Total Tax Collected" value={formatAmount(dailyData.totalTax)} icon={<FiTag />}/>
                       <SummaryLine label="Grand Total Sales" value={formatAmount(dailyData.totalSales)} icon={<FiDollarSign />} isTotal/>
                    </div>

                     <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Sales by Payment Method</h3>
                        <div className="space-y-1">
                             {Object.keys(dailyData.paymentMethodBreakdown).length > 0 ? (
                                Object.entries(dailyData.paymentMethodBreakdown).map(([method, amount]) => (
                                    <SummaryLine key={method} label={method} value={formatAmount(amount)} icon={<FiCreditCard />}/>
                                ))
                             ) : (
                                <p className="text-gray-500 text-sm py-2">No sales recorded for this day.</p>
                             )}
                        </div>
                    </div>
                    
                     <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Tax Summary</h3>
                        <div className="space-y-1">
                           {Object.entries(dailyData.taxBreakdown).map(([name, amount]) => (
                             <SummaryLine key={name} label={`Total ${name}`} value={formatAmount(amount)} />
                           ))}
                           <SummaryLine label="Total Tax" value={formatAmount(dailyData.totalTax)} isTotal/>
                        </div>
                    </div>
                    
                    <div className="mt-8 text-center text-xs text-gray-500">
                        <p>Report Generated: {new Date().toLocaleString()}</p>
                        <p>RestoByte POS</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default RegisterReportPage;
