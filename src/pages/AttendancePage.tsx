
import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Employee, AttendanceRecord, AttendanceStatus } from '../types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import AttendanceSummaryGraph from '@/components/attendance/AttendanceSummaryGraph'; // New import
import { FiCalendar, FiSave, FiUsers, FiCheckSquare } from 'react-icons/fi';

interface DailyAttendanceEntry {
  employeeId: string;
  employeeName: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

const AttendancePage: React.FC = () => {
  const { employees, attendanceRecords, markOrUpdateAttendance, getAttendanceForDate } = useRestaurantData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceEntry[]>([]);

  const activeEmployees = useMemo(() => employees.filter(emp => emp.isActive), [employees]);

  useEffect(() => {
    const recordsForDate = getAttendanceForDate(selectedDate);
    const newDailyAttendance: DailyAttendanceEntry[] = activeEmployees.map(emp => {
      const existingRecord = recordsForDate.find(r => r.employeeId === emp.id);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        status: existingRecord?.status || AttendanceStatus.Present, // Default to Present
        checkInTime: existingRecord?.checkInTime || '',
        checkOutTime: existingRecord?.checkOutTime || '',
        notes: existingRecord?.notes || '',
      };
    });
    setDailyAttendance(newDailyAttendance);
  }, [selectedDate, activeEmployees, getAttendanceForDate]);

  const getTableStatusColorClass = (status: AttendanceStatus): string => {
    switch (status) {
      case AttendanceStatus.Present: return 'bg-green-100 text-green-700';
      case AttendanceStatus.Absent: return 'bg-red-100 text-red-700';
      case AttendanceStatus.Late: return 'bg-amber-100 text-amber-700';
      case AttendanceStatus.HalfDay: return 'bg-sky-100 text-sky-700';
      case AttendanceStatus.OnLeave: return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getGraphStatusColor = (status: AttendanceStatus): string => {
    // Returns SVG fill classes
    switch (status) {
      case AttendanceStatus.Present: return 'fill-green-500';
      case AttendanceStatus.Absent: return 'fill-red-500';
      case AttendanceStatus.Late: return 'fill-amber-500';
      case AttendanceStatus.HalfDay: return 'fill-sky-500';
      case AttendanceStatus.OnLeave: return 'fill-indigo-500';
      default: return 'fill-gray-500';
    }
  };

  const attendanceSummaryData = useMemo(() => {
    if (dailyAttendance.length === 0) return [];
    const summary: { status: AttendanceStatus; count: number; color: string }[] = [];
    const counts: Record<AttendanceStatus, number> = {
        [AttendanceStatus.Present]: 0,
        [AttendanceStatus.Absent]: 0,
        [AttendanceStatus.Late]: 0,
        [AttendanceStatus.HalfDay]: 0,
        [AttendanceStatus.OnLeave]: 0,
    };

    dailyAttendance.forEach(entry => {
        counts[entry.status]++;
    });

    for (const status of Object.values(AttendanceStatus)) {
        summary.push({
            status: status,
            count: counts[status],
            color: getGraphStatusColor(status),
        });
    }
    return summary;
  }, [dailyAttendance]);


  const handleAttendanceChange = (employeeId: string, field: keyof DailyAttendanceEntry, value: string) => {
    setDailyAttendance(prev =>
      prev.map(entry =>
        entry.employeeId === employeeId ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleMarkAllPresent = () => {
    setDailyAttendance(prev =>
      prev.map(entry => ({
        ...entry,
        status: AttendanceStatus.Present,
      }))
    );
  };

  const handleSaveAttendance = () => {
    const recordsToUpdate: Array<Omit<AttendanceRecord, 'id' | 'employeeName'>> = dailyAttendance.map(entry => ({
      employeeId: entry.employeeId,
      date: selectedDate,
      status: entry.status,
      checkInTime: entry.checkInTime || undefined,
      checkOutTime: entry.checkOutTime || undefined,
      notes: entry.notes || undefined,
    }));
    markOrUpdateAttendance(recordsToUpdate);
    alert(`Attendance for ${new Date(selectedDate + 'T00:00:00Z').toLocaleDateString()} saved successfully!`);
  };
  
  const isTimeInputDisabled = (status: AttendanceStatus): boolean => {
    return status === AttendanceStatus.Absent || status === AttendanceStatus.OnLeave;
  };
  
  const totalActiveEmployees = activeEmployees.length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiCalendar className="mr-3 text-sky-600" /> Employee Attendance
        </h1>
        <Input
          type="date"
          label="Select Date:"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          containerClassName="mb-0 sm:w-auto w-full"
          className="sm:w-auto w-full"
        />
      </div>

      {totalActiveEmployees > 0 && dailyAttendance.length > 0 && (
        <Card title={`Attendance Summary for ${new Date(selectedDate + 'T00:00:00Z').toLocaleDateString()}`}>
          <AttendanceSummaryGraph data={attendanceSummaryData} totalEmployees={totalActiveEmployees} />
        </Card>
      )}

      <Card>
        <div className="p-4 mb-4 flex justify-end space-x-3">
          <Button onClick={handleMarkAllPresent} variant="secondary" leftIcon={<FiCheckSquare />}>
            Mark All Present
          </Button>
          <Button onClick={handleSaveAttendance} variant="primary" leftIcon={<FiSave />}>
            Save Attendance for {new Date(selectedDate + 'T00:00:00Z').toLocaleDateString()}
          </Button>
        </div>
        
        {activeEmployees.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
                <FiUsers size={48} className="mx-auto mb-2 text-gray-400"/>
                No active employees found. Please add employees first.
            </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Employee Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Check-in</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Check-out</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyAttendance.map(entry => (
                <tr key={entry.employeeId} className="hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm font-medium text-gray-800">{entry.employeeName}</td>
                  <td className="py-2 px-4">
                    <select
                      value={entry.status}
                      onChange={(e) => handleAttendanceChange(entry.employeeId, 'status', e.target.value)}
                      className={`w-full text-xs p-1.5 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500 ${getTableStatusColorClass(entry.status)}`}
                    >
                      {Object.values(AttendanceStatus).map(status => (
                        <option key={status} value={status} className="bg-white text-gray-700">
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-4">
                    <Input
                      type="time"
                      value={entry.checkInTime}
                      onChange={(e) => handleAttendanceChange(entry.employeeId, 'checkInTime', e.target.value)}
                      className="text-xs p-1.5 w-full"
                      containerClassName="mb-0"
                      disabled={isTimeInputDisabled(entry.status)}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <Input
                      type="time"
                      value={entry.checkOutTime}
                      onChange={(e) => handleAttendanceChange(entry.employeeId, 'checkOutTime', e.target.value)}
                      className="text-xs p-1.5 w-full"
                      containerClassName="mb-0"
                      disabled={isTimeInputDisabled(entry.status)}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <Input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => handleAttendanceChange(entry.employeeId, 'notes', e.target.value)}
                      placeholder="Optional notes..."
                      className="text-xs p-1.5 w-full"
                      containerClassName="mb-0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  );
};

export default AttendancePage;
