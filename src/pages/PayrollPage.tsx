import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Employee, AttendanceStatus, PayrollRecord } from '../types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import PayslipModal from '@/components/payroll/PayslipModal';
import { FiCalendar, FiDollarSign, FiUsers, FiFileText, FiCheckCircle, FiClock, FiXOctagon } from 'react-icons/fi';

type DisplayPayrollRecord = Omit<PayrollRecord, 'id'> & { id?: string; status: 'Pending' | 'Paid' | 'NotGenerated'; paidDate?: string };

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

const PayrollPage: React.FC = () => {
  const { employees, attendanceRecords, payrollRecords, addOrUpdatePayrollRecord } = useRestaurantData();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [displayPayroll, setDisplayPayroll] = useState<DisplayPayrollRecord[]>([]);
  const [viewingPayslip, setViewingPayslip] = useState<{ record: PayrollRecord, employee: Employee } | null>(null);

  const activeEmployees = useMemo(() => employees.filter(emp => emp.isActive), [employees]);

  const handleGeneratePayroll = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const generated: DisplayPayrollRecord[] = activeEmployees.map(emp => {
      const existingRecord = payrollRecords.find(r =>
        r.employeeId === emp.id && r.month === selectedMonth && r.year === selectedYear
      );

      if (existingRecord) {
        return { ...existingRecord, status: 'Paid' };
      }

      const employeeAttendance = attendanceRecords.filter(r =>
        r.employeeId === emp.id &&
        new Date(r.date).getFullYear() === selectedYear &&
        new Date(r.date).getMonth() + 1 === selectedMonth
      );

      let presentDays = 0;
      let lateDays = 0;
      let halfDays = 0;

      employeeAttendance.forEach(rec => {
        if (rec.status === AttendanceStatus.Present) presentDays++;
        if (rec.status === AttendanceStatus.Late) { presentDays++; lateDays++; }
        if (rec.status === AttendanceStatus.HalfDay) halfDays++;
      });
      
      const absentDays = daysInMonth - (presentDays + halfDays);
      const baseSalary = emp.salary || 0;
      const deductionPerDay = baseSalary / daysInMonth;
      const deductions = (absentDays * deductionPerDay) + (halfDays * (deductionPerDay / 2));
      const netSalary = baseSalary - deductions;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        month: selectedMonth,
        year: selectedYear,
        baseSalary,
        presentDays,
        absentDays: Math.max(0, absentDays), // Ensure non-negative
        lateDays,
        halfDays,
        deductions: Math.max(0, deductions),
        netSalary: Math.max(0, netSalary),
        status: 'Pending',
      };
    });
    setDisplayPayroll(generated);
  };
  
  const handleProcessPayment = (record: DisplayPayrollRecord) => {
    if(window.confirm(`Process payment of $${record.netSalary.toFixed(2)} for ${record.employeeName}?`)) {
      const finalRecord: PayrollRecord = {
        ...record,
        id: `${record.employeeId}-${record.year}-${record.month}`,
        status: 'Paid',
        paidDate: new Date().toISOString(),
      };
      addOrUpdatePayrollRecord(finalRecord);
      // Refresh the display list to show the new status
      setDisplayPayroll(prev => prev.map(p => p.employeeId === record.employeeId ? finalRecord : p));
    }
  };

  const handleViewPayslip = (record: DisplayPayrollRecord) => {
      const employee = activeEmployees.find(e => e.id === record.employeeId);
      if (employee && record.id) {
          setViewingPayslip({ record: record as PayrollRecord, employee });
      }
  };

  const summary = useMemo(() => {
      return displayPayroll.reduce((acc, record) => {
          acc.totalBase += record.baseSalary;
          acc.totalDeductions += record.deductions;
          acc.totalNet += record.netSalary;
          return acc;
      }, { totalBase: 0, totalDeductions: 0, totalNet: 0 });
  }, [displayPayroll]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {viewingPayslip && (
          <PayslipModal
              isOpen={!!viewingPayslip}
              onClose={() => setViewingPayslip(null)}
              record={viewingPayslip.record}
              employee={viewingPayslip.employee}
          />
      )}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiDollarSign className="mr-3 text-sky-600" /> Payroll Management
        </h1>
        <div className="flex items-center space-x-2">
            <input type="month" value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`} onChange={e => {
                const [year, month] = e.target.value.split('-').map(Number);
                setSelectedYear(year);
                setSelectedMonth(month);
            }} className="p-2 border rounded-md"/>
            <Button onClick={handleGeneratePayroll}>Generate</Button>
        </div>
      </div>
      
      {displayPayroll.length > 0 && (
        <Card title="Payroll Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-100 rounded-lg"><p className="text-sm">Total Base Salary</p><p className="text-xl font-bold">${summary.totalBase.toFixed(2)}</p></div>
                <div className="p-3 bg-amber-100 rounded-lg"><p className="text-sm">Total Deductions</p><p className="text-xl font-bold">${summary.totalDeductions.toFixed(2)}</p></div>
                <div className="p-3 bg-green-100 rounded-lg"><p className="text-sm">Total Net Salary</p><p className="text-xl font-bold">${summary.totalNet.toFixed(2)}</p></div>
            </div>
        </Card>
      )}

      <Card className="overflow-x-auto">
        {displayPayroll.length === 0 ? (
          <div className="text-center py-10">
            <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Select a month and click "Generate" to view payroll data.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Employee</th>
                <th className="py-3 px-4 text-right">Base Salary</th>
                <th className="py-3 px-4 text-center">Present</th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Salary</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayPayroll.map(record => (
                <tr key={record.employeeId}>
                  <td className="py-3 px-4 font-medium">{record.employeeName}</td>
                  <td className="py-3 px-4 text-right">${record.baseSalary.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">{record.presentDays}</td>
                  <td className="py-3 px-4 text-center">{record.absentDays}</td>
                  <td className="py-3 px-4 text-right text-red-600">${record.deductions.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-700">${record.netSalary.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {record.status}
                      </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                      {record.status === 'Pending' ? (
                          <Button size="sm" onClick={() => handleProcessPayment(record)}>Process Payment</Button>
                      ) : (
                          <Button size="sm" variant="secondary" onClick={() => handleViewPayslip(record)}>View Payslip</Button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default PayrollPage;