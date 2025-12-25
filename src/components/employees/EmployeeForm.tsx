
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Employee } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiDollarSign, FiBriefcase, FiShield, FiImage, FiCheckSquare } from 'react-icons/fi';

interface EmployeeFormProps {
  initialData?: Employee | null;
  onSubmit: (data: Omit<Employee, 'id' | 'waiterId'>) => void; // waiterId handled by hook
  onUpdate: (data: Employee) => void;
  onClose: () => void;
}

const DESIGNATION_OPTIONS = ["Manager", "Chef", "Sous Chef", "Cook", "Waiter/Waitress", "Senior Waiter", "Captain", "Host/Hostess", "Bartender", "Cashier", "Cleaner", "Dishwasher", "Delivery Staff", "Accountant", "HR Specialist", "Other"];

const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId || `EMP-${Date.now().toString().slice(-5)}`);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [designation, setDesignation] = useState(DESIGNATION_OPTIONS[0]);
  const [salary, setSalary] = useState<string | number>('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isWaiter, setIsWaiter] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);


  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmployeeId(initialData.employeeId);
      setPhone(initialData.phone);
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setDob(initialData.dob || '');
      setJoiningDate(initialData.joiningDate ? initialData.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setDesignation(initialData.designation);
      setSalary(initialData.salary || '');
      setEmergencyContactName(initialData.emergencyContactName || '');
      setEmergencyContactPhone(initialData.emergencyContactPhone || '');
      setIsActive(initialData.isActive);
      setIsWaiter(initialData.isWaiter);
      setPhotoUrl(initialData.photoUrl);
      setPhotoPreview(initialData.photoUrl);
    } else {
      // Reset for new entry
      setName('');
      setEmployeeId(`EMP-${Date.now().toString().slice(-5)}`);
      setPhone('');
      setEmail('');
      setAddress('');
      setDob('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setDesignation(DESIGNATION_OPTIONS[0]);
      setSalary('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setIsActive(true);
      setIsWaiter(false);
      setPhotoUrl(undefined);
      setPhotoPreview(undefined);
    }
  }, [initialData]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setPhotoUrl(reader.result as string); // Store as DataURL
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(undefined);
      setPhotoUrl(undefined);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim() || !phone.trim() || !joiningDate || !designation) {
      alert('Name, Employee ID, Phone, Joining Date, and Designation are required.');
      return;
    }
    const numericSalary = salary ? parseFloat(String(salary)) : undefined;
    if (salary && (isNaN(numericSalary) || numericSalary < 0)) {
        alert('Please enter a valid salary or leave it blank.');
        return;
    }

    const employeeData = { 
        name, employeeId, phone, email, address, dob, 
        joiningDate, designation, salary: numericSalary, 
        emergencyContactName, emergencyContactPhone, 
        isActive, isWaiter, photoUrl,
    };

    if (initialData) {
      // waiterId is managed by the hook based on isWaiter flag change
      onUpdate({ ...initialData, ...employeeData });
    } else {
      onSubmit(employeeData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Full Name *" value={name} onChange={(e) => setName(e.target.value)} required leftIcon={<FiUser />} />
        <Input label="Employee ID *" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required leftIcon={<FiBriefcase />} />
        <Input label="Phone Number *" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required leftIcon={<FiPhone />} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Email (Optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<FiMail />} />
        <Input label="Date of Birth (Optional)" type="date" value={dob} onChange={(e) => setDob(e.target.value)} leftIcon={<FiCalendar />} max={new Date().toISOString().split("T")[0]} />
        <Input label="Joining Date *" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required leftIcon={<FiCalendar />} />
      </div>

      <Input label="Address (Optional)" value={address} onChange={(e) => setAddress(e.target.value)} leftIcon={<FiMapPin />} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
            <select
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required
            >
                {DESIGNATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
        <Input label="Salary (Optional)" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} min="0" step="any" leftIcon={<FiDollarSign />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Emergency Contact Name (Optional)" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} leftIcon={<FiShield />} />
        <Input label="Emergency Contact Phone (Optional)" type="tel" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} leftIcon={<FiPhone />} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photo (Optional)</label>
        <div className="flex items-center space-x-4">
            {photoPreview ? (
                <img src={photoPreview} alt="Employee Preview" className="w-20 h-20 rounded-full object-cover border" />
            ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border">
                    <FiImage size={30} />
                </div>
            )}
            <Input type="file" onChange={handlePhotoChange} accept="image/*" className="text-sm"/>
        </div>
      </div>
      
      <div className="flex items-center space-x-6 pt-2">
        <div className="flex items-center">
          <input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active Employee</label>
        </div>
        <div className="flex items-center">
          <input id="isWaiter" type="checkbox" checked={isWaiter} onChange={(e) => setIsWaiter(e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
          <label htmlFor="isWaiter" className="ml-2 block text-sm text-gray-900">Is this employee also a Waiter?</label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>Cancel</Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>{initialData ? 'Update Employee' : 'Save Employee'}</Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
