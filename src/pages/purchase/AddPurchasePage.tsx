
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { PurchaseItem as PurchaseItemType, Supplier, StockItem } from '@/types';
import Money from '@/components/common/Money';
import { FiPlus, FiTrash2, FiArrowLeft, FiShoppingCart, FiSearch, FiTruck, FiPackage, FiFileText, FiCheckCircle } from 'react-icons/fi';

interface PurchaseLine {
  id: string;
  itemName: string;
  showDropdown: string;
  showCatDropdown: string;
  stockItemId?: string;
  itemCategory: string;
  itemUnit: string;
  itemLowStockThreshold: string;
  quantityPurchased: string;
  costPerUnit: string;
}

const UNITS = ["kg", "g", "ltr", "ml", "pcs", "pack", "dozen", "bottle", "can", "box", "unit"];

const blankLine = (): PurchaseLine => ({
  id: Date.now().toString() + Math.random(),
  itemName: '',
  showDropdown: '',
  showCatDropdown: '',
  itemCategory: '',
  itemUnit: UNITS[0],
  itemLowStockThreshold: '0',
  quantityPurchased: '',
  costPerUnit: '',
});

const AddPurchasePage: React.FC = () => {
  const { stockItems, suppliers, paymentMethods, addPurchase, addSupplier: contextAddSupplier, getSingleActiveOutlet } = useRestaurantData();
  const navigate = ReactRouterDom.useNavigate();
  const outlet = getSingleActiveOutlet();

  const paymentMethodOptions = useMemo(() => paymentMethods.filter(pm => pm.isEnabled).map(pm => pm.name), [paymentMethods]);

  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseNumber, setPurchaseNumber] = useState(`PO-${Date.now().toString().slice(-4)}`);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethodOptions[0] || 'Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Partial'>('Pending');
  const [paidAmount, setPaidAmount] = useState<string>('');

  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([blankLine()]);

  // Tax: percent or flat
  const [taxType, setTaxType] = useState<'percent' | 'flat'>('flat');
  const [taxValue, setTaxValue] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Supplier search dropdown
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Item & category dropdown refs
  const itemDropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const catDropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(target)) {
        setShowSupplierDropdown(false);
      }
      itemDropdownRefs.current.forEach((ref, id) => {
        if (ref && !ref.contains(target)) {
          setPurchaseLines(prev => prev.map(l => l.id === id ? { ...l, showDropdown: '' } : l));
        }
      });
      catDropdownRefs.current.forEach((ref, id) => {
        if (ref && !ref.contains(target)) {
          setPurchaseLines(prev => prev.map(l => l.id === id ? { ...l, showCatDropdown: '' } : l));
        }
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const existingCategories = useMemo(() => {
    return [...new Set(stockItems.map(s => s.category).filter(Boolean))];
  }, [stockItems]);

  const filteredStockItems = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return stockItems;
    const lower = searchTerm.toLowerCase();
    return stockItems.filter(item =>
      item.name.toLowerCase().includes(lower) ||
      (item.category && item.category.toLowerCase().includes(lower))
    );
  }, [stockItems]);

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

  const handleLineChange = (lineId: string, field: keyof PurchaseLine, value: string) => {
    setPurchaseLines(prev => prev.map(line => line.id === lineId ? { ...line, [field]: value } : line));
  };

  const selectStockItem = (lineId: string, stockItem: StockItem) => {
    setPurchaseLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      return {
        ...l,
        itemName: stockItem.name,
        stockItemId: stockItem.id,
        itemCategory: stockItem.category,
        itemUnit: stockItem.unit,
        itemLowStockThreshold: stockItem.lowStockThreshold?.toString() || '0',
        showDropdown: '',
      };
    }));
  };

  const handleAddLine = () => {
    setPurchaseLines([...purchaseLines, blankLine()]);
  };

  const handleRemoveLine = (lineId: string) => {
    if (purchaseLines.length <= 1) return;
    setPurchaseLines(purchaseLines.filter(line => line.id !== lineId));
  };

  const calculateSubTotal = (line: PurchaseLine): number => {
    const qty = parseFloat(line.quantityPurchased);
    const cost = parseFloat(line.costPerUnit);
    return (!isNaN(qty) && !isNaN(cost) && qty > 0 && cost >= 0) ? qty * cost : 0;
  };

  const overallSubTotal = useMemo(() => {
    return purchaseLines.reduce((sum, line) => sum + calculateSubTotal(line), 0);
  }, [purchaseLines]);

  const taxAmount = useMemo(() => {
    const val = parseFloat(taxValue) || 0;
    if (taxType === 'percent') {
      return (overallSubTotal * val) / 100;
    }
    return val;
  }, [overallSubTotal, taxValue, taxType]);

  const grandTotal = useMemo(() => {
    const discount = parseFloat(discountAmount) || 0;
    return overallSubTotal + taxAmount - discount;
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
          stockItemId: line.stockItemId,
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
        taxAmount: taxAmount || undefined,
        discountAmount: parseFloat(discountAmount) || undefined,
        grandTotalAmount: grandTotal,
        paidAmount: paymentStatus === 'Paid' ? grandTotal : (paymentStatus === 'Partial' ? (parseFloat(paidAmount) || 0) : 0),
        paymentMethod,
        paymentStatus,
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
              <div className="sm:col-span-2 lg:col-span-3">
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

                  {/* Item Name - Searchable Combobox */}
                  <div
                    className="flex-1 min-w-0 relative"
                    ref={(el) => { if (el) itemDropdownRefs.current.set(line.id, el); }}
                  >
                    <div className="relative">
                      <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={line.itemName}
                        onChange={(e) => {
                          handleLineChange(line.id, 'itemName', e.target.value);
                          setPurchaseLines(prev => prev.map(l => l.id === line.id ? { ...l, showDropdown: e.target.value } : l));
                        }}
                        onFocus={() => {
                          setPurchaseLines(prev => prev.map(l => l.id === line.id ? { ...l, showDropdown: l.itemName || ' ' } : l));
                        }}
                        placeholder="Search item or type new..."
                        className={`w-full pl-8 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white ${
                          errors[`itemName_${line.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors[`itemName_${line.id}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`itemName_${line.id}`]}</p>}

                    {line.showDropdown && (
                      <div className="absolute z-20 left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredStockItems(line.itemName).length > 0 && (
                          filteredStockItems(line.itemName).map(stockItem => (
                            <div
                              key={stockItem.id}
                              className="px-3 py-2 cursor-pointer hover:bg-sky-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectStockItem(line.id, stockItem);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <FiPackage className="w-3.5 h-3.5 text-sky-600" />
                                <span className="text-sm font-medium text-gray-900">{stockItem.name}</span>
                              </div>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {stockItem.quantity} {stockItem.unit}
                              </span>
                            </div>
                          ))
                        )}
                        {line.itemName.trim() && !stockItems.find(s => s.name.toLowerCase() === line.itemName.trim().toLowerCase()) && (
                          <div
                            className="px-3 py-2.5 cursor-pointer hover:bg-sky-50 text-sm font-medium text-sky-600 flex items-center gap-1.5 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleLineChange(line.id, 'showDropdown', '');
                            }}
                          >
                            <FiPlus className="w-3.5 h-3.5" />
                            Add "{line.itemName.trim()}" as new item
                          </div>
                        )}
                        {filteredStockItems(line.itemName).length === 0 && !line.itemName.trim() && (
                          <div className="px-3 py-2.5 text-sm text-gray-500 italic">
                            Type an item name to add.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Category - Searchable Dropdown */}
                  <div
                    className="w-32 flex-shrink-0 relative hidden sm:block"
                    ref={(el) => { if (el) catDropdownRefs.current.set(line.id, el); }}
                  >
                    <input
                      type="text"
                      value={line.itemCategory}
                      onChange={(e) => {
                        handleLineChange(line.id, 'itemCategory', e.target.value);
                        setPurchaseLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: e.target.value } : l));
                      }}
                      onFocus={() => {
                        setPurchaseLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: l.itemCategory || ' ' } : l));
                      }}
                      placeholder="Category"
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                    />
                    {line.showCatDropdown !== '' && (
                      <div className="absolute z-20 left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-36 overflow-y-auto">
                        {existingCategories
                          .filter(c => c.toLowerCase().includes((line.showCatDropdown || '').toLowerCase()))
                          .map(category => (
                            <div
                              key={category}
                              className="px-3 py-2 cursor-pointer hover:bg-sky-50 text-sm text-gray-700 border-b border-gray-50 last:border-0 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleLineChange(line.id, 'itemCategory', category);
                                setPurchaseLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: '' } : l));
                              }}
                            >
                              {category}
                            </div>
                          ))}
                        <div
                          className="px-3 py-2 cursor-pointer hover:bg-sky-50 text-sm font-medium text-sky-600 flex items-center gap-1.5 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleLineChange(line.id, 'showCatDropdown', '');
                          }}
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          Add New
                        </div>
                      </div>
                    )}
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

                {/* Error messages */}
                {(errors[`itemName_${line.id}`] || errors[`qty_${line.id}`] || errors[`cost_${line.id}`]) && (
                  <div className="flex items-center gap-2 mt-1 ml-8">
                    {errors[`itemName_${line.id}`] && <span className="text-red-500 text-xs">{errors[`itemName_${line.id}`]}</span>}
                    {errors[`qty_${line.id}`] && <span className="text-red-500 text-xs">{errors[`qty_${line.id}`]}</span>}
                    {errors[`cost_${line.id}`] && <span className="text-red-500 text-xs">{errors[`cost_${line.id}`]}</span>}
                  </div>
                )}

                {/* Mobile-only: Category & Total row */}
                <div className="flex items-center gap-2 mt-2 sm:hidden">
                  <div className="flex-1 relative" ref={(el) => { if (el) catDropdownRefs.current.set(line.id, el); }}>
                    <input
                      type="text"
                      value={line.itemCategory}
                      onChange={(e) => {
                        handleLineChange(line.id, 'itemCategory', e.target.value);
                        setPurchaseLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: e.target.value } : l));
                      }}
                      onFocus={() => {
                        setPurchaseLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: l.itemCategory || ' ' } : l));
                      }}
                      placeholder="Category"
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                    />
                    {line.showCatDropdown !== '' && (
                      <div className="absolute z-20 left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-36 overflow-y-auto">
                        {existingCategories
                          .filter(c => c.toLowerCase().includes((line.showCatDropdown || '').toLowerCase()))
                          .map(category => (
                            <div
                              key={category}
                              className="px-3 py-2 cursor-pointer hover:bg-sky-50 text-sm text-gray-700 border-b border-gray-50 last:border-0 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleLineChange(line.id, 'itemCategory', category);
                                setPurchaseLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: '' } : l));
                              }}
                            >
                              {category}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {parseFloat(totalLineCost(line)) > 0 && (
                    <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200 whitespace-nowrap">
                      <Money amount={parseFloat(totalLineCost(line))} />
                    </span>
                  )}
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
              Tax, Discount & Totals
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tax: Type Toggle + Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tax (Optional)</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setTaxType('percent'); setTaxValue(''); }}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                      taxType === 'percent'
                        ? 'bg-sky-50 border-sky-300 text-sky-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    % Percent
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTaxType('flat'); setTaxValue(''); }}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                      taxType === 'flat'
                        ? 'bg-sky-50 border-sky-300 text-sky-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Flat Amount
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={taxValue}
                    onChange={(e) => setTaxValue(e.target.value)}
                    placeholder={taxType === 'percent' ? 'e.g., 13' : 'e.g., 15.50'}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    {taxType === 'percent' ? '%' : '$'}
                  </span>
                </div>
                {taxType === 'percent' && parseFloat(taxValue) > 0 && (
                  <p className="text-xs text-sky-600">Tax amount: <Money amount={taxAmount} /></p>
                )}
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount (Optional)</label>
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

              {/* Totals Summary */}
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <Money amount={overallSubTotal} />
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax {taxType === 'percent' ? `(${taxValue}%)` : ''}</span>
                    <span>+ <Money amount={taxAmount} /></span>
                  </div>
                )}
                {(parseFloat(discountAmount) || 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>- <Money amount={parseFloat(discountAmount) || 0} /></span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-sky-700 pt-1.5 border-t border-sky-200">
                  <span>Grand Total</span>
                  <Money amount={grandTotal} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FiFileText className="w-3.5 h-3.5" />
              Payment Details
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white appearance-none"
                >
                  {paymentMethodOptions.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
                <div className="flex gap-1.5">
                  {(['Paid', 'Pending', 'Partial'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setPaymentStatus(status);
                        if (status === 'Paid') setPaidAmount(grandTotal.toFixed(2));
                        else if (status === 'Pending') setPaidAmount('');
                      }}
                      className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-xl border transition-all ${
                        paymentStatus === status
                          ? status === 'Paid'
                            ? 'bg-green-50 border-green-300 text-green-700'
                            : status === 'Pending'
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Amount (show when Partial) */}
              {paymentStatus === 'Partial' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    max={grandTotal}
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
                  />
                  {parseFloat(paidAmount) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Balance due: <Money amount={grandTotal - (parseFloat(paidAmount) || 0)} />
                    </p>
                  )}
                </div>
              ) : paymentStatus === 'Paid' ? (
                <div className="p-3 bg-green-50 rounded-xl border border-green-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-green-700">
                    Fully paid: <Money amount={grandTotal} />
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-amber-700">
                    Amount due: <Money amount={grandTotal} />
                  </span>
                </div>
              )}
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
