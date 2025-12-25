import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { Reservation } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { FiCalendar, FiUser, FiArrowRight, FiClock } from 'react-icons/fi';

const formatReservationTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

    if (date.toDateString() === now.toDateString()) {
        return `Today at ${date.toLocaleTimeString([], timeOptions)}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow at ${date.toLocaleTimeString([], timeOptions)}`;
    }
    return date.toLocaleString([], { ...timeOptions, month: 'short', day: 'numeric' });
};

const UpcomingReservationsCard: React.FC = () => {
    const { reservations } = useRestaurantData();
    const navigate = useNavigate();

    const upcomingReservations = reservations
        .filter(res => new Date(res.dateTime) >= new Date())
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .slice(0, 4); // Show up to 4 upcoming reservations

    return (
        <Card title="Upcoming Reservations" icon={<FiCalendar />} className="h-full flex flex-col">
            <div className="flex-grow">
                {upcomingReservations.length > 0 ? (
                    <ul className="space-y-3">
                        {upcomingReservations.map(res => (
                            <li key={res.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0 bg-sky-100 text-sky-600 p-2 rounded-full">
                                    <FiUser size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-gray-800">{res.customerName}</p>
                                    <p className="text-xs text-gray-500">
                                        Party of {res.partySize} - {formatReservationTime(res.dateTime)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full py-8">
                        <FiClock size={32} className="mb-2 text-gray-400" />
                        <p className="text-sm">No upcoming reservations.</p>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/reservations')}
                    rightIcon={<FiArrowRight />}
                >
                    View All Reservations
                </Button>
            </div>
        </Card>
    );
};

export default UpcomingReservationsCard;