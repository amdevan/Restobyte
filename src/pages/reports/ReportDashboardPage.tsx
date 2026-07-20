
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiDollarSign, FiBarChart2, FiArchive, FiUsers as FiUsersIcon, FiBarChart,
    FiFileText, FiTrendingUp, FiClipboard, FiClock, FiTag, FiPercent, FiTruck,
    FiShoppingBag, FiAlertTriangle, FiPackage, FiLayers, FiTrash2, FiActivity,
    FiGrid, FiUserCheck, FiList, FiCoffee, FiAward, FiChevronDown, FiSearch, FiX,
} from 'react-icons/fi';
import Card from '@/components/common/Card';
import { isNative } from '../../utils/capacitorService';
import { useMobile } from '../../hooks/useMobileApp';

type ReportItem = { name: string; path: string; icon: React.ReactNode };
type ReportCategory = { title: string; icon: React.ReactNode; accent: string; reports: ReportItem[] };

const ReportDashboardPage: React.FC = () => {
    const { haptic } = useMobile();
    const [search, setSearch] = useState('');
    const [openCats, setOpenCats] = useState<Set<string>>(new Set([/* all open by default */]));

    const reportCategories: ReportCategory[] = [
        {
            title: 'Sales & Billing',
            icon: <FiDollarSign size={18} />,
            accent: '#0ea5e9',
            reports: [
                { name: 'Register Report', path: '../reports/register-report', icon: <FiFileText size={16} /> },
                { name: 'Z Report', path: '../reports/z-report', icon: <FiBarChart2 size={16} /> },
                { name: 'Food Sale Report', path: '../reports/food-sale-report', icon: <FiShoppingBag size={16} /> },
                { name: 'Daily Sale Report', path: '../reports/daily-sale-report', icon: <FiTrendingUp size={16} /> },
                { name: 'Detailed Sale Report', path: '../reports/detailed-sale-report', icon: <FiClipboard size={16} /> },
                { name: 'Menu Sale By Category', path: '../reports/food-menu-sale-by-category', icon: <FiGrid size={16} /> },
                { name: 'Waiter Tips Report', path: '../reports/waiter-tips-report', icon: <FiAward size={16} /> },
            ]
        },
        {
            title: 'Inventory & Production',
            icon: <FiArchive size={18} />,
            accent: '#f59e0b',
            reports: [
                { name: 'Stock Report', path: '../reports/stock-report', icon: <FiPackage size={16} /> },
                { name: 'Low Stock Report', path: '../stock/low-stock-report', icon: <FiAlertTriangle size={16} /> },
                { name: 'Consumption Report', path: '../reports/consumption-report', icon: <FiActivity size={16} /> },
                { name: 'Purchase Report', path: '../reports/purchase-report', icon: <FiTruck size={16} /> },
                { name: 'Waste Report', path: '../reports/waste-report', icon: <FiTrash2 size={16} /> },
                { name: 'Production Report', path: '../reports/production-report', icon: <FiLayers size={16} /> },
                { name: 'Product Analysis Report', path: '../reports/product-analysis-report', icon: <FiTag size={16} /> },
            ]
        },
        {
            title: 'Financial & Summary',
            icon: <FiBarChart2 size={18} />,
            accent: '#22c55e',
            reports: [
                { name: 'Profit Loss Report', path: '../reports/profit-loss-report', icon: <FiTrendingUp size={16} /> },
                { name: 'Expense Report', path: '../reports/expense-report', icon: <FiDollarSign size={16} /> },
                { name: 'Tax Report', path: '../reports/tax-report', icon: <FiPercent size={16} /> },
                { name: 'Daily Summary Report', path: '../reports/daily-summary-report', icon: <FiClock size={16} /> },
                { name: 'Supplier Ledger Report', path: '../reports/supplier-ledger-report', icon: <FiTruck size={16} /> },
                { name: 'Supplier Due Report', path: '../reports/supplier-due-report', icon: <FiFileText size={16} /> },
                { name: 'Customer Ledger Report', path: '../reports/customer-ledger-report', icon: <FiUserCheck size={16} /> },
                { name: 'Customer Due Report', path: '../reports/customer-due-report', icon: <FiList size={16} /> },
            ]
        },
        {
            title: 'HR & System',
            icon: <FiUsersIcon size={18} />,
            accent: '#8b5cf6',
            reports: [
                { name: 'Attendance Report', path: '../reports/attendance-report', icon: <FiClock size={16} /> },
                { name: 'Audit Log Report', path: '../reports/audit-log-report', icon: <FiList size={16} /> },
                { name: 'Kitchen Performance Report', path: '../reports/kitchen-performance-report', icon: <FiCoffee size={16} /> },
                { name: 'Available Loyalty Point Report', path: '../reports/available-loyalty-point-report', icon: <FiAward size={16} /> },
                { name: 'Usage Loyalty Point Report', path: '../reports/usage-loyalty-point-report', icon: <FiAward size={16} /> },
            ]
        }
    ];

    // Filter reports by search across all categories.
    const filteredCategories = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return reportCategories;
        return reportCategories
            .map(cat => ({
                ...cat,
                reports: cat.reports.filter(r => r.name.toLowerCase().includes(q)),
            }))
            .filter(cat => cat.reports.length > 0);
    }, [search]);

    const totalReports = reportCategories.reduce((n, c) => n + c.reports.length, 0);
    const visibleReports = filteredCategories.reduce((n, c) => n + c.reports.length, 0);

    const toggleCat = (title: string) => {
        setOpenCats(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title); else next.add(title);
            return next;
        });
        haptic('light');
    };

    if (isNative) {
        return (
            <div className="rb-page-full">
                {/* Search bar — sticky under the MobilePageHeader */}
                <div className="rb-report-search-wrap">
                    <div className="rb-report-search">
                        <FiSearch size={16} className="rb-report-search-icon" />
                        <input
                            type="text"
                            inputMode="search"
                            placeholder={`Search ${totalReports} reports...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="rb-report-search-input"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => { setSearch(''); haptic('light'); }}
                                className="rb-report-search-clear"
                                aria-label="Clear search"
                            >
                                <FiX size={16} />
                            </button>
                        )}
                    </div>
                    {search && (
                        <div className="rb-report-search-meta">{visibleReports} match{visibleReports !== 1 ? 'es' : ''}</div>
                    )}
                </div>

                <div className="rb-report-list">
                    {filteredCategories.length === 0 ? (
                        <div className="rb-report-empty">
                            <FiSearch size={28} />
                            <p>No reports match "{search}".</p>
                        </div>
                    ) : (
                        filteredCategories.map(category => {
                            const open = search ? true : openCats.has(category.title);
                            return (
                                <div key={category.title} className="rb-report-cat">
                                    <button
                                        type="button"
                                        className="rb-report-cat-head"
                                        onClick={() => toggleCat(category.title)}
                                        style={{ '--rb-report-accent': category.accent } as React.CSSProperties}
                                    >
                                        <span className="rb-report-cat-icon" style={{ background: category.accent }}>
                                            {category.icon}
                                        </span>
                                        <span className="rb-report-cat-title">{category.title}</span>
                                        <span className="rb-report-cat-count">{category.reports.length}</span>
                                        <FiChevronDown className={`rb-report-cat-chevron ${open ? 'rb-report-cat-chevron-open' : ''}`} size={16} />
                                    </button>
                                    {open && (
                                        <div className="rb-report-cat-body">
                                            {category.reports.map(report => (
                                                <Link
                                                    key={report.name}
                                                    to={report.path}
                                                    className="rb-report-row"
                                                    onClick={() => haptic('light')}
                                                >
                                                    <span className="rb-report-row-icon" style={{ color: category.accent }}>
                                                        {report.icon}
                                                    </span>
                                                    <span className="rb-report-row-name">{report.name}</span>
                                                    <FiChevronDown className="rb-report-row-arrow" size={14} />
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    // Desktop layout (unchanged)
    return (
        <div className="bg-gray-100 min-h-full p-6 sm:p-8">
            <header className="mb-8 flex items-center space-x-5">
                <div className="bg-sky-100 p-4 rounded-full">
                     <FiBarChart size={32} className="text-sky-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Report Dashboard</h1>
                    <p className="text-gray-500 mt-1">Access various sales, inventory, and operational reports.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {reportCategories.map(category => (
                    <Card key={category.title} title={category.title} icon={category.icon as React.ReactElement<any>}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {category.reports.map(report => (
                                <Link
                                    key={report.name}
                                    to={report.path}
                                    className="block p-4 bg-gray-50 rounded-lg text-gray-700 hover:bg-sky-100 hover:text-sky-700 transition-colors duration-200 border border-gray-200 hover:border-sky-300"
                                >
                                    {report.name}
                                </Link>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ReportDashboardPage;
