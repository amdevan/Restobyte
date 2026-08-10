
import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { PurchaseItem as PurchaseItemType, Supplier } from '@/types';
import Money from '@/components/common/Money';
import { FiPlus, FiTrash2, FiArrowLeft, FiShoppingCart, FiSearch, FiTruck, FiPackage, FiFileText, FiCheckCircle } from 'react-icons/fi';

interface PurchaseLine {
  id: string;
  itemName: string;
  itemCategory: string;
  itemUnit: string;
  itemLowStockThreshold: string;
  quantityPurchased: string;
  costPerUnit: string;
}

const UNITS = ["kg", "g", "ltr", "ml", "pcs", "pack", "dozen", "bottle", "can", "box", "unit"];

const AddPurchasePage: React.FC = () => {
  const { suppliers, addPurchase, addSupplier: contextAddSupplier, getSingleActiveOutlet } = useRestaurantData();
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Supplier search dropdown
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(target)) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const lower = supplierSearch.toLowerCase();
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(lower)) ||
      (s.phone && s.phone.includes(lower))
    );
  }, [suppliers, supplierSearch]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  const handleAddLine = () => {
    setPurchaseLines([...purchaseLines, { id: Date.now().toString(), itemName: '', itemCategory: '', itemUnit: UNITS[0], itemLowStockThreshold: '0', quantityPurchased: '', costPerUnit: '' }]);
  };

  const handleRemoveLine = (lineId: string) => {
    if (purchaseLines.length <= 1) return;
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

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplierId(supplier.id);
    setSupplierSearch('');
    setShowSupplierDropdown(false);
  };

  const handleAddNewSupplier = async () => {
    const name = supplierSearch.trim();
    if (!name) return;
    const createdSupplier = await contextAddSupplier({ name });
    setSelectedSupplierId(createdSupplier.id);
    setSupplierSearch('');
    setShowSupplierDropdown(false);
  };

  const totalLineCost = (line: PurchaseLine) => {
    const qty = parseFloat(line.quantityPurchased) || 0;
    const cost = parseFloat(line.costPerUnit) || 0;
    return (qty * cost).toFixed(2);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!purchaseNumber.trim()) newErrors.purchaseNumber = 'PO Number is required';

    purchaseLines.forEach((line) => {
      if (!line.itemName.trim()) newErrors[`itemName_${line.id}`] = 'Item name required';
      if (!line.quantityPurchased || parseFloat(line.quantityPurchased) <= 0) newErrors[`qty_${line.id}`] = 'Qty required';
      if (!line.costPerUnit || parseFloat(line.costPerUnit) < 0) newErrors[`cost_${line.id}`] = 'Cost required';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!outlet) {
      alert('An active outlet must be selected to add a purchase.');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const processedPurchaseItems: PurchaseItemType[] = [];
      for (const line of purchaseLines) {
        const quantity = parseFloat(line.quantityPurchased);
        const cost = parseFloat(line.costPerUnit);
        const lowStockThreshold = parseFloat(line.itemLowStockThreshold) || 0;

        processedPurchaseItems.push({
          id: line.id,
          itemName: line.itemName.trim(),
          category: line.itemCategory.trim() || 'Uncategorized',
          unit: line.itemUnit,
          lowStockThreshold,
          quantityPurchased: quantity,
          costPerUnit: cost,
          subTotal: quantity * cost,
        });
      }

      const selectedSupplierDetails = suppliers.find(s => s.id === selectedSupplierId);

      await addPurchase({
        date: purchaseDate,
        purchaseNumber: purchaseNumber.trim(),
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

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/app/purchase');
      }, 1500);
    } catch (error) {
      console.error('Error submitting purchase:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-200">
              <FiShoppingCart className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add Purchase Order</h1>
              <p className="text-sm text-gray-500">Record new stock purchases and deliveries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 animate-slide-in">
            <FiCheckCircle className="text-green-600 w-5 h-5" />
            <span className="text-green-800 font-medium">Purchase order saved successfully!</span>
          </div>
        )}

        {/* Entry Details Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FiTruck className="w-3.5 h-3.5" />
              Order Details
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Supplier - Searchable Combobox */}
              <div className="relative" ref={supplierDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Supplier <span className="text-xs text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={showSupplierDropdown ? supplierSearch : (selectedSupplier?.name || '')}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                      if (!e.target.value) {
                        setSelectedSupplierId('');
                      }
                    }}
                    onFocus={() => {
                      setShowSupplierDropdown(true);
                      setSupplierSearch('');
                    }}
                    placeholder="Search or add supplier..."
                    className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                  />
                  {selectedSupplier && !showSupplierDropdown && (
                    <button
                      onClick={() => {
                        setSelectedSupplierId('');
                        setShowSupplierDropdown(true);
                        setSupplierSearch('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {showSupplierDropdown && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map(supplier => (
                        <div
                          key={supplier.id}
                          className={`px-3 py-2.5 cursor-pointer hover:bg-sky-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors ${
                            supplier.id === selectedSupplierId ? 'bg-sky-50' : ''
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectSupplier(supplier);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <FiTruck className="w-4 h-4 text-sky-600" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">{supplier.name}</span>
                              {supplier.contactPerson && (
                                <span className="text-xs text-gray-500 ml-1">({supplier.contactPerson})</span>
                              )}
                            </div>
                          </div>
                          {supplier.phone && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {supplier.phone}
                            </span>
                          )}
                        </div>
                      ))
                    ) : null}
                    {supplierSearch.trim() && !suppliers.find(s => s.name.toLowerCase() === supplierSearch.trim().toLowerCase()) && (
                      <div
                        className="px-3 py-2.5 cursor-pointer hover:bg-sky-50 text-sm font-medium text-sky-600 flex items-center gap-1.5 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddNewSupplier();
                        }}
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        Add "{supplierSearch.trim()}" as new supplier
                      </div>
                    )}
                    {filteredSuppliers.length === 0 && !supplierSearch.trim() && (
                      <div className="px-3 py-4 text-sm text-gray-400 text-center italic">
                        No suppliers yet. Type a name to add one.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  PO Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white ${
                    errors.purchaseDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
              </div>

              {/* PO Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  PO Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={purchaseNumber}
                  onChange={(e) => setPurchaseNumber(e.target.value)}
                  placeholder="e.g., PO-2024-00123"
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white ${
                    errors.purchaseNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.purchaseNumber && <p className="text-red-500 text-xs mt-1">{errors.purchaseNumber}</p>}
              </div>

              {/* Supplier Invoice No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Number</label>
                <input
                  type="text"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV-SUP-001"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this purchase order"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FiPackage className="w-3.5 h-3.5" />
              Purchase Items
              {purchaseLines.length > 0 && (
                <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                  {purchaseLines.length}
                </span>
              )}
            </h2>
            {parseFloat(grandTotal.toFixed(2)) > 0 && (
              <span className="text-sm font-semibold text-gray-900">
                Grand Total: <span className="text-sky-600"><Money amount={grandTotal} /></span>
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {purchaseLines.map((line, index) => (
              <div key={line.id} className="p-3 sm:p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2">
                  {/* Line Number */}
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* Item Name */}
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={line.itemName}
                        onChange={(e) => handleLineChange(line.id, 'itemName', e.target.value)}
                        placeholder="Item name"
                        className={`w-full pl-8 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white ${
                          errors[`itemName_${line.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors[`itemName_${line.id}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`itemName_${line.id}`]}</p>}
                  </div>

                  {/* Category */}
                  <div className="w-32 flex-shrink-0 hidden sm:block">
                    <input
                      type="text"
                      value={line.itemCategory}
                      onChange={(e) => handleLineChange(line.id, 'itemCategory', e.target.value)}
                      placeholder="Category"
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-20 flex-shrink-0">
                    <input
                      type="number"
                      value={line.quantityPurchased}
                      onChange={(e) => handleLineChange(line.id, 'quantityPurchased', e.target.value)}
                      placeholder="Qty"
                      min="0.01"
                      step="0.01"
                      className={`w-full px-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white ${
                        errors[`qty_${line.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  {/* Cost Per Unit */}
                  <div className="w-24 flex-shrink-0">
                    <input
                      type="number"
                      value={line.costPerUnit}
                      onChange={(e) => handleLineChange(line.id, 'costPerUnit', e.target.value)}
                      placeholder="Cost"
                      min="0"
                      step="0.01"
                      className={`w-full px-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white ${
                        errors[`cost_${line.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  {/* Unit */}
                  <div className="w-16 flex-shrink-0">
                    <select
                      value={line.itemUnit}
                      onChange={(e) => handleLineChange(line.id, 'itemUnit', e.target.value)}
                      className="w-full px-1 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                    >
                      {UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  {/* Low Stock Threshold */}
                  <div className="w-16 flex-shrink-0 hidden sm:block">
                    <input
                      type="number"
                      value={line.itemLowStockThreshold}
                      onChange={(e) => handleLineChange(line.id, 'itemLowStockThreshold', e.target.value)}
                      placeholder="Min"
                      min="0"
                      step="1"
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                    />
                  </div>

                  {/* Line Total */}
                  <div className="w-24 flex-shrink-0 text-right hidden sm:block">
                    {parseFloat(totalLineCost(line)) > 0 ? (
                      <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200 whitespace-nowrap">
                        <Money amount={parseFloat(totalLineCost(line))} />
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Remove Button */}
                  {purchaseLines.length > 1 && (
                    <button
                      onClick={() => handleRemoveLine(line.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove item"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Mobile-only: Category & Total row */}
                <div className="flex items-center gap-2 mt-2 sm:hidden">
                  <input
                    type="text"
                    value={line.itemCategory}
                    onChange={(e) => handleLineChange(line.id, 'itemCategory', e.target.value)}
                    placeholder="Category"
                    className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                  />
                  {parseFloat(totalLineCost(line)) > 0 && (
                    <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200 whitespace-nowrap">
                      <Money amount={parseFloat(totalLineCost(line))} />
                    </span>
                  )}
                </div>

                {/* Mobile: Low Stock Threshold */}
                <div className="flex items-center gap-2 mt-2 sm:hidden">
                  <label className="text-xs text-gray-500 whitespace-nowrap">Min Stock:</label>
                  <input
                    type="number"
                    value={line.itemLowStockThreshold}
                    onChange={(e) => handleLineChange(line.id, 'itemLowStockThreshold', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
            <button
              onClick={handleAddLine}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add Item Line
            </button>
          </div>
        </div>

        {/* Tax, Discount & Totals */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FiFileText className="w-3.5 h-3.5" />
              Totals
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Amount (Optional)</label>
                <input
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  placeholder="e.g., 15.50"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Amount (Optional)</label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="e.g., 5.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                />
              </div>
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                <p className="text-sm text-gray-600">Subtotal: <Money amount={overallSubTotal} /></p>
                <p className="text-lg font-bold text-sky-700">Grand Total: <Money amount={grandTotal} /></p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-8">
          <button
            onClick={() => navigate('/app/purchase')}
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || purchaseLines.length === 0}
            className="flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-600 rounded-xl hover:from-sky-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-200 transition-all"
          >
            <FiCheckCircle className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : `Save Purchase (${purchaseLines.length} item${purchaseLines.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPurchasePage;
