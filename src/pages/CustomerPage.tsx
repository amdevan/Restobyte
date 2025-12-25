

import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Customer } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import CustomerForm from '@/components/customer/CustomerForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiUsers, FiSearch, FiPhone, FiMail, FiMapPin, FiCalendar, FiBriefcase, FiHash } from 'react-icons/fi';

const CustomerPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModalForAdd = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = (customerId: string) => {
    if (customerId === 'cust-walkin') {
      alert("The 'Walk-in Customer' record cannot be deleted.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(customerId);
    }
  };

  const filteredCustomers = useMemo(() => {
    // Exclude 'Walk-in Customer' from the manageable list
    const manageableCustomers = customers.filter(c => c.id !== 'cust-walkin');
    if (!searchTerm) {
      return manageableCustomers;
    }
    return manageableCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);

  const formatDateOfBirth = (dobString?: string): string => {
    if (!dobString) return '-';
    try {
      // Assuming dobString is in 'YYYY-MM-DD' format
      const date = new Date(dobString + 'T00:00:00'); // Ensure it's parsed as local date
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dobString; // Fallback to raw string if parsing fails
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiUsers className="mr-3 text-sky-600"/> Manage Customers
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
             <Input
                id="customer-search"
                type="text"
                placeholder="Search by name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10"
                containerClassName="mb-0 flex-grow sm:flex-grow-0"
                leftIcon={<FiSearch className="h-5 w-5" />}
            />
            <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary" className="w-full sm:w-auto">
            Add New Customer
            </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-10">
            <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
                {customers.filter(c => c.id !== 'cust-walkin').length === 0 
                    ? "No customers found. Add your first customer!" 
                    : "No customers match your search criteria."}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Company Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">VAT/PAN</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Address</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-sky-50 transition-all duration-200">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{customer.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{customer.companyName || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <a href={`tel:${customer.phone}`} className="hover:text-sky-600 flex items-center">
                        <FiPhone size={12} className="mr-1.5"/>{customer.phone}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {customer.email ? (
                        <a href={`mailto:${customer.email}`} className="hover:text-sky-600 flex items-center">
                            <FiMail size={12} className="mr-1.5"/>{customer.email}
                        </a>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{customer.vatPan || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{customer.address || '-'}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(customer)} variant="secondary" size="sm" aria-label="Edit Customer">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(customer.id)} variant="danger" size="sm" aria-label="Delete Customer">
                        <FiTrash2 />
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
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        size="lg"
      >
        <CustomerForm
          initialData={editingCustomer}
          onSubmit={addCustomer}
          onUpdate={updateCustomer}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default CustomerPage;