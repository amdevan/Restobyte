


import React, { useState, useMemo } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { AttendanceRecord, Employee } from '@/types';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import DownloadReportButton from '@/components/common/DownloadReportButton';
import AttendanceSummaryGraph from '@/components/attendance/AttendanceSummaryGraph';
import { FiCalendar, FiUser, FiFilter, FiXCircle, FiUsers, FiClock, FiArrowLeft } from 'react-icons/fi';

const AttendanceReportPage: React.FC = () => {
  const { attendanceRecords, employees } = useRestaurantData();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('All');

  const activeEmployees = useMemo(() => employees.filter(emp => emp.isActive), [employees]);

  const filteredRecords = useMemo(() => {
    return attendanceRecords
      .filter(record => {
        const recordDate = new Date(record.date + 'T00:00:00'); // Treat date as local
        const sDate = startDate ? new Date(startDate + 'T00:00:00') : null;
        const eDate = endDate ? new Date(endDate + 'T00:00:00') : null;

        if (sDate && recordDate < sDate) return false;
        if (eDate) {
          const endOfDay = new Date(eDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (recordDate > endOfDay) return false;
        }

        const matchesEmployee = selectedEmployeeId === 'All' || record.employeeId === selectedEmployeeId;
        return matchesEmployee;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.employeeName.localeCompare(b.employeeName));
  }, [attendanceRecords, startDate, endDate, selectedEmployeeId]);
  
  const summaryStats = useMemo(() => {
      const stats = {
          Present: 0,
          Absent: 0,
          Late: 0,
          'Half-Day': 0,
          'On Leave': 0
      };
      filteredRecords.forEach(record => {
          if (stats[record.status] !== undefined) {
              stats[record.status]++;
          }
      });
      return stats;
  }, [filteredRecords]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedEmployeeId('All');
  };

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading Attendance Report as ${format}... (This is a simulation)`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiClock className="mr-3 text-sky-600" /> Attendance Report
        </h1>
        <div className="flex items-center space-x-2">
            <DownloadReportButton onDownload={handleDownload} />
            <Button onClick={() => navigate('/app/report')} variant="outline" leftIcon={<FiArrowLeft />}>
            Back to Dashboard
            </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <Input
              label="Start Date"
              id="start-date-attendance"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
            <Input
              label="End Date"
              id="end-date-attendance"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              leftIcon={<FiCalendar />}
            />
            <div>
              <label htmlFor="employeeFilter" className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                id="employeeFilter"
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
              >
                <option value="All">All Employees</option>
                {activeEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div className="flex space-x-2 items-end h-full">
              <Button onClick={handleResetFilters} variant="secondary" leftIcon={<FiXCircle />} className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <Card title="Summary (Filtered Period)">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
              {Object.entries(summaryStats).map(([status, count]) => (
                  <div key={status} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">{status}</p>
                      <p className="text-2xl font-bold text-sky-600">{count}</p>
                  </div>
              ))}
          </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 p-4 border-b">
          Attendance Records ({filteredRecords.length})
        </h3>
        <div className="overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No attendance records match your criteria.
            </p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Check-in</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Check-out</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(record.date + 'T00:00:00').toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{record.employeeName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.status}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.checkInTime || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.checkOutTime || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">{record.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AttendanceReportPage;