

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import { FiArrowLeft, FiFilter, FiUser } from 'react-icons/fi';

const SupplierLedgerReportPage: React.FC = () => {
    const { purchases, suppliers } = useRestaurantData();
    const navigate = useNavigate();
    const [selectedSupplierId, setSelectedSupplierId] = useState('');

    const ledgerData = useMemo(() => {
        if (!selectedSupplierId) return [];
        const supplierDetails = suppliers.find(s => s.id === selectedSupplierId);
        if (!supplierDetails) return [];

        return purchases
            .filter(p => p.supplierId === selectedSupplierId || p.supplierName === supplierDetails.name)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [purchases, selectedSupplierId, suppliers]);

    const balance = useMemo(() => {
        return ledgerData.reduce((acc, p) => acc + p.grandTotalAmount - (p.paidAmount || 0), 0);
    }, [ledgerData]);

    const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
        alert(`Downloading Supplier Ledger Report as ${format}... (This is a simulation)`);
    };
    
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
                    <FiUser className="mr-3 text-sky-600" /> Supplier Ledger Report
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
                    <label htmlFor="supplierSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Supplier</label>
                    <select id="supplierSelect" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md">
                        <option value="">-- Select a Supplier --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </Card>

            <Card>
                <div className="p-4 mb-0 flex justify-between items-center bg-gray-50 rounded-t-lg border-b">
                    <h3 className="text-lg font-semibold text-gray-700">
                        {selectedSupplierId ? `Ledger for ${suppliers.find(s=>s.id===selectedSupplierId)?.name}` : 'Select a supplier to view ledger'}
                    </h3>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className={`text-xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>${balance.toFixed(2)}</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {selectedSupplierId && ledgerData.length === 0 && <p className="text-center text-gray-500 py-10">No transactions found for this supplier.</p>}
                    {ledgerData.length > 0 && (
                        <table className="w-full min-w-max">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-3 px-4 text-left">Date</th>
                                    <th className="py-3 px-4 text-left">Transaction (PO #)</th>
                                    <th className="py-3 px-4 text-right">Debit (Purchase)</th>
                                    <th className="py-3 px-4 text-right">Credit (Paid)</th>
                                    <th className="py-3 px-4 text-right">Balance Due</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.map(p => (
                                    <tr key={p.id} className="border-b">
                                        <td className="py-3 px-4">{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">Purchase Order {p.purchaseNumber}</td>
                                        <td className="py-3 px-4 text-right">${p.grandTotalAmount.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right text-green-600">${(p.paidAmount || 0).toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right text-red-600 font-semibold">${(p.grandTotalAmount - (p.paidAmount || 0)).toFixed(2)}</td>
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

export default SupplierLedgerReportPage;