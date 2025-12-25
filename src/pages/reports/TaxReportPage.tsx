

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiDollarSign, FiPercent, FiArrowLeft } from 'react-icons/fi';
import Money from '@/components/common/Money';

const TaxReportPage: React.FC = () => {
  const { sales } = useRestaurantData();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const sDate = startDate ? new Date(startDate) : null;
      const eDate = endDate ? new Date(endDate) : null;
      if (sDate && saleDate < sDate) return false;
      if (eDate) {
        const endOfDay = new Date(eDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (saleDate > endOfDay) return false;
      }
      return true;
    }).sort((a,b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [sales, startDate, endDate]);
  
  const taxSummary = useMemo(() => {
    const summary = {
        totalTax: 0,
        breakdown: {} as Record<string, number>
    };
    filteredSales.forEach(sale => {
        if (sale.taxDetails) {
            sale.taxDetails.forEach(tax => {
                summary.totalTax += tax.amount;
                summary.breakdown[tax.name] = (summary.breakdown[tax.name] || 0) + tax.amount;
            });
        }
    });
    return summary;
  }, [filteredSales]);

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Tax Report as ${format}... (This is a simulation)`);
  };


  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiPercent className="mr-3 text-sky-600" /> Tax Report
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
          <Input label="Start Date" id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} leftIcon={<FiCalendar />} />
          <Input label="End Date" id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} leftIcon={<FiCalendar />} />
          <Button onClick={() => { setStartDate(''); setEndDate(''); }} variant="secondary">Reset Dates</Button>
        </div>
      </Card>
      
      <Card title="Tax Summary (Filtered Period)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-sky-50 rounded-lg text-center">
                <p className="text-sm text-sky-600">Total Tax Collected</p>
                <p className="text-2xl font-bold text-sky-800"><Money amount={taxSummary.totalTax} /></p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-600 text-center mb-2">Tax Breakdown</h4>
                <div className="space-y-1">
                    {Object.entries(taxSummary.breakdown).map(([name, amount]) => (
                        <div key={name} className="flex justify-between text-sm">
                            <span className="text-gray-700">{name}</span>
                            <span className="font-medium text-gray-800"><Money amount={amount} /></span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 p-4 border-b">
          Tax Details per Sale ({filteredSales.length})
        </h3>
        <div className="overflow-x-auto">
          {filteredSales.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No sales data found for the selected period.</p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Sale ID</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Subtotal</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total Tax</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Grand Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map(sale => {
                   const totalTaxForSale = sale.taxDetails?.reduce((sum, tax) => sum + tax.amount, 0) || 0;
                   return (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-sky-600">#{sale.id.slice(-6).toUpperCase()}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{new Date(sale.saleDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right"><Money amount={sale.subTotal} /></td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-700 text-right"><Money amount={totalTaxForSale} /></td>
                        <td className="py-3 px-4 text-sm font-bold text-gray-800 text-right"><Money amount={sale.totalAmount} /></td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TaxReportPage;
