
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { ReservationSettings, ReservationAvailability } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FiCalendar, FiHelpCircle, FiUpload, FiCheckCircle } from 'react-icons/fi';

const DAYS_OF_WEEK: ReservationAvailability['day'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EnableDisableReservationPage: React.FC = () => {
    const { reservationSettings, setReservationSettings } = useRestaurantData();
    const [localSettings, setLocalSettings] = useState<ReservationSettings>(reservationSettings);
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        // This ensures the local form state is updated if the global context changes
        // (e.g., loaded from localStorage after initial render)
        setLocalSettings(reservationSettings);
    }, [reservationSettings]);

    const handleGlobalEnableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLocalSettings(prev => ({ ...prev, enabled: e.target.value === 'enable' }));
    };

    const handleAvailabilityChange = (day: ReservationAvailability['day'], isAvailable: boolean) => {
        setLocalSettings(prev => ({
            ...prev,
            availability: prev.availability.map(d => 
                d.day === day ? { ...d, isAvailable } : d
            )
        }));
    };

    const handleTimeChange = (day: ReservationAvailability['day'], field: 'startTime' | 'endTime', value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            availability: prev.availability.map(d => 
                d.day === day ? { ...d, [field]: value } : d
            )
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setReservationSettings(localSettings);
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };
    
    // Check if there are unsaved changes
    const isDirty = JSON.stringify(localSettings) !== JSON.stringify(reservationSettings);

    return (
        <div className="p-4 sm:p-6">
            <Card>
                <form onSubmit={handleSubmit} className="p-5 space-y-6">
                     <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
                        <FiCalendar className="mr-3 text-sky-600"/> Enable/Disable (Reservation)
                    </h1>

                    <div className="flex items-end space-x-2 max-w-sm">
                        <div className="flex-grow">
                             <label htmlFor="enableDisableSelect" className="block text-sm font-medium text-gray-700 mb-1">
                                Enable/Disable
                            </label>
                            <select
                                id="enableDisableSelect"
                                value={localSettings.enabled ? 'enable' : 'disable'}
                                onChange={handleGlobalEnableChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            >
                                <option value="enable">Enable</option>
                                <option value="disable">Disable</option>
                            </select>
                        </div>
                        <span className="p-2.5 text-gray-400 hover:text-sky-600 cursor-pointer" title="Globally enable or disable the reservation system.">
                            <FiHelpCircle size={22} />
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Availability</th>
                                    <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Day</th>
                                    <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Start Time</th>
                                    <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">End Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS_OF_WEEK.map(dayName => {
                                    const daySetting = localSettings.availability.find(d => d.day === dayName);
                                    if (!daySetting) return null;

                                    return (
                                        <tr key={dayName} className="border-b border-gray-200 last:border-b-0">
                                            <td className="py-3 px-2">
                                                <input
                                                    type="checkbox"
                                                    checked={daySetting.isAvailable}
                                                    onChange={(e) => handleAvailabilityChange(dayName, e.target.checked)}
                                                    className="h-5 w-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                                />
                                            </td>
                                            <td className="py-3 px-2 text-sm text-gray-800">{dayName}</td>
                                            <td className="py-3 px-2">
                                                <Input
                                                    type="time"
                                                    value={daySetting.startTime}
                                                    onChange={(e) => handleTimeChange(dayName, 'startTime', e.target.value)}
                                                    disabled={!daySetting.isAvailable}
                                                    className="p-1.5 text-sm"
                                                    containerClassName="mb-0"
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <Input
                                                    type="time"
                                                    value={daySetting.endTime}
                                                    onChange={(e) => handleTimeChange(dayName, 'endTime', e.target.value)}
                                                    disabled={!daySetting.isAvailable}
                                                    className="p-1.5 text-sm"
                                                    containerClassName="mb-0"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="flex items-center space-x-4 pt-4">
                        <Button type="submit" variant="primary" className="bg-violet-600 hover:bg-violet-700" leftIcon={<FiUpload />} disabled={!isDirty}>
                            Submit
                        </Button>
                        <div className="h-5">
                            {showSavedMessage && (
                                <span className="text-green-600 text-sm flex items-center">
                                    <FiCheckCircle size={16} className="mr-1.5" />
                                    Settings saved successfully!
                                </span>
                            )}
                        </div>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EnableDisableReservationPage;
