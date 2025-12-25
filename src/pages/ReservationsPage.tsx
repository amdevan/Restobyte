

import React, { useState, useMemo } from 'react';
import { FiPlusCircle, FiEdit, FiTrash2 } from 'react-icons/fi';
import AddReservationForm from '@/components/reservations/AddReservationForm';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Reservation } from '../types';
import FeatureDisabledPage from '@/components/common/FeatureDisabledPage';

const ReservationRow: React.FC<{ reservation: Reservation; onEdit: (res: Reservation) => void; onDelete: (id: string) => void; tableName: string | undefined }> = ({ reservation, onEdit, onDelete, tableName }) => {
  return (
    <tr className="border-b border-gray-200 hover:bg-sky-50 transition-all duration-200">
      <td className="py-3 px-4 text-sm text-gray-700">{reservation.customerName}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{new Date(reservation.dateTime).toLocaleString()}</td>
      <td className="py-3 px-4 text-sm text-gray-700 text-center">{reservation.partySize}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{tableName || 'Not Assigned'}</td>
      <td className="py-3 px-4 text-sm text-gray-500 truncate max-w-xs">{reservation.notes || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">
        <div className="flex space-x-2">
          <Button onClick={() => onEdit(reservation)} variant="secondary" size="sm" aria-label="Edit Reservation"><FiEdit /></Button>
          <Button onClick={() => onDelete(reservation.id)} variant="danger" size="sm" aria-label="Delete Reservation"><FiTrash2 /></Button>
        </div>
      </td>
    </tr>
  );
};


const ReservationsPage: React.FC = () => {
  const { reservations, tables, addReservation, updateReservation, deleteReservation: removeReservation, getSingleActiveOutlet } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const outlet = getSingleActiveOutlet();

  const handleOpenModal = (reservation?: Reservation) => {
    setEditingReservation(reservation || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReservation(null);
  };

  const handleSubmitReservation = (reservationData: Omit<Reservation, 'id'>) => {
    addReservation(reservationData);
    handleCloseModal();
  };

  const handleUpdateReservation = (reservationData: Reservation) => {
    updateReservation(reservationData);
    handleCloseModal();
  };

  const handleDeleteReservation = (reservationId: string) => {
     if (window.confirm("Are you sure you want to delete this reservation?")) {
      removeReservation(reservationId);
    }
  };
  
  const getTableName = (tableId?: string): string | undefined => {
    if (!tableId) return undefined;
    return tables.find(t => t.id === tableId)?.name;
  };

  const filteredReservations = useMemo(() => {
    if (!outlet) return [];
    return reservations.filter(r => r.outletId === outlet.id);
  }, [reservations, outlet]);

  // Sort reservations by date (most recent first, or upcoming first)
  const sortedReservations = [...filteredReservations].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  if (!outlet) {
      return <FeatureDisabledPage type="selectOutlet" featureName="Reservations"/>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800">Reservation Management</h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Reservation
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {sortedReservations.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No reservations yet. Add your first one!</p>
        ) : (
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date & Time</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider text-center">Party Size</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Table</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Notes</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedReservations.map(res => (
                <ReservationRow 
                    key={res.id} 
                    reservation={res} 
                    onEdit={handleOpenModal} 
                    onDelete={handleDeleteReservation}
                    tableName={getTableName(res.tableId)}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingReservation ? "Edit Reservation" : "Add New Reservation"} size="lg">
        <AddReservationForm 
          onSubmit={handleSubmitReservation}
          onUpdate={handleUpdateReservation}
          initialData={editingReservation} 
          onClose={handleCloseModal} 
        />
      </Modal>
    </div>
  );
};

export default ReservationsPage;