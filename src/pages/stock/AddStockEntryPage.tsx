


import React, { useState, useRef } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { StockEntryItem as StockEntryItemType } from '@/types'; // Renamed to avoid conflict
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiBox, FiUpload, FiDownloadCloud } from 'react-icons/fi';

// Local interface for form line management
interface StockEntryLine {
  id: string; // Temporary client-side ID for the line
  itemName: string;
  itemCategory: string;
  itemUnit: string; // Selected from a dropdown
  itemLowStockThreshold: string;
  quantityAdded: string;
  costPerUnit: string;
}

const UNITS = ["kg", "g", "ltr", "ml", "pcs", "pack", "dozen", "bottle", "can", "box", "unit"];


const AddStockEntryPage: React.FC = () => {
  const { suppliers, findOrCreateStockItem, addStockEntry, getSingleActiveOutlet } = useRestaurantData();
  const navigate = useNavigate();
  const outlet = getSingleActiveOutlet();

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [entryLines, setEntryLines] = useState<StockEntryLine[]>([
    { id: Date.now().toString(), itemName: '', itemCategory: '', itemUnit: UNITS[0], itemLowStockThreshold: '0', quantityAdded: '', costPerUnit: '' }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleAddLine = () => {
    setEntryLines([...entryLines, { id: Date.now().toString(), itemName: '', itemCategory: '', itemUnit: UNITS[0], itemLowStockThreshold: '0', quantityAdded: '', costPerUnit: '' }]);
  };

  const handleRemoveLine = (lineId: string) => {
    setEntryLines(entryLines.filter(line => line.id !== lineId));
  };

  const handleLineChange = (lineId: string, field: keyof StockEntryLine, value: string) => {
    setEntryLines(entryLines.map(line => line.id === lineId ? { ...line, [field]: value } : line));
  };

  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadSampleCsv = () => {
    const header = "Item Name,Category,Unit,Low Stock Threshold,Quantity Added,Cost Per Unit";
    const exampleRows = [
      "Flour,Baking,kg,5,20,1.50",
      "Sugar,Baking,kg,2,10,", // Example with empty optional cost
      "Olive Oil,Oils,ltr,1,5,8.75",
      "Coffee Beans,Beverages,kg,0.5,2,22.00",
      "Paper Napkins,Supplies,pack,50,100,0.80"
    ];
    const csvContent = [header, ...exampleRows].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "sample_stock_entry_format.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        alert('Invalid file type. Please upload a CSV file.');
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        processCsvData(text);
      } else {
        alert('Could not read file content.');
      }
      if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input after processing
    };
    reader.onerror = () => {
        alert('Error reading file.');
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    };
    reader.readAsText(file);
  };

  const processCsvData = (csvText: string) => {
    const lines = csvText.trim().split(/\r\n|\n/); // Handles different line endings
    const newBulkEntryLines: StockEntryLine[] = [];
    let successfulAdds = 0;
    let failedAdds = 0;
    const errors: string[] = [];

    // Skip header row if present (simple check, can be made more robust)
    const dataLines = lines[0]?.match(/Item Name,Category,Unit,Low Stock Threshold,Quantity Added,Cost Per Unit/i) 
                      ? lines.slice(1) 
                      : lines;


    dataLines.forEach((line, index) => {
      if (line.trim() === '') return; // Skip empty lines

      const parts = line.split(',').map(part => part.trim());
      if (parts.length < 5 || parts.length > 6) {
        errors.push(`Line ${index + 1}: Incorrect number of fields. Expected 5 or 6, got ${parts.length}. Line: "${line}"`);
        failedAdds++;
        return;
      }

      const [itemName, itemCategory, itemUnitInput, itemLowStockThresholdStr, quantityAddedStr, costPerUnitStr] = parts;

      if (!itemName || !itemCategory || !itemUnitInput || !itemLowStockThresholdStr || !quantityAddedStr) {
        errors.push(`Line ${index + 1}: Missing required fields (Name, Category, Unit, Low Stock Threshold, Quantity). Line: "${line}"`);
        failedAdds++;
        return;
      }
      
      const itemUnit = itemUnitInput.toLowerCase();
      if (!UNITS.includes(itemUnit)) {
         errors.push(`Line ${index + 1}: Invalid unit "${itemUnitInput}". Must be one of: ${UNITS.join(', ')}. Line: "${line}"`);
         failedAdds++;
         return;
      }

      const quantityAdded = parseFloat(quantityAddedStr);
      const itemLowStockThreshold = parseFloat(itemLowStockThresholdStr);

      if (isNaN(quantityAdded) || quantityAdded <= 0) {
        errors.push(`Line ${index + 1}: Invalid Quantity Added "${quantityAddedStr}". Must be a positive number. Line: "${line}"`);
        failedAdds++;
        return;
      }
      if (isNaN(itemLowStockThreshold) || itemLowStockThreshold < 0) {
        errors.push(`Line ${index + 1}: Invalid Low Stock Threshold "${itemLowStockThresholdStr}". Must be a non-negative number. Line: "${line}"`);
        failedAdds++;
        return;
      }

      let costPerUnitValue: string | undefined = undefined;
      if (costPerUnitStr !== undefined && costPerUnitStr.trim() !== '') {
        const cost = parseFloat(costPerUnitStr);
        if (isNaN(cost) || cost < 0) {
          errors.push(`Line ${index + 1}: Invalid Cost Per Unit "${costPerUnitStr}". Must be a non-negative number or empty. Line: "${line}"`);
          failedAdds++;
          return;
        }
        costPerUnitValue = costPerUnitStr;
      }

      newBulkEntryLines.push({
        id: `${Date.now().toString()}-csv-${index}`, // Unique ID for the new line
        itemName,
        itemCategory,
        itemUnit: itemUnit, // Use validated unit
        itemLowStockThreshold: itemLowStockThresholdStr,
        quantityAdded: quantityAddedStr,
        costPerUnit: costPerUnitValue || '',
      });
      successfulAdds++;
    });

    if (newBulkEntryLines.length > 0) {
      const currentLinesArePlaceholder = entryLines.length === 1 &&
                                       !entryLines[0].itemName &&
                                       !entryLines[0].itemCategory &&
                                       !entryLines[0].quantityAdded &&
                                       !entryLines[0].costPerUnit &&
                                       entryLines[0].itemLowStockThreshold === '0';

      if (currentLinesArePlaceholder) {
        setEntryLines(newBulkEntryLines);
      } else {
        setEntryLines(prevLines => [...prevLines, ...newBulkEntryLines]);
      }
    }

    let feedbackMessage = `${successfulAdds} item(s) processed from CSV file.`;
    if (failedAdds > 0) {
      feedbackMessage += ` ${failedAdds} item(s) could not be processed due to errors.`;
      console.warn("CSV Upload Errors:\n" + errors.join("\n"));
      feedbackMessage += " Check console for details on errors.";
    }
    
    if (successfulAdds === 0 && failedAdds === 0 && csvText.trim() !== '') {
        feedbackMessage = "No valid items found in the CSV file. Please check the format and ensure it doesn't just contain a header.";
    } else if (csvText.trim() === '') {
        feedbackMessage = "CSV file was empty or contained no processable lines.";
    }
    alert(feedbackMessage);
  };

  const isSubmitDisabled = () => {
    if (entryLines.length === 0) return true;
    if (entryLines.length === 1) {
        const line = entryLines[0];
        // Check if the single line is essentially empty (placeholder state)
        return !line.itemName.trim() && 
               !line.itemCategory.trim() && 
               !line.quantityAdded.trim() && 
               !line.costPerUnit.trim() &&
               line.itemLowStockThreshold.trim() === '0';
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!outlet) {
        alert('An active outlet must be selected to add a stock entry.');
        return;
    }
    
    const processedEntryItems: StockEntryItemType[] = [];
    for (const line of entryLines) {
      if (!line.itemName.trim() || !line.itemCategory.trim() || !line.itemUnit || !line.quantityAdded.trim() || !line.itemLowStockThreshold.trim()) {
        alert('Please fill in Item Name, Category, Unit, Low Stock Threshold, and Quantity for all lines.');
        return;
      }
      const quantity = parseFloat(line.quantityAdded);
      const lowStockThreshold = parseFloat(line.itemLowStockThreshold);

      if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid positive quantity for all lines.');
        return;
      }
      if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
        alert('Please enter a valid non-negative low stock threshold.');
        return;
      }

      const cost = line.costPerUnit ? parseFloat(line.costPerUnit) : undefined;
      if (line.costPerUnit && (isNaN(cost) || cost < 0)) {
        alert('Please enter a valid cost per unit or leave it blank.');
        return;
      }
      
      const stockItemDetails = {
          name: line.itemName.trim(),
          category: line.itemCategory.trim(),
          unit: line.itemUnit,
          lowStockThreshold: lowStockThreshold
      };
      const actualStockItem = findOrCreateStockItem(stockItemDetails);

      processedEntryItems.push({
        stockItemId: actualStockItem.id,
        stockItemName: actualStockItem.name, 
        quantityAdded: quantity,
        unit: actualStockItem.unit, 
        costPerUnit: cost,
      });
    }

    if (processedEntryItems.length === 0) {
      alert('Please add at least one item to the stock entry.');
      return;
    }

    addStockEntry({
      supplier: selectedSupplier || undefined,
      referenceNumber,
      items: processedEntryItems,
      notes,
      outletId: outlet.id,
    });

    alert('Stock entry added successfully!');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setSelectedSupplier('');
    setReferenceNumber('');
    setNotes('');
    setEntryLines([{ id: Date.now().toString(), itemName: '', itemCategory: '', itemUnit: UNITS[0], itemLowStockThreshold: '0', quantityAdded: '', costPerUnit: '' }]);
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <div className="p-5">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <FiBox className="mr-3 text-sky-600" /> Add Stock Entry
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Entry Date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier (Optional)
                </label>
                <select
                  id="supplier"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm h-[42px]"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.name}>{sup.name}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Reference/Invoice No. (Optional)"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g., INV-2024-001"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Stock Items</h3>
              {entryLines.map((line) => (
                <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end p-3 border rounded-md bg-gray-50/50">
                  <div className="md:col-span-3">
                    <Input
                        label="Item Name *"
                        value={line.itemName}
                        onChange={(e) => handleLineChange(line.id, 'itemName', e.target.value)}
                        placeholder="e.g., Tomatoes"
                        containerClassName="mb-0"
                        required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                        label="Category *"
                        value={line.itemCategory}
                        onChange={(e) => handleLineChange(line.id, 'itemCategory', e.target.value)}
                        placeholder="e.g., Vegetables"
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
                        label="Low Stock Threshold *"
                        type="number"
                        id={`lowStockThreshold-${line.id}`}
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
                        label="Qty Added *"
                        type="number"
                        id={`quantity-${line.id}`}
                        value={line.quantityAdded}
                        min="0.01"
                        step="0.01"
                        onChange={(e) => handleLineChange(line.id, 'quantityAdded', e.target.value)}
                        placeholder="e.g., 10"
                        containerClassName="mb-0"
                        required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                        label="Cost/Unit (Opt.)"
                        type="number"
                        id={`cost-${line.id}`}
                        value={line.costPerUnit}
                        min="0"
                        step="0.01"
                        onChange={(e) => handleLineChange(line.id, 'costPerUnit', e.target.value)}
                        placeholder="e.g., 2.50"
                        containerClassName="mb-0"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center justify-end pt-3 md:pt-0">
                    {entryLines.length > 1 && (
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
                </div>
              ))}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-2">
                <Button type="button" variant="secondary" onClick={handleAddLine} leftIcon={<FiPlus />}>
                  Add Item Line
                </Button>
                <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3">
                    <div>
                        <Button type="button" variant="secondary" onClick={handleTriggerFileUpload} leftIcon={<FiUpload />}>
                            Upload CSV
                        </Button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                            accept=".csv"
                        />
                    </div>
                     <Button type="button" variant="outline" onClick={handleDownloadSampleCsv} leftIcon={<FiDownloadCloud />} className="text-sky-600 border-sky-500 hover:bg-sky-50">
                        Download Sample
                    </Button>
                </div>
              </div>
               <p className="text-xs text-gray-500 mt-1">
                    CSV Format: <code className="text-xs">Item Name,Category,Unit,Low Stock Threshold,Quantity Added,Cost Per Unit</code> (Cost is optional).
                    <br />
                    Valid units: {UNITS.join(', ')}. Ensure CSV does not contain only a header.
                </p>
            </div>
            
            <div>
              <label htmlFor="entryNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="entryNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Any additional notes for this stock entry..."
              />
            </div>

            <div className="flex items-center justify-start space-x-3 pt-4 border-t mt-6">
              <Button type="submit" variant="primary" leftIcon={<FiSave size={18}/>} disabled={isSubmitDisabled()}>
                Save Stock Entry
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} leftIcon={<FiArrowLeft size={18}/>}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AddStockEntryPage;