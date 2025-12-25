import React, { useRef } from 'react';
import { PayrollRecord, Employee } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { FiPrinter, FiXCircle } from 'react-icons/fi';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord;
  employee: Employee;
}

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="grid grid-cols-2 py-1">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-800 text-right">{value}</span>
  </div>
);

const PayslipModal: React.FC<PayslipModalProps> = ({ isOpen, onClose, record, employee }) => {
  const { getSingleActiveOutlet } = useRestaurantData();
  const outlet = getSingleActiveOutlet();
  const printRef = useRef<HTMLDivElement>(null);

  const monthName = new Date(record.year, record.month - 1, 1).toLocaleString('default', { month: 'long' });

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (content) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Payslip - ${employee.name}</title>
            <style>
                body { font-family: sans-serif; font-size: 12px; }
                .payslip-container { width: 100%; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; }
                .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 15px; }
                h1, h2, h3 { margin: 0; }
                .section { margin-top: 20px; }
                .section h3 { font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px; }
                .detail-row { display: flex; justify-content: space-between; padding: 4px 0; }
                .total-row { font-weight: bold; border-top: 2px solid #333; margin-top: 8px; }
            </style>
            </head><body>${content}</body></html>`);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Payslip for ${monthName} ${record.year}`} size="lg">
      <div ref={printRef} className="payslip-container p-4">
        <div className="header text-center pb-4 mb-4 border-b">
          <h1 className="text-2xl font-bold">{outlet?.restaurantName || 'Restaurant'}</h1>
          <p className="text-sm text-gray-500">{outlet?.address}</p>
          <h2 className="text-xl font-semibold mt-2">Payslip for {monthName} {record.year}</h2>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <DetailRow label="Employee Name" value={employee.name} />
          <DetailRow label="Employee ID" value={employee.employeeId} />
          <DetailRow label="Designation" value={employee.designation} />
          <DetailRow label="Joining Date" value={new Date(employee.joiningDate).toLocaleDateString()} />
        </div>

        <div className="grid grid-cols-2 gap-x-8 mt-4">
          <div className="section">
            <h3 className="text-lg font-semibold border-b pb-1 mb-2">Earnings</h3>
            <div className="detail-row text-sm">
              <span>Base Salary</span>
              <span className="font-mono">${record.baseSalary.toFixed(2)}</span>
            </div>
            <div className="detail-row total-row text-sm">
              <span>Gross Earnings</span>
              <span className="font-mono">${record.baseSalary.toFixed(2)}</span>
            </div>
          </div>
          <div className="section">
            <h3 className="text-lg font-semibold border-b pb-1 mb-2">Deductions</h3>
             <div className="detail-row text-sm">
              <span>Absent Days ({record.absentDays})</span>
              <span className="font-mono">-${record.deductions.toFixed(2)}</span>
            </div>
            <div className="detail-row total-row text-sm">
              <span>Total Deductions</span>
              <span className="font-mono">-${record.deductions.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-black text-right">
            <p className="text-gray-600">NET SALARY PAYABLE</p>
            <p className="text-2xl font-bold font-mono">${record.netSalary.toFixed(2)}</p>
        </div>
      </div>
       <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="secondary" onClick={onClose} leftIcon={<FiXCircle/>}>Close</Button>
            <Button onClick={handlePrint} leftIcon={<FiPrinter/>}>Print Payslip</Button>
       </div>
    </Modal>
  );
};

export default PayslipModal;