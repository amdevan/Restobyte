import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MenuItem as MenuItemType, SaleItem, Customer, Waiter, Table, DeliveryPartner, Sale, TableStatus, SaleTaxDetail, PartialPayment, KOT, Split, Variation } from '../types';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import CustomerSelectionModal from '@/components/pos/CustomerSelectionModal';
import ReceiptModal from '@/components/pos/ReceiptModal';
import PosCategorySidebar from '@/components/pos/PosCategorySidebar';
import PosMenuItemCard from '@/components/pos/PosMenuItemCard';
import CartHeader from '@/components/pos/CartHeader';
import CartItems from '@/components/pos/CartItems';
import CartSummary from '@/components/pos/CartSummary';
import CartActions from '@/components/pos/CartActions';
import DiscountModal from '@/components/pos/DiscountModal';
import ItemNoteModal from '@/components/pos/ItemNoteModal';
import PaymentModal from '@/components/pos/PaymentModal';
import PosActionsPanel from '@/components/pos/PosActionsPanel';
import KotModal from '@/components/pos/KotModal';
import FeatureDisabledPage from '@/components/common/FeatureDisabledPage';
import ItemCustomizationModal from '@/components/pos/ItemCustomizationModal'; // New
import AiAssistantModal from '@/components/pos/AiAssistantModal'; // New
import {
  FiShoppingCart, FiXCircle, FiSearch, FiZap
} from 'react-icons/fi';


// --- Sound Utilities ---
const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.4) => {
    try {
        const saved = localStorage.getItem('restoByteSoundSettings');
        if (saved && JSON.parse(saved).soundsEnabled === false) {
            return;
        }
    } catch (e) { /* ignore */ }

    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
            console.warn("AudioContext not supported.");
            return;
        }
        const context = new AudioContext();
        if (context.state === 'suspended') { context.resume(); }
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.02);
        oscillator.start(context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + duration);
        oscillator.stop(context.currentTime + duration);
    } catch (e) {
        console.error("Could not play sound:", e);
    }
};

const playKotSentSound = () => {
    playSound(440, 0.1, 'square');
    setTimeout(() => playSound(880, 0.1, 'square'), 100);
};

const playSaleFinalizedSound = () => {
    playSound(523.25, 0.15, 'sine'); // C5
    setTimeout(() => playSound(659.25, 0.2, 'sine'), 150); // E5
};
// --- End Sound Utilities ---


type OrderItem = SaleItem & { status: 'new' | 'sent'; lineId: string };

const PosPage: React.FC = () => {
  const {
    menuItems,
    foodMenuCategories,
    customers,
    addCustomer,
    tables,
    waiters,
    deliveryPartners,
    getSingleActiveOutlet,
    applicationSettings,
    recordSale,
    updateSale,
    sales
  } = useRestaurantData();

  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId?: string }>();
  
  const singleActiveOutlet = getSingleActiveOutlet();
  
  // UI State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isKotModalOpen, setIsKotModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false); // New
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false); // New

  // Order State
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [orderType, setOrderType] = useState<'Dine In' | 'Delivery' | 'Pickup' | 'WhatsApp'>(
    singleActiveOutlet?.outletType === 'CloudKitchen' ? 'Delivery' : (applicationSettings.defaultOrderType || 'Dine In')
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState<DeliveryPartner | null>(null);
  const [editingNoteItem, setEditingNoteItem] = useState<OrderItem | null>(null);
  const [itemToCustomize, setItemToCustomize] = useState<MenuItemType | null>(null); // New
  const [pax, setPax] = useState<number>(1);
  const [orderNotes, setOrderNotes] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage' | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // KOT State
  const [kotData, setKotData] = useState<KOT | null>(null);

  // Post-Sale State
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  
  const categories = useMemo(() => ['All', ...foodMenuCategories.map(c => c.name)], [foodMenuCategories]);
  const activeWaiters = useMemo(() => waiters, [waiters]);
  const activeDeliveryPartners = useMemo(() => deliveryPartners.filter(dp => dp.isEnabled), [deliveryPartners]);
  const hasNewItems = useMemo(() => currentOrderItems.some(item => item.status === 'new'), [currentOrderItems]);
  
  const clearOrder = useCallback((keepTable: boolean = false) => {
      setCurrentOrderItems([]);
      setSelectedCustomer(null);
      if (!keepTable) {
        setSelectedTable(null);
      }
      setSelectedWaiter(null);
      setSelectedDeliveryPartner(null);
      setPax(1);
      setOrderNotes('');
      setDiscountType(null);
      setDiscountAmount(0);
      setEditingSale(null);
      localStorage.removeItem('customerDisplayOrder'); // Clear display
      if (tableId && !keepTable) navigate('/app/panel/pos');
  }, [navigate, tableId]);

// FIX: Moved handleSendKot before the useEffect that uses it.
const handleSendKot = useCallback(() => {
    const newItems = currentOrderItems.filter(item => item.status === 'new');
    if (newItems.length === 0) {
      alert("No new items to send to the kitchen.");
      return;
    }
    if (orderType === 'Dine In' && !selectedTable) {
      alert("Please select a table before sending the order.");
      return;
    }
    if (!singleActiveOutlet) {
      alert("Error: No active outlet selected. Please select a single outlet.");
      return;
    }

    const subTotal = currentOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountValue = discountType === 'fixed' ? discountAmount : (subTotal * discountAmount) / 100;
    const totalAfterDiscount = subTotal - discountValue;
    
    const taxDetails: SaleTaxDetail[] = singleActiveOutlet.taxes.map(tax => {
      const taxAmount = totalAfterDiscount * (tax.rate / 100);
      return { id: tax.id, name: tax.name, rate: tax.rate, amount: taxAmount };
    });
    
    const totalTaxAmount = taxDetails.reduce((sum, tax) => sum + tax.amount, 0);
    const totalAmount = totalAfterDiscount + totalTaxAmount;

    if (editingSale) {
        updateSale({
            ...editingSale,
            items: currentOrderItems,
            subTotal,
            taxDetails,
            totalAmount,
            isSettled: false,
        });
    } else {
        const newSale = recordSale({
            items: currentOrderItems,
            subTotal,
            taxDetails,
            totalAmount,
            orderType,
            isSettled: false,
            pax: orderType === 'Dine In' ? pax : undefined,
            assignedTableId: selectedTable?.id,
            assignedTableName: selectedTable?.name,
            waiterId: selectedWaiter?.id,
            waiterName: selectedWaiter?.name,
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer?.name,
            orderNotes,
            discountType: discountType || undefined,
            discountAmount: discountValue > 0 ? discountAmount : undefined,
            deliveryPartnerId: selectedDeliveryPartner?.id,
            deliveryPartnerName: selectedDeliveryPartner?.name,
            deliveryCommission: selectedDeliveryPartner?.commissionRate,
            tipAmount: undefined,
            outletId: singleActiveOutlet.id,
        });
        setEditingSale(newSale);
    }
    
    const kot: KOT = {
        kotNumber: `KOT-${Date.now().toString().slice(-5)}`,
        table: selectedTable?.name,
        waiter: selectedWaiter?.name,
        timestamp: new Date().toLocaleString(),
        items: newItems,
    };
    setKotData(kot);
    setIsKotModalOpen(true);
    playKotSentSound();

    setCurrentOrderItems(prevItems => 
        prevItems.map(item => 
            item.status === 'new' ? { ...item, status: 'sent' } : item
        )
    );
  }, [
    currentOrderItems, orderType, selectedTable, selectedWaiter, singleActiveOutlet, editingSale,
    recordSale, updateSale, setEditingSale, discountType, discountAmount, pax,
    selectedCustomer, orderNotes, selectedDeliveryPartner
  ]);

  useEffect(() => {
    // Keyboard shortcuts listener
    const handleKeyDown = (event: KeyboardEvent) => {
        // Prevent shortcuts from firing inside modals or input fields
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || document.querySelector('.fixed.inset-0')) {
            return;
        }

        if (event.ctrlKey && event.key.toLowerCase() === 's') {
            event.preventDefault();
            if(hasNewItems && currentOrderItems.length > 0) handleSendKot();
        }
        if (event.ctrlKey && event.key.toLowerCase() === 'p') {
            event.preventDefault();
            if(currentOrderItems.length > 0) setIsPaymentModalOpen(true);
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            if(currentOrderItems.length > 0) clearOrder();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasNewItems, currentOrderItems.length, handleSendKot, clearOrder]);


  useEffect(() => {
    if (tableId && singleActiveOutlet?.outletType !== 'CloudKitchen') {
      const tableFromUrl = tables.find(t => t.id === tableId);
      if (tableFromUrl) {
          const openOrderForTable = sales.find(s => s.assignedTableId === tableId && !s.isSettled);
          
          if (openOrderForTable) {
            // Load existing order
            setEditingSale(openOrderForTable);
            setCurrentOrderItems(openOrderForTable.items.map(item => ({...item, status: 'sent', lineId: `line-${item.id}-${Math.random()}`})));
            setOrderType(openOrderForTable.orderType as any);
            setSelectedTable(tableFromUrl);
            setSelectedWaiter(waiters.find(w => w.id === openOrderForTable.waiterId) || null);
            setSelectedCustomer(customers.find(c => c.id === openOrderForTable.customerId) || null);
            setOrderNotes(openOrderForTable.orderNotes || '');
            setDiscountType(openOrderForTable.discountType || null);
            setDiscountAmount(openOrderForTable.discountAmount || 0);
            setPax(Number(openOrderForTable.pax) || 1);
          } else {
             // Start new order for this table
             clearOrder(true);
             setSelectedTable(tableFromUrl);
             setOrderType('Dine In');
          }
      }
    } else {
        clearOrder();
    }
  }, [tableId, tables, sales, singleActiveOutlet, waiters, customers, clearOrder]);
  
  const handleAddItem = useCallback((itemToAdd: MenuItemType) => {
    const hasVariations = itemToAdd.variations && itemToAdd.variations.length > 1;
    const hasAddons = itemToAdd.addonGroupIds && itemToAdd.addonGroupIds.length > 0;

    if (hasVariations || hasAddons) {
      setItemToCustomize(itemToAdd);
      setIsCustomizationModalOpen(true);
      return;
    }
    
    const firstVariation = itemToAdd.variations?.[0];
    if (!firstVariation) {
        alert('This item has no price variations and cannot be added to the cart.');
        return;
    }

    setCurrentOrderItems(prevItems => {
        const existingNewItem = prevItems.find(item =>
            item.id === itemToAdd.id &&
            !item.notes &&
            item.status === 'new' &&
            item.price === firstVariation.price
        );
      
        if (existingNewItem) {
            return prevItems.map(item =>
            item.lineId === existingNewItem.lineId
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            );
        }
      
        const newItem: OrderItem = { 
            id: itemToAdd.id,
            name: itemToAdd.name,
            price: firstVariation.price,
            basePrice: firstVariation.price,
            isVeg: itemToAdd.isVeg,
            quantity: 1, 
            notes: undefined, 
            status: 'new',
            lineId: `line-${Date.now()}`
        };
        return [...prevItems, newItem];
    });
  }, []);
  
   const handleSaveCustomizedItem = useCallback((customizedItem: SaleItem) => {
    // Customized items are always added as new lines to avoid merging complex orders
    const newItem: OrderItem = {
      ...customizedItem,
      status: 'new',
      lineId: `line-${Date.now()}-${Math.random()}`
    };
    setCurrentOrderItems(prev => [...prev, newItem]);
    setIsCustomizationModalOpen(false);
    setItemToCustomize(null);
  }, []);


  const handleUpdateQuantity = useCallback((lineId: string, newQuantity: number) => {
    setCurrentOrderItems(prevItems => {
        const targetItem = prevItems.find(item => item.lineId === lineId);
        if(targetItem?.status === 'sent') return prevItems; // Do not modify sent items

        if (newQuantity <= 0) {
            return prevItems.filter(item => item.lineId !== lineId);
        } else {
            return prevItems.map(item =>
                item.lineId === lineId ? { ...item, quantity: newQuantity } : item
            );
        }
    });
  }, []);

  const handleEditItemNote = (item: OrderItem) => {
    if (item.status === 'sent') return;
    setEditingNoteItem(item);
    setIsNoteModalOpen(true);
  };
  
  const handleSaveItemNote = (lineId: string, newNote: string) => {
    setCurrentOrderItems(prev => prev.map(item =>
      item.lineId === lineId ? { ...item, notes: newNote.trim() || undefined } : item
    ));
    setIsNoteModalOpen(false);
    setEditingNoteItem(null);
  };

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = menuSearchTerm === '' || item.name.toLowerCase().includes(menuSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, menuSearchTerm]);

  const subTotal = useMemo(() => currentOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [currentOrderItems]);
  const discountValue = useMemo(() => discountType === 'fixed' ? discountAmount : (subTotal * discountAmount) / 100, [subTotal, discountType, discountAmount]);
  const taxes = useMemo(() => {
    if (!singleActiveOutlet) return [];
    const totalAfterDiscount = subTotal - discountValue;
    return singleActiveOutlet.taxes.map(tax => ({...tax, amount: totalAfterDiscount * (tax.rate / 100)}));
  }, [subTotal, discountValue, singleActiveOutlet]);
  const totalTaxAmount = useMemo(() => taxes.reduce((sum, tax) => sum + tax.amount, 0), [taxes]);
  const grandTotal = useMemo(() => subTotal - discountValue + totalTaxAmount, [subTotal, discountValue, totalTaxAmount]);

  // Update customer display whenever the order changes
  useEffect(() => {
    if (currentOrderItems.length > 0) {
        const orderDataForDisplay: Partial<Sale> = {
            items: currentOrderItems,
            subTotal: subTotal,
            discountType: discountType || undefined,
            discountAmount: discountAmount || undefined,
            taxDetails: taxes,
            totalAmount: grandTotal,
        };
        localStorage.setItem('customerDisplayOrder', JSON.stringify(orderDataForDisplay));
    } else {
        localStorage.removeItem('customerDisplayOrder');
    }
  }, [currentOrderItems, subTotal, discountType, discountAmount, taxes, grandTotal]);

  const handleFinalizeSale = useCallback((paymentDetails: {
    payments: PartialPayment[],
    tip: number,
    isSettled: boolean,
    splitDetails?: Split[]
  }) => {
    if (currentOrderItems.length === 0) {
      alert("Cannot finalize an empty order.");
      return;
    }
    
    if (!singleActiveOutlet) {
      alert("Error: No active outlet selected. Please select a single outlet.");
      return;
    }
    
    const subTotal = currentOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountValue = discountType === 'fixed' ? discountAmount : (subTotal * discountAmount) / 100;
    const totalAfterDiscount = subTotal - discountValue;
    
    const taxDetails: SaleTaxDetail[] = singleActiveOutlet.taxes.map(tax => {
      const taxAmount = totalAfterDiscount * (tax.rate / 100);
      return { id: tax.id, name: tax.name, rate: tax.rate, amount: taxAmount };
    });
    
    const totalTaxAmount = taxDetails.reduce((sum, tax) => sum + tax.amount, 0);
    const totalAmount = totalAfterDiscount + totalTaxAmount + paymentDetails.tip;
    
    let saleToProcess: Sale;

    if (editingSale) {
        saleToProcess = {
            ...editingSale,
            items: currentOrderItems,
            subTotal: subTotal,
            taxDetails: taxDetails,
            totalAmount: totalAmount,
            partialPayments: paymentDetails.payments,
            paymentMethod: paymentDetails.splitDetails ? 'Split' : paymentDetails.payments[0]?.method || 'Other',
            isSettled: paymentDetails.isSettled,
            tipAmount: paymentDetails.tip > 0 ? paymentDetails.tip : undefined,
            splitDetails: paymentDetails.splitDetails,
        };
        updateSale(saleToProcess);
    } else {
        saleToProcess = recordSale({
          items: currentOrderItems,
          subTotal: subTotal,
          taxDetails: taxDetails,
          totalAmount: totalAmount,
          orderType: orderType,
          partialPayments: paymentDetails.payments,
          paymentMethod: paymentDetails.splitDetails ? 'Split' : paymentDetails.payments[0]?.method || 'Other',
          isSettled: paymentDetails.isSettled,
          pax: orderType === 'Dine In' ? pax : undefined,
          assignedTableId: selectedTable?.id,
          assignedTableName: selectedTable?.name,
          waiterId: selectedWaiter?.id,
          waiterName: selectedWaiter?.name,
          customerId: selectedCustomer?.id,
          customerName: selectedCustomer?.name,
          orderNotes: orderNotes,
          discountType: discountType || undefined,
          discountAmount: discountValue > 0 ? discountAmount : undefined,
          deliveryPartnerId: selectedDeliveryPartner?.id,
          deliveryPartnerName: selectedDeliveryPartner?.name,
          deliveryCommission: selectedDeliveryPartner?.commissionRate,
          tipAmount: paymentDetails.tip > 0 ? paymentDetails.tip : undefined,
          splitDetails: paymentDetails.splitDetails,
          outletId: singleActiveOutlet.id,
        });
    }

    setIsPaymentModalOpen(false);
    setLastCompletedSale(saleToProcess);
    setIsReceiptModalOpen(true);
    clearOrder();
    playSaleFinalizedSound();
    
  }, [currentOrderItems, orderType, pax, selectedTable, selectedWaiter, selectedCustomer, orderNotes, discountType, discountAmount, selectedDeliveryPartner, singleActiveOutlet, recordSale, updateSale, clearOrder, editingSale]);

  if (!singleActiveOutlet) {
    return <FeatureDisabledPage type="selectOutlet" featureName="Point of Sale" />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 font-sans">
      <DiscountModal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} onApplyDiscount={(type, amount) => { setDiscountType(type); setDiscountAmount(amount); }} />
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Select Customer" size="lg">
        <CustomerSelectionModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSelectCustomer={(c) => {setSelectedCustomer(c); setIsCustomerModalOpen(false);}} customers={customers} addCustomer={addCustomer} />
      </Modal>
      {editingNoteItem && <ItemNoteModal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} item={editingNoteItem} onSave={(lineId, note) => handleSaveItemNote(lineId, note)} />}
      {lastCompletedSale && <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Sale Completed" size="sm"><ReceiptModal sale={lastCompletedSale} onClose={() => setIsReceiptModalOpen(false)} /></Modal>}
      {kotData && <KotModal isOpen={isKotModalOpen} kotData={kotData} onClose={() => setIsKotModalOpen(false)} /> }
      {isCustomizationModalOpen && itemToCustomize && <ItemCustomizationModal isOpen={isCustomizationModalOpen} item={itemToCustomize} onClose={() => setIsCustomizationModalOpen(false)} onSave={handleSaveCustomizedItem} />}
      <AiAssistantModal isOpen={isAiAssistantOpen} onClose={() => setIsAiAssistantOpen(false)} />


      {isPaymentModalOpen && (
        <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} orderItems={currentOrderItems} subTotal={subTotal} grandTotal={grandTotal} taxes={taxes} onFinalizeSale={handleFinalizeSale} />
      )}
      
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Left Panel: Categories */}
        <aside className="w-1/4 lg:w-1/5 bg-white p-4 flex flex-col shadow-lg z-10">
            <header className="mb-4">
            <Link to="/" className="text-2xl font-bold text-sky-600">Resto<span className="text-amber-500">Byte</span></Link>
            <p className="text-xs text-gray-500">POS: {singleActiveOutlet.name}</p>
            </header>
            <nav className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
            <PosCategorySidebar categories={categories.filter(c => c !== 'All')} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory}/>
            </nav>
        </aside>

        {/* Middle Panel: Menu Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex-shrink-0 bg-white z-10">
                <PosActionsPanel
                    searchTerm={menuSearchTerm}
                    onSearchChange={setMenuSearchTerm}
                />
            </header>
            <main className="flex-1 p-4 bg-gray-50/50 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredMenu.map(item => (
                    <PosMenuItemCard key={item.id} item={item} onAddItem={handleAddItem} />
                ))}
                </div>
            </main>
        </div>
        
        {/* Right Panel: Cart */}
        <aside className="w-1/4 bg-white flex flex-col p-4 border-l">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800">{editingSale ? 'Update Order' : 'Current Order'}</h2>
                <Button size="sm" variant="danger" onClick={() => clearOrder()} disabled={currentOrderItems.length === 0}><FiXCircle className="mr-1"/> Clear</Button>
            </div>
            
            <CartHeader
                orderType={orderType}
                setOrderType={setOrderType}
                selectedCustomer={selectedCustomer}
                selectedTable={selectedTable}
                selectedWaiter={selectedWaiter}
                onCustomerSelectClick={() => setIsCustomerModalOpen(true)}
                onTableSelect={(e) => setSelectedTable(tables.find(t=>t.id === e.target.value) || null)}
                onWaiterSelect={(e) => setSelectedWaiter(waiters.find(w=>w.id === e.target.value) || null)}
                tables={tables}
                waiters={activeWaiters}
                deliveryPartners={activeDeliveryPartners}
                selectedDeliveryPartner={selectedDeliveryPartner}
                onDeliveryPartnerSelect={e => setSelectedDeliveryPartner(deliveryPartners.find(dp => dp.id === e.target.value) || null)}
            />
            
            <CartItems items={currentOrderItems} onUpdateQuantity={handleUpdateQuantity} onEditItemNote={handleEditItemNote} />

            <div className="flex-shrink-0">
                <CartSummary subTotal={subTotal} discountValue={discountValue} taxes={taxes} grandTotal={grandTotal} onDiscountClick={() => setIsDiscountModalOpen(true)} />
                <CartActions onGoToPayment={() => setIsPaymentModalOpen(true)} onSendKot={handleSendKot} isCartEmpty={currentOrderItems.length === 0} hasNewItems={hasNewItems} />
            </div>
        </aside>
      </div>
      
       <div className="fixed bottom-6 right-6 z-30">
           <Button 
               onClick={() => setIsAiAssistantOpen(true)} 
               className="!rounded-full !p-4 !h-16 !w-16 shadow-lg bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 animate-pulse-glow" 
               title="Open AI Assistant"
           >
               <FiZap size={28} />
           </Button>
       </div>
    </div>
  );
};

export default PosPage;