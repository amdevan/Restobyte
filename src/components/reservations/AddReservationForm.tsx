

import React, { useState, useEffect } from 'react';
import { Reservation, Table, TableStatus } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { useRestaurantData } from '../../hooks/useRestaurantData';

interface AddReservationFormProps {
  onSubmit: (reservation: Omit<Reservation, 'id'>) => void;
  onUpdate?: (reservation: Reservation) => void;
  initialData?: Reservation | null;
  onClose: () => void;
}

const AddReservationForm: React.FC<AddReservationFormProps> = ({ onSubmit, onUpdate, initialData, onClose }) => {
  const { tables, getAvailableTables, getSingleActiveOutlet } = useRestaurantData();
  const outlet = getSingleActiveOutlet();
  
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [partySize, setPartySize] = useState<number | string>(1);
  const [tableId, setTableId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [availableTablesForForm, setAvailableTablesForForm] = useState<Table[]>([]);

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName);
      setPhone(initialData.phone || '');
      // Format date for datetime-local input
      const initialDate = new Date(initialData.dateTime);
      const localDateTime = new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDateTime(localDateTime);
      setPartySize(initialData.partySize);
      setTableId(initialData.tableId);
      setNotes(initialData.notes || '');
    } else {
      // Set default time to now + 1 hour for new reservations
      const defaultDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const localDateTime = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDateTime(localDateTime);
      setCustomerName('');
      setPhone('');
      setPartySize(1);
      setTableId(undefined);
      setNotes('');
    }
  }, [initialData]);
  
  useEffect(() => {
    if (dateTime && partySize) {
      const numericPartySize = Number(partySize);
      if (numericPartySize > 0) {
        const available = getAvailableTables(new Date(dateTime).toISOString(), numericPartySize);
        setAvailableTablesForForm(available);
        // If editing and current tableId is no longer in available list (but is valid), keep it selected or clear if invalid
        if (initialData && initialData.tableId && !available.some(t => t.id === initialData.tableId)) {
            // Keep it if it's the one currently assigned; it's handled by specific logic in select options
        } else if (tableId && !available.some(t => t.id === tableId)){
             // If selected table is no longer available, deselect it unless it's the initial one for an edit.
             if(!initialData || tableId !== initialData.tableId) {
                setTableId(undefined);
             }
        }

      } else {
        setAvailableTablesForForm([]);
      }
    } else {
      setAvailableTablesForForm([]);
    }
  }, [dateTime, partySize, getAvailableTables, initialData, tableId]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outlet) {
      alert("Error: No single outlet is active. Cannot create reservation.");
      return;
    }
    if (!customerName || !dateTime || !partySize) {
        alert("Customer name, date/time, and party size are required.");
        return;
    }
    const numericPartySize = parseInt(String(partySize), 10);
     if (isNaN(numericPartySize) || numericPartySize <= 0) {
        alert("Please enter a valid party size.");
        return;
    }
    
    const reservationData = { 
        customerName, 
        phone, 
        dateTime: new Date(dateTime).toISOString(), // Store as ISO string
        partySize: numericPartySize, 
        tableId, 
        notes,
        outletId: outlet.id,
    };

    if (initialData && onUpdate) {
      onUpdate({ ...initialData, ...reservationData });
    } else {
      onSubmit(reservationData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
      <Input label="Phone (Optional)" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
      <Input label="Date and Time" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
      <Input label="Party Size" type="number" value={partySize} onChange={(e) => setPartySize(e.target.value)} min="1" required />
      
      <div>
        <label htmlFor="tableId" className="block text-sm font-medium text-gray-700 mb-1">Assign Table (Optional)</label>
        <select
          id="tableId"
          value={tableId || ''}
          onChange={(e) => setTableId(e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="">No specific table</option>
          {availableTablesForForm.map(table => (
            <option key={table.id} value={table.id}>
              {table.name} (Capacity: {table.capacity}, Status: {table.status})
            </option>
          ))}
          {/* If editing, and the originally assigned table is not in the "available" list (e.g. it's reserved for THIS reservation), show it. */}
          {initialData && initialData.tableId && !availableTablesForForm.find(t => t.id === initialData.tableId) && 
            tables.find(t=> t.id === initialData.tableId) && (
            <option key={initialData.tableId} value={initialData.tableId}>
                {tables.find(t=> t.id === initialData.tableId)?.name} (Capacity: {tables.find(t=> t.id === initialData.tableId)?.capacity}, Currently Assigned)
            </option>
          )}
        </select>
        {availableTablesForForm.length === 0 && Number(partySize) > 0 && dateTime && (!initialData || !initialData.tableId || !tables.find(t=> t.id === initialData.tableId)) && <p className="text-xs text-amber-600 mt-1">No tables seem available for this time/party size, or all suitable tables are occupied. You can still create the reservation without assigning a table.</p>}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          placeholder="e.g., Birthday celebration, window seat preference"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">{initialData ? 'Update Reservation' : 'Add Reservation'}</Button>
      </div>
    </form>
  );
};

export default AddReservationForm;