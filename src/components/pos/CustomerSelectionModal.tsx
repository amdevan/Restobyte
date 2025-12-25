import React, { useState, useMemo, useEffect } from 'react';
import { Customer } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { FiSearch, FiUserPlus, FiXCircle, FiCheckCircle, FiSmile } from 'react-icons/fi';

interface CustomerSelectionModalProps {
  isOpen: boolean; // This prop might be controlled by the parent Modal component
  onClose: () => void;
  onSelectCustomer: (customer: Customer | null) => void; // null for walk-in
  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id'>) => Customer;
  initialView?: 'select' | 'add'; // New prop
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen, // Though Modal controls overall visibility, this can be used for internal conditional rendering if needed.
  onClose,
  onSelectCustomer,
  customers: allCustomers,
  addCustomer,
  initialView = 'select', // Default to 'select'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(initialView === 'add');
  
  // Form state for new customer
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newVatPan, setNewVatPan] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDob, setNewDob] = useState('');


  useEffect(() => {
    setShowAddForm(initialView === 'add');
    if (initialView === 'add') {
        resetAddForm(); // Reset form if switching to add view
    }
    setSearchTerm(''); // Reset search term when initial view changes or modal opens
  }, [initialView, isOpen]); // React to isOpen to reset when modal re-opens

  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(
      c => c.id !== 'cust-walkin' && 
           (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.phone && c.phone.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [allCustomers, searchTerm]);

  const handleAddNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Customer Name and Phone are required.');
      return;
    }
    const newCustomerData: Omit<Customer, 'id'> = {
      name: newName,
      phone: newPhone,
      email: newEmail.trim() || undefined,
      companyName: newCompanyName.trim() || undefined,
      vatPan: newVatPan.trim() || undefined,
      address: newAddress.trim() || undefined,
      dob: newDob || undefined,
    };
    const createdCustomer = addCustomer(newCustomerData);
    onSelectCustomer(createdCustomer); // This will also call onClose from the parent (PosPage)
  };

  const resetAddForm = () => {
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewCompanyName('');
    setNewVatPan('');
    setNewAddress('');
    setNewDob('');
  };
  
  const handleSelectWalkIn = () => {
    onSelectCustomer(null); // This will also call onClose from the parent (PosPage)
  };

  // The main Modal component handles the overall visibility via its own isOpen prop.
  // This component's content will be rendered inside that Modal.

  return (
    <div className="p-0"> {/* Parent Modal provides padding */}
      {!showAddForm ? (
        <>
          <div className="mb-4 relative">
            <Input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
              id="customer-search-modal"
              containerClassName="mb-0"
              autoFocus
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto mb-4 custom-scrollbar pr-1">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer)}
                  className="flex justify-between items-center p-3 bg-gray-50 hover:bg-sky-100 rounded-md cursor-pointer border border-gray-200 hover:border-sky-300 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.phone} {customer.email && `- ${customer.email}`}</p>
                  </div>
                  {customer.dueAmount && customer.dueAmount > 0 && (
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-red-500 font-medium">Due</p>
                      <p className="font-semibold text-red-600">${customer.dueAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No matching customers found.</p>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2">
            <Button onClick={() => { setShowAddForm(true); resetAddForm(); }} variant="success" leftIcon={<FiUserPlus />}>
              Add New Customer
            </Button>
             <Button onClick={handleSelectWalkIn} variant="secondary" leftIcon={<FiSmile />} className="w-full sm:w-auto">
              Use Walk-in Customer
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={handleAddNewCustomer} className="space-y-4">
          <h4 className="text-md font-semibold text-gray-700 mb-1">Add New Customer Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Input label="Name *" value={newName} onChange={(e) => setNewName(e.target.value)} required id="new-cust-name" autoFocus/>
            <Input label="Company Name (Optional)" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} id="new-cust-company" />
            <Input label="Phone *" type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required id="new-cust-phone" />
            <Input label="VAT/PAN (Optional)" value={newVatPan} onChange={(e) => setNewVatPan(e.target.value)} id="new-cust-vatpan" />
            <Input label="Email (Optional)" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} id="new-cust-email" />
            <Input label="Date of Birth (Optional)" type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} id="new-cust-dob" max={new Date().toISOString().split("T")[0]}/>
          </div>
          <Input label="Address (Optional)" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} id="new-cust-address" />
          <div className="flex justify-end space-x-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)} leftIcon={<FiXCircle />}>
              Cancel Add
            </Button>
            <Button type="submit" variant="primary" leftIcon={<FiCheckCircle />}>
              Save & Select
            </Button>
          </div>
        </form>
      )}
       <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close Window</Button>
      </div>
    </div>
  );
};

export default CustomerSelectionModal;