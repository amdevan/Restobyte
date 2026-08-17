import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { FiSearch, FiPackage, FiPlus, FiTrash2, FiDownload, FiUpload, FiCheckCircle, FiTruck } from 'react-icons/fi';
import type { StockItem, Supplier, StockEntryItem } from '../../types';

interface StockEntryLine {
  id: string;
  itemName: string;
  showDropdown: string;
  showCatDropdown: string;
  itemCategory: string;
  itemUnit: string;
  itemLowStockThreshold: string;
  quantityAdded: string;
  costPerUnit: string;
}

interface StockEntry {
  id: string;
  supplierName: string;
  supplierId: string;
  purchaseDate: string;
  totalAmount: string;
  invoiceNumber: string;
  paymentStatus: string;
  paidAmount: string;
  notes: string;
}

const initialEntry: StockEntry = {
  id: '',
  supplierName: '',
  supplierId: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  totalAmount: '',
  invoiceNumber: '',
  paymentStatus: 'Paid',
  paidAmount: '',
  notes: '',
};

const blankLine = (): StockEntryLine => ({
  id: Date.now().toString() + Math.random(),
  itemName: '',
  showDropdown: '',
  showCatDropdown: '',
  itemCategory: '',
  itemUnit: 'kg',
  itemLowStockThreshold: '',
  quantityAdded: '',
  costPerUnit: '',
});

const AddStockEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    stockItems,
    findOrCreateStockItem,
    addStockEntry,
    suppliers,
    addSupplier,
    getSingleActiveOutlet,
  } = useRestaurantData();

  const [entry, setEntry] = useState<StockEntry>({
    ...initialEntry,
    purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [lines, setLines] = useState<StockEntryLine[]>([blankLine()]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Supplier dropdown state
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  const itemDropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const catDropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Supplier dropdown
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(target)) {
        setShowSupplierDropdown(false);
      }
      // Item dropdowns
      itemDropdownRefs.current.forEach((ref, id) => {
        if (ref && !ref.contains(target)) {
          setLines(prev => prev.map(l => l.id === id ? { ...l, showDropdown: '' } : l));
        }
      });
      // Category dropdowns
      catDropdownRefs.current.forEach((ref, id) => {
        if (ref && !ref.contains(target)) {
          setLines(prev => prev.map(l => l.id === id ? { ...l, showCatDropdown: '' } : l));
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

  const filteredCategories = useMemo(() => {
    const lower = categorySearch.toLowerCase();
    return existingCategories.filter(c => c.toLowerCase().includes(lower));
  }, [existingCategories, categorySearch]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const lower = supplierSearch.toLowerCase();
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(lower)) ||
      (s.phone && s.phone.includes(lower))
    );
  }, [suppliers, supplierSearch]);

  const handleEntryChange = (field: keyof StockEntry, value: string) => {
    setEntry(prev => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (id: string, field: keyof StockEntryLine, value: string) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const selectStockItem = (lineId: string, stockItem: StockItem) => {
    setLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      return {
        ...l,
        itemName: stockItem.name,
        itemCategory: stockItem.category,
        itemUnit: stockItem.unit,
        itemLowStockThreshold: stockItem.lowStockThreshold?.toString() || '',
        showDropdown: '',
      };
    }));
  };

  const selectSupplier = (supplier: Supplier) => {
    setEntry(prev => ({
      ...prev,
      supplierName: supplier.name,
      supplierId: supplier.id,
    }));
    setSupplierSearch('');
    setShowSupplierDropdown(false);
  };

  const handleAddNewSupplier = async () => {
    const name = supplierSearch.trim();
    if (!name) return;
    const newSupplier = await addSupplier({ name });
    setEntry(prev => ({
      ...prev,
      supplierName: newSupplier.name,
      supplierId: newSupplier.id,
    }));
    setSupplierSearch('');
    setShowSupplierDropdown(false);
  };

  const handleAddLine = () => {
    setLines(prev => [...prev, blankLine()]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length === 1) return;
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const handleAddNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !existingCategories.includes(trimmed)) {
      setLines(prev => prev.map(l =>
        l.showCatDropdown !== '' ? { ...l, itemCategory: trimmed, showCatDropdown: '' } : l
      ));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      setCategorySearch('');
    }
  };

  const handleCsvUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const csvLines = text.split('\n').filter(line => line.trim() !== '');
        if (csvLines.length < 2) return;

        const newLines: StockEntryLine[] = [];
        for (let i = 1; i < csvLines.length; i++) {
          const values = csvLines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          if (values.length >= 4) {
            newLines.push({
              ...blankLine(),
              itemName: values[0] || '',
              itemCategory: values[1] || '',
              itemUnit: values[2] || 'kg',
              quantityAdded: values[3] || '',
              costPerUnit: values[4] || '',
            });
          }
        }

        if (newLines.length > 0) {
          setLines(prev => [...prev, ...newLines]);
        }
      } catch (err) {
        console.error('CSV parsing error:', err);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  const downloadCsvTemplate = () => {
    const headers = ['Item Name', 'Category', 'Unit', 'Quantity Added', 'Cost Per Unit'];
    const csvContent = [headers.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stock_entry_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!entry.supplierName.trim()) newErrors.supplierName = 'Supplier is required';
    if (!entry.purchaseDate) newErrors.purchaseDate = 'Date is required';
    if (lines.length === 0) newErrors.lines = 'At least one item is required';

    lines.forEach((line, index) => {
      if (!line.itemName.trim()) newErrors[`itemName_${line.id}`] = `Item name required`;
      if (!line.quantityAdded || parseFloat(line.quantityAdded) <= 0) newErrors[`quantityAdded_${line.id}`] = `Qty required`;
      if (!line.costPerUnit || parseFloat(line.costPerUnit) <= 0) newErrors[`costPerUnit_${line.id}`] = `Cost required`;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const entryItems: StockEntryItem[] = [];

      for (const line of lines) {
        const stockItem = findOrCreateStockItem({
          name: line.itemName,
          category: line.itemCategory || 'Uncategorized',
          unit: line.itemUnit || 'kg',
          costPerUnit: parseFloat(line.costPerUnit),
          lowStockThreshold: line.itemLowStockThreshold ? parseFloat(line.itemLowStockThreshold) : 10,
        });

        entryItems.push({
          stockItemId: stockItem.id,
          stockItemName: stockItem.name,
          quantityAdded: parseFloat(line.quantityAdded),
          unit: stockItem.unit,
          costPerUnit: parseFloat(line.costPerUnit),
        });
      }

      addStockEntry({
        supplier: entry.supplierName,
        referenceNumber: entry.invoiceNumber,
        items: entryItems,
        notes: entry.notes,
        outletId: getSingleActiveOutlet()?.id || '',
      });

      setEntry({
        ...initialEntry,
        purchaseDate: new Date().toISOString().split('T')[0],
      });
      setLines([blankLine()]);
      setErrors({});
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting stock entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLineCost = (line: StockEntryLine) => {
    const qty = parseFloat(line.quantityAdded) || 0;
    const cost = parseFloat(line.costPerUnit) || 0;
    return (qty * cost).toFixed(2);
  };

  const grandTotal = useMemo(() => {
    return lines.reduce((sum, line) => sum + parseFloat(totalLineCost(line)), 0).toFixed(2);
  }, [lines]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200">
              <FiPackage className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add Stock Entry</h1>
              <p className="text-sm text-gray-500">Record new stock purchases and deliveries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
              id="csvUpload"
            />
            <button
              onClick={downloadCsvTemplate}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Download CSV template"
            >
              <FiDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Template</span>
            </button>
            <label
              htmlFor="csvUpload"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              title="Upload CSV file"
            >
              <FiUpload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload CSV</span>
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 animate-slide-in">
            <FiCheckCircle className="text-green-600 w-5 h-5" />
            <span className="text-green-800 font-medium">Stock entry saved successfully!</span>
          </div>
        )}

        {/* Entry Details Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FiTruck className="w-3.5 h-3.5" />
              Entry Details
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Supplier - Searchable Combobox */}
              <div className="relative" ref={supplierDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={showSupplierDropdown ? supplierSearch : entry.supplierName}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                      if (!e.target.value) {
                        setEntry(prev => ({ ...prev, supplierName: '', supplierId: '' }));
                      }
                    }}
                    onFocus={() => {
                      setShowSupplierDropdown(true);
                      setSupplierSearch('');
                    }}
                    placeholder="Search or add supplier..."
                    className={`w-full pl-9 pr-8 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white ${
                      errors.supplierName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {entry.supplierName && !showSupplierDropdown && (
                    <button
                      onClick={() => {
                        setEntry(prev => ({ ...prev, supplierName: '', supplierId: '' }));
                        setSupplierSearch('');
                        setShowSupplierDropdown(true);
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
                          className="px-3 py-2.5 cursor-pointer hover:bg-green-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectSupplier(supplier);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <FiTruck className="w-4 h-4 text-green-600" />
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
                        className="px-3 py-2.5 cursor-pointer hover:bg-blue-50 text-sm font-medium text-blue-600 flex items-center gap-1.5 transition-colors"
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
                {errors.supplierName && <p className="text-red-500 text-xs mt-1">{errors.supplierName}</p>}
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={entry.purchaseDate}
                  onChange={(e) => handleEntryChange('purchaseDate', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white ${
                    errors.purchaseDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate}</p>}
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
                <div className="flex gap-1.5">
                  {['Paid', 'Pending', 'Partial'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleEntryChange('paymentStatus', status)}
                      className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-xl border transition-all ${
                        entry.paymentStatus === status
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

              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Number</label>
                <input
                  type="text"
                  value={entry.invoiceNumber}
                  onChange={(e) => handleEntryChange('invoiceNumber', e.target.value)}
                  placeholder="e.g., INV-2024-001"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <input
                  type="text"
                  value={entry.notes}
                  onChange={(e) => handleEntryChange('notes', e.target.value)}
                  placeholder="Optional notes about this stock entry"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
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
              Items to Add
              {lines.length > 0 && (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                  {lines.length}
                </span>
              )}
            </h2>
            {parseFloat(grandTotal) > 0 && (
              <span className="text-sm font-semibold text-gray-900">
                Total: <span className="text-green-600">NPR {grandTotal}</span>
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {lines.map((line, index) => (
              <div key={line.id} className="p-3 sm:p-4 hover:bg-gray-50/50 transition-colors">
                {/* Single Row: Item | Category | Qty | Cost | Unit | Total | Remove */}
                <div className="flex items-center gap-2">
                  {/* Line Number */}
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
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
                          setLines(prev => prev.map(l => l.id === line.id ? { ...l, showDropdown: e.target.value } : l));
                        }}
                        onFocus={() => {
                          setLines(prev => prev.map(l => l.id === line.id ? { ...l, showDropdown: l.itemName || ' ' } : l));
                        }}
                        placeholder="Item name"
                        className={`w-full pl-8 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white ${
                          errors[`itemName_${line.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    </div>

                    {line.showDropdown && line.itemName !== undefined && (
                      <div className="absolute z-20 left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredStockItems(line.itemName).length > 0 && (
                          filteredStockItems(line.itemName).map(stockItem => (
                            <div
                              key={stockItem.id}
                              className="px-3 py-2 cursor-pointer hover:bg-green-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectStockItem(line.id, stockItem);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <FiPackage className="w-3.5 h-3.5 text-green-600" />
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
                            className="px-3 py-2.5 cursor-pointer hover:bg-blue-50 text-sm font-medium text-blue-600 flex items-center gap-1.5 transition-colors"
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

                  {/* Category */}
                  <div
                    className="w-32 flex-shrink-0 relative hidden sm:block"
                    ref={(el) => { if (el) catDropdownRefs.current.set(line.id, el); }}
                  >
                    <input
                      type="text"
                      value={line.itemCategory}
                      onChange={(e) => {
                        handleLineChange(line.id, 'itemCategory', e.target.value);
                        setCategorySearch(e.target.value);
                        setLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: e.target.value } : l));
                      }}
                      onFocus={() => {
                        setLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: l.itemCategory || ' ' } : l));
                      }}
                      placeholder="Category"
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                    />

                    {line.showCatDropdown !== '' && (
                      <div className="absolute z-20 left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-36 overflow-y-auto">
                        {filteredCategories.length > 0 && filteredCategories.map(category => (
                          <div
                            key={category}
                            className="px-3 py-2 cursor-pointer hover:bg-green-50 text-sm text-gray-700 border-b border-gray-50 last:border-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleLineChange(line.id, 'itemCategory', category);
                              setLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: '' } : l));
                            }}
                          >
                            {category}
                          </div>
                        ))}
                        <div
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm font-medium text-blue-600 flex items-center gap-1.5 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShowNewCategoryInput(true);
                            setLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: '' } : l));
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
                      value={line.quantityAdded}
                      onChange={(e) => handleLineChange(line.id, 'quantityAdded', e.target.value)}
                      placeholder="Qty"
                      min="0"
                      step="0.01"
                      className={`w-full px-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white ${
                        errors[`quantityAdded_${line.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
                      className={`w-full px-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white ${
                        errors[`costPerUnit_${line.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  {/* Unit */}
                  <div className="w-16 flex-shrink-0">
                    <select
                      value={line.itemUnit}
                      onChange={(e) => handleLineChange(line.id, 'itemUnit', e.target.value)}
                      className="w-full px-1 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="ltr">ltr</option>
                      <option value="ml">ml</option>
                      <option value="pcs">pcs</option>
                      <option value="pack">pack</option>
                      <option value="dozen">dozen</option>
                      <option value="bottle">bottle</option>
                      <option value="can">can</option>
                      <option value="box">box</option>
                      <option value="unit">unit</option>
                    </select>
                  </div>

                  {/* Line Total */}
                  <div className="w-24 flex-shrink-0 text-right hidden sm:block">
                    {parseFloat(totalLineCost(line)) > 0 ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-200 whitespace-nowrap">
                        NPR {totalLineCost(line)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Remove Button */}
                  {lines.length > 1 && (
                    <button
                      onClick={() => handleRemoveLine(line.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove item"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Error messages row */}
                {(errors[`itemName_${line.id}`] || errors[`quantityAdded_${line.id}`] || errors[`costPerUnit_${line.id}`]) && (
                  <div className="flex items-center gap-2 mt-1 ml-8">
                    {errors[`itemName_${line.id}`] && <span className="text-red-500 text-xs">{errors[`itemName_${line.id}`]}</span>}
                    {errors[`quantityAdded_${line.id}`] && <span className="text-red-500 text-xs">{errors[`quantityAdded_${line.id}`]}</span>}
                    {errors[`costPerUnit_${line.id}`] && <span className="text-red-500 text-xs">{errors[`costPerUnit_${line.id}`]}</span>}
                  </div>
                )}

                {/* Mobile-only: Category row for small screens */}
                <div className="flex items-center gap-2 mt-2 sm:hidden">
                  <div
                    className="flex-1 relative"
                    ref={(el) => { if (el) catDropdownRefs.current.set(line.id, el); }}
                  >
                    <input
                      type="text"
                      value={line.itemCategory}
                      onChange={(e) => {
                        handleLineChange(line.id, 'itemCategory', e.target.value);
                        setCategorySearch(e.target.value);
                        setLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: e.target.value } : l));
                      }}
                      onFocus={() => {
                        setLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: l.itemCategory || ' ' } : l));
                      }}
                      placeholder="Category"
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                    />
                    {line.showCatDropdown !== '' && (
                      <div className="absolute z-20 left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-36 overflow-y-auto">
                        {filteredCategories.length > 0 && filteredCategories.map(category => (
                          <div
                            key={category}
                            className="px-3 py-2 cursor-pointer hover:bg-green-50 text-sm text-gray-700 border-b border-gray-50 last:border-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleLineChange(line.id, 'itemCategory', category);
                              setLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: '' } : l));
                            }}
                          >
                            {category}
                          </div>
                        ))}
                        <div
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm font-medium text-blue-600 flex items-center gap-1.5 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShowNewCategoryInput(true);
                            setLines(prev => prev.map(l => l.id === line.id ? { ...l, showCatDropdown: '' } : l));
                          }}
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          Add New
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Mobile Total */}
                  {parseFloat(totalLineCost(line)) > 0 && (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-200 whitespace-nowrap">
                      NPR {totalLineCost(line)}
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
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add Item Line
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || lines.length === 0}
            className="flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200 transition-all"
          >
            <FiCheckCircle className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : `Save Entry (${lines.length} item${lines.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>

      {/* New Category Modal */}
      {showNewCategoryInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddNewCategory();
                if (e.key === 'Escape') {
                  setShowNewCategoryInput(false);
                  setNewCategoryName('');
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowNewCategoryInput(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStockEntryPage;
