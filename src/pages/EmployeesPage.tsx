
import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Employee } from '../types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import EmployeeForm from '@/components/employees/EmployeeForm';
import EmployeeDetailsModal from '@/components/employees/EmployeeDetailsModal';
import { FiPlusCircle, FiEdit, FiTrash2, FiUsers, FiSearch, FiFilter, FiEye, FiBriefcase, FiCheckCircle, FiXCircle as FiStatusX } from 'react-icons/fi';

const DESIGNATION_FILTER_OPTIONS = ["All", "Manager", "Chef", "Sous Chef", "Cook", "Waiter/Waitress", "Senior Waiter", "Captain", "Host/Hostess", "Bartender", "Cashier", "Cleaner", "Dishwasher", "Delivery Staff", "Accountant", "HR Specialist", "Other"];
const STATUS_FILTER_OPTIONS = [
    { label: "All Statuses", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
];

const EmployeesPage: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useRestaurantData();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        employee.name.toLowerCase().includes(searchTermLower) ||
        employee.employeeId.toLowerCase().includes(searchTermLower) ||
        employee.designation.toLowerCase().includes(searchTermLower);

      const matchesDesignation = selectedDesignationFilter === 'All' || employee.designation === selectedDesignationFilter;
      
      let matchesStatus = true;
      if (selectedStatusFilter === 'active') matchesStatus = employee.isActive;
      else if (selectedStatusFilter === 'inactive') matchesStatus = !employee.isActive;
      
      return matchesSearch && matchesDesignation && matchesStatus;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm, selectedDesignationFilter, selectedStatusFilter]);

  const handleOpenFormModal = (employee?: Employee) => {
    setEditingEmployee(employee || null);
    setIsFormModalOpen(true);
  };
  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingEmployee(null);
  };

  const handleOpenDetailsModal = (employee: Employee) => {
    setViewingEmployee(employee);
    setIsDetailsModalOpen(true);
  };
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingEmployee(null);
  };

  const handleDelete = (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee record? This action cannot be undone.')) {
      deleteEmployee(employeeId);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiUsers className="mr-3 text-sky-600"/> Manage Employees
        </h1>
        <Button onClick={() => handleOpenFormModal()} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Employee
        </Button>
      </div>

      <Card>
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Input
                    label="Search Name / Emp ID / Designation"
                    id="employee-search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    leftIcon={<FiSearch />}
                    placeholder="e.g., John Doe, EMP001, Manager"
                />
                <div>
                    <label htmlFor="designationFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Designation</label>
                    <select
                        id="designationFilter"
                        value={selectedDesignationFilter}
                        onChange={e => setSelectedDesignationFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
                    >
                        {DESIGNATION_FILTER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                    <select
                        id="statusFilter"
                        value={selectedStatusFilter}
                        onChange={e => setSelectedStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
                    >
                        {STATUS_FILTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-10">
            <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
                {employees.length === 0 
                    ? "No employees found. Add your first employee!" 
                    : "No employees match your search criteria."}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Photo</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Emp. ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Designation</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Joining Date</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-4">
                    <img 
                        src={emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&color=fff&size=40`} 
                        alt={emp.name} 
                        className="w-10 h-10 rounded-full object-cover"
                    />
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{emp.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{emp.employeeId}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{emp.designation}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{emp.phone}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{new Date(emp.joiningDate  + 'T00:00:00').toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {emp.isActive ? <FiCheckCircle className="mr-1" /> : <FiStatusX className="mr-1" />}
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-1">
                       <Button onClick={() => handleOpenDetailsModal(emp)} variant="outline" size="sm" className="p-1.5" aria-label="View Details">
                        <FiEye size={14}/>
                      </Button>
                      <Button onClick={() => handleOpenFormModal(emp)} variant="secondary" size="sm" className="p-1.5" aria-label="Edit Employee">
                        <FiEdit size={14}/>
                      </Button>
                      <Button onClick={() => handleDelete(emp.id)} variant="danger" size="sm" className="p-1.5" aria-label="Delete Employee">
                        <FiTrash2 size={14}/>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal 
        isOpen={isFormModalOpen} 
        onClose={handleCloseFormModal} 
        title={editingEmployee ? "Edit Employee" : "Add New Employee"}
        size="2xl"
      >
        <EmployeeForm
          initialData={editingEmployee}
          onSubmit={addEmployee}
          onUpdate={updateEmployee}
          onClose={handleCloseFormModal}
        />
      </Modal>
      
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={handleCloseDetailsModal} 
        title="Employee Details"
        size="lg"
      >
        <EmployeeDetailsModal
          employee={viewingEmployee}
          onClose={handleCloseDetailsModal}
        />
      </Modal>
    </div>
  );
};

export default EmployeesPage;
