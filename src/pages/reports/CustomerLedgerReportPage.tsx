

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiArrowLeft, FiUser } from 'react-icons/fi';

const CustomerLedgerReportPage: React.FC = () => {
    const { sales, customers, receiveCustomerPayment } = useRestaurantData();
    const navigate = useNavigate();
    const [selectedCustomerId, setSelectedCustomerId] = useState('');

    const customer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);

    const ledgerData = useMemo(() => {
        if (!selectedCustomerId) return [];
        return sales
            .filter(s => s.customerId === selectedCustomerId)
            .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
    }, [sales, selectedCustomerId]);

    const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
        alert(`Downloading Customer Ledger Report as ${format}... (This is a simulation)`);
    };
    
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
                    <FiUser className="mr-3 text-sky-600" /> Customer Ledger Report
                </h1>
                <div className="flex items-center space-x-2">
                    <DownloadReportButton onDownload={handleDownload} />
                    <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
            <Card>
                <div className="p-4">
                    <label htmlFor="customerSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                    <select id="customerSelect" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md">
                        <option value="">-- Select a Customer --</option>
                        {customers.filter(c => c.id !== 'cust-walkin').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </Card>

            <Card>
                <div className="p-4 mb-0 flex justify-between items-center bg-gray-50 rounded-t-lg border-b">
                    <h3 className="text-lg font-semibold text-gray-700">
                        {selectedCustomerId ? `Ledger for ${customer?.name}` : 'Select a customer to view ledger'}
                    </h3>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Current Due</p>
                        <p className={`text-xl font-bold ${customer && customer.dueAmount && customer.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${(customer?.dueAmount || 0).toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {selectedCustomerId && ledgerData.length === 0 && <p className="text-center text-gray-500 py-10">No transactions found for this customer.</p>}
                    {ledgerData.length > 0 && (
                        <table className="w-full min-w-max">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-3 px-4 text-left">Date</th>
                                    <th className="py-3 px-4 text-left">Transaction (Sale ID)</th>
                                    <th className="py-3 px-4 text-right">Debit (Sale)</th>
                                    <th className="py-3 px-4 text-right">Credit (Paid)</th>
                                    <th className="py-3 px-4 text-right">Due this transaction</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.map(sale => {
                                    const totalPaidForSale = sale.partialPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                                    const dueForSale = sale.totalAmount - totalPaidForSale;
                                    return (
                                    <tr key={sale.id} className="border-b">
                                        <td className="py-3 px-4">{new Date(sale.saleDate).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">Sale #{sale.id.slice(-6).toUpperCase()}</td>
                                        <td className="py-3 px-4 text-right">${sale.totalAmount.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right text-green-600">${totalPaidForSale.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right text-red-600 font-semibold">${dueForSale.toFixed(2)}</td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    )}
                </div>
                 <div className="p-4 text-xs text-gray-500">Note: This ledger shows individual sale transactions. The total due amount is managed at the customer level and may include payments not tied to a specific sale shown here.</div>
            </Card>
        </div>
    );
};

export default CustomerLedgerReportPage;