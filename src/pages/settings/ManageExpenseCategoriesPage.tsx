

import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { ExpenseCategory } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import ExpenseCategoryForm from '@/components/settings/ExpenseCategoryForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiTag } from 'react-icons/fi';

const ManageExpenseCategoriesPage: React.FC = () => {
  const { expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this expense category? This might affect existing expense records.')) {
      deleteExpenseCategory(categoryId);
    }
  };
  
  const handleAddSubmit = (categoryData: Omit<ExpenseCategory, 'id'>) => {
    addExpenseCategory(categoryData);
    handleCloseModal();
  };

  const handleUpdateSubmit = (updatedCategory: ExpenseCategory) => {
    updateExpenseCategory(updatedCategory);
    handleCloseModal();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiTag className="mr-3 text-sky-600"/> Manage Expense Categories
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Category
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {expenseCategories.length === 0 ? (
          <div className="text-center py-10">
            <FiTag size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No expense categories defined.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Category" to start organizing your expenses.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseCategories.map(cat => (
                <tr key={cat.id} className="hover:bg-sky-50 transition-all duration-200">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{cat.name}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(cat)} variant="secondary" size="sm" aria-label="Edit Category">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(cat.id)} variant="danger" size="sm" aria-label="Delete Category">
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
        title={editingCategory ? "Edit Expense Category" : "Add New Expense Category"}
        size="md"
      >
        <ExpenseCategoryForm
          initialData={editingCategory}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManageExpenseCategoriesPage;