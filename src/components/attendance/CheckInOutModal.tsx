import React, { useState, useMemo, useEffect } from 'react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { Employee, AttendanceStatus, AttendanceRecord } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FiLogIn, FiLogOut, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface CheckInOutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CheckInOutModal: React.FC<CheckInOutModalProps> = ({ isOpen, onClose }) => {
    const { employees, getAttendanceForDate, markOrUpdateAttendance } = useRestaurantData();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const activeEmployees = useMemo(() => employees.filter(emp => emp.isActive), [employees]);
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    useEffect(() => {
        if (isOpen && activeEmployees.length > 0 && !selectedEmployeeId) {
            setSelectedEmployeeId(activeEmployees[0].id);
        }
        if (!isOpen) {
            setFeedback(null); // Reset feedback when modal closes
        }
    }, [isOpen, activeEmployees, selectedEmployeeId]);

    const todaysAttendanceForEmployee = useMemo(() => {
        if (!selectedEmployeeId) return null;
        const todaysRecords = getAttendanceForDate(todayStr);
        return todaysRecords.find(rec => rec.employeeId === selectedEmployeeId) || null;
    }, [selectedEmployeeId, getAttendanceForDate, todayStr, markOrUpdateAttendance]); // re-evaluate when data changes

    const handleAction = (action: 'checkin' | 'checkout') => {
        if (!selectedEmployeeId) {
            setFeedback({ type: 'error', message: 'Please select an employee.' });
            return;
        }

        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        let newRecord: Omit<AttendanceRecord, 'id' | 'employeeName'>;

        if (action === 'checkin') {
            newRecord = {
                employeeId: selectedEmployeeId,
                date: todayStr,
                status: AttendanceStatus.Present,
                checkInTime: currentTime,
                checkOutTime: undefined,
                notes: 'Checked in via shortcut',
            };
            setFeedback({ type: 'success', message: 'Checked in successfully!' });
        } else { // checkout
            if (!todaysAttendanceForEmployee || !todaysAttendanceForEmployee.checkInTime) {
                setFeedback({ type: 'error', message: 'Cannot check out without checking in first.' });
                return;
            }
            newRecord = {
                ...todaysAttendanceForEmployee,
                checkOutTime: currentTime,
                notes: todaysAttendanceForEmployee.notes ? `${todaysAttendanceForEmployee.notes} | Checked out via shortcut` : 'Checked out via shortcut',
            };
            setFeedback({ type: 'success', message: 'Checked out successfully!' });
        }
        
        markOrUpdateAttendance([newRecord]);
        
        setTimeout(() => {
            setFeedback(null);
        }, 3000);
    };

    const canCheckIn = !todaysAttendanceForEmployee?.checkInTime;
    const canCheckOut = todaysAttendanceForEmployee?.checkInTime && !todaysAttendanceForEmployee?.checkOutTime;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Employee Check-in / Check-out" size="md">
            <div className="space-y-4">
                <div>
                    <label htmlFor="employeeSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                    <select
                        id="employeeSelect"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                    >
                        <option value="" disabled>-- Select an employee --</option>
                        {activeEmployees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                        ))}
                    </select>
                </div>
                
                {selectedEmployeeId && (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="font-semibold text-lg text-gray-800">{activeEmployees.find(e => e.id === selectedEmployeeId)?.name}</p>
                        <div className="mt-2 text-sm text-gray-600">
                            {todaysAttendanceForEmployee?.checkInTime && !todaysAttendanceForEmployee?.checkOutTime && (
                                <p>Checked in at: <span className="font-medium text-green-600">{todaysAttendanceForEmployee.checkInTime}</span></p>
                            )}
                             {todaysAttendanceForEmployee?.checkInTime && todaysAttendanceForEmployee?.checkOutTime && (
                                <p>Checked out at: <span className="font-medium text-red-600">{todaysAttendanceForEmployee.checkOutTime}</span></p>
                            )}
                             {!todaysAttendanceForEmployee?.checkInTime && (
                                <p>Not yet checked in today.</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-center space-x-4 pt-2">
                    <Button onClick={() => handleAction('checkin')} disabled={!selectedEmployeeId || !canCheckIn} leftIcon={<FiLogIn/>}>Check In</Button>
                    <Button onClick={() => handleAction('checkout')} disabled={!selectedEmployeeId || !canCheckOut} variant="danger" leftIcon={<FiLogOut/>}>Check Out</Button>
                </div>

                {feedback && (
                    <div className={`mt-4 p-2 rounded-md text-sm flex items-center justify-center ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {feedback.type === 'success' ? <FiCheckCircle className="mr-2"/> : <FiXCircle className="mr-2"/>}
                        {feedback.message}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default CheckInOutModal;
