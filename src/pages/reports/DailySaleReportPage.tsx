

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiArrowLeft, FiBarChart2, FiDollarSign } from 'react-icons/fi';

const BarChart = ({ data }: { data: { label: string, value: number }[] }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    if (maxValue === 0) return <p className="text-center text-gray-500 py-8">No data to display for this day.</p>;

    return (
        <div className="flex items-end space-x-2 h-64 p-4 border-l border-b bg-gray-50 rounded-lg">
            {data.map(d => (
                <div key={d.label} className="flex-1 flex flex-col items-center justify-end">
                    <div
                        className="w-full bg-sky-500 hover:bg-sky-600 transition-colors rounded-t-sm"
                        style={{ height: `${(d.value / maxValue) * 100}%` }}
                        title={`${d.label}: $${d.value.toFixed(2)}`}
                    ></div>
                    <span className="text-xs mt-1 text-gray-500 transform -rotate-45">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

const DailySaleReportPage: React.FC = () => {
    const { sales } = useRestaurantData();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const hourlySalesData = useMemo(() => {
        const data: { [hour: number]: number } = {};
        for(let i=0; i<24; i++) data[i] = 0;

        sales
            .filter(sale => sale.saleDate.startsWith(selectedDate))
            .forEach(sale => {
                const hour = new Date(sale.saleDate).getHours();
                data[hour] += sale.totalAmount;
            });

        return Object.entries(data).map(([hour, total]) => ({
            label: `${hour.padStart(2, '0')}:00`,
            value: total
        }));
    }, [sales, selectedDate]);
    
    const totalSales = hourlySalesData.reduce((sum, item) => sum + item.value, 0);

    const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
        alert(`Downloading Daily Sale Report as ${format}... (This is a simulation)`);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
                    <FiBarChart2 className="mr-3 text-sky-600" /> Daily Sale Report
                </h1>
                <div className="flex items-center space-x-2">
                    <DownloadReportButton onDownload={handleDownload} />
                    <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
            <Card>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <Input label="Select Date" id="date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} leftIcon={<FiCalendar />} />
                </div>
            </Card>

            <Card title={`Hourly Sales for ${new Date(selectedDate + 'T00:00:00Z').toLocaleDateString()}`}>
                <div className="p-4">
                    <p className="mb-4 text-lg">Total Sales for the day: <span className="font-bold text-xl text-green-600">${totalSales.toFixed(2)}</span></p>
                    <BarChart data={hourlySalesData} />
                </div>
            </Card>
        </div>
    );
};

export default DailySaleReportPage;