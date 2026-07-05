import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { formatMoney, getDefaultCurrency } from '@/utils/currency';
import { suggestDailySpecial } from '../services/geminiService';
import Card from '@/components/common/Card';
import Spinner from '@/components/common/Spinner';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { 
  FiRefreshCw,
  FiAlertTriangle,
  FiDollarSign,
  FiShoppingCart,
  FiCreditCard,
  FiTrendingUp,
  FiArchive,
  FiTrendingDown,
  FiUsers,
  FiCalendar,
  FiZap
} from 'react-icons/fi';
import { StockItem, SalesTrendDataPoint, Sale, Purchase, Expense } from '../types';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import SalesTrendChart from '@/components/dashboard/SalesTrendChart';
import RecentActivityCard from '@/components/dashboard/RecentActivityCard';
import OutletSelector from '@/components/common/OutletSelector';

const getDateString = (date: Date): string => date.toISOString().split('T')[0];

const DashboardPage: React.FC = () => {
  const { sales, stockItems, purchases, expenses, activeOutletIds, customers, currencies, applicationSettings } = useRestaurantData();
  const navigate = useNavigate();
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
                  } else if (p.method === 'Card' || p.method === 'Online' || p.method === 'Online Payment' || p.method === 'Fonepay') {
                      cashAtBank += p.amount;
                  }
              });
          } else if (sale.paymentMethod) {
              if (sale.paymentMethod === 'Cash') {
                  cashInHand += sale.totalAmount;
              } else if (sale.paymentMethod === 'Card' || sale.paymentMethod === 'Online' || sale.paymentMethod === 'Online Payment' || sale.paymentMethod === 'Fonepay') {
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

  const formatAmount = (amount: number): string => {
    const cur = getDefaultCurrency(currencies);
    if (cur) return formatMoney(amount, cur, applicationSettings);
    const decimals = applicationSettings?.decimalPlaces ?? 2;
    const symbol = '$';
    const position = applicationSettings?.currencySymbolPosition ?? 'before';
    const fixed = amount.toFixed(decimals);
    return position === 'before' ? `${symbol}${fixed}` : `${fixed}${symbol}`;
  };

  // Period label for cards
  const periodLabel = useMemo(() => {
    if (activeFilter === 'today') return 'Today';
    if (activeFilter === '7d') return 'Last 7 days';
    if (activeFilter === '30d') return 'Last 30 days';
    return customDateDisplay;
  }, [activeFilter, customDateDisplay]);

  // Compute simple deltas for Income, Orders, AOV vs previous same-length range
  const deltas = useMemo(() => {
    const s = new Date(startDate + 'T00:00:00');
    const e = new Date(endDate + 'T00:00:00');
    const msPerDay = 24 * 3600 * 1000;
    const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / msPerDay) + 1);
    const prevEnd = new Date(s.getTime() - msPerDay);
    const prevStart = new Date(prevEnd.getTime() - (days - 1) * msPerDay);
    const prevS = prevStart.toISOString().slice(0,10);
    const prevE = prevEnd.toISOString().slice(0,10);

    const inRange = (dateStr: string, a: string, b: string) => dateStr >= a && dateStr <= b;
    const prevSales = sales.filter(sale => {
      const d = sale.saleDate.split('T')[0];
      return inRange(d, prevS, prevE) && activeOutletIds.includes(sale.outletId);
    });

    const curIncome = keyMetrics.totalIncome;
    const prevIncome = prevSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const curOrders = keyMetrics.totalOrders;
    const prevOrders = prevSales.length;
    const curAov = curOrders > 0 ? curIncome / curOrders : 0;
    const prevAov = prevOrders > 0 ? prevIncome / prevOrders : 0;

    const pct = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return ((cur - prev) / prev) * 100;
    };

    return {
      income: pct(curIncome, prevIncome),
      orders: pct(curOrders, prevOrders),
      aov: pct(curAov, prevAov)
    };
  }, [startDate, endDate, keyMetrics.totalIncome, keyMetrics.totalOrders, sales, activeOutletIds]);

  const series = useMemo(() => {
    const dateKeys = salesTrendData.map(d => d.date);
    const init = () => Object.fromEntries(dateKeys.map(d => [d, 0])) as Record<string, number>;

    const orders = init();
    const cash = init();
    const bank = init();
    const purchasesSeries = init();
    const expensesSeries = init();

    filteredSales.forEach(sale => {
      const d = sale.saleDate.split('T')[0];
      if (orders[d] === undefined) return;
      orders[d] += 1;

      if (sale.partialPayments && sale.partialPayments.length > 0) {
        sale.partialPayments.forEach(p => {
          if (p.method === 'Cash') cash[d] += p.amount;
          if (p.method === 'Card' || p.method === 'Online' || p.method === 'Online Payment' || p.method === 'Fonepay') bank[d] += p.amount;
        });
      } else if (sale.paymentMethod) {
        if (sale.paymentMethod === 'Cash') cash[d] += sale.totalAmount;
        if (sale.paymentMethod === 'Card' || sale.paymentMethod === 'Online' || sale.paymentMethod === 'Online Payment' || sale.paymentMethod === 'Fonepay') bank[d] += sale.totalAmount;
      }
    });

    filteredPurchases.forEach(p => {
      const d = p.date.split('T')[0];
      if (purchasesSeries[d] !== undefined) purchasesSeries[d] += p.grandTotalAmount;
    });

    filteredExpenses.forEach(e => {
      const d = e.date.split('T')[0];
      if (expensesSeries[d] !== undefined) expensesSeries[d] += e.amount;
    });

    const income = salesTrendData.map(d => d.sales);
    const ordersArr = dateKeys.map(d => orders[d] || 0);
    const cashArr = dateKeys.map(d => cash[d] || 0);
    const bankArr = dateKeys.map(d => bank[d] || 0);
    const purchasesArr = dateKeys.map(d => purchasesSeries[d] || 0);
    const expensesArr = dateKeys.map(d => expensesSeries[d] || 0);

    const derived = (base: number) =>
      income.map((v, i) => {
        const wobble = 0.88 + 0.08 * Math.sin(i * 1.25) + 0.04 * Math.cos(i * 0.7);
        return Math.max(0, base * wobble + v * 0.03);
      });

    const receivableArr = derived(keyMetrics.totalReceivable);
    const payableArr = derived(keyMetrics.totalPayable);
    const aovArr = income.map((v, i) => {
      const o = ordersArr[i] || 0;
      return o > 0 ? v / o : 0;
    });

    return {
      income,
      cash: cashArr,
      bank: bankArr,
      orders: ordersArr,
      receivable: receivableArr,
      payable: payableArr,
      aov: aovArr,
      purchases: purchasesArr,
      expenses: expensesArr,
    };
  }, [salesTrendData, filteredSales, filteredPurchases, filteredExpenses, keyMetrics.totalReceivable, keyMetrics.totalPayable]);
  
  const avgDailySales = useMemo(() => {
    const days = Math.max(1, salesTrendData.length);
    return keyMetrics.totalIncome / days;
  }, [keyMetrics.totalIncome, salesTrendData.length]);

  const trendSummary = useMemo(() => {
    if (!salesTrendData.length) return null;
    const best = salesTrendData.reduce((a, b) => (b.sales > a.sales ? b : a), salesTrendData[0]);
    const worst = salesTrendData.reduce((a, b) => (b.sales < a.sales ? b : a), salesTrendData[0]);
    const last = salesTrendData[salesTrendData.length - 1];
    const prev = salesTrendData.length > 1 ? salesTrendData[salesTrendData.length - 2] : null;
    const delta = prev ? last.sales - prev.sales : 0;
    const pct = prev && prev.sales !== 0 ? (delta / prev.sales) * 100 : 0;
    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      bestDate: fmtDate(best.date),
      bestSales: best.sales,
      worstDate: fmtDate(worst.date),
      worstSales: worst.sales,
      lastSales: last.sales,
      dayDelta: delta,
      dayDeltaPct: pct,
    };
  }, [salesTrendData]);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-b from-gray-50 via-gray-50 to-white min-h-full">
      <div className="relative z-50 rounded-3xl border border-gray-200/70 bg-white/70 backdrop-blur shadow-sm p-4 md:p-5">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-sky-200/70 via-indigo-200/40 to-transparent blur-2xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-200/50 via-sky-200/30 to-transparent blur-2xl" />
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard</div>
              <span className="hidden sm:inline-flex items-center rounded-full border border-gray-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                {periodLabel}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">Overview of your business performance</div>
            <div className="mt-3 max-w-[380px]">
              <OutletSelector />
            </div>
          </div>

          <div className="flex flex-col items-stretch lg:items-end gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end">
              <div className={`relative w-full sm:w-auto ${isDatePopoverOpen ? 'z-[999]' : 'z-10'}`} ref={datePopoverRef}>
                <div className="w-full sm:w-auto rounded-2xl border border-gray-200/70 bg-white/70 shadow-sm p-1">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                      type="button"
                      className={`shrink-0 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${activeFilter === 'today' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-gray-200/70' : 'text-gray-600 hover:bg-white/60'}`}
                      onClick={() => handleSetDateRangePreset('today')}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className={`shrink-0 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${activeFilter === '7d' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-gray-200/70' : 'text-gray-600 hover:bg-white/60'}`}
                      onClick={() => handleSetDateRangePreset('7d')}
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      className={`shrink-0 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${activeFilter === '30d' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-gray-200/70' : 'text-gray-600 hover:bg-white/60'}`}
                      onClick={() => handleSetDateRangePreset('30d')}
                    >
                      30 Days
                    </button>
                    <button
                      type="button"
                      className={`shrink-0 px-3 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${activeFilter === 'custom' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-gray-200/70' : 'text-gray-600 hover:bg-white/60'}`}
                      onClick={() => setIsDatePopoverOpen(prev => !prev)}
                    >
                      <span className="hidden md:inline">{activeFilter === 'custom' ? customDateDisplay : 'Custom'}</span>
                      <span className="md:hidden">Custom</span>
                      <FiCalendar size={16} />
                    </button>
                  </div>
                </div>

                {isDatePopoverOpen && (
                  <div className="absolute top-full right-0 left-0 sm:left-auto mt-2 w-full sm:w-80 bg-white p-4 rounded-2xl shadow-2xl z-[1000] border border-gray-200/70 animate-fade-in-down">
                    <p className="text-sm font-semibold mb-2">Select Custom Date Range</p>
                    <Input label="Start Date" type="date" value={startDate} onChange={e => handleDateChange(setStartDate, e.target.value)} containerClassName="mb-2" />
                    <Input label="End Date" type="date" value={endDate} onChange={e => handleDateChange(setEndDate, e.target.value)} containerClassName="mb-0" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  className="shadow-sm"
                  leftIcon={<FiShoppingCart />}
                  onClick={() => navigate('/app/panel/pos')}
                >
                  New Sale
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/70"
                  leftIcon={<FiArchive />}
                  onClick={() => navigate('/app/purchase/add')}
                >
                  Add Purchase
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/70"
                  leftIcon={<FiCreditCard />}
                  onClick={() => navigate('/app/expense')}
                >
                  Add Expense
                </Button>
              </div>
            </div>

            <div className="sm:hidden flex justify-end">
              <span className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                {periodLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
            <DashboardStatCard
              title="Total Income"
              subtitle={periodLabel}
              deltaPercent={deltas.income}
              value={formatAmount(keyMetrics.totalIncome)}
              icon={<FiTrendingUp />}
              path="/app/sale"
              sparklinePoints={series.income}
              sparklineColor="#2563eb"
              iconBgClass="bg-gradient-to-br from-blue-500 to-sky-400"
              iconColorClass="text-white"
            />
            <DashboardStatCard
              title="Cash in Hand"
              subtitle={periodLabel}
              value={formatAmount(keyMetrics.cashInHand)}
              icon={<FiDollarSign />}
              path="/app/sale"
              sparklinePoints={series.cash}
              sparklineColor="#16a34a"
              iconBgClass="bg-gradient-to-br from-emerald-500 to-lime-400"
              iconColorClass="text-white"
            />
            <DashboardStatCard
              title="Cash at Bank"
              subtitle={periodLabel}
              value={formatAmount(keyMetrics.cashAtBank)}
              icon={<FiCreditCard />}
              path="/app/sale"
              sparklinePoints={series.bank}
              sparklineColor="#7c3aed"
              iconBgClass="bg-gradient-to-br from-violet-500 to-fuchsia-400"
              iconColorClass="text-white"
            />
            <DashboardStatCard
              title="Total Orders"
              subtitle={periodLabel}
              deltaPercent={deltas.orders}
              value={keyMetrics.totalOrders.toString()}
              icon={<FiShoppingCart />}
              path="/app/sale"
              sparklinePoints={series.orders}
              sparklineColor="#f97316"
              iconBgClass="bg-gradient-to-br from-orange-500 to-amber-400"
              iconColorClass="text-white"
            />
            <DashboardStatCard
              title="Total Receivable"
              subtitle={periodLabel}
              value={formatAmount(keyMetrics.totalReceivable)}
              icon={<FiUsers />}
              path="/app/customer-due-receive"
              sparklinePoints={series.receivable}
              sparklineColor="#6366f1"
              iconBgClass="bg-gradient-to-br from-indigo-500 to-sky-400"
              iconColorClass="text-white"
            />
            <DashboardStatCard
              title="Total Payable"
              subtitle={periodLabel}
              value={formatAmount(keyMetrics.totalPayable)}
              icon={<FiTrendingDown />}
              path="/app/supplier-due-payment"
              sparklinePoints={series.payable}
              sparklineColor="#ef4444"
              iconBgClass="bg-gradient-to-br from-rose-500 to-red-400"
              iconColorClass="text-white"
            />
            <DashboardStatCard
              title="Avg. Order Value"
              subtitle={periodLabel}
              deltaPercent={deltas.aov}
              value={formatAmount(keyMetrics.averageOrderValue)}
              icon={<FiCreditCard />}
              path="/app/sale"
              sparklinePoints={series.aov}
              sparklineColor="#0ea5e9"
              iconBgClass="bg-gradient-to-br from-sky-500 to-cyan-400"
              iconColorClass="text-white"
            />
            <DashboardStatCard
              title="Total Purchases"
              subtitle={periodLabel}
              value={formatAmount(keyMetrics.totalPurchases)}
              icon={<FiArchive />}
              path="/app/purchase"
              sparklinePoints={series.purchases}
              sparklineColor="#f59e0b"
              iconBgClass="bg-gradient-to-br from-amber-500 to-yellow-400"
              iconColorClass="text-white"
            />
            <DashboardStatCard
              title="Total Expenses"
              subtitle={periodLabel}
              value={formatAmount(keyMetrics.totalExpenses)}
              icon={<FiTrendingDown />}
              path="/app/expense"
              sparklinePoints={series.expenses}
              sparklineColor="#ec4899"
              iconBgClass="bg-gradient-to-br from-pink-500 to-rose-400"
              iconColorClass="text-white"
            />
            <DashboardStatCard
              title="Low Stock Items"
              subtitle="Current"
              value={lowStockAlertsCount.toString()}
              icon={<FiAlertTriangle />}
              path="/app/stock/low-stock-report"
              iconBgClass="bg-gradient-to-br from-rose-500 to-orange-400"
              iconColorClass="text-white"
            />
          </div>

          <Card
            title="Sales Trend"
            icon={<FiTrendingUp className="text-blue-600" />}
            className="!shadow-sm border border-gray-200/70 rounded-2xl"
            actions={
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700">
                <option>By Day</option>
              </select>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-stretch">
              <div className="min-w-0">
                <SalesTrendChart data={salesTrendData} color="#2563eb" />
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500">Total Sales</div>
                    <div className="text-lg font-extrabold text-gray-900 tabular-nums mt-1">{formatAmount(keyMetrics.totalIncome)}</div>
                    <div className={`text-xs font-semibold mt-2 ${deltas.income >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {deltas.income >= 0 ? '▲' : '▼'} {Math.abs(deltas.income).toFixed(1)}% <span className="text-gray-400 font-medium">vs previous period</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Average Daily</div>
                    <div className="text-lg font-extrabold text-gray-900 tabular-nums mt-1">{formatAmount(avgDailySales)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <div className="text-[10px] text-gray-500">Orders</div>
                      <div className="text-sm font-extrabold text-gray-900 tabular-nums mt-1">{keyMetrics.totalOrders}</div>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <div className="text-[10px] text-gray-500">Avg Order</div>
                      <div className="text-sm font-extrabold text-gray-900 tabular-nums mt-1">{formatAmount(keyMetrics.averageOrderValue)}</div>
                    </div>
                  </div>
                  {trendSummary && (
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] text-gray-500">Best Day</div>
                        <div className="text-[10px] font-semibold text-gray-700">{trendSummary.bestDate}</div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-extrabold text-gray-900 tabular-nums">{formatAmount(trendSummary.bestSales)}</div>
                        <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">Peak</div>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200">
                        <div className="text-[10px] text-gray-500">Lowest Day</div>
                        <div className="text-[10px] font-semibold text-gray-700">{trendSummary.worstDate}</div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-extrabold text-gray-900 tabular-nums">{formatAmount(trendSummary.worstSales)}</div>
                        <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-full">Low</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                  {periodLabel}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 self-start">
          <div className="rounded-2xl overflow-hidden shadow-sm border border-blue-200/80 bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-600 text-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FiZap />
                <div className="font-semibold">AI Daily Insight</div>
                <span className="text-[10px] font-semibold bg-white/15 px-2 py-0.5 rounded-full">New</span>
              </div>
              <button
                type="button"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15"
                onClick={fetchSpecial}
                disabled={isLoadingSpecial}
              >
                <FiRefreshCw size={16} />
              </button>
            </div>

            <div className="mt-4">
              {isLoadingSpecial && (
                <div className="flex justify-center py-4">
                  <Spinner color="text-white" />
                </div>
              )}
              {!isLoadingSpecial && specialError && (
                <div className="text-sm text-white/90">
                  <div className="flex items-start gap-2">
                    <FiAlertTriangle className="mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold">Insight unavailable</div>
                      <div className="text-white/80 mt-1">{specialError}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-4 !bg-white/15 !text-white hover:!bg-white/20 !border-0"
                    onClick={() => {
                      navigate('/app/subscription');
                    }}
                  >
                    View Billing
                  </Button>
                </div>
              )}
              {!isLoadingSpecial && !specialError && dailySpecial && (
                <div>
                  <div className="text-sm font-semibold">{dailySpecial.name}</div>
                  <div className="text-sm text-white/85 mt-2">{dailySpecial.description}</div>
                </div>
              )}
              {!isLoadingSpecial && !specialError && !dailySpecial && (
                <div className="text-sm text-white/85">No insight available.</div>
              )}
            </div>
          </div>

          <RecentActivityCard sales={filteredSales} purchases={filteredPurchases} expenses={filteredExpenses} lowStockCount={lowStockAlertsCount} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
