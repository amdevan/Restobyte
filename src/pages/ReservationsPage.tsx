import React, { useState, useMemo } from 'react';
import { FiPlusCircle, FiEdit, FiTrash2, FiUsers, FiGrid, FiFileText, FiCheck, FiX, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import AddReservationForm from '@/components/reservations/AddReservationForm';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Reservation } from '../types';
import FeatureDisabledPage from '@/components/common/FeatureDisabledPage';
import { isNative } from '../utils/capacitorService';
import { useMobile } from '../hooks/useMobileApp';

type TabType = 'running' | 'completed' | 'cancelled' | 'all';

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'seated': return 'bg-blue-100 text-blue-800';
    case 'confirmed': return 'bg-purple-100 text-purple-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'seated': return 'Seated';
    case 'confirmed': return 'Confirmed';
    default: return 'Pending';
  }
};

const ReservationRow: React.FC<{ reservation: Reservation; onEdit: (res: Reservation) => void; onDelete: (id: string) => void; onComplete: (id: string) => void; onCancel: (id: string) => void; tableName: string | undefined }> = ({ reservation, onEdit, onDelete, onComplete, onCancel, tableName }) => {
  const showCompleteCancel = !reservation.status || ['pending', 'confirmed', 'seated'].includes(reservation.status || '');

  return (
    <tr className="border-b border-gray-200 hover:bg-sky-50 transition-all duration-200">
      <td className="py-3 px-4 text-sm text-gray-700">{reservation.customerName}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{new Date(reservation.dateTime).toLocaleString()}</td>
      <td className="py-3 px-4 text-sm text-gray-700 text-center">{reservation.partySize}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{tableName || 'Not Assigned'}</td>
      <td className="py-3 px-4 text-sm text-gray-500 truncate max-w-xs">{reservation.notes || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(reservation.status)}`}>
          {getStatusLabel(reservation.status)}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-700">
        <div className="flex space-x-2">
          {showCompleteCancel && (
            <>
              <Button onClick={() => onComplete(reservation.id)} variant="secondary" size="sm" aria-label="Complete Reservation" title="Complete">
                <FiCheck />
              </Button>
              <Button onClick={() => onCancel(reservation.id)} variant="secondary" size="sm" aria-label="Cancel Reservation" title="Cancel">
                <FiX />
              </Button>
            </>
          )}
          <Button onClick={() => onEdit(reservation)} variant="secondary" size="sm" aria-label="Edit Reservation"><FiEdit /></Button>
          <Button onClick={() => onDelete(reservation.id)} variant="danger" size="sm" aria-label="Delete Reservation"><FiTrash2 /></Button>
        </div>
      </td>
    </tr>
  );
};

/** Compact tappable card for a single reservation — used on native mobile. */
const ReservationCardMobile: React.FC<{ reservation: Reservation; onEdit: (res: Reservation) => void; onDelete: (id: string) => void; onComplete: (id: string) => void; onCancel: (id: string) => void; tableName: string | undefined }> = ({ reservation, onEdit, onDelete, onComplete, onCancel, tableName }) => {
  const showCompleteCancel = !reservation.status || ['pending', 'confirmed', 'seated'].includes(reservation.status || '');

  return (
    <div className="rb-reservation-card">
      <div className="rb-reservation-card-top">
        <div>
          <p className="rb-reservation-card-name">{reservation.customerName}</p>
          <p className="text-xs text-sky-600 font-medium mt-1">
            {new Date(reservation.dateTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(reservation.status)}`}>
          {getStatusLabel(reservation.status)}
        </span>
      </div>
      <div className="rb-reservation-card-meta">
        <FiUsers size={14} /> <b>{reservation.partySize} guests</b>
        <FiGrid size={14} /> <b>{tableName || 'Not Assigned'}</b>
        {reservation.notes ? (<><FiFileText size={14} /> <span className="truncate">{reservation.notes}</span></>) : null}
      </div>
      <div className="rb-reservation-card-actions">
        {showCompleteCancel && (
          <>
            <Button onClick={() => onComplete(reservation.id)} variant="secondary" size="sm" className="flex-1" leftIcon={<FiCheck size={14} />}>Done</Button>
            <Button onClick={() => onCancel(reservation.id)} variant="danger" size="sm" className="flex-1" leftIcon={<FiX size={14} />}>Cancel</Button>
          </>
        )}
        <Button onClick={() => onEdit(reservation)} variant="secondary" size="sm" className={showCompleteCancel ? "flex-1" : "flex-1"} leftIcon={<FiEdit size={14} />}>Edit</Button>
        <Button onClick={() => onDelete(reservation.id)} variant="danger" size="sm" className="flex-1" leftIcon={<FiTrash2 size={14} />}>Delete</Button>
      </div>
    </div>
  );
};


const ReservationsPage: React.FC = () => {
  const { reservations, tables, addReservation, updateReservation, deleteReservation: removeReservation, completeReservation, cancelReservation, getSingleActiveOutlet } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('running');
  const { haptic } = useMobile();

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
    addReservation({ ...reservationData, status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    handleCloseModal();
  };

  const handleUpdateReservation = (reservationData: Reservation) => {
    updateReservation({ ...reservationData, updatedAt: new Date().toISOString() });
    handleCloseModal();
  };

  const handleDeleteReservation = (reservationId: string) => {
     if (window.confirm("Are you sure you want to delete this reservation?")) {
      removeReservation(reservationId);
    }
  };

  const handleCompleteReservation = (reservationId: string) => {
    if (window.confirm("Mark this reservation as completed?")) {
      completeReservation(reservationId);
    }
  };

  const handleCancelReservation = (reservationId: string) => {
    if (window.confirm("Cancel this reservation?")) {
      cancelReservation(reservationId);
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

  // Sort reservations by date (upcoming first, then past)
  const sortedReservations = [...filteredReservations].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Tab-based filtering
  const tabFilteredReservations = useMemo(() => {
    switch (activeTab) {
      case 'running':
        return sortedReservations.filter(r => !r.status || ['pending', 'confirmed', 'seated'].includes(r.status));
      case 'completed':
        return sortedReservations.filter(r => r.status === 'completed');
      case 'cancelled':
        return sortedReservations.filter(r => r.status === 'cancelled');
      case 'all':
        return sortedReservations;
      default:
        return sortedReservations;
    }
  }, [sortedReservations, activeTab]);

  const tabCounts = useMemo(() => {
    const running = sortedReservations.filter(r => !r.status || ['pending', 'confirmed', 'seated'].includes(r.status || '')).length;
    const completed = sortedReservations.filter(r => r.status === 'completed').length;
    const cancelled = sortedReservations.filter(r => r.status === 'cancelled').length;
    return { running, completed, cancelled, all: sortedReservations.length };
  }, [sortedReservations]);

  if (!outlet) {
      return <FeatureDisabledPage type="selectOutlet" featureName="Reservations"/>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800">Reservation Management</h1>
        <Button
          onClick={() => { handleOpenModal(); haptic('light'); }}
          leftIcon={<FiPlusCircle size={20}/>}
          variant="primary"
        >
          {isNative ? 'Add' : 'Add New Reservation'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('running')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'running' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiClock className="inline mr-1" size={16} />
            Running ({tabCounts.running})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'completed' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiCheckCircle className="inline mr-1" size={16} />
            Completed ({tabCounts.completed})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'cancelled' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiXCircle className="inline mr-1" size={16} />
            Cancelled ({tabCounts.cancelled})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'all' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiGrid className="inline mr-1" size={16} />
            All ({tabCounts.all})
          </button>
        </nav>
      </div>

      {tabFilteredReservations.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-10">No {activeTab} reservations found.</p>
        </Card>
      ) : isNative ? (
        // Native: stacked tappable cards — much friendlier than a horizontal-scroll table.
        <div className="space-y-3">
          {tabFilteredReservations.map(res => (
            <ReservationCardMobile
              key={res.id}
              reservation={res}
              onEdit={handleOpenModal}
              onDelete={handleDeleteReservation}
              onComplete={handleCompleteReservation}
              onCancel={handleCancelReservation}
              tableName={getTableName(res.tableId)}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date & Time</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider text-center">Party Size</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Table</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Notes</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tabFilteredReservations.map(res => (
                <ReservationRow 
                    key={res.id} 
                    reservation={res} 
                    onEdit={handleOpenModal} 
                    onDelete={handleDeleteReservation}
                    onComplete={handleCompleteReservation}
                    onCancel={handleCancelReservation}
                    tableName={getTableName(res.tableId)}
                />
              ))}
            </tbody>
          </table>
        </Card>
      )}

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
