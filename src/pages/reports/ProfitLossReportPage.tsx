

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiDollarSign, FiTrendingUp, FiTrendingDown, FiAlertCircle, FiBarChart2, FiArrowLeft } from 'react-icons/fi';
import { Sale, Expense } from '@/types';

const ProfitLossReportPage: React.FC = () => {
  const { sales, expenses } = useRestaurantData();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // FIX: Use function overloads to ensure correct type inference for filtered arrays.
  // This prevents TypeScript errors when accessing properties specific to Sale or Expense types.
  function filterByDate(items: Sale[]): Sale[];
  function filterByDate(items: Expense[]): Expense[];
  function filterByDate(items: (Sale | Expense)[]): (Sale | Expense)[] {
    return items.filter(item => {
      const dateString = 'saleDate' in item ? item.saleDate : item.date;
      const itemDate = new Date(dateString);
      const sDate = startDate ? new Date(startDate) : null;
      const eDate = endDate ? new Date(endDate) : null;
      if (sDate && itemDate < sDate) return false;
      if (eDate) {
        const endOfDay = new Date(eDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (itemDate > endOfDay) return false;
      }
      return true;
    });
  };

  const filteredData = useMemo(() => {
    const filteredSales = filterByDate(sales);
    const filteredExpenses = filterByDate(expenses);

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const revenueByOrderType = filteredSales.reduce((acc, sale) => {
      acc[sale.orderType] = (acc[sale.orderType] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      acc[expense.categoryName] = (acc[expense.categoryName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalExpenses,
      profitLoss: totalRevenue - totalExpenses,
      revenueByOrderType,
      expensesByCategory,
    };
  }, [sales, expenses, startDate, endDate]);

  const { totalRevenue, totalExpenses, profitLoss, revenueByOrderType, expensesByCategory } = filteredData;
  
  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Profit & Loss Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiBarChart2 className="mr-3 text-sky-600" /> Profit & Loss Report (Simplified)
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

      <Card title="Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <p className="text-sm text-green-700">Total Revenue</p>
            <p className="text-2xl font-bold text-green-800">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <p className="text-sm text-red-700">Total Expenses</p>
            <p className="text-2xl font-bold text-red-800">${totalExpenses.toFixed(2)}</p>
          </div>
          <div className={`${profitLoss >= 0 ? 'bg-sky-50' : 'bg-rose-50'} p-4 rounded-lg shadow`}>
            <p className={`text-sm ${profitLoss >= 0 ? 'text-sky-700' : 'text-rose-700'}`}>Profit / Loss</p>
            <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-sky-800' : 'text-rose-800'}`}>${profitLoss.toFixed(2)}</p>
          </div>
        </div>
      </Card>
      
      <div className="p-4 bg-amber-50 text-amber-800 rounded-lg flex items-start space-x-3">
        <FiAlertCircle className="flex-shrink-0 w-5 h-5 mt-0.5"/>
        <p className="text-sm">
          <strong>Note:</strong> This is a simplified report showing Total Revenue minus Recorded Expenses. It does <strong className="underline">not</strong> account for the Cost of Goods Sold (COGS), which requires a recipe management system to calculate accurately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue Breakdown" icon={<FiTrendingUp />}>
          {Object.keys(revenueByOrderType).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(revenueByOrderType).map(([type, amount]) => (
                <li key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">{type}</span>
                  <span className="font-medium text-green-700">${amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-center text-gray-500 py-4">No revenue recorded for this period.</p>}
        </Card>

        <Card title="Expense Breakdown" icon={<FiTrendingDown />}>
          {Object.keys(expensesByCategory).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(expensesByCategory).map(([category, amount]) => (
                <li key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">{category}</span>
                  <span className="font-medium text-red-700">${amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-center text-gray-500 py-4">No expenses recorded for this period.</p>}
        </Card>
      </div>
    </div>
  );
};

export default ProfitLossReportPage;