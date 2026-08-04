
import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { PaymentMethod } from '@/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FiCreditCard, FiSave, FiCheckCircle, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

const PROTECTED_METHODS = ['Cash', 'Due'];

const ListPaymentMethodPage: React.FC = () => {
    const { paymentMethods, updatePaymentMethod, addPaymentMethod, removePaymentMethod } = useRestaurantData();
    const [localMethods, setLocalMethods] = useState<PaymentMethod[]>(paymentMethods);
    const [showSavedMessage, setShowSavedMessage] = useState(false);
    const [newMethodName, setNewMethodName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        setLocalMethods(paymentMethods);
    }, [paymentMethods]);

    const handleToggle = (id: string) => {
        setLocalMethods(prev => prev.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m));
    };

    const handleAdd = () => {
        const name = newMethodName.trim();
        if (!name) return;
        if (localMethods.some(m => m.name.toLowerCase() === name.toLowerCase())) {
            alert('A payment method with this name already exists.');
            return;
        }
        const newMethod = addPaymentMethod(name);
        setLocalMethods(prev => [...prev, newMethod]);
        setNewMethodName('');
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Are you sure you want to delete this payment method?')) return;
        removePaymentMethod(id);
        setLocalMethods(prev => prev.filter(m => m.id !== id));
    };

    const handleStartRename = (method: PaymentMethod) => {
        setEditingId(method.id);
        setEditingName(method.name);
    };

    const handleSaveRename = () => {
        if (!editingId) return;
        const name = editingName.trim();
        if (!name) return;
        if (localMethods.some(m => m.id !== editingId && m.name.toLowerCase() === name.toLowerCase())) {
            alert('A payment method with this name already exists.');
            return;
        }
        setLocalMethods(prev => prev.map(m => m.id === editingId ? { ...m, name } : m));
        setEditingId(null);
        setEditingName('');
    };

    const handleCancelRename = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSave = () => {
        localMethods.forEach(method => {
            const originalMethod = paymentMethods.find(m => m.id === method.id);
            if (JSON.stringify(method) !== JSON.stringify(originalMethod)) {
                updatePaymentMethod(method);
            }
        });
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2000);
    };

    const isDirty = JSON.stringify(localMethods) !== JSON.stringify(paymentMethods);

    return (
        <div className="p-6">
            <Card>
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center"><FiCreditCard className="mr-3 text-sky-600"/>Payment Methods</h2>
                        <div className="flex items-center space-x-3 h-10">
                            {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                            <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>Save Changes</Button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Add, edit, enable or disable payment methods available throughout the application (e.g., POS, Expense recording).</p>
                    
                    {/* Add New Payment Method */}
                    <div className="flex items-center space-x-3 mb-6 border-t pt-6">
                        <Input
                            value={newMethodName}
                            onChange={(e) => setNewMethodName(e.target.value)}
                            placeholder="New payment method name..."
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd} leftIcon={<FiPlus />} disabled={!newMethodName.trim()}>Add</Button>
                    </div>

                    {/* Payment Methods List */}
                    <div className="space-y-3">
                        {localMethods.map(method => (
                            <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                {editingId === method.id ? (
                                    <div className="flex items-center space-x-2 flex-1">
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') handleCancelRename(); }}
                                            className="flex-1 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            autoFocus
                                        />
                                        <Button size="sm" variant="primary" onClick={handleSaveRename}>Save</Button>
                                        <Button size="sm" variant="outline" onClick={handleCancelRename}>Cancel</Button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium text-gray-700">{method.name}</span>
                                        <div className="flex items-center space-x-3">
                                            {!PROTECTED_METHODS.includes(method.name) && (
                                                <button
                                                    onClick={() => handleStartRename(method)}
                                                    className="text-gray-400 hover:text-sky-600 transition-colors"
                                                    title="Rename"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleToggle(method.id)}
                                                role="switch"
                                                aria-checked={method.isEnabled}
                                                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${method.isEnabled ? 'bg-sky-600' : 'bg-gray-300'}`}
                                            >
                                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${method.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                            {!PROTECTED_METHODS.includes(method.name) && (
                                                <button
                                                    onClick={() => handleDelete(method.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ListPaymentMethodPage;
