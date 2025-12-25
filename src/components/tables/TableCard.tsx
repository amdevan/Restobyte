

import React, { useState, useEffect, useMemo } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { Table, TableStatus, Sale } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Button from '../common/Button';
import Modal from '../common/Modal'; // For TableNotesModal
import { 
    FiUsers, FiCircle, FiCheckCircle, FiClock as FiClockIcon, FiMapPin, FiDollarSign, 
    FiShoppingCart, FiFileText, FiArrowRightCircle, FiEdit2, FiMessageSquare, FiBell, FiShoppingBag
} from 'react-icons/fi';

// Helper function to format time difference
const formatTimeDifference = (isoTimestamp?: string): string => {
  if (!isoTimestamp) return '';
  const occupiedDate = new Date(isoTimestamp);
  const now = new Date();
  let diffMs = now.getTime() - occupiedDate.getTime()
  if (diffMs < 0) diffMs = 0; // Prevent negative time if clock is off

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let result = '';
  if (diffHours > 0) result += `${diffHours}h `;
  result += `${diffMins}m`;
  return result.trim();
};

const TableNotesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
  initialNotes?: string;
  tableName: string;
}> = ({ isOpen, onClose, onSave, initialNotes, tableName }) => {
  const [notes, setNotes] = useState(initialNotes || '');

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes, isOpen]);

  const handleSave = () => {
    onSave(notes);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Notes for ${tableName}`}>
      <div className="space-y-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
          placeholder="e.g., Waiting on drinks, VIP guest..."
          autoFocus
        />
        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={handleSave}>Save Notes</Button>
        </div>
      </div>
    </Modal>
  );
};

interface TableCardProps {
  table: Table;
  onStatusChange: (tableId: string, newStatus: TableStatus) => void;
}

const TableCard: React.FC<TableCardProps> = ({ table, onStatusChange }) => {
  const { areasFloors, sales, updateTableNotes, requestTableAssistance, resolveTableAssistance, resolveFoodReady } = useRestaurantData();
  const navigate = useNavigate();
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [timer, setTimer] = useState(formatTimeDifference(table.occupiedSince));

  useEffect(() => {
    if (table.status === TableStatus.Occupied && table.occupiedSince) {
      const interval = setInterval(() => {
        setTimer(formatTimeDifference(table.occupiedSince));
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [table.status, table.occupiedSince]);

  const openBillAmount = useMemo(() => {
    if (table.status !== TableStatus.Occupied) return 0;
    return sales
      .filter((s: Sale) => s.assignedTableId === table.id && !s.isSettled)
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [sales, table.id, table.status]);


  const statusConfig = {
    [TableStatus.Free]: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-700',
      icon: <FiCheckCircle />,
    },
    [TableStatus.Occupied]: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-700',
      icon: <FiUsers />,
    },
    [TableStatus.Reserved]: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-700',
      icon: <FiClockIcon />,
    },
  };

  const { bgColor, borderColor, textColor, icon } = statusConfig[table.status];
  const areaName = table.areaFloorId ? areasFloors.find(af => af.id === table.areaFloorId)?.name : 'Unassigned';

  const handleNotesSave = (notes: string) => {
    updateTableNotes(table.id, notes);
  };
  
  const handleToggleAssistance = () => {
      if (table.assistanceRequested) {
          resolveTableAssistance(table.id);
      } else {
          requestTableAssistance(table.id);
      }
  };

  return (
    <>
      <TableNotesModal 
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        onSave={handleNotesSave}
        initialNotes={table.notes}
        tableName={table.name}
      />
      <div className={`relative rounded-lg overflow-hidden shadow-md border ${borderColor} ${bgColor} transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg`}>
        <div className="absolute top-2 right-2 flex flex-col space-y-1.5">
            <div className={`p-1.5 rounded-full text-white/80 ${table.status === TableStatus.Free ? 'bg-green-500' : table.status === TableStatus.Occupied ? 'bg-red-500' : 'bg-amber-500'}`}>
              <FiCircle size={10} />
            </div>
             {table.foodReady && (
                <button 
                    onClick={() => resolveFoodReady(table.id)}
                    className="p-1.5 rounded-full bg-green-500 text-white animate-bounce" 
                    title="Food is ready for pickup!">
                    <FiShoppingBag size={12} />
                </button>
            )}
        </div>
        
        {/* Assistance Bell */}
        {table.assistanceRequested && (
            <div className="absolute top-2 left-2 p-1.5 rounded-full bg-amber-500 animate-pulse text-white" title={`Assistance requested at ${new Date(table.assistanceRequestedAt!).toLocaleTimeString()}`}>
                <FiBell size={12} />
            </div>
        )}


        <div className="p-3 flex flex-col h-full">
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-gray-800">{table.name}</h3>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <FiUsers size={12} className="mr-1.5" />
              <span>{table.capacity} Guests</span>
            </div>
             <div className="flex items-center text-xs text-gray-400 mt-1">
              <FiMapPin size={12} className="mr-1.5" />
              <span>{areaName}</span>
            </div>
            
            <div className={`mt-2 flex items-center text-xs font-semibold ${textColor}`}>
              {icon}
              <span className="ml-1.5">{table.status}</span>
              {table.status === TableStatus.Occupied && timer && (
                <span className="ml-2 font-mono text-xs px-1.5 py-0.5 bg-red-100 rounded-full">{timer}</span>
              )}
            </div>

            {openBillAmount > 0 && (
                <div className="mt-2 flex items-center bg-gray-200/50 p-1.5 rounded-md">
                    <FiDollarSign size={14} className="text-gray-600 mr-1.5 flex-shrink-0" />
                    <span className="text-gray-800 font-bold text-base">${openBillAmount.toFixed(2)}</span>
                </div>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-300/50 space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/app/panel/pos/${table.id}`)} leftIcon={<FiShoppingCart size={14}/>}>
                    Go to POS
                </Button>
                <div className="relative">
                    <select
                        value={table.status}
                        onChange={(e) => onStatusChange(table.id, e.target.value as TableStatus)}
                        className="w-full h-full text-center appearance-none px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                    >
                        <option value={TableStatus.Free}>Free</option>
                        <option value={TableStatus.Occupied}>Occupied</option>
                        <option value={TableStatus.Reserved}>Reserved</option>
                    </select>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-1.5">
                 <Button variant="outline" size="sm" onClick={() => setIsNotesModalOpen(true)} leftIcon={<FiEdit2 size={14} />}>
                    Notes
                </Button>
                 <Button 
                    variant={table.assistanceRequested ? 'primary' : 'outline'} 
                    size="sm" 
                    onClick={handleToggleAssistance} 
                    leftIcon={<FiBell size={14}/>}
                >
                    Assist
                </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TableCard;