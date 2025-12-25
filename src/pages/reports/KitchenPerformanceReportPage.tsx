
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiClock, FiList, FiArrowLeft, FiCalendar, FiTrendingUp, FiTrendingDown, FiCheckCircle } from 'react-icons/fi';

const formatDuration = (ms: number) => {
    if (ms < 0) return 'N/A';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    result += `${seconds}s`;
    return result.trim() || '0s';
};

const KitchenPerformanceReportPage: React.FC = () => {
    const { sales } = useRestaurantData();
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const performanceData = useMemo(() => {
        const completedOrders = sales.filter(s => {
            if (!s.kdsReadyTimestamp) return false;
            
            const readyDate = new Date(s.kdsReadyTimestamp);
            const sDate = startDate ? new Date(startDate) : null;
            const eDate = endDate ? new Date(endDate) : null;

            if (sDate && readyDate < sDate) return false;
            if (eDate) {
                const endOfDay = new Date(eDate);
                endOfDay.setHours(23, 59, 59, 999);
                if (readyDate > endOfDay) return false;
            }
            return true;
        }).map(s => {
            const prepTimeMs = new Date(s.kdsReadyTimestamp!).getTime() - new Date(s.saleDate).getTime();
            return {
                ...s,
                prepTimeMs
            };
        }).sort((a,b) => b.prepTimeMs - a.prepTimeMs);

        const prepTimes = completedOrders.map(o => o.prepTimeMs).filter(t => t >= 0);

        return {
            orders: completedOrders,
            totalCompleted: completedOrders.length,
            avgPrepTime: prepTimes.length > 0 ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length : 0,
            fastestPrepTime: prepTimes.length > 0 ? Math.min(...prepTimes) : 0,
            slowestPrepTime: prepTimes.length > 0 ? Math.max(...prepTimes) : 0,
        };
    }, [sales, startDate, endDate]);

    const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
        alert(`Downloading Kitchen Performance Report as ${format}... (This is a simulation)`);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
                    <FiClock className="mr-3 text-sky-600" /> Kitchen Performance Report
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
                    <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} leftIcon={<FiCalendar />} />
                    <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} leftIcon={<FiCalendar />} />
                    <Button onClick={() => { setStartDate(''); setEndDate(''); }} variant="secondary">Reset Dates</Button>
                </div>
            </Card>

            <Card title="Performance Summary">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-100 rounded-lg text-center"><p className="text-sm">Total Orders Prepared</p><p className="text-2xl font-bold">{performanceData.totalCompleted}</p></div>
                    <div className="p-4 bg-sky-100 rounded-lg text-center"><p className="text-sm">Avg. Prep Time</p><p className="text-2xl font-bold">{formatDuration(performanceData.avgPrepTime)}</p></div>
                    <div className="p-4 bg-green-100 rounded-lg text-center"><p className="text-sm">Fastest Prep Time</p><p className="text-2xl font-bold">{formatDuration(performanceData.fastestPrepTime)}</p></div>
                    <div className="p-4 bg-red-100 rounded-lg text-center"><p className="text-sm">Slowest Prep Time</p><p className="text-2xl font-bold">{formatDuration(performanceData.slowestPrepTime)}</p></div>
                </div>
            </Card>

            <Card className="overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-700 p-4 border-b">Order Details</h3>
                {performanceData.orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">No completed orders found for the selected period.</p>
                ) : (
                    <table className="w-full min-w-max">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-2 px-3 text-left">Order ID</th>
                                <th className="py-2 px-3 text-left">Table</th>
                                <th className="py-2 px-3 text-left">Order Time</th>
                                <th className="py-2 px-3 text-left">Ready Time</th>
                                <th className="py-2 px-3 text-right">Preparation Time</th>
                                <th className="py-2 px-3 text-center">Items</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {performanceData.orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 font-mono text-xs">#{order.id.slice(-6)}</td>
                                    <td className="py-2 px-3 text-sm">{order.assignedTableName}</td>
                                    <td className="py-2 px-3 text-sm">{new Date(order.saleDate).toLocaleTimeString()}</td>
                                    <td className="py-2 px-3 text-sm">{new Date(order.kdsReadyTimestamp!).toLocaleTimeString()}</td>
                                    <td className="py-2 px-3 text-right font-semibold">{formatDuration(order.prepTimeMs)}</td>
                                    <td className="py-2 px-3 text-center text-sm">{order.items.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
};

export default KitchenPerformanceReportPage;
