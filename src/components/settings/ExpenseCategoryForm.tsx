
import React, { useState, useEffect, ChangeEvent } from 'react';
import { ExpenseCategory } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiTag } from 'react-icons/fi';

interface ExpenseCategoryFormProps {
  initialData?: ExpenseCategory | null;
  onSubmit: (data: Omit<ExpenseCategory, 'id'>) => void;
  onUpdate: (data: ExpenseCategory) => void;
  onClose: () => void;
}

const ExpenseCategoryForm: React.FC<ExpenseCategoryFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
    } else {
      setName('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Category Name is required.');
      return;
    }
    const categoryData = { name };
    if (initialData) {
      onUpdate({ ...initialData, ...categoryData });
    } else {
      onSubmit(categoryData);
    }
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Category Name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="e.g., Rent, Utilities, Marketing"
        required
        autoFocus
        leftIcon={<FiTag />}
      />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>
          {initialData ? 'Update Category' : 'Save Category'}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseCategoryForm;
