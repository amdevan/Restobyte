import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import Spinner from '@/components/common/Spinner';

interface Reservation {
    id: string;
    reservationTime: string;
    numberOfGuests: number;
    status: string;
    table?: {
        name: string;
    };
    notes?: string;
}

const CustomerReservationsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [date, setDate] = useState('');
    const [guests, setGuests] = useState(2);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/me/reservations`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReservations(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReservation = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const res = await fetch(`${API_BASE_URL}/me/reservations`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('authToken')}` 
                },
                body: JSON.stringify({
                    reservationTime: date,
                    numberOfGuests: guests,
                    notes
                })
            });

            if (res.ok) {
                setMessage('Reservation request sent successfully!');
                setShowForm(false);
                fetchReservations();
                setDate('');
                setGuests(2);
                setNotes('');
            } else {
                const err = await res.json();
                setMessage(err.message || 'Failed to create reservation.');
            }
        } catch (error) {
            setMessage('Error creating reservation.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Reservations</h1>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                    {showForm ? 'Cancel' : 'New Reservation'}
                </button>
            </div>

            {message && <div className={`p-4 mb-4 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
                    <h2 className="text-lg font-bold mb-4">Request a Table</h2>
                    <form onSubmit={handleCreateReservation} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                            <input 
                                type="datetime-local" 
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                            <input 
                                type="number" 
                                min="1"
                                max="20"
                                required
                                value={guests}
                                onChange={e => setGuests(parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
                                rows={2}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                </div>
            )}

            {reservations.length === 0 ? (
                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No reservations found.</p>
            ) : (
                <div className="space-y-4">
                    {reservations.map(res => (
                        <div key={res.id} className="border rounded-lg p-4 flex justify-between items-center shadow-sm">
                            <div>
                                <div className="font-bold text-lg">
                                    {new Date(res.reservationTime).toLocaleDateString()} at {new Date(res.reservationTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                <div className="text-gray-600">
                                    {res.numberOfGuests} Guests • {res.table?.name ? `Table: ${res.table.name}` : 'Table not assigned'}
                                </div>
                                {res.notes && <div className="text-sm text-gray-500 mt-1">Note: {res.notes}</div>}
                            </div>
                            <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    res.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                    res.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {res.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerReservationsPage;