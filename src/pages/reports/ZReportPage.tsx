

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { formatMoney, getDefaultCurrency } from '@/utils/currency';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiPrinter, FiDollarSign, FiCreditCard, FiHash, FiFileText, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';

interface SummaryLineProps {
    label: string;
    value: string | number;
    icon?: React.ReactElement<IconBaseProps>;
    isTotal?: boolean;
    className?: string;
}

const SummaryLine: React.FC<SummaryLineProps> = ({ label, value, icon, isTotal = false, className = '' }) => (
    <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t-2 border-black font-bold text-lg' : 'border-b border-dashed border-gray-400'} ${className}`}>
        <span className="flex items-center text-gray-700">
            {icon && React.cloneElement(icon, { className: "mr-2 text-sky-700" })}
            {label}
        </span>
        <span className="font-mono text-gray-900">{value}</span>
    </div>
);

const ZReportPage: React.FC = () => {
    const { sales, currencies, applicationSettings } = useRestaurantData();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const dailyData = useMemo(() => {
        const filteredSales = sales.filter(sale => sale.saleDate.startsWith(selectedDate));
        
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const subTotal = filteredSales.reduce((sum, sale) => sum + sale.subTotal, 0);
        const totalTax = filteredSales.reduce((sum, sale) => {
            const saleTax = sale.taxDetails?.reduce((taxSum, tax) => taxSum + tax.amount, 0) || 0;
            return sum + saleTax;
        }, 0);
        const orderCount = filteredSales.length;

        const paymentMethodBreakdown = filteredSales.reduce((acc, sale) => {
            const method = sale.paymentMethod || 'Other';
            acc[method] = (acc[method] || 0) + sale.totalAmount;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalSales,
            subTotal,
            totalTax,
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
        const printContent = document.getElementById('z-report-content')?.innerHTML;
        const originalContent = document.body.innerHTML;
        if (printContent) {
            document.body.innerHTML = `<div class="font-mono text-black">${printContent}</div>`;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload(); 
        }
    };

    const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
        alert(`Downloading Z Report as ${format}... (This is a simulation)`);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
                    <FiFileText className="mr-3 text-sky-600" /> Z Report (End of Day)
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
                        Print Z Report
                    </Button>
                </div>
            </div>
            
             <div className="p-4 bg-amber-50 text-amber-800 rounded-lg flex items-start space-x-3">
                <FiAlertTriangle className="flex-shrink-0 w-5 h-5 mt-0.5"/>
                <p className="text-sm">
                    A 'Z Report' typically finalizes and closes the business day. In a real POS system, generating this report would prevent further sales for this date. This simulation is read-only.
                </p>
            </div>


            <Card>
                <div id="z-report-content" className="p-6 max-w-md mx-auto font-mono text-black bg-white">
                    <div className="text-center mb-4 border-b-2 border-black pb-2">
                        <h2 className="text-2xl font-bold">Z REPORT</h2>
                        <p className="text-sm">END OF DAY FINANCIALS</p>
                        <p className="text-xs">Date: {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</p>
                    </div>

                     <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">SALES BY PAYMENT TYPE</h3>
                        <div className="space-y-1">
                             {Object.keys(dailyData.paymentMethodBreakdown).length > 0 ? (
                                Object.entries(dailyData.paymentMethodBreakdown).map(([method, amount]) => (
                                    <SummaryLine key={method} label={method.toUpperCase()} value={formatAmount(amount)}/>
                                ))
                             ) : (
                                <p className="text-gray-600 text-sm py-2 text-center">-- NO SALES RECORDED --</p>
                             )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">TOTALS</h3>
                        <div className="space-y-1 mb-4">
                           <SummaryLine label="ORDER COUNT" value={dailyData.orderCount}/>
                           <SummaryLine label="GROSS SALES" value={formatAmount(dailyData.subTotal)}/>
                           <SummaryLine label="TOTAL TAX" value={formatAmount(dailyData.totalTax)}/>
                           <SummaryLine label="NET SALES" value={formatAmount(dailyData.totalSales)} isTotal className="text-xl"/>
                        </div>
                    </div>
                    
                    <div className="mt-8 text-center text-xs">
                        <p>END OF Z REPORT</p>
                        <p>Report Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ZReportPage;
