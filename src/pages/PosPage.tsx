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
import Money from '@/components/common/Money';
import ItemCustomizationModal from '@/components/pos/ItemCustomizationModal'; // New
import AiAssistantModal from '@/components/pos/AiAssistantModal'; // New
import { applyLeftMarginToText, clampCharsPerLine, getConfiguredLineWidth, getDividerLine, getEscPosBottomFeed, getEscPosEmphasizedTitle, getMarginSpaces } from '@/utils/printSettings';
import { isNative, vibrate } from '../utils/capacitorService';
import {
  FiShoppingCart, FiXCircle, FiSearch, FiRefreshCw
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
    preMadeFoodItems,
    foodMenuCategories,
    customers,
    addCustomer,
    tables,
    waiters,
    deliveryPartners,
    outlets,
    activeOutletIds,
    setActiveOutletIds,
    getSingleActiveOutlet,
    applicationSettings,
    websiteSettings,
    recordSale,
    updateSale,
    sales,
    applyCustomerDueDelta,
    printers,
    printInvoice,
    printKot
  } = useRestaurantData();

  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId?: string }>();
  
  const singleActiveOutlet = getSingleActiveOutlet();

  useEffect(() => {
    if (activeOutletIds.length === 1) return;
    if ((outlets || []).length === 0) return;

    const preferredId = activeOutletIds.find(id => outlets.some(o => o.id === id)) || outlets[0]?.id;
    if (preferredId && (activeOutletIds.length !== 1 || activeOutletIds[0] !== preferredId)) {
      setActiveOutletIds([preferredId]);
    }
  }, [activeOutletIds, outlets, setActiveOutletIds]);
  
  // UI State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isKotModalOpen, setIsKotModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // mobile: floating cart sheet open?
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false); // New
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false); // New

  // Order State
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [orderType, setOrderType] = useState<'Dine In' | 'Delivery' | 'Pickup' | 'WhatsApp'>(
    singleActiveOutlet?.outletType === 'CloudKitchen' ? 'Delivery' : (applicationSettings.defaultOrderType || 'Dine In')
  );

  useEffect(() => {
    if (singleActiveOutlet?.outletType === 'CloudKitchen' && orderType === 'Dine In') {
      setOrderType('Delivery');
    }
  }, [singleActiveOutlet?.outletType, orderType]);

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

  const generateKotPrintContent = useCallback((kot: KOT) => {
    const lineWidth = clampCharsPerLine(applicationSettings?.kotCharactersPerLine, applicationSettings?.kotPaperSize);
    const serialWidth = 4;
    const columnGap = 1;
    const qtyWidth = 4;
    const nameWidth = lineWidth - serialWidth - columnGap - qtyWidth;
    const divider = '-'.repeat(lineWidth);
    const centerText = (value: string) => {
      const text = value.trim();
      if (!text) return '';
      if (text.length >= lineWidth) return text;
      const leftPad = Math.floor((lineWidth - text.length) / 2);
      return `${' '.repeat(leftPad)}${text}`;
    };
    const formatTwoCol = (left: string, right: string) => {
      const spaces = Math.max(1, lineWidth - left.length - right.length);
      return `${left}${' '.repeat(spaces)}${right}`;
    };
    const wrapText = (value: string, width: number) => {
      const words = value.trim().split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let current = '';

      words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= width) {
          current = candidate;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      });

      if (current) lines.push(current);
      return lines.length > 0 ? lines : [''];
    };
    const lines: string[] = [];
    const formatLabelLine = (label: string, value: string) => {
      const prefix = `${label} : `;
      const wrapped = wrapText(value, Math.max(8, lineWidth - prefix.length));
      lines.push(`${prefix}${wrapped[0]}`);
      wrapped.slice(1).forEach((line) => {
        lines.push(`${' '.repeat(prefix.length)}${line}`);
      });
    };

    lines.push(getEscPosEmphasizedTitle('KOT', lineWidth) || centerText('KOT'));
    lines.push(formatTwoCol(kot.kotNumber, kot.timestamp));
    lines.push(divider);
    formatLabelLine('Customer', kot.customer || 'Walk-in Customer');
    formatLabelLine('Table No.', kot.table || 'N/A');
    if (kot.waiter) {
      formatLabelLine('Waiter', kot.waiter);
    }
    lines.push(divider);
    lines.push(`${'Sl'.padEnd(serialWidth)}${' '.repeat(columnGap)}${'Item Name'.padEnd(nameWidth)}${'Qty.'.padStart(qtyWidth)}`);
    lines.push(divider);

    kot.items.forEach((item, index) => {
      const serial = String(index + 1).padEnd(serialWidth);
      const nameLines = wrapText(item.name, nameWidth);
      const qty = String(item.quantity).padStart(qtyWidth);
      lines.push(`${serial}${' '.repeat(columnGap)}${nameLines[0].padEnd(nameWidth)}${qty}`);
      nameLines.slice(1).forEach((line) => {
        lines.push(`${' '.repeat(serialWidth + columnGap)}${line}`);
      });
      if (item.notes) {
        wrapText(`Note: ${item.notes}`, nameWidth).forEach((line) => {
          lines.push(`${' '.repeat(serialWidth + columnGap)}${line}`);
        });
      }
    });

    lines.push(divider);
    lines.push(centerText(`Total Items : ${kot.items.length}`));
    lines.push(divider);

    return `${lines.join('\r\n')}\r\n${getEscPosBottomFeed(12)}`;
  }, [applicationSettings?.kotCharactersPerLine]);

  const generateInvoicePrintContent = useCallback((sale: Sale) => {
    const marginSpaces = getMarginSpaces(applicationSettings.invoiceSideMarginMm);
    const lineWidth = Math.max(24, getConfiguredLineWidth(
      applicationSettings.invoicePaperSize,
      applicationSettings.invoiceCharactersPerLine
    ) - marginSpaces * 2);
    const divider = getDividerLine(lineWidth, applicationSettings.invoiceDividerStyle);
    const itemNameWidth = Math.max(10, lineWidth - 17);
    const outletName = singleActiveOutlet?.restaurantName || singleActiveOutlet?.name || websiteSettings.whiteLabel.appName || 'Demo Restaurant';
    const outletAddress = singleActiveOutlet?.address || 'Address not set';
    const outletPhone = singleActiveOutlet?.phone || 'Phone not set';
    const outletEmail = singleActiveOutlet?.email || websiteSettings.contactUsContent.email || '';
    const customer = sale.customerId ? customers.find((item) => item.id === sale.customerId) : undefined;
    const showRestaurantDetails = applicationSettings.invoiceShowRestaurantDetails ?? true;
    const showRestaurantName = applicationSettings.invoiceShowRestaurantName ?? true;
    const showRestaurantAddress = applicationSettings.invoiceShowRestaurantAddress ?? true;
    const showRestaurantPhone = applicationSettings.invoiceShowRestaurantPhone ?? true;
    const showRestaurantEmail = applicationSettings.invoiceShowRestaurantEmail ?? true;

    const centerText = (value: string) => {
      const text = value.trim();
      if (!text) return '';
      if (text.length >= lineWidth) return `${text}\n`;
      const leftPad = Math.floor((lineWidth - text.length) / 2);
      return `${' '.repeat(leftPad)}${text}\n`;
    };

    const formatPair = (label: string, value: string) => {
      const suffix = `: ${value}`;
      const spaces = Math.max(1, lineWidth - label.length - suffix.length);
      return `${label}${' '.repeat(spaces)}${suffix}\n`;
    };

    const formatItemsSummary = (count: number, subtotal: number) => {
      const left = `Items/${count}`;
      const middle = 'Sub Total';
      const right = subtotal.toFixed(2);
      const firstGap = Math.max(1, 17 - left.length);
      const secondGap = Math.max(1, lineWidth - left.length - firstGap - middle.length - right.length);
      return `${left}${' '.repeat(firstGap)}${middle}${' '.repeat(secondGap)}${right}\n`;
    };

    const formatMoneyLine = (label: string, amount: number) => {
      const amountText = amount.toFixed(2);
      const spaces = Math.max(1, lineWidth - label.length - amountText.length);
      return `${label}${' '.repeat(spaces)}${amountText}\n`;
    };

    let invoiceText = '';
    if (showRestaurantDetails) {
      if (showRestaurantName) {
        invoiceText += getEscPosEmphasizedTitle(outletName, lineWidth) || centerText(outletName.toUpperCase());
      }
      if (showRestaurantAddress) invoiceText += centerText(outletAddress);
      if (showRestaurantPhone) invoiceText += centerText(`Tel No.: ${outletPhone}`);
      if (showRestaurantEmail && outletEmail) {
        invoiceText += centerText(`Email: ${outletEmail}`);
      }
      if (applicationSettings.invoiceRestaurantSectionTitle?.trim()) {
        invoiceText += centerText(applicationSettings.invoiceRestaurantSectionTitle.trim());
      }
      invoiceText += `${divider}\n\n`;
    }
    invoiceText += centerText(applicationSettings.invoiceTitle || sale.orderType || 'Invoice');
    invoiceText += `${divider}\n`;

    if (applicationSettings.invoiceShowCustomerDetails && customer) {
      invoiceText += `${applicationSettings.invoiceCustomerSectionTitle || 'Customer Details'}\n`;
      invoiceText += `${divider}\n`;
      if (applicationSettings.invoiceShowCustomerName) invoiceText += formatPair('Name', customer.name);
      if (applicationSettings.invoiceShowCustomerPhone && customer.phone) invoiceText += formatPair('Phone', customer.phone);
      if (applicationSettings.invoiceShowCustomerEmail && customer.email) invoiceText += formatPair('Email', customer.email);
      if (applicationSettings.invoiceShowCustomerAddress && customer.address) invoiceText += formatPair('Address', customer.address);
      if (applicationSettings.invoiceShowCustomerCompany && customer.companyName) invoiceText += formatPair('Company', customer.companyName);
      if (applicationSettings.invoiceShowCustomerVatPan && customer.vatPan) invoiceText += formatPair('VAT/PAN', customer.vatPan);
      invoiceText += `${divider}\n`;
    }

    invoiceText += formatPair('Bill No', `DNBILL ${sale.id.slice(-4).toUpperCase()}`);
    if (sale.assignedTableName) {
      invoiceText += formatPair('Table Name', `${sale.assignedTableName}   Pax: ${sale.pax || 1}`);
    }
    if (sale.waiterName) {
      invoiceText += formatPair('Waiter', sale.waiterName);
    }
    invoiceText += formatPair('Date & Time', new Date(sale.saleDate).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    invoiceText += formatPair('Bill By', 'Admin');
    invoiceText += `${divider}\n`;
    invoiceText += `${'Item Name'.padEnd(itemNameWidth)}Qty   Rate Amount\n`;
    invoiceText += `${divider}\n`;

    sale.items.forEach((item) => {
      const name = item.name.substring(0, itemNameWidth).padEnd(itemNameWidth);
      const qty = item.quantity.toString().padStart(4);
      const rate = item.price.toFixed(2).padStart(6);
      const amount = (item.price * item.quantity).toFixed(2).padStart(7);
      invoiceText += `${name}${qty} ${rate} ${amount}\n`;
    });

    invoiceText += `${divider}\n`;
    invoiceText += formatItemsSummary(sale.items.length, sale.subTotal);

    if (applicationSettings.invoiceShowTaxBreakdown) {
      sale.taxDetails.forEach((tax) => {
        invoiceText += formatMoneyLine(`${tax.name} (${tax.rate}%)`, tax.amount);
      });
    }

    if (sale.discountAmount && sale.discountAmount > 0) {
      const discountVal = sale.discountType === 'percentage'
        ? (sale.subTotal * sale.discountAmount) / 100
        : sale.discountAmount;
      invoiceText += formatMoneyLine('Discount', -discountVal);
    }

    if (sale.tipAmount && sale.tipAmount > 0) {
      invoiceText += formatMoneyLine('Tip', sale.tipAmount);
    }

    invoiceText += `${divider}\n`;
    invoiceText += formatMoneyLine('Grand Total', sale.totalAmount);
    invoiceText += `\n`;

    if (applicationSettings.invoiceShowPaymentDetails) {
      invoiceText += `Payment Details\n`;
      invoiceText += `${divider}\n`;
      if (applicationSettings.invoiceShowPaymentMethod && sale.paymentMethod) {
        invoiceText += formatPair('Payment Method', sale.paymentMethod);
      }
      if (applicationSettings.invoiceShowPaymentDate) {
        invoiceText += formatPair('Payment Date', new Date(sale.paymentDate || sale.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }));
      }
      if (applicationSettings.invoiceShowPaymentReference && sale.paymentReference) {
        invoiceText += formatPair('Reference', sale.paymentReference);
      }
      if (applicationSettings.invoiceShowReceivedAmount) {
        invoiceText += formatPair('Received Amount', (sale.receivedAmount || sale.totalAmount).toFixed(2));
      }
      if (applicationSettings.invoiceShowReturnAmount && ((sale.returnAmount ?? 0) > 0 || ((sale.receivedAmount ?? 0) > sale.totalAmount))) {
        invoiceText += formatPair('Return/Change Amount', ((sale.returnAmount ?? 0) || ((sale.receivedAmount || sale.totalAmount) - sale.totalAmount)).toFixed(2));
      }
      invoiceText += `\n`;
    }

    if (applicationSettings.invoiceShowReturnInformation && applicationSettings.invoiceReturnPolicyText) {
      invoiceText += `Return Policy\n`;
      invoiceText += `${divider}\n`;
      invoiceText += `${applicationSettings.invoiceReturnPolicyText}\n\n`;
    }

    invoiceText += centerText(applicationSettings.invoiceFooterText || 'Thank you Visit Us Again!');
    if (applicationSettings.invoiceShowQrCode) {
      invoiceText += centerText(`Scan: /invoice/${sale.id}`);
    }
    invoiceText += `\n`;
    invoiceText += centerText('Powered by RestoByte Software');
    invoiceText += `${divider}\n`;

    return `${applyLeftMarginToText(invoiceText, marginSpaces)}${getEscPosBottomFeed(12)}`;
  }, [applicationSettings, customers, singleActiveOutlet, websiteSettings.contactUsContent.email, websiteSettings.whiteLabel.appName]);

  const directKotPrinters = useMemo(
    () => printers.filter((printer) => printer.isActive && (printer.type === 'Kitchen Order Ticket (KOT)' || printer.autoPrintKOT)),
    [printers]
  );
  const autoPrintInvoicePrinters = useMemo(
    () => printers.filter((printer) => printer.isActive && printer.autoPrintReceipt === true),
    [printers]
  );
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    for (const c of (foodMenuCategories || [])) categorySet.add(c.name);
    for (const item of (preMadeFoodItems || [])) {
      const categoryName = typeof item.category === 'object' && item.category !== null ? (item.category as any).name : item.category;
      if (typeof categoryName === 'string' && categoryName.trim()) categorySet.add(categoryName);
    }
    return ['All', ...Array.from(categorySet)];
  }, [foodMenuCategories, preMadeFoodItems]);
  const activeWaiters = useMemo(() => (waiters || []), [waiters]);
  const activeDeliveryPartners = useMemo(() => (deliveryPartners || []).filter(dp => dp.isEnabled), [deliveryPartners]);
  const hasNewItems = useMemo(() => (currentOrderItems || []).some(item => item.status === 'new'), [currentOrderItems]);
  
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
const handleSendKot = useCallback(async () => {
    const newItems = (currentOrderItems || []).filter(item => item.status === 'new');
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

    const subTotal = (currentOrderItems || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountValue = discountType === 'fixed' ? discountAmount : (subTotal * discountAmount) / 100;
    const totalAfterDiscount = subTotal - discountValue;
    
    const taxDetails: SaleTaxDetail[] = (singleActiveOutlet.taxes || []).map(tax => {
      const taxAmount = totalAfterDiscount * (tax.rate / 100);
      return { id: tax.id, name: tax.name, rate: tax.rate, amount: taxAmount };
    });
    
    const totalTaxAmount = (taxDetails || []).reduce((sum, tax) => sum + tax.amount, 0);
    const totalAmount = totalAfterDiscount + totalTaxAmount;

    if (editingSale) {
        const savedSale = await updateSale({
            ...editingSale,
            items: currentOrderItems,
            subTotal,
            taxDetails,
            totalAmount,
            isSettled: false,
            isClosed: false,
        });
        if (!savedSale) return;
        setEditingSale(savedSale);
    } else {
        const newSale = await recordSale({
            items: currentOrderItems,
            subTotal,
            taxDetails,
            totalAmount,
            orderType,
            isSettled: false,
            isClosed: false,
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
        if (!newSale) return;
        setEditingSale(newSale);
    }
    
    const kot: KOT = {
        kotNumber: `KOT-${Date.now().toString().slice(-5)}`,
        customer: selectedCustomer?.name,
        table: selectedTable?.name,
        waiter: selectedWaiter?.name,
        timestamp: (() => {
          const now = new Date();
          const datePart = now.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          });
          const timePart = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }).toUpperCase();
          return `${datePart} ${timePart}`;
        })(),
        items: newItems,
    };
    setKotData(kot);
    setIsKotModalOpen(true);
    const kotPrintContent = generateKotPrintContent(kot);
    directKotPrinters.forEach((printer) => {
      void printKot(printer.id, kotPrintContent);
    });
    playKotSentSound();

    setCurrentOrderItems(prevItems => 
        prevItems.map(item => 
            item.status === 'new' ? { ...item, status: 'sent' } : item
        )
    );
  }, [
    currentOrderItems, orderType, selectedTable, selectedWaiter, singleActiveOutlet, editingSale,
    recordSale, updateSale, setEditingSale, discountType, discountAmount, pax,
    selectedCustomer, orderNotes, selectedDeliveryPartner, generateKotPrintContent, directKotPrinters, printKot
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
          const openOrderForTable = sales.find(s => s.assignedTableId === tableId && !(s.isClosed ?? s.isSettled));
          
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
            isVeg: itemToAdd.isVegetarian === undefined ? true : itemToAdd.isVegetarian,
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
    setCurrentOrderItems(prev => (prev || []).map(item =>
      item.lineId === lineId ? { ...item, notes: newNote.trim() || undefined } : item
    ));
    setIsNoteModalOpen(false);
    setEditingNoteItem(null);
  };

  const mergedMenuItems = useMemo(() => {
    const normalizedPreMade = (preMadeFoodItems || []).map(item => {
      const normalizedPrice = typeof item.price === 'number' ? item.price : (item.variations?.[0]?.price ?? 0);
      const normalizedIsVeg = item.isVegetarian === undefined ? ((item as any).isVeg === undefined ? true : (item as any).isVeg) : item.isVegetarian;
      return { ...item, price: normalizedPrice, isVegetarian: normalizedIsVeg };
    });
    return [...(menuItems || []), ...normalizedPreMade];
  }, [menuItems, preMadeFoodItems]);

  const filteredMenu = useMemo(() => {
    return (mergedMenuItems || []).filter(item => {
      const categoryName = typeof item.category === 'object' && item.category !== null ? (item.category as any).name : item.category;
      const matchesCategory = selectedCategory === 'All' || categoryName === selectedCategory;
      const matchesSearch = menuSearchTerm === '' || item.name.toLowerCase().includes(menuSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [mergedMenuItems, selectedCategory, menuSearchTerm]);

  const subTotal = useMemo(() => (currentOrderItems || []).reduce((sum, item) => sum + item.price * item.quantity, 0), [currentOrderItems]);
  const discountValue = useMemo(() => discountType === 'fixed' ? discountAmount : (subTotal * discountAmount) / 100, [subTotal, discountType, discountAmount]);
  const taxes = useMemo(() => {
    if (!singleActiveOutlet) return [];
    const totalAfterDiscount = subTotal - discountValue;
    return (singleActiveOutlet.taxes || []).map(tax => ({...tax, amount: totalAfterDiscount * (tax.rate / 100)}));
  }, [subTotal, discountValue, singleActiveOutlet]);
  const totalTaxAmount = useMemo(() => (taxes || []).reduce((sum, tax) => sum + tax.amount, 0), [taxes]);
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

  const handleFinalizeSale = useCallback(async (paymentDetails: {
    payments: PartialPayment[],
    tip: number,
    isSettled: boolean,
    splitDetails?: Split[],
    receivedAmount: number,
    returnAmount: number
  }) => {
    if ((currentOrderItems || []).length === 0) {
      alert("Cannot finalize an empty order.");
      return;
    }
    
    if (!singleActiveOutlet) {
      alert("Error: No active outlet selected. Please select a single outlet.");
      return;
    }
    
    const subTotal = (currentOrderItems || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountValue = discountType === 'fixed' ? discountAmount : (subTotal * discountAmount) / 100;
    const totalAfterDiscount = subTotal - discountValue;
    
    const taxDetails: SaleTaxDetail[] = (singleActiveOutlet.taxes || []).map(tax => {
      const taxAmount = totalAfterDiscount * (tax.rate / 100);
      return { id: tax.id, name: tax.name, rate: tax.rate, amount: taxAmount };
    });
    
    const totalTaxAmount = (taxDetails || []).reduce((sum, tax) => sum + tax.amount, 0);
    const totalAmount = totalAfterDiscount + totalTaxAmount + paymentDetails.tip;
    const totalPaid = (paymentDetails.payments || []).reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : Number(p.amount)), 0);
    const outstandingAmount = Math.max(0, totalAmount - totalPaid);
    
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
            isClosed: true,
            tipAmount: paymentDetails.tip > 0 ? paymentDetails.tip : undefined,
            splitDetails: paymentDetails.splitDetails,
            receivedAmount: paymentDetails.receivedAmount,
            returnAmount: paymentDetails.returnAmount,
        };
        const savedSale = await updateSale(saleToProcess);
        if (!savedSale) return;
        saleToProcess = savedSale;
    } else {
        const savedSale = await recordSale({
          items: currentOrderItems,
          subTotal: subTotal,
          taxDetails: taxDetails,
          totalAmount: totalAmount,
          orderType: orderType,
          partialPayments: paymentDetails.payments,
          paymentMethod: paymentDetails.splitDetails ? 'Split' : paymentDetails.payments[0]?.method || 'Other',
          isSettled: paymentDetails.isSettled,
          isClosed: true,
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
          receivedAmount: paymentDetails.receivedAmount,
          returnAmount: paymentDetails.returnAmount,
        });
        if (!savedSale) return;
        saleToProcess = savedSale;
    }

    if (!paymentDetails.isSettled && saleToProcess.customerId && outstandingAmount > 0) {
        void applyCustomerDueDelta(saleToProcess.customerId, outstandingAmount);
    }

    setIsPaymentModalOpen(false);
    setLastCompletedSale(saleToProcess);
    setIsReceiptModalOpen(true);
    if (autoPrintInvoicePrinters.length > 0) {
      const invoicePrintContent = generateInvoicePrintContent(saleToProcess);
      autoPrintInvoicePrinters.forEach((printer) => {
        void printInvoice(printer.id, invoicePrintContent);
      });
    }
    clearOrder();
    playSaleFinalizedSound();
    
  }, [currentOrderItems, orderType, pax, selectedTable, selectedWaiter, selectedCustomer, orderNotes, discountType, discountAmount, selectedDeliveryPartner, singleActiveOutlet, recordSale, updateSale, clearOrder, editingSale, applyCustomerDueDelta, autoPrintInvoicePrinters, generateInvoicePrintContent, printInvoice]);

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
      
      {!isNative && (
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Left Panel: Categories */}
        <aside className="w-1/5 lg:w-1/6 bg-white p-4 flex flex-col shadow-lg z-10">
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
      )}

      {/* ===== Mobile-native POS layout ===== */}
      {isNative && (
        <div className="rb-pos-mobile">
          {/* Menu (always mounted; cart floats above as a sheet) */}
          <div className="rb-pos-mobile-menu">
            {/* Search box */}
            <div className="rb-pos-search">
              <FiSearch size={16} className="rb-pos-search-icon" />
              <input
                type="text"
                inputMode="search"
                placeholder="Search food..."
                value={menuSearchTerm}
                onChange={e => setMenuSearchTerm(e.target.value)}
                className="rb-pos-search-input"
              />
              {menuSearchTerm && (
                <button
                  type="button"
                  onClick={() => { setMenuSearchTerm(''); vibrate(); }}
                  className="rb-pos-search-clear"
                  aria-label="Clear search"
                >&times;</button>
              )}
            </div>

            {/* Categories as horizontal chip scroll */}
            <div className="rb-pos-cat-row">
              <button
                className={`rb-pos-cat-chip ${selectedCategory === 'All' ? 'rb-pos-cat-chip-active' : ''}`}
                onClick={() => setSelectedCategory('All')}
              >All</button>
              {categories.filter(c => c !== 'All').map(cat => (
                <button
                  key={cat}
                  className={`rb-pos-cat-chip ${selectedCategory === cat ? 'rb-pos-cat-chip-active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >{cat}</button>
              ))}
            </div>

            <main className="rb-pos-mobile-grid">
              <div className="grid grid-cols-3 gap-2.5">
                {filteredMenu.map(item => (
                  <PosMenuItemCard key={item.id} item={item} onAddItem={(it) => { handleAddItem(it); vibrate(); }} />
                ))}
              </div>
            </main>

            {/* Floating mini-cart bar — always visible at the bottom of the menu. */}
            {currentOrderItems.length > 0 ? (
              <button className="rb-pos-minicart" onClick={() => { setCartOpen(true); vibrate(); }}>
                <span className="rb-pos-minicart-count">{currentOrderItems.length}</span>
                <span className="rb-pos-minicart-label">View Order</span>
                <span className="rb-pos-minicart-total"><Money amount={grandTotal} /></span>
                <FiShoppingCart size={18} />
              </button>
            ) : (
              <div className="rb-pos-minicart rb-pos-minicart-empty">No items in cart</div>
            )}
          </div>

          {/* Floating cart sheet (overlay above the menu) */}
          {cartOpen && (
            <div className="rb-pos-cart-sheet" role="dialog" aria-modal="true">
              <div className="rb-pos-cart-backdrop" onClick={() => setCartOpen(false)} />
              <div className="rb-pos-cart-panel">
                {editingSale && (
                  <div className="rb-pos-edit-banner">
                    <FiRefreshCw size={15} />
                    <span>Updating order · {editingSale.assignedTableName || 'Table'}</span>
                  </div>
                )}
                <div className="rb-pos-cart-bar">
                  <button className="rb-pos-back" onClick={() => { setCartOpen(false); vibrate(); }}>‹ Close</button>
                  <h2 className="rb-pos-cart-title">{editingSale ? 'Update Order' : 'Current Order'}</h2>
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

                <div className="rb-pos-cart-items">
                  <CartItems items={currentOrderItems} onUpdateQuantity={handleUpdateQuantity} onEditItemNote={handleEditItemNote} />
                </div>

                <div className="rb-pos-cart-foot">
                  <CartSummary subTotal={subTotal} discountValue={discountValue} taxes={taxes} grandTotal={grandTotal} onDiscountClick={() => setIsDiscountModalOpen(true)} />
                  <CartActions onGoToPayment={() => setIsPaymentModalOpen(true)} onSendKot={handleSendKot} isCartEmpty={currentOrderItems.length === 0} hasNewItems={hasNewItems} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PosPage;
