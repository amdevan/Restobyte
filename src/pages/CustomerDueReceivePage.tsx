

import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Customer } from '../types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import ReceivePaymentModal from '@/components/customer/ReceivePaymentModal';
import { FiSearch, FiUsers, FiDollarSign, FiPhone, FiMail, FiCreditCard } from 'react-icons/fi';

const CustomerDueReceivePage: React.FC = () => {
  const { customers, receiveCustomerPayment } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const customersWithDues = useMemo(() => {
    return customers.filter(c => c.dueAmount && c.dueAmount > 0);
  }, [customers]);

  const filteredCustomersWithDues = useMemo(() => {
    if (!searchTerm) {
      return customersWithDues;
    }
    return customersWithDues.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customersWithDues, searchTerm]);

  const handleOpenModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleReceivePayment = (customerId: string, amountReceived: number, paymentMethod: string, notes?: string) => {
    receiveCustomerPayment(customerId, amountReceived, paymentMethod, notes);
    // Optionally: show a success message
  };
  
  const totalDueAmount = useMemo(() => {
    return filteredCustomersWithDues.reduce((sum, cust) => sum + (cust.dueAmount || 0), 0);
  }, [filteredCustomersWithDues]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiCreditCard className="mr-3 text-sky-600" /> Customer Due Receive
        </h1>
        <Input
          id="customer-due-search"
          type="text"
          placeholder="Search by name, phone, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-72 pl-10"
          containerClassName="mb-0"
          leftIcon={<FiSearch className="h-5 w-5" />}
        />
      </div>
      
       <Card>
        <div className="p-4 bg-gray-50 rounded-t-lg border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">
            Customers with Outstanding Dues ({filteredCustomersWithDues.length})
          </h3>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Outstanding (Filtered)</p>
            <p className="text-xl font-bold text-red-600">
                <FiDollarSign className="inline h-5 w-5 mr-0.5 relative -top-0.5" />
                {totalDueAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredCustomersWithDues.length === 0 ? (
            <div className="text-center py-10">
              <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {customersWithDues.length === 0 ? "No customers currently have outstanding dues." : "No customers match your search."}
              </p>
              {customersWithDues.length === 0 && <p className="text-sm text-green-600 mt-1">All dues are settled!</p>}
            </div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Due Amount</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomersWithDues.map(customer => (
                  <tr key={customer.id} className="hover:bg-sky-50 transition-all duration-200">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{customer.name}</td>
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
                    <td className="py-3 px-4 text-sm text-red-600 font-semibold text-right">${(customer.dueAmount || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <Button onClick={() => handleOpenModal(customer)} variant="primary" size="sm" leftIcon={<FiDollarSign />}>
                        Receive Payment
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title="Receive Customer Payment"
        size="md"
      >
        <ReceivePaymentModal
          customer={selectedCustomer}
          onClose={handleCloseModal}
          onReceivePayment={handleReceivePayment}
        />
      </Modal>
    </div>
  );
};

export default CustomerDueReceivePage;