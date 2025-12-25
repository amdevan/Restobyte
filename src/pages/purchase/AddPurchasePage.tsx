

import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { PurchaseItem as PurchaseItemType, Supplier } from '@/types';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiShoppingCart, FiDollarSign, FiBox } from 'react-icons/fi';

interface PurchaseLine {
  id: string; // Temporary client-side ID for the line
  itemName: string;
  itemCategory: string;
  itemUnit: string;
  itemLowStockThreshold: string;
  quantityPurchased: string;
  costPerUnit: string;
}

const UNITS = ["kg", "g", "ltr", "ml", "pcs", "pack", "dozen", "bottle", "can", "box", "unit"]; // Same as AddStockEntry

const AddPurchasePage: React.FC = () => {
  const { suppliers, addPurchase, findOrCreateStockItem, addSupplier: contextAddSupplier, getSingleActiveOutlet } = useRestaurantData();
  const navigate = ReactRouterDom.useNavigate();
  const outlet = getSingleActiveOutlet();

  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseNumber, setPurchaseNumber] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([
    { id: Date.now().toString(), itemName: '', itemCategory: '', itemUnit: UNITS[0], itemLowStockThreshold: '0', quantityPurchased: '', costPerUnit: '' }
  ]);

  const [taxAmount, setTaxAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');

  // For adding new supplier inline
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');


  const handleAddLine = () => {
    setPurchaseLines([...purchaseLines, { id: Date.now().toString(), itemName: '', itemCategory: '', itemUnit: UNITS[0], itemLowStockThreshold: '0', quantityPurchased: '', costPerUnit: '' }]);
  };

  const handleRemoveLine = (lineId: string) => {
    setPurchaseLines(purchaseLines.filter(line => line.id !== lineId));
  };

  const handleLineChange = (lineId: string, field: keyof PurchaseLine, value: string) => {
    setPurchaseLines(purchaseLines.map(line => line.id === lineId ? { ...line, [field]: value } : line));
  };

  const calculateSubTotal = (line: PurchaseLine): number => {
    const qty = parseFloat(line.quantityPurchased);
    const cost = parseFloat(line.costPerUnit);
    return (!isNaN(qty) && !isNaN(cost) && qty > 0 && cost >= 0) ? qty * cost : 0;
  };

  const overallSubTotal = useMemo(() => {
    return purchaseLines.reduce((sum, line) => sum + calculateSubTotal(line), 0);
  }, [purchaseLines]);

  const grandTotal = useMemo(() => {
    const tax = parseFloat(taxAmount) || 0;
    const discount = parseFloat(discountAmount) || 0;
    return overallSubTotal + tax - discount;
  }, [overallSubTotal, taxAmount, discountAmount]);

  const handleAddNewSupplier = () => {
    if (!newSupplierName.trim()) {
        alert("Please enter a name for the new supplier.");
        return;
    }
    const createdSupplier = contextAddSupplier({ name: newSupplierName.trim() });
    setSelectedSupplierId(createdSupplier.id);
    setShowAddSupplier(false);
    setNewSupplierName('');
  };

  const isSubmitDisabled = () => {
    if (purchaseLines.length === 0) return true;
    if (purchaseLines.length === 1) {
        const line = purchaseLines[0];
        return !line.itemName.trim() && 
               !line.itemCategory.trim() && 
               !line.quantityPurchased.trim() && 
               !line.costPerUnit.trim() &&
               line.itemLowStockThreshold.trim() === '0';
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!outlet) {
      alert('An active outlet must be selected to add a purchase.');
      return;
    }

    if (!purchaseNumber.trim()) {
        alert("Purchase Order Number is required.");
        return;
    }
    
    const processedPurchaseItems: PurchaseItemType[] = [];
    for (const line of purchaseLines) {
      if (!line.itemName.trim() || !line.itemCategory.trim() || !line.itemUnit || !line.quantityPurchased.trim() || !line.costPerUnit.trim() || !line.itemLowStockThreshold.trim()) {
        alert('Please fill in Item Name, Category, Unit, Low Stock Threshold, Quantity, and Cost for all lines.');
        return;
      }
      const quantity = parseFloat(line.quantityPurchased);
      const cost = parseFloat(line.costPerUnit);
      const lowStockThreshold = parseFloat(line.itemLowStockThreshold);

      if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid positive quantity for all lines.');
        return;
      }
      if (isNaN(cost) || cost < 0) {
        alert('Please enter a valid non-negative cost for all lines.');
        return;
      }
       if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
        alert('Please enter a valid non-negative low stock threshold for all lines.');
        return;
      }
      
      processedPurchaseItems.push({
        id: line.id, // This temporary ID is fine for the Purchase object, stockItemId will be the real link
        itemName: line.itemName.trim(),
        category: line.itemCategory.trim(),
        unit: line.itemUnit,
        lowStockThreshold: lowStockThreshold,
        quantityPurchased: quantity,
        costPerUnit: cost,
        subTotal: quantity * cost,
      });
    }

    if (processedPurchaseItems.length === 0) {
      alert('Please add at least one item to the purchase order.');
      return;
    }
    
    const selectedSupplierDetails = suppliers.find(s => s.id === selectedSupplierId);

    addPurchase({
      purchaseNumber,
      supplierId: selectedSupplierId || undefined,
      supplierName: selectedSupplierDetails?.name || undefined,
      supplierInvoiceNumber: supplierInvoiceNumber.trim() || undefined,
      items: processedPurchaseItems,
      subTotalAmount: overallSubTotal,
      taxAmount: parseFloat(taxAmount) || undefined,
      discountAmount: parseFloat(discountAmount) || undefined,
      grandTotalAmount: grandTotal,
      notes: notes.trim() || undefined,
      outletId: outlet.id,
    });

    alert('Purchase order added successfully! Stock levels will be updated.');
    // Reset form
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseNumber(`PO-${Date.now().toString().slice(-6)}`);
    setSelectedSupplierId('');
    setSupplierInvoiceNumber('');
    setNotes('');
    setPurchaseLines([{ id: Date.now().toString(), itemName: '', itemCategory: '', itemUnit: UNITS[0], itemLowStockThreshold: '0', quantityPurchased: '', costPerUnit: '' }]);
    setTaxAmount('');
    setDiscountAmount('');
    navigate('/purchase'); // Navigate to purchase list page
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <div className="p-5">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <FiShoppingCart className="mr-3 text-sky-600" /> Add New Purchase Order
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input
                label="PO Date *"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
              <Input
                label="PO Number *"
                value={purchaseNumber}
                onChange={(e) => setPurchaseNumber(e.target.value)}
                placeholder="e.g., PO-2024-00123"
                required
              />
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier (Optional)
                </label>
                <div className="flex items-center space-x-2">
                    <select
                    id="supplier"
                    value={selectedSupplierId}
                    onChange={(e) => { setSelectedSupplierId(e.target.value); setShowAddSupplier(false); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px] flex-grow"
                    >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                    </select>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddSupplier(s => !s)} className="p-2.5 h-[42px]">
                        <FiPlus/>
                    </Button>
                </div>
                {showAddSupplier && (
                    <div className="mt-2 p-3 border rounded-md bg-gray-50">
                        <Input 
                            label="New Supplier Name" 
                            value={newSupplierName} 
                            onChange={e => setNewSupplierName(e.target.value)}
                            containerClassName="mb-2"
                        />
                        <Button type="button" size="sm" onClick={handleAddNewSupplier}>Add This Supplier</Button>
                    </div>
                )}
              </div>
               <Input
                label="Supplier Invoice No. (Optional)"
                value={supplierInvoiceNumber}
                onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                placeholder="e.g., INV-SUP-001"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Purchase Items</h3>
              {purchaseLines.map((line) => (
                <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end p-3 border rounded-md bg-gray-50/50">
                  <div className="md:col-span-3">
                    <Input
                        label="Item Name *"
                        value={line.itemName}
                        onChange={(e) => handleLineChange(line.id, 'itemName', e.target.value)}
                        placeholder="e.g., Flour, Tomatoes"
                        containerClassName="mb-0"
                        required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                        label="Category *"
                        value={line.itemCategory}
                        onChange={(e) => handleLineChange(line.id, 'itemCategory', e.target.value)}
                        placeholder="e.g., Baking, Vegetables"
                        containerClassName="mb-0"
                        required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor={`unit-${line.id}`} className="block text-xs font-medium text-gray-600 mb-0.5">Unit *</label>
                    <select
                      id={`unit-${line.id}`}
                      value={line.itemUnit}
                      onChange={(e) => handleLineChange(line.id, 'itemUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
                      required
                    >
                      {UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                     <Input
                        label="Low Stock Th. *"
                        type="number"
                        value={line.itemLowStockThreshold}
                        min="0"
                        step="1"
                        onChange={(e) => handleLineChange(line.id, 'itemLowStockThreshold', e.target.value)}
                        placeholder="e.g., 5"
                        containerClassName="mb-0"
                        required
                    />
                  </div>
                  <div className="md:col-span-1">
                     <Input
                        label="Qty Purch. *"
                        type="number"
                        value={line.quantityPurchased}
                        min="0.01"
                        step="0.01"
                        onChange={(e) => handleLineChange(line.id, 'quantityPurchased', e.target.value)}
                        placeholder="e.g., 10"
                        containerClassName="mb-0"
                        required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                        label="Cost/Unit *"
                        type="number"
                        value={line.costPerUnit}
                        min="0"
                        step="0.01"
                        onChange={(e) => handleLineChange(line.id, 'costPerUnit', e.target.value)}
                        placeholder="e.g., 2.50"
                        containerClassName="mb-0"
                        required
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center justify-end pt-3 md:pt-0">
                    {purchaseLines.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-2"
                        aria-label="Remove item line"
                      >
                        <FiTrash2 size={16} />
                      </Button>
                    )}
                  </div>
                  <div className="md:col-span-12 text-right text-sm font-medium pr-10 md:pr-14">
                    Subtotal: ${calculateSubTotal(line).toFixed(2)}
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={handleAddLine} leftIcon={<FiPlus />}>
                Add Item Line
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <Input
                    label="Tax Amount (Optional)"
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    placeholder="e.g., 15.50"
                    min="0"
                    step="0.01"
                    leftIcon={<FiDollarSign />}
                />
                <Input
                    label="Discount Amount (Optional)"
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="e.g., 5.00"
                    min="0"
                    step="0.01"
                    leftIcon={<FiDollarSign />}
                />
                 <div className="text-right p-3 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-600">Subtotal: ${overallSubTotal.toFixed(2)}</p>
                    <p className="text-lg font-semibold text-sky-700">Grand Total: ${grandTotal.toFixed(2)}</p>
                </div>
            </div>
            
            <div>
              <label htmlFor="purchaseNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="purchaseNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Any additional notes for this purchase order..."
              />
            </div>

            <div className="flex items-center justify-start space-x-3 pt-4 border-t mt-6">
              <Button type="submit" variant="primary" leftIcon={<FiSave size={18}/>} disabled={isSubmitDisabled()}>
                Save Purchase Order
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/purchase')} leftIcon={<FiArrowLeft size={18}/>}>
                Cancel & Back to List
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AddPurchasePage;