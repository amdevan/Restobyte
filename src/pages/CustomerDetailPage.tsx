import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiDollarSign, FiCreditCard, FiEdit } from 'react-icons/fi';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Money from '@/components/common/Money';
import Modal from '@/components/common/Modal';
import CustomerForm from '@/components/customer/CustomerForm';

const CustomerDetailPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customers, sales, updateCustomer, receiveCustomerPayment, customerPayments } = useRestaurantData();

  const customer = useMemo(() => 
    customers.find(c => c.id === customerId), 
    [customers, customerId]
  );

  const customerOrders = useMemo(() => 
    sales.filter(sale => sale.customerId === customerId)
         .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()), 
    [sales, customerId]
  );

  const customerPaymentHistory = useMemo(() => 
    customerPayments.filter(payment => payment.customerId === customerId)
                   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [customerPayments, customerId]
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  if (!customer) {
    return (
      <div className="p-4 sm:p-6">
        <Button onClick={() => navigate('/app/customer')} variant="secondary" leftIcon={<FiArrowLeft />}>
          Back to Customers
        </Button>
        <div className="text-center py-10 mt-6">
          <p className="text-gray-600 text-lg">Customer not found.</p>
        </div>
      </div>
    );
  }

  const handlePaymentSubmit = () => {
    if (paymentAmount && parseFloat(paymentAmount) > 0) {
      receiveCustomerPayment(customer.id, parseFloat(paymentAmount), paymentMethod, paymentNotes);
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
    }
  };

  const totalSpent = customerOrders.reduce((sum, sale) => sum + sale.totalAmount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/app/customer')} variant="secondary" leftIcon={<FiArrowLeft />}>
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiUser className="mr-2" />
            {customer.name}
          </h1>
        </div>
        <Button onClick={() => setIsEditModalOpen(true)} variant="primary" leftIcon={<FiEdit />}>
          Edit Customer
        </Button>
      </div>

      {/* Customer Details Card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">Phone</p>
            <p className="text-gray-800 flex items-center gap-2">
              <FiPhone className="text-sky-600" />
              {customer.phone}
            </p>
          </div>
          {customer.email && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">Email</p>
              <p className="text-gray-800 flex items-center gap-2">
                <FiMail className="text-sky-600" />
                {customer.email}
              </p>
            </div>
          )}
          {customer.companyName && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">Company</p>
              <p className="text-gray-800 flex items-center gap-2">
                <FiMapPin className="text-sky-600" />
                {customer.companyName}
              </p>
            </div>
          )}
          {customer.address && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">Address</p>
              <p className="text-gray-800 flex items-center gap-2">
                <FiMapPin className="text-sky-600" />
                {customer.address}
              </p>
            </div>
          )}
          {customer.vatPan && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">VAT/PAN</p>
              <p className="text-gray-800">{customer.vatPan}</p>
            </div>
          )}
          {customer.dob && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">Date of Birth</p>
              <p className="text-gray-800 flex items-center gap-2">
                <FiCalendar className="text-sky-600" />
                {new Date(customer.dob).toLocaleDateString()}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">Outstanding Due</p>
            <p className={`text-xl font-bold ${customer.dueAmount && customer.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <Money amount={customer.dueAmount || 0} />
            </p>
            {customer.dueAmount && customer.dueAmount > 0 && (
              <Button onClick={() => setIsPaymentModalOpen(true)} variant="primary" size="sm" leftIcon={<FiCreditCard />}>
                Record Payment
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">Total Spent</p>
            <p className="text-xl font-bold text-sky-600 flex items-center gap-2">
              <FiDollarSign />
              <Money amount={totalSpent} />
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <p className="text-xl font-bold text-gray-800">{customerOrders.length}</p>
          </div>
        </div>
      </Card>

      {/* Order History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Order History</h3>
        </div>
        <div className="overflow-x-auto">
          {customerOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No orders yet.</p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order ID</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Method</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerOrders.map(order => (
                  <tr key={order.id} className="hover:bg-sky-50 transition-all duration-200">
                    <td className="py-3 px-4 text-sm text-gray-800">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(order.saleDate).toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{order.orderType}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{order.paymentMethod || '-'}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800 text-right"><Money amount={order.totalAmount} /></td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.isSettled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.isSettled ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Payment History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          {customerPaymentHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No payments recorded yet.</p>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment ID</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Method</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Notes</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerPaymentHistory.map(payment => (
                  <tr key={payment.id} className="hover:bg-sky-50 transition-all duration-200">
                    <td className="py-3 px-4 text-sm text-gray-800">#{payment.id.slice(-6).toUpperCase()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(payment.date).toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{payment.paymentMethod}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{payment.notes || '-'}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800 text-right"><Money amount={payment.amount} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer"
        size="lg"
      >
        <CustomerForm
          initialData={customer}
          onUpdate={updateCustomer}
          onClose={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        size="md"
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Enter payment amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Online">Online</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Enter any additional notes..."
              rows={3}
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => setIsPaymentModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} variant="primary">
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetailPage;