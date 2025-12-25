
import React from 'react';
import { Employee } from '../../types';
import Button from '../common/Button';
import { FiXCircle, FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiDollarSign, FiBriefcase, FiShield, FiCheckSquare, FiImage, FiCoffee } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons'; // Import IconBaseProps

interface EmployeeDetailsModalProps {
  employee: Employee | null;
  onClose: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number | boolean | null; icon: React.ReactElement<IconBaseProps>; isBoolean?: boolean }> = ({ label, value, icon, isBoolean = false }) => {
  let displayValue: React.ReactNode = '-';
  if (isBoolean) {
    displayValue = value ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-red-600 font-semibold">No</span>;
  } else if (value !== undefined && value !== null && String(value).trim() !== '') {
    displayValue = String(value);
  }

  return (
    <div className="py-1.5 grid grid-cols-3 gap-2 items-start">
      <div className="col-span-1 flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        {React.cloneElement(icon, { size: 14, className: "mr-2 text-sky-600"})}
        {label}
      </div>
      <div className="col-span-2 text-gray-800 text-sm">{displayValue}</div>
    </div>
  );
};

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ employee, onClose }) => {
  if (!employee) return null;

  return (
    <div className="text-sm text-gray-700 max-h-[80vh] flex flex-col">
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3">
        <div className="flex items-center space-x-4 mb-4 pb-3 border-b">
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.name} className="w-24 h-24 rounded-full object-cover border-2 border-sky-200" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border-2 border-gray-300">
              <FiUser size={40} />
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-sky-700">{employee.name}</h3>
            <p className="text-gray-600">{employee.designation}</p>
            <p className={`text-xs font-medium px-2 py-0.5 inline-block rounded-full mt-1 ${employee.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {employee.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        <DetailItem label="Employee ID" value={employee.employeeId} icon={<FiBriefcase />} />
        <DetailItem label="Phone" value={employee.phone} icon={<FiPhone />} />
        <DetailItem label="Email" value={employee.email} icon={<FiMail />} />
        <DetailItem label="Date of Birth" value={employee.dob ? new Date(employee.dob + 'T00:00:00').toLocaleDateString() : '-'} icon={<FiCalendar />} />
        <DetailItem label="Joining Date" value={new Date(employee.joiningDate + 'T00:00:00').toLocaleDateString()} icon={<FiCalendar />} />
        <DetailItem label="Address" value={employee.address} icon={<FiMapPin />} />
        
        <DetailItem label="Salary" value={employee.salary ? `$${employee.salary.toFixed(2)}` : '-'} icon={<FiDollarSign />} />
        
        <DetailItem label="Emergency Contact" value={employee.emergencyContactName} icon={<FiShield />} />
        <DetailItem label="Emergency Phone" value={employee.emergencyContactPhone} icon={<FiPhone />} />

        <DetailItem label="Is Waiter" value={employee.isWaiter} icon={<FiCoffee />} isBoolean />
        {employee.isWaiter && employee.waiterId && <DetailItem label="Waiter ID" value={employee.waiterId.slice(0,15)+'...'} icon={<FiCheckSquare />} />}

      </div>
      <div className="mt-auto pt-4 border-t flex justify-end">
        <Button onClick={onClose} variant="primary" leftIcon={<FiXCircle />}>Close</Button>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
