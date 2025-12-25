
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiDollarSign, FiUser, FiArrowLeft } from 'react-icons/fi';

interface WaiterTipData {
  waiterId: string;
  waiterName: string;
  totalTips: number;
  orderCount: number;
}

const WaiterTipsReportPage: React.FC = () => {
  const { sales, waiters } = useRestaurantData();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWaiterId, setSelectedWaiterId] = useState('All');

  const tipsData = useMemo(() => {
    const filteredSales = sales.filter(sale => {
      if (!sale.tipAmount || sale.tipAmount <= 0) return false;
      const saleDate = new Date(sale.saleDate);
      const sDate = startDate ? new Date(startDate) : null;
      const eDate = endDate ? new Date(endDate) : null;
      if (sDate && saleDate < sDate) return false;
      if (eDate) {
        const endOfDay = new Date(eDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (saleDate > endOfDay) return false;
      }
      if (selectedWaiterId !== 'All' && sale.waiterId !== selectedWaiterId) return false;
      return true;
    });

    const data: Record<string, WaiterTipData> = {};

    filteredSales.forEach(sale => {
      const waiterId = sale.waiterId || 'unassigned';
      if (!data[waiterId]) {
        const waiter = waiters.find(w => w.id === waiterId);
        data[waiterId] = { 
          waiterId,
          waiterName: waiter?.name || sale.waiterName || 'Unassigned',
          totalTips: 0,
          orderCount: 0
        };
      }
      data[waiterId].totalTips += sale.tipAmount!;
      data[waiterId].orderCount++;
    });
    
    return Object.values(data).sort((a, b) => b.totalTips - a.totalTips);
  }, [sales, waiters, startDate, endDate, selectedWaiterId]);

  const totalTips = useMemo(() => {
    return tipsData.reduce((sum, item) => sum + item.totalTips, 0);
  }, [tipsData]);

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Waiter Tips Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiDollarSign className="mr-3 text-sky-600" /> Waiter Tips Report
        </h1>
        <div className="flex items-center space-x-2">
            <DownloadReportButton onDownload={handleDownload} />
            <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
                Back to Dashboard
            </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} leftIcon={<FiCalendar />} />
          <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} leftIcon={<FiCalendar />} />
          <div>
            <label htmlFor="waiterFilter" className="block text-sm font-medium text-gray-700 mb-1">Waiter</label>
            <select id="waiterFilter" value={selectedWaiterId} onChange={e => setSelectedWaiterId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="All">All Waiters</option>
                {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <Button onClick={() => { setStartDate(''); setEndDate(''); setSelectedWaiterId('All'); }} variant="secondary">Reset Filters</Button>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="p-4 mb-0 flex justify-between items-center bg-gray-50 rounded-t-lg border-b">
          <h3 className="text-lg font-semibold text-gray-700">Tips Summary ({tipsData.length} Waiters)</h3>
           <div className="text-right">
                <p className="text-sm text-gray-600">Total Tips (Filtered)</p>
                <p className="text-xl font-bold text-green-600">${totalTips.toFixed(2)}</p>
            </div>
        </div>
        <div className="overflow-x-auto">
          {tipsData.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No tips recorded for the selected criteria.</p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Waiter Name</th>
                  <th className="py-3 px-4 text-right">Number of Tipped Orders</th>
                  <th className="py-3 px-4 text-right">Total Tips</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tipsData.map(item => (
                  <tr key={item.waiterId} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.waiterName}</td>
                    <td className="py-3 px-4 text-right">{item.orderCount}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-700">${item.totalTips.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WaiterTipsReportPage;
