
import React from 'react';
import { Link } from 'react-router-dom';
import { FiDollarSign, FiBarChart2, FiArchive, FiUsers as FiUsersIcon, FiBarChart } from 'react-icons/fi';
import Card from '@/components/common/Card';

const ReportDashboardPage: React.FC = () => {
    // Report data based on the provided image and existing paths
    const reportCategories = [
        {
            title: 'Sales & Billing Reports',
            icon: <FiDollarSign size={20} />,
            reports: [
                { name: 'Register Report', path: '../reports/register-report' },
                { name: 'Z Report', path: '../reports/z-report' },
                { name: 'Food Sale Report', path: '../reports/food-sale-report' },
                { name: 'Daily Sale Report', path: '../reports/daily-sale-report' },
                { name: 'Detailed Sale Report', path: '../reports/detailed-sale-report' },
                { name: 'Food Menu Sale By Category', path: '../reports/food-menu-sale-by-category' },
                { name: 'Waiter Tips Report', path: '../reports/waiter-tips-report' },
            ]
        },
        {
            title: 'Inventory & Production Reports',
            icon: <FiArchive size={20} />,
            reports: [
                { name: 'Stock Report', path: '../reports/stock-report' },
                { name: 'Low Stock Report', path: '../stock/low-stock-report' },
                { name: 'Consumption Report', path: '../reports/consumption-report' },
                { name: 'Purchase Report', path: '../reports/purchase-report' },
                { name: 'Waste Report', path: '../reports/waste-report' },
                { name: 'Production Report', path: '../reports/production-report' },
                { name: 'Product Analysis Report', path: '../reports/product-analysis-report' },
            ]
        },
        {
            title: 'Financial & Summary Reports',
            icon: <FiBarChart2 size={20} />,
            reports: [
                { name: 'Profit Loss Report', path: '../reports/profit-loss-report' },
                { name: 'Expense Report', path: '../reports/expense-report' },
                { name: 'Tax Report', path: '../reports/tax-report' },
                { name: 'Daily Summary Report', path: '../reports/daily-summary-report' },
                { name: 'Supplier Ledger Report', path: '../reports/supplier-ledger-report' },
                { name: 'Supplier Due Report', path: '../reports/supplier-due-report' },
                { name: 'Customer Ledger Report', path: '../reports/customer-ledger-report' },
                { name: 'Customer Due Report', path: '../reports/customer-due-report' },
            ]
        },
        {
            title: 'HR & System Reports',
            icon: <FiUsersIcon size={20} />,
            reports: [
                { name: 'Attendance Report', path: '../reports/attendance-report' },
                { name: 'Audit Log Report', path: '../reports/audit-log-report' },
                { name: 'Kitchen Performance Report', path: '../reports/kitchen-performance-report' },
                { name: 'Available Loyalty Point Report', path: '../reports/available-loyalty-point-report' },
                { name: 'Usage Loyalty Point Report', path: '../reports/usage-loyalty-point-report' },
            ]
        }
    ];

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
                    <Card key={category.title} title={category.title} icon={category.icon}>
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
