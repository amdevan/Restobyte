


import React, { useState, useMemo } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Sale, MenuItem as MenuItemType } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiCalendar, FiDollarSign, FiShoppingCart, FiList, FiPrinter, FiPieChart, FiCreditCard, FiTag, FiArrowLeft } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';
import Money from '@/components/common/Money';

interface DailySummaryItem {
  name: string;
  value: React.ReactNode;
  icon: React.ReactElement<IconBaseProps>;
}

interface BreakdownItem {
  name: string;
  orderCount: number;
  totalSales: number;
}

interface TopSellingItem {
  name: string;
  quantity: number;
}

const DailySummaryReportPage: React.FC = () => {
  const { sales, menuItems } = useRestaurantData();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const dailyData = useMemo(() => {
    const filteredSales = sales.filter(sale => sale.saleDate.startsWith(selectedDate));

    const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalOrders = filteredSales.length;
    const averageOrderValue = totalOrders > 0 ? totalSalesAmount / totalOrders : 0;

    const orderTypeBreakdown: Record<string, { orderCount: number; totalSales: number }> = {};
    filteredSales.forEach(sale => {
      if (!orderTypeBreakdown[sale.orderType]) {
        orderTypeBreakdown[sale.orderType] = { orderCount: 0, totalSales: 0 };
      }
      orderTypeBreakdown[sale.orderType].orderCount++;
      orderTypeBreakdown[sale.orderType].totalSales += sale.totalAmount;
    });

    const paymentMethodBreakdown: Record<string, { transactionCount: number; totalSales: number }> = {};
    filteredSales.forEach(sale => {
      const method = sale.paymentMethod || 'Unknown';
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { transactionCount: 0, totalSales: 0 };
      }
      paymentMethodBreakdown[method].transactionCount++;
      paymentMethodBreakdown[method].totalSales += sale.totalAmount;
    });

    const itemSales: Record<string, { name: string; quantity: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!itemSales[item.id]) {
          const menuItem = menuItems.find(mi => mi.id === item.id);
          itemSales[item.id] = { name: menuItem?.name || item.name, quantity: 0 };
        }
        itemSales[item.id].quantity += item.quantity;
      });
    });
    const topSellingItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalSalesAmount,
      totalOrders,
      averageOrderValue,
      orderTypeBreakdown: Object.entries(orderTypeBreakdown).map(([name, data]) => ({ name, ...data })),
      paymentMethodBreakdown: Object.entries(paymentMethodBreakdown).map(([name, data]) => ({ name, ...data })),
      topSellingItems,
    };
  }, [selectedDate, sales, menuItems]);

  const salesOverviewItems: DailySummaryItem[] = [
    { name: 'Total Sales', value: <Money amount={dailyData.totalSalesAmount} />, icon: <FiDollarSign /> },
    { name: 'Total Orders', value: dailyData.totalOrders, icon: <FiShoppingCart /> },
    { name: 'Avg. Order Value', value: <Money amount={dailyData.averageOrderValue} />, icon: <FiDollarSign /> },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Daily Summary Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiCalendar className="mr-3 text-sky-600" /> Daily Summary Report
        </h1>
        <div className="flex items-center space-x-3">
          <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
            Back to Dashboard
          </Button>
          <Input
            type="date"
            label="Select Date:"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            containerClassName="mb-0"
          />
          <DownloadReportButton onDownload={handleDownload} />
          <Button onClick={handlePrint} variant="secondary" leftIcon={<FiPrinter />}>
            Print Report
          </Button>
        </div>
      </div>

      <Card title="Sales Overview" icon={<FiDollarSign />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {salesOverviewItems.map(item => (
            <div key={item.name} className="bg-gray-50 p-4 rounded-lg shadow flex items-center">
              <div className="p-3 bg-sky-100 text-sky-600 rounded-full mr-4">
                {React.cloneElement(item.icon, { size: 24 })}
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.name}</p>
                <p className="text-xl font-semibold text-gray-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Order Type Breakdown" icon={<FiPieChart />}>
          {dailyData.orderTypeBreakdown.length > 0 ? (
            <ul className="space-y-2">
              {dailyData.orderTypeBreakdown.map(item => (
                <li key={item.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-medium text-gray-800">
                    {item.orderCount} Orders / <Money amount={item.totalSales} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No orders for this day.</p>
          )}
        </Card>

        <Card title="Payment Method Breakdown" icon={<FiCreditCard />}>
           {dailyData.paymentMethodBreakdown.length > 0 ? (
            <ul className="space-y-2">
              {dailyData.paymentMethodBreakdown.map(item => (
                <li key={item.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-medium text-gray-800">
                    {item.transactionCount} Transactions / <Money amount={item.totalSales} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-gray-500 text-center py-4">No payments recorded for this day.</p>
          )}
        </Card>
      </div>

      <Card title="Top Selling Items Today" icon={<FiList />}>
        {dailyData.topSellingItems.length > 0 ? (
          <ol className="list-decimal list-inside space-y-2">
            {dailyData.topSellingItems.map(item => (
              <li key={item.name} className="p-2 bg-gray-50 rounded text-gray-700">
                {item.name} - <span className="font-medium text-gray-800">{item.quantity} sold</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-500 text-center py-4">No items sold on this day.</p>
        )}
      </Card>
    </div>
  );
};

export default DailySummaryReportPage;
