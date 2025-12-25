import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { formatMoney, getDefaultCurrency } from '@/utils/currency';
import { suggestDailySpecial } from '../services/geminiService';
import Card from '@/components/common/Card';
import Spinner from '@/components/common/Spinner';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { 
  FiRefreshCw, FiAlertTriangle, FiGift, FiDollarSign, FiShoppingCart, FiCreditCard, FiFilter, FiXCircle, FiTrendingUp, FiList,
  FiArchive, FiTrendingDown, FiUsers
} from 'react-icons/fi';
import { StockItem, SalesTrendDataPoint, Sale, Purchase, Expense } from '../types';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import SalesTrendChart from '@/components/dashboard/SalesTrendChart';
import DashboardInfoCard from '@/components/dashboard/DashboardInfoCard';
import RecentActivityCard from '@/components/dashboard/RecentActivityCard';
import OutletSelector from '@/components/common/OutletSelector';

const getDateString = (date: Date): string => date.toISOString().split('T')[0];

const DashboardPage: React.FC = () => {
  const { sales, stockItems, menuItems, purchases, expenses, activeOutletIds, customers, currencies, applicationSettings } = useRestaurantData();
  const [dailySpecial, setDailySpecial] = useState<{ name: string; description: string } | null>(null);
  const [isLoadingSpecial, setIsLoadingSpecial] = useState(true);
  const [specialError, setSpecialError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return getDateString(date);
  });
  const [endDate, setEndDate] = useState(getDateString(new Date()));
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const datePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (datePopoverRef.current && !datePopoverRef.current.contains(event.target as Node)) {
            setIsDatePopoverOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSpecial = async () => {
    setIsLoadingSpecial(true);
    setSpecialError(null);
    try {
      const special = await suggestDailySpecial();
      if (!special || special.name.includes("Error") || special.name.includes("Unavailable") || special.name.includes("Quota") || special.name.includes("API Key")) {
        setSpecialError(special?.description || "An unknown error occurred while fetching the daily special.");
        setDailySpecial(null);
      } else {
        setDailySpecial(special);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Failed to fetch daily special:", error);
      setSpecialError(errorMessage);
    } finally {
      setIsLoadingSpecial(false);
    }
  };

  useEffect(() => {
    fetchSpecial();
  }, []);
  
  const handleSetDateRangePreset = (preset: 'today' | '7d' | '30d') => {
    const today = new Date();
    let sDate = new Date();
    
    if (preset === 'today') {
        sDate = new Date(today);
    } else if (preset === '7d') {
        sDate.setDate(today.getDate() - 6);
    } else if (preset === '30d') {
        sDate.setDate(today.getDate() - 29);
    }
    
    setStartDate(getDateString(sDate));
    setEndDate(getDateString(today));
    setActiveFilter(preset);
    setIsDatePopoverOpen(false);
  };

  const handleDateChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setActiveFilter('custom');
  };
  
  const customDateDisplay = useMemo(() => {
    if (activeFilter !== 'custom' || !startDate || !endDate) {
      return "Custom Range";
    }
    const sDate = new Date(startDate + 'T00:00:00');
    const eDate = new Date(endDate + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${sDate.toLocaleDateString(undefined, options)} - ${eDate.toLocaleDateString(undefined, options)}`;
  }, [startDate, endDate, activeFilter]);
  
  function filterByDateAndOutlet(items: Sale[]): Sale[];
  function filterByDateAndOutlet(items: Purchase[]): Purchase[];
  function filterByDateAndOutlet(items: Expense[]): Expense[];
  function filterByDateAndOutlet(items: (Sale | Purchase | Expense)[]): (Sale | Purchase | Expense)[] {
    const sDate = startDate || '0000-01-01';
    const eDate = endDate || '9999-12-31';
    return items.filter(item => {
        const itemDateStr = 'saleDate' in item ? item.saleDate : item.date;
        const itemDate = itemDateStr.split('T')[0];
        return itemDate >= sDate && itemDate <= eDate && activeOutletIds.includes(item.outletId);
    });
  };

  const filteredSales = useMemo(() => {
    return filterByDateAndOutlet(sales)
      .sort((a,b) => new Date(b.saleDate!).getTime() - new Date(a.saleDate!).getTime());
  }, [sales, startDate, endDate, activeOutletIds]);
  
  const filteredPurchases = useMemo(() => filterByDateAndOutlet(purchases), [purchases, startDate, endDate, activeOutletIds]);

  const filteredExpenses = useMemo(() => filterByDateAndOutlet(expenses), [expenses, startDate, endDate, activeOutletIds]);


  const keyMetrics = useMemo(() => {
      const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalOrders = filteredSales.length;
      const averageOrderValue = totalOrders > 0 ? totalSalesAmount / totalOrders : 0;
      const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.grandTotalAmount, 0);
      const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalPayable = filteredPurchases.reduce((sum, p) => sum + (p.grandTotalAmount - (p.paidAmount || 0)), 0);
      const totalReceivable = customers.reduce((sum, c) => sum + (c.dueAmount || 0), 0);
      
      let cashInHand = 0;
      let cashAtBank = 0;

      filteredSales.forEach(sale => {
          if (sale.partialPayments && sale.partialPayments.length > 0) {
              sale.partialPayments.forEach(p => {
                  if (p.method === 'Cash') {
                      cashInHand += p.amount;
                  } else if (p.method === 'Card' || p.method === 'Online Payment') {
                      cashAtBank += p.amount;
                  }
              });
          } else if (sale.paymentMethod) {
              if (sale.paymentMethod === 'Cash') {
                  cashInHand += sale.totalAmount;
              } else if (sale.paymentMethod === 'Card' || sale.paymentMethod === 'Online Payment') {
                  cashAtBank += sale.totalAmount;
              }
          }
      });
      
      const totalIncome = totalSalesAmount;

      return { 
          totalSales: totalSalesAmount, 
          totalOrders, 
          averageOrderValue,
          totalPurchases,
          totalExpenses: totalExpensesAmount,
          totalPayable,
          totalReceivable,
          totalIncome,
          cashInHand,
          cashAtBank,
      };
  }, [filteredSales, filteredPurchases, filteredExpenses, customers]);

  const lowStockAlertsCount = useMemo(() => {
    // Note: Stock is currently global. This count will not be filtered by outlet.
    return stockItems.filter((item: StockItem) => item.quantity > 0 && item.quantity <= item.lowStockThreshold).length;
  }, [stockItems]);

  const salesTrendData = useMemo((): SalesTrendDataPoint[] => {
    const dateMap: Record<string, number> = {};
    filteredSales.forEach(sale => {
        const date = sale.saleDate.split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + sale.totalAmount;
    });
    const trend: SalesTrendDataPoint[] = [];
    const sDate = new Date(startDate + 'T00:00:00');
    const eDate = new Date(endDate + 'T00:00:00');
    
    for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
        const dateStr = getDateString(d);
        trend.push({ date: dateStr, sales: dateMap[dateStr] || 0 });
    }
    return trend;
  }, [filteredSales, startDate, endDate]);
  
  const infoCardData = useMemo(() => {
      const itemCounts: Record<string, { name: string; quantity: number }> = {};

      filteredSales.forEach(sale => {
          sale.items.forEach(item => {
              if (!itemCounts[item.id]) {
                  itemCounts[item.id] = { name: item.name, quantity: 0 };
              }
              itemCounts[item.id].quantity += item.quantity;
          });
      });

      const topItems = Object.values(itemCounts).sort((a,b) => b.quantity - a.quantity).slice(0, 5).map(item => ({ label: item.name, value: item.quantity }));
        
      return { topItems };
  }, [filteredSales]);

  const formatAmount = (amount: number): string => {
    const cur = getDefaultCurrency(currencies);
    if (cur) return formatMoney(amount, cur, applicationSettings);
    const decimals = applicationSettings?.decimalPlaces ?? 2;
    const symbol = applicationSettings?.currencySymbol ?? '$';
    const position = applicationSettings?.currencySymbolPosition ?? 'before';
    const fixed = amount.toFixed(decimals);
    return position === 'before' ? `${symbol}${fixed}` : `${fixed}${symbol}`;
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6 bg-white p-4 rounded-xl shadow">
            {/* Left side filters */}
            <div className="flex items-center gap-x-4">
                <h2 className="text-lg font-semibold text-gray-700 flex-shrink-0">
                    Filters
                </h2>
                <div className="h-6 w-px bg-gray-200"></div>
                <OutletSelector />
            </div>

            {/* Right side date filters */}
            <div className="flex items-center gap-x-2">
                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-full">
                    <Button
                        size="sm"
                        variant={activeFilter === 'today' ? 'primary' : 'secondary'}
                        className={`!rounded-full !px-4 transition-colors ${activeFilter === 'today' ? 'shadow' : '!bg-transparent text-gray-600 hover:!bg-white/60'}`}
                        onClick={() => handleSetDateRangePreset('today')}
                    >
                        Today
                    </Button>
                    <Button
                        size="sm"
                        variant={activeFilter === '7d' ? 'primary' : 'secondary'}
                        className={`!rounded-full !px-4 transition-colors ${activeFilter === '7d' ? 'shadow' : '!bg-transparent text-gray-600 hover:!bg-white/60'}`}
                        onClick={() => handleSetDateRangePreset('7d')}
                    >
                        7 Days
                    </Button>
                    <Button
                        size="sm"
                        variant={activeFilter === '30d' ? 'primary' : 'secondary'}
                        className={`!rounded-full !px-4 transition-colors ${activeFilter === '30d' ? 'shadow' : '!bg-transparent text-gray-600 hover:!bg-white/60'}`}
                        onClick={() => handleSetDateRangePreset('30d')}
                    >
                        30 Days
                    </Button>
                </div>
                <div className="relative" ref={datePopoverRef}>
                    <Button
                        size="sm"
                        variant={activeFilter === 'custom' ? 'primary' : 'secondary'}
                        className={`!rounded-full !px-4 transition-colors min-w-[150px] text-center ${activeFilter === 'custom' ? 'shadow' : '!bg-transparent text-gray-600 hover:!bg-white/60'}`}
                        onClick={() => setIsDatePopoverOpen(prev => !prev)}
                    >
                        {customDateDisplay}
                    </Button>
                    {isDatePopoverOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white p-4 rounded-lg shadow-2xl z-20 border animate-fade-in-down">
                            <p className="text-sm font-semibold mb-2">Select Custom Date Range</p>
                            <Input label="Start Date" type="date" value={startDate} onChange={e => handleDateChange(setStartDate, e.target.value)} containerClassName="mb-2" />
                            <Input label="End Date" type="date" value={endDate} onChange={e => handleDateChange(setEndDate, e.target.value)} containerClassName="mb-0" />
                        </div>
                    )}
                </div>
            </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardStatCard title="Total Income" value={formatAmount(keyMetrics.totalIncome)} icon={<FiTrendingUp />} path="/app/sale" />
            <DashboardStatCard title="Cash in Hand" value={formatAmount(keyMetrics.cashInHand)} icon={<FiDollarSign />} path="/app/sale" />
            <DashboardStatCard title="Cash at Bank" value={formatAmount(keyMetrics.cashAtBank)} icon={<FiCreditCard />} path="/app/sale" />
            <DashboardStatCard title="Total Orders" value={keyMetrics.totalOrders.toString()} icon={<FiShoppingCart />} path="/app/sale" />
            <DashboardStatCard title="Total Receivable" value={formatAmount(keyMetrics.totalReceivable)} icon={<FiUsers />} path="/app/customer-due-receive" />
            <DashboardStatCard title="Total Payable" value={formatAmount(keyMetrics.totalPayable)} icon={<FiTrendingDown />} path="/app/supplier-due-payment" />
            <DashboardStatCard title="Avg. Order Value" value={formatAmount(keyMetrics.averageOrderValue)} icon={<FiCreditCard />} path="/app/sale" />
            <DashboardStatCard title="Total Purchases" value={formatAmount(keyMetrics.totalPurchases)} icon={<FiArchive />} path="/app/purchase" />
            <DashboardStatCard title="Total Expenses" value={formatAmount(keyMetrics.totalExpenses)} icon={<FiTrendingDown />} path="/app/expense" />
            <DashboardStatCard title="Low Stock Items" value={lowStockAlertsCount.toString()} icon={<FiAlertTriangle />} path="/app/stock/low-stock-report" />
          </div>

          <Card title="Sales Trend" icon={<FiTrendingUp className="text-sky-600"/>}>
               <SalesTrendChart data={salesTrendData} />
           </Card>
        </div>

        <div className="space-y-6">
            <div className="p-5 bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-xl rounded-xl">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-white flex items-center"><FiGift className="mr-2"/> AI Daily Special</h3>
                    <Button onClick={fetchSpecial} size="sm" className="bg-white/20 hover:bg-white/30 text-white !border-0" leftIcon={<FiRefreshCw size={14} />} disabled={isLoadingSpecial}> {isLoadingSpecial ? '...' : ''} </Button>
                </div>
                <div>
                    {isLoadingSpecial && <div className="flex justify-center py-4"><Spinner color="text-white" /></div>}
                    {specialError && !isLoadingSpecial && ( <div className="flex items-center p-3 bg-white/10 rounded-md"> <FiAlertTriangle className="mr-2 flex-shrink-0" /> <span className="text-sm">{specialError}</span> </div> )}
                    {dailySpecial && !isLoadingSpecial && !specialError && (<div><h4 className="text-lg font-semibold text-white mb-1">{dailySpecial.name}</h4><p className="text-sky-100 text-sm">{dailySpecial.description}</p></div>)}
                    {!dailySpecial && !isLoadingSpecial && !specialError && ( <p className="text-sm">No special suggestion available.</p> )}
                </div>
            </div>

            <RecentActivityCard sales={filteredSales} />
            <DashboardInfoCard title="Top Selling Items" icon={<FiList className="text-purple-600"/>} data={infoCardData.topItems} unit="sold" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
