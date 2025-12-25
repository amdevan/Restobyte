
import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Currency } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import CurrencyForm from '@/components/settings/CurrencyForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiStar, FiDollarSign } from 'react-icons/fi';

const ManageCurrenciesPage: React.FC = () => {
  const { currencies, addCurrency, updateCurrency, deleteCurrency, setDefaultCurrency } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingCurrency(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCurrency(null);
  };

  const handleDelete = (currencyId: string) => {
    const currencyToDelete = currencies.find(c => c.id === currencyId);
    if (currencyToDelete?.isDefault) {
      alert("Cannot delete the default currency. Please set another currency as default first.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${currencyToDelete?.name || 'this currency'}?`)) {
      deleteCurrency(currencyId);
    }
  };
  
  const handleAddSubmit = (currencyData: Omit<Currency, 'id' | 'isDefault'>) => {
    addCurrency(currencyData);
    handleCloseModal();
  };

  const handleUpdateSubmit = (updatedCurrencyData: Currency) => {
    // The isDefault flag is not directly changed by the form.
    // updateCurrency will take the existingCurrency's isDefault status unless explicitly changed by setDefaultCurrency.
    updateCurrency(updatedCurrencyData);
    handleCloseModal();
  };

  const handleSetDefault = (currencyId: string) => {
    if (window.confirm("Are you sure you want to set this currency as default? This will adjust its exchange rate to 1.")) {
        setDefaultCurrency(currencyId);
    }
  };
  
  const defaultCurrencyInfo = currencies.find(c => c.isDefault);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiDollarSign className="mr-3 text-sky-600"/> Manage Multiple Currencies
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Currency
        </Button>
      </div>

       {defaultCurrencyInfo && (
        <Card className="bg-sky-50 border-sky-200 border">
            <p className="text-sm text-sky-700">
                Default Currency: <strong>{defaultCurrencyInfo.name} ({defaultCurrencyInfo.code}) - {defaultCurrencyInfo.symbol}</strong>.
                All other currency exchange rates are relative to this default.
            </p>
        </Card>
      )}

      <Card className="overflow-x-auto">
        {currencies.length === 0 ? (
          <div className="text-center py-10">
            <FiDollarSign size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No currencies configured.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Currency" to get started. USD is usually added by default.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Code</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Symbol</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Exchange Rate</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Default</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currencies.map(c => (
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.isDefault ? 'bg-sky-50 font-medium' : ''}`}>
                  <td className="py-3 px-4 text-sm text-gray-800">{c.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{c.code}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-center">{c.symbol}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{c.exchangeRate.toFixed(4)}</td>
                  <td className="py-3 px-4 text-sm text-center">
                    {c.isDefault ? (
                      <FiStar className="text-amber-500 inline-block" title="Default Currency"/>
                    ) : (
                      <Button onClick={() => handleSetDefault(c.id)} variant="outline" size="sm" className="p-1.5" title="Set as Default">
                        <FiStar className="text-gray-400 hover:text-amber-500"/>
                      </Button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(c)} variant="secondary" size="sm" aria-label="Edit Currency">
                        <FiEdit />
                      </Button>
                      {!c.isDefault && (
                        <Button onClick={() => handleDelete(c.id)} variant="danger" size="sm" aria-label="Delete Currency">
                          <FiTrash2 />
                        </Button>
                      )}
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
        title={editingCurrency ? "Edit Currency" : "Add New Currency"}
        size="md"
      >
        <CurrencyForm
          initialData={editingCurrency}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
          isEditingDefault={!!editingCurrency?.isDefault}
        />
      </Modal>
    </div>
  );
};

export default ManageCurrenciesPage;
