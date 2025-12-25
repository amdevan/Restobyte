
import React, { useMemo } from 'react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Card from '../common/Card';
import { FiShoppingCart, FiGrid, FiCalendar } from 'react-icons/fi';
import { TableStatus } from '../../types';

interface RingProgressProps {
    percentage: number;
    color: string;
    label: string;
}

const RingProgress: React.FC<RingProgressProps> = ({ percentage, color, label }) => {
    const radius = 30;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-20 h-20">
            <svg className="w-full h-full" viewBox="0 0 70 70">
                <circle
                    className="text-gray-200"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="35"
                    cy="35"
                />
                <circle
                    className={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="35"
                    cy="35"
                    transform="rotate(-90 35 35)"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-700">
                {label}
            </div>
        </div>
    );
};


const AtAGlanceCard: React.FC = () => {
    const { sales, tables, reservations } = useRestaurantData();

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        
        const todaysOrders = sales.filter(sale => sale.saleDate.startsWith(today));
        const activeTables = tables.filter(table => table.status === TableStatus.Occupied);
        const upcomingReservations = reservations.filter(res => new Date(res.dateTime) >= new Date());

        const totalTables = tables.length > 0 ? tables.length : 1; // Avoid division by zero
        const activeTablePercentage = (activeTables.length / totalTables) * 100;

        // Assuming a daily goal of 50 orders for percentage calculation
        const orderGoal = 50;
        const orderPercentage = (todaysOrders.length / orderGoal) * 100;

        // Assuming a daily goal of 20 reservations for percentage
        const reservationGoal = 20;
        const reservationPercentage = (upcomingReservations.length / reservationGoal) * 100;


        return {
            orders: { count: todaysOrders.length, percentage: Math.min(orderPercentage, 100) },
            tables: { count: activeTables.length, percentage: Math.min(activeTablePercentage, 100) },
            reservations: { count: upcomingReservations.length, percentage: Math.min(reservationPercentage, 100) }
        };
    }, [sales, tables, reservations]);

    return (
        <Card title="At a Glance" className="h-full">
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <RingProgress percentage={stats.orders.percentage} color="text-green-500" label={`${stats.orders.count}`} />
                    <div>
                        <h4 className="font-semibold text-gray-700">Today's Orders</h4>
                        <p className="text-sm text-gray-500">Total sales transactions processed today.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <RingProgress percentage={stats.tables.percentage} color="text-red-500" label={`${stats.tables.count}`} />
                    <div>
                        <h4 className="font-semibold text-gray-700">Active Tables</h4>
                        <p className="text-sm text-gray-500">Tables currently occupied by customers.</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-4">
                    <RingProgress percentage={stats.reservations.percentage} color="text-amber-500" label={`${stats.reservations.count}`} />
                    <div>
                        <h4 className="font-semibold text-gray-700">Upcoming Reservations</h4>
                        <p className="text-sm text-gray-500">Confirmed reservations for today and future.</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default AtAGlanceCard;
