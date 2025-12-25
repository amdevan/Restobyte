

import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { WasteRecord, WasteItem } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import AddWasteRecordForm from '@/components/waste/AddWasteRecordForm';
import ViewWasteRecordDetailsModal from '@/components/waste/ViewWasteRecordDetailsModal';
import { FiSearch, FiCalendar, FiFilter, FiXCircle, FiEye, FiPlusCircle, FiTrash2, FiDollarSign, FiArchive } from 'react-icons/fi';

const WastePage: React.FC = () => {
  const { wasteRecords, addWasteRecord, stockItems, getSingleActiveOutlet } = useRestaurantData();
  const outlet = getSingleActiveOutlet();

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedWasteRecord, setSelectedWasteRecord] = useState<WasteRecord | null>(null);

  const distinctReasons = useMemo(() => {
    const reasons = new Set(wasteRecords.map(wr => wr.reason));
    return ['All', ...Array.from(reasons)];
  }, [wasteRecords]);

  const filteredWasteRecords = useMemo(() => {
    return wasteRecords.filter(record => {
      const recordDate = new Date(record.date);
      const sDate = startDate ? new Date(startDate) : null;
      const eDate = endDate ? new Date(endDate) : null;

      if (sDate && recordDate < sDate) return false;
      if (eDate) {
        const endOfDay = new Date(eDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (recordDate > endOfDay) return false;
      }
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        record.reason.toLowerCase().includes(searchTermLower) ||
        (record.responsiblePerson && record.responsiblePerson.toLowerCase().includes(searchTermLower)) ||
        (record.notes && record.notes.toLowerCase().includes(searchTermLower)) ||
        record.items.some(item => item.stockItemName.toLowerCase().includes(searchTermLower));

      const matchesReason = selectedReasonFilter === 'All' || record.reason === selectedReasonFilter;
      
      return matchesSearch && matchesReason;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [wasteRecords, searchTerm, startDate, endDate, selectedReasonFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedReasonFilter('All');
  };

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleOpenDetailsModal = (record: WasteRecord) => {
    setSelectedWasteRecord(record);
    setIsDetailsModalOpen(true);
  };
  const handleCloseDetailsModal = () => {
    setSelectedWasteRecord(null);
    setIsDetailsModalOpen(false);
  };
  
  const handleAddWasteSubmit = (data: { reason: string; responsiblePerson?: string; notes?: string; items: WasteItem[]; }) => {
    if (!outlet) {
      alert('An active outlet must be selected to record waste.');
      return;
    }
    addWasteRecord({ ...data, outletId: outlet.id });
  };
  
  const totalEstimatedLossValue = useMemo(() => {
    return filteredWasteRecords.reduce((sum, record) => sum + (record.totalEstimatedLoss || 0), 0);
  }, [filteredWasteRecords]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiTrash2 className="mr-3 text-red-500"/> Waste Management
        </h1>
        <Button onClick={handleOpenAddModal} leftIcon={<FiPlusCircle />} variant="primary" disabled={stockItems.length === 0}>
            Add New Waste Record
        </Button>
      </div>
       {stockItems.length === 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <p className="text-amber-700 text-sm">
                No stock items found in the system. Please <a href="#/stock/add-entry" className="font-semibold underline hover:text-amber-800">add stock entries</a> first before you can record waste.
            </p>
          </Card>
      )}

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <Input
              label="Search Reason / Item / Responsible"
              id="waste-search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<FiSearch />}
              placeholder="e.g., Spoilage, Tomatoes, Chef John"
            />
            <Input
              label="Start Date"
              id="start-date-waste"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
            <Input
              label="End Date"
              id="end-date-waste"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
            <div>
              <label htmlFor="reasonFilterWaste" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select
                id="reasonFilterWaste"
                value={selectedReasonFilter}
                onChange={e => setSelectedReasonFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
              >
                {distinctReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
              </select>
            </div>
          </div>
           <div className="flex justify-end">
                <Button onClick={handleResetFilters} variant="secondary" leftIcon={<FiXCircle />}>
                    Reset Filters
                </Button>
            </div>
        </div>
      </Card>
      
      <Card className="mt-6">
        <div className="p-4 mb-0 flex justify-between items-center bg-gray-50 rounded-t-lg border-b">
             <h3 className="text-lg font-semibold text-gray-700">
                Waste Records ({filteredWasteRecords.length})
             </h3>
             <div className="text-right">
                <p className="text-sm text-gray-600">Total Est. Loss (Filtered)</p>
                <p className="text-xl font-bold text-red-600">
                    <FiDollarSign className="inline h-5 w-5 mr-0.5 relative -top-0.5" />
                    {totalEstimatedLossValue.toFixed(2)}
                </p>
             </div>
        </div>
        <div className="overflow-x-auto">
          {filteredWasteRecords.length === 0 ? (
            <div className="text-center py-10">
              <FiArchive size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {wasteRecords.length === 0 ? "No waste records found." : "No waste records match your criteria."}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Reason</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Items</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Responsible</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Est. Loss</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWasteRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.reason}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                        {record.items.map(item => item.stockItemName).join(', ').substring(0,50)}
                        {record.items.map(item => item.stockItemName).join(', ').length > 50 ? '...' : ''}
                        ({record.items.length})
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.responsiblePerson || '-'}</td>
                    <td className="py-3 px-4 text-sm text-red-600 font-semibold text-right">
                      {record.totalEstimatedLoss !== undefined ? `$${record.totalEstimatedLoss.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button onClick={() => handleOpenDetailsModal(record)} variant="outline" size="sm" leftIcon={<FiEye />}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="Add New Waste Record" size="xl">
        <AddWasteRecordForm onClose={handleCloseAddModal} onSubmit={handleAddWasteSubmit} />
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={handleCloseDetailsModal} title="Waste Record Details" size="lg">
        <ViewWasteRecordDetailsModal wasteRecord={selectedWasteRecord} onClose={handleCloseDetailsModal} />
      </Modal>
    </div>
  );
};

export default WastePage;