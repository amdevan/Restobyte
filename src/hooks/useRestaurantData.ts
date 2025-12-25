
import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { 
    MenuItem, Table, TableStatus, Reservation, Sale, SaleItem, FoodMenuCategory, PreMadeFoodItem, 
    StockItem, StockEntry, StockEntryItem, StockAdjustment, StockAdjustmentItem, StockAdjustmentType,
    Supplier, Customer, AreaFloor, Kitchen, Printer, PrinterType, PrinterInterfaceType, Counter, Waiter,
    Currency, Denomination, Purchase, PurchaseItem, ExpenseCategory, Expense, WasteRecord, Employee,
    AttendanceRecord, AttendanceStatus, ReservationSettings, ReservationAvailability, WebsiteSettings,
    PaymentMethod, Outlet, User, Role, ApplicationSettings, Tax, SaleTaxDetail, DeliveryPartner, Split, RestaurantDataContextType, SaasWebsiteContent, SaasPost,
    Plan, AddonGroup, PayrollRecord, SaaSSettings, SoundSettings
} from '../types';
import { INITIAL_TABLES_COUNT } from '../constants';

const RestaurantDataContext = createContext<RestaurantDataContextType | undefined>(undefined);

const generateInitialTables = (): Table[] => {
  return Array.from({ length: INITIAL_TABLES_COUNT }, (_, i) => ({
    id: `table-${i + 1}`,
    name: `Table ${i + 1}`,
    capacity: (i % 3 === 0) ? 6 : (i % 2 === 0 ? 4 : 2), 
    status: TableStatus.Free,
    areaFloorId: undefined,
    occupiedSince: undefined,
    notes: undefined,
    assistanceRequested: false,
    assistanceRequestedAt: undefined,
    foodReady: false,
  }));
};

const initialStockItems: StockItem[] = [
    { id: 'si-1', name: 'Tomatoes', category: 'Vegetables', quantity: 15, unit: 'kg', lowStockThreshold: 5, costPerUnit: 1.5 },
    { id: 'si-2', name: 'Chicken Breast', category: 'Meat', quantity: 20, unit: 'kg', lowStockThreshold: 10, costPerUnit: 5 },
    { id: 'si-3', name: 'Flour', category: 'Baking', quantity: 50, unit: 'kg', lowStockThreshold: 10, costPerUnit: 1 },
    { id: 'si-4', name: 'Olive Oil', category: 'Oils', quantity: 8, unit: 'ltr', lowStockThreshold: 2, costPerUnit: 8 },
    { id: 'si-5', name: 'Milk', category: 'Dairy', quantity: 3, unit: 'ltr', lowStockThreshold: 5, costPerUnit: 0.8 },
];
const initialCustomers: Customer[] = [
    { id: 'cust-walkin', name: 'Walk-in Customer', phone: 'N/A', dob: undefined, dueAmount: 0 },
    { id: 'cust-1', name: 'Alice Wonderland', phone: '555-1234', email: 'alice@example.com', address: '123 Rabbit Hole Lane', dob: '1990-03-15', dueAmount: 75.50, companyName: 'Wonderland Inc.', vatPan: 'VAT12345' },
    { id: 'cust-2', name: 'Bob The Builder', phone: '555-5678', email: 'bob@example.com', address: '456 Construction Rd', dob: '1985-07-22', dueAmount: 0, companyName: 'Bob\'s Constructions', vatPan: 'PAN67890' },
    { id: 'cust-3', name: 'Charlie Brown', phone: '555-8765', email: 'charlie@example.com', address: '789 Comic Strip Ave', dob: '2000-10-04', dueAmount: 120.00 },
];
const initialAreasFloors: AreaFloor[] = [
    { id: 'af-1', name: 'Ground Floor', description: 'Main dining area near the entrance.' },
    { id: 'af-2', name: 'Patio', description: 'Outdoor seating area.' },
];
const initialKitchens: Kitchen[] = [];
const initialPrinters: Printer[] = [
    { id: 'printer-1', name: 'Main Receipt Printer', type: PrinterType.Receipt, interfaceType: PrinterInterfaceType.Network, ipAddress: '192.168.1.100', port: '9100'},
    { id: 'printer-2', name: 'Kitchen KOT Printer', type: PrinterType.KOT, interfaceType: PrinterInterfaceType.Network, ipAddress: '192.168.1.101', port: '9100'},
];
const initialCounters: Counter[] = [
    { id: 'counter-1', name: 'Main Counter', assignedPrinterIds: ['printer-1'] },
];
const initialWaiters: Waiter[] = [
    { id: 'waiter-1', name: 'John Doe', employeeId: 'EMP001' },
    { id: 'waiter-2', name: 'Jane Smith', employeeId: 'EMP002' },
];
const initialCurrencies: Currency[] = [
    { id: 'curr-1', name: 'US Dollar', code: 'USD', symbol: '$', exchangeRate: 1, isDefault: true },
];
const initialDenominations: Denomination[] = [];
const initialPurchases: Purchase[] = [];
const initialExpenseCategories: ExpenseCategory[] = [
    { id: 'exp-cat-1', name: 'Rent' },
    { id: 'exp-cat-2', name: 'Utilities' },
    { id: 'exp-cat-3', name: 'Marketing' },
    { id: 'exp-cat-4', name: 'Salaries' },
    { id: 'exp-cat-5', name: 'Supplies' },
];
const initialExpenses: Expense[] = [];
const initialWasteRecords: WasteRecord[] = [];

const initialEmployees: Employee[] = [
     { id: 'emp-1', name: 'John Doe', employeeId: 'EMP001', phone: '555-0001', joiningDate: '2023-01-15', designation: 'Senior Waiter', isActive: true, isWaiter: true, waiterId: 'waiter-1' },
    { id: 'emp-2', name: 'Jane Smith', employeeId: 'EMP002', phone: '555-0002', joiningDate: '2023-02-20', designation: 'Waiter/Waitress', isActive: true, isWaiter: true, waiterId: 'waiter-2' },
    { id: 'emp-3', name: 'Peter Pan', employeeId: 'EMP003', phone: '555-0003', joiningDate: '2023-03-10', designation: 'Manager', isActive: true, isWaiter: false, salary: 50000 },
];
const initialAttendanceRecords: AttendanceRecord[] = [];
const initialPayrollRecords: PayrollRecord[] = [];

const initialPaymentMethods: PaymentMethod[] = [
    { id: 'pm-1', name: 'Cash', isEnabled: true },
    { id: 'pm-2', name: 'Card', isEnabled: true },
    { id: 'pm-3', name: 'Online Payment', isEnabled: true },
    { id: 'pm-4', name: 'Other', isEnabled: true },
];
const initialDeliveryPartners: DeliveryPartner[] = [
    { id: 'dp-1', name: 'Uber Eats', commissionRate: 15, isEnabled: true },
    { id: 'dp-2', name: 'DoorDash', commissionRate: 12.5, isEnabled: true },
];

const initialApplicationSettings: ApplicationSettings = {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12h',
    currencySymbolPosition: 'before',
    decimalPlaces: 2,
    kotCharactersPerLine: 42,
    defaultWalkInCustomerId: 'cust-walkin',
    defaultOrderType: 'Dine In',
};

const initialOutlets: Outlet[] = [
    { id: 'outlet-1', name: 'Downtown Branch', restaurantName: 'RestoByte Downtown', address: '123 Main St, Anytown', phone: '555-111-2222', outletType: 'Restaurant', taxes: [{id: 'tax-1', name: 'VAT', rate: 5}], plan: 'Pro', subscriptionStatus: 'active', registrationDate: new Date().toISOString() },
];

const initialRoles: Role[] = [
    { id: 'role-admin', name: 'Admin', permissions: ['*'] },
    { id: 'role-cashier', name: 'Cashier', permissions: ['pos', 'sales_history'] },
];
const initialUsers: User[] = [
    { id: 'user-admin', username: 'admin', passwordHash: 'admin123', roleId: 'role-admin', outletId: 'outlet-1', isActive: true },
    { id: 'user-superadmin', username: 'superadmin', passwordHash: 'superadmin123', roleId: 'role-admin', outletId: 'outlet-1', isActive: true, isSuperAdmin: true },
];

const initialAddonGroups: AddonGroup[] = [
    { id: 'ag-1', name: 'Toppings', addons: [{id: 'addon-1', name: 'Extra Cheese', price: 1.50}, {id: 'addon-2', name: 'Pepperoni', price: 2.00}] }
];

const initialSaasSettings: SaaSSettings = {
    sms: { provider: '', apiKey: '', senderId: ''},
    paymentGateways: {
        stripe: { isEnabled: false, publicKey: '', secretKey: '' },
        khalti: { isEnabled: false, publicKey: '', secretKey: '' }
    },
    legal: { termsOfService: '', privacyPolicy: '' },
    maintenance: { isEnabled: false, message: '' }
};

const initialPlans: Plan[] = [
    { id: 'plan-1', name: 'Basic', price: 29, period: 'monthly', features: ['POS', 'Table Management'], isPublic: true, isActive: true },
    { id: 'plan-2', name: 'Pro', price: 59, period: 'monthly', features: ['All Basic features', 'Inventory', 'Reports'], isPublic: true, isActive: true, isFeatured: true },
];

const initialSaasWebsiteContent: SaasWebsiteContent = {
    sectionOrder: [],
    header: { logoUrl: '', navLinks: [{id: 'l1', text: 'Features', url: '#features'}, {id: 'l2', text: 'Pricing', url: '#pricing'}] },
    footer: { copyright: '© 2024 RestoByte. All rights reserved.', columns: [], socialLinks: [] },
    seo: { title: 'RestoByte', description: '', faviconUrl: '' },
    pages: [],
    hero: { title: 'The Ultimate Restaurant Management Platform', subtitle: 'From point of sale to inventory management, streamline your operations and delight your customers.', imageUrl: 'https://placehold.co/1200x600' },
    trustedByLogos: [{id: 'tb1', name: 'Gourmet Grill', logoUrl: ''}, {id: 'tb2', name: 'The Cozy Cafe', logoUrl: ''}],
    statistics: [{id: 'st1', value: '1M+', label: 'Orders Processed'}],
    features: [{id: 'f1', icon: 'FiShoppingCart', title: 'POS System', description: 'A fast and reliable point of sale system.'}],
    cta: { title: 'Get Started with RestoByte', subtitle: 'Sign up today and see the difference.', buttonText: 'Start Free Trial'},
    pricing: [],
    testimonials: [],
    blogPosts: []
};

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    });
  
    const setValue: React.Dispatch<React.SetStateAction<T>> = value => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(error);
      }
    };
  
    return [storedValue, setValue];
};

export const RestaurantDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // This is a simplified implementation. A real app would use a more robust state management solution.
    const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>('menuItems', []);
    const [tables, setTables] = useLocalStorage<Table[]>('tables', generateInitialTables());
    const [reservations, setReservations] = useLocalStorage<Reservation[]>('reservations', []);
    const [sales, setSales] = useLocalStorage<Sale[]>('sales', []);
    const [foodMenuCategories, setFoodMenuCategories] = useLocalStorage<FoodMenuCategory[]>('foodMenuCategories', []);
    const [preMadeFoodItems, setPreMadeFoodItems] = useLocalStorage<PreMadeFoodItem[]>('preMadeFoodItems', []);
    const [stockItems, setStockItems] = useLocalStorage<StockItem[]>('stockItems', initialStockItems);
    const [stockEntries, setStockEntries] = useLocalStorage<StockEntry[]>('stockEntries', []);
    const [stockAdjustments, setStockAdjustments] = useLocalStorage<StockAdjustment[]>('stockAdjustments', []);
    const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
    const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', initialCustomers);
    const [areasFloors, setAreasFloors] = useLocalStorage<AreaFloor[]>('areasFloors', initialAreasFloors);
    const [kitchens, setKitchens] = useLocalStorage<Kitchen[]>('kitchens', initialKitchens);
    const [printers, setPrinters] = useLocalStorage<Printer[]>('printers', initialPrinters);
    const [counters, setCounters] = useLocalStorage<Counter[]>('counters', initialCounters);
    const [waiters, setWaiters] = useLocalStorage<Waiter[]>('waiters', initialWaiters);
    // const [currencies, setCurrencies] = useLocalStorage<Currency[]>('currencies', initialCurrencies);
    const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);

    useEffect(() => {
        fetch('http://localhost:3000/api/currencies')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCurrencies(data);
                }
            })
            .catch(err => console.error('Failed to fetch currencies:', err));
    }, []);

    const [denominations, setDenominations] = useLocalStorage<Denomination[]>('denominations', initialDenominations);
    const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', initialPurchases);
    const [expenseCategories, setExpenseCategories] = useLocalStorage<ExpenseCategory[]>('expenseCategories', initialExpenseCategories);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', initialExpenses);
    const [wasteRecords, setWasteRecords] = useLocalStorage<WasteRecord[]>('wasteRecords', initialWasteRecords);
    const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', initialEmployees);
    const [attendanceRecords, setAttendanceRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', initialAttendanceRecords);
    const [payrollRecords, setPayrollRecords] = useLocalStorage<PayrollRecord[]>('payrollRecords', initialPayrollRecords);
    const [paymentMethods, setPaymentMethods] = useLocalStorage<PaymentMethod[]>('paymentMethods', initialPaymentMethods);
    const [deliveryPartners, setDeliveryPartners] = useLocalStorage<DeliveryPartner[]>('deliveryPartners', initialDeliveryPartners);
    const [isSelfOrderEnabled, setSelfOrderStatus] = useLocalStorage<boolean>('isSelfOrderEnabled', false);
    const [isReservationOrderEnabled, setReservationOrderStatus] = useLocalStorage<boolean>('isReservationOrderEnabled', false);
    const [reservationOrderReceivingUserIds, setReservationOrderReceivingUserIds] = useLocalStorage<string[]>('reservationOrderReceivingUserIds', []);
    const [reservationSettings, setReservationSettings] = useLocalStorage<ReservationSettings>('reservationSettings', { enabled: true, availability: [] });
    const [websiteSettings, setWebsiteSettings] = useLocalStorage<WebsiteSettings>('websiteSettings', { orderEnabled: true, orderReceivingUserIds: [], whiteLabel: { appName: 'RestoByte', primaryColor: '#0ea5e9' }, homePageContent: { bannerSection: { title: 'Welcome', subtitle: '' }, serviceSection: {services:[]}, exploreMenuSection: {title: 'Explore', subtitle: '', buttonText: 'View Menu'}, gallery: [], socialMedia: []}, availableOnlineFoodIds: [], aboutUsContent: {title: '', content: ''}, contactUsContent: {address: '', phone: '', email: ''}, contactMessages: [], commonMenuPage: {title: 'Our Menu'}, socialLogin: {google: false, facebook: false}, emailSettings: {mailer: 'log'}, paymentSettings: {paypalEnabled: false, stripeEnabled: false, fonepayEnabled: false} });
    const [applicationSettings, setApplicationSettings] = useLocalStorage<ApplicationSettings>('applicationSettings', initialApplicationSettings);
    const [soundSettings, setSoundSettings] = useLocalStorage<SoundSettings>('soundSettings', { soundsEnabled: true });
    const [outlets, setOutlets] = useLocalStorage<Outlet[]>('outlets', initialOutlets);
    const [activeOutletIds, setActiveOutletIds] = useLocalStorage<string[]>('activeOutletIds', [initialOutlets[0]?.id].filter(Boolean));
    const [roles, setRoles] = useLocalStorage<Role[]>('roles', initialRoles);
    const [users, setUsers] = useLocalStorage<User[]>('users', initialUsers);
    const [saasWebsiteContent, setSaasWebsiteContent] = useLocalStorage<SaasWebsiteContent>('saasWebsiteContent', initialSaasWebsiteContent);
    const [plans, setPlans] = useLocalStorage<Plan[]>('plans', initialPlans);
    const [saasSettings, setSaaSSettings] = useLocalStorage<SaaSSettings>('saasSettings', initialSaasSettings);
    const [addonGroups, setAddonGroups] = useLocalStorage<AddonGroup[]>('addonGroups', initialAddonGroups);
    

    const contextValue: RestaurantDataContextType = {
        // Implement all functions from RestaurantDataContextType
        menuItems,
        addMenuItem: (item, imageUrl, isVeg) => setMenuItems(prev => [...prev, { ...item, id: `menu-${Date.now()}`, imageUrl, isVeg }]),
        updateMenuItem: (item) => setMenuItems(prev => prev.map(i => i.id === item.id ? item : i)),
        deleteMenuItem: (itemId) => setMenuItems(prev => prev.filter(i => i.id !== itemId)),
        
        tables,
        updateTableStatus: (tableId, newStatus) => setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: newStatus, occupiedSince: newStatus === TableStatus.Occupied ? new Date().toISOString() : undefined } : t)),
        addTable: (name, capacity, areaFloorId) => setTables(prev => [...prev, { id: `table-${Date.now()}`, name, capacity, areaFloorId, status: TableStatus.Free }]),
        updateTableSettings: (tableId, name, capacity, areaFloorId) => setTables(prev => prev.map(t => t.id === tableId ? { ...t, name, capacity, areaFloorId } : t)),
        deleteTable: (tableId) => setTables(prev => prev.filter(t => t.id !== tableId)),
        updateTableNotes: (tableId, notes) => setTables(prev => prev.map(t => t.id === tableId ? { ...t, notes } : t)),
        requestTableAssistance: (tableId) => setTables(prev => prev.map(t => t.id === tableId ? { ...t, assistanceRequested: true, assistanceRequestedAt: new Date().toISOString() } : t)),
        resolveTableAssistance: (tableId) => setTables(prev => prev.map(t => t.id === tableId ? { ...t, assistanceRequested: false } : t)),
        resolveFoodReady: (tableId) => setTables(prev => prev.map(t => t.id === tableId ? { ...t, foodReady: false } : t)),
        
        reservations,
        addReservation: (reservation) => setReservations(prev => [...prev, { ...reservation, id: `res-${Date.now()}` }]),
        updateReservation: (reservation) => setReservations(prev => prev.map(r => r.id === reservation.id ? reservation : r)),
        deleteReservation: (reservationId) => setReservations(prev => prev.filter(r => r.id !== reservationId)),
        getAvailableTables: (dateTime, partySize) => {
            // This is a simplified logic
            return tables.filter(t => t.capacity >= partySize);
        },
        
        sales,
        recordSale: (saleData) => {
            const newSale = { ...saleData, id: `sale-${Date.now()}`, saleDate: new Date().toISOString() };
            setSales(prev => [...prev, newSale]);
            if (saleData.assignedTableId && saleData.orderType === 'Dine In') {
                setTables(prev => prev.map(t => t.id === saleData.assignedTableId ? { ...t, status: TableStatus.Occupied, occupiedSince: new Date().toISOString() } : t));
            }
            return newSale;
        },
        updateSale: (updatedSale) => setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s)),
        updateKdsOrderStatus: (saleId, status) => setSales(prev => prev.map(s => s.id === saleId ? { ...s, kdsStatus: status, kdsReadyTimestamp: status === 'ready' ? new Date().toISOString() : s.kdsReadyTimestamp } : s)),
        
        foodMenuCategories,
        addFoodMenuCategory: (categoryData) => setFoodMenuCategories(prev => [...prev, { ...categoryData, id: `fmc-${Date.now()}` }]),
        updateFoodMenuCategory: (category) => setFoodMenuCategories(prev => prev.map(c => c.id === category.id ? category : c)),
        deleteFoodMenuCategory: (categoryId) => setFoodMenuCategories(prev => prev.filter(c => c.id !== categoryId)),

        preMadeFoodItems,
        addPreMadeFoodItem: (item, imageUrl, isVeg) => setPreMadeFoodItems(prev => [...prev, { ...item, id: `pmf-${Date.now()}`, imageUrl, isVeg }]),
        updatePreMadeFoodItem: (item) => setPreMadeFoodItems(prev => prev.map(i => i.id === item.id ? item : i)),
        deletePreMadeFoodItem: (itemId) => setPreMadeFoodItems(prev => prev.filter(i => i.id !== itemId)),

        stockItems,
        updateStockItemQuantity: (itemId, quantityValue, changeType = 'increase') => {
            setStockItems(prev => prev.map(item => {
                if (item.id === itemId) {
                    let newQuantity = item.quantity;
                    if (changeType === 'increase') newQuantity += quantityValue;
                    else if (changeType === 'decrease') newQuantity -= quantityValue;
                    else if (changeType === 'set') newQuantity = quantityValue;
                    return { ...item, quantity: Math.max(0, newQuantity) };
                }
                return item;
            }));
        },
        findOrCreateStockItem: (details) => {
            let item = stockItems.find(i => i.name.toLowerCase() === details.name.toLowerCase() && i.category.toLowerCase() === details.category.toLowerCase());
            if (item) return item;
            const newItem: StockItem = { id: `si-${Date.now()}`, quantity: 0, ...details };
            setStockItems(prev => [...prev, newItem]);
            return newItem;
        },

        stockEntries,
        addStockEntry: (entryData) => {
            const newEntry = { ...entryData, id: `se-${Date.now()}`, date: new Date().toISOString() };
            setStockEntries(prev => [...prev, newEntry]);
            newEntry.items.forEach(item => {
                setStockItems(prev => prev.map(si => si.id === item.stockItemId ? { ...si, quantity: si.quantity + item.quantityAdded, costPerUnit: item.costPerUnit || si.costPerUnit } : si));
            });
            return newEntry;
        },

        stockAdjustments,
        addStockAdjustment: (adjustmentData) => {
            const newAdjustment = { ...adjustmentData, id: `sa-${Date.now()}`, date: new Date().toISOString() };
            setStockAdjustments(prev => [...prev, newAdjustment]);
            newAdjustment.items.forEach(item => {
                setStockItems(prev => prev.map(si => {
                    if (si.id === item.stockItemId) {
                        let newQuantity = si.quantity;
                        if (item.adjustmentType === 'Increase') newQuantity += item.quantity;
                        else if (item.adjustmentType === 'Decrease') newQuantity -= item.quantity;
                        else if (item.adjustmentType === 'SetTo') newQuantity = item.quantity;
                        return { ...si, quantity: Math.max(0, newQuantity) };
                    }
                    return si;
                }));
            });
        },

        suppliers,
        addSupplier: (supplierData) => {
            const newSupplier = { ...supplierData, id: `sup-${Date.now()}` };
            setSuppliers(prev => [...prev, newSupplier]);
            return newSupplier;
        },
        updateSupplier: (supplier) => setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s)),
        deleteSupplier: (supplierId) => setSuppliers(prev => prev.filter(s => s.id !== supplierId)),

        customers,
        addCustomer: (customerData) => {
            const newCustomer = { ...customerData, id: `cust-${Date.now()}` };
            setCustomers(prev => [...prev, newCustomer]);
            return newCustomer;
        },
        updateCustomer: (customer) => setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c)),
        deleteCustomer: (customerId) => setCustomers(prev => prev.filter(c => c.id !== customerId)),
        getAllCustomers: () => customers,
        receiveCustomerPayment: (customerId: string, amountReceived: number, paymentMethod: string, notes?: string) => {
            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: Math.max(0, (c.dueAmount || 0) - amountReceived) } : c));
        },

        areasFloors,
        addAreaFloor: (areaFloorData) => setAreasFloors(prev => [...prev, { ...areaFloorData, id: `af-${Date.now()}` }]),
        updateAreaFloor: (areaFloor) => setAreasFloors(prev => prev.map(af => af.id === areaFloor.id ? areaFloor : af)),
        deleteAreaFloor: (areaFloorId) => setAreasFloors(prev => prev.filter(af => af.id !== areaFloorId)),

        kitchens,
        addKitchen: (kitchenData) => setKitchens(prev => [...prev, { ...kitchenData, id: `k-${Date.now()}` }]),
        updateKitchen: (kitchen) => setKitchens(prev => prev.map(k => k.id === kitchen.id ? kitchen : k)),
        deleteKitchen: (kitchenId) => setKitchens(prev => prev.filter(k => k.id !== kitchenId)),

        printers,
        addPrinter: (printerData) => setPrinters(prev => [...prev, { ...printerData, id: `p-${Date.now()}` }]),
        updatePrinter: (printer) => setPrinters(prev => prev.map(p => p.id === printer.id ? printer : p)),
        deletePrinter: (printerId) => setPrinters(prev => prev.filter(p => p.id !== printerId)),

        counters,
        addCounter: (counterData) => setCounters(prev => [...prev, { ...counterData, id: `c-${Date.now()}` }]),
        updateCounter: (counter) => setCounters(prev => prev.map(c => c.id === counter.id ? counter : c)),
        deleteCounter: (counterId) => setCounters(prev => prev.filter(c => c.id !== counterId)),

        waiters,
        addWaiter: (waiterData) => {
            const newWaiter = { ...waiterData, id: `w-${Date.now()}` };
            setWaiters(prev => [...prev, newWaiter]);
            return newWaiter;
        },
        updateWaiter: (waiter) => setWaiters(prev => prev.map(w => w.id === waiter.id ? waiter : w)),
        deleteWaiter: (waiterId) => setWaiters(prev => prev.filter(w => w.id !== waiterId)),

        currencies,
        addCurrency: async (currencyData) => {
            try {
                const res = await fetch('http://localhost:3000/api/currencies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currencyData),
                });
                if (res.ok) {
                    const newCurrency = await res.json();
                    setCurrencies(prev => [...prev, newCurrency]);
                    // Refresh to ensure consistency if needed, but append is fine
                }
            } catch (error) {
                console.error('Failed to add currency:', error);
            }
        },
        updateCurrency: async (currency) => {
            try {
                const res = await fetch(`http://localhost:3000/api/currencies/${currency.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currency),
                });
                if (res.ok) {
                    const updated = await res.json();
                    setCurrencies(prev => prev.map(c => c.id === currency.id ? updated : c));
                }
            } catch (error) {
                console.error('Failed to update currency:', error);
            }
        },
        deleteCurrency: async (currencyId) => {
            try {
                const res = await fetch(`http://localhost:3000/api/currencies/${currencyId}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                     setCurrencies(prev => prev.filter(c => c.id !== currencyId));
                } else {
                     const err = await res.json();
                     alert(err.message || 'Failed to delete currency');
                }
            } catch (error) {
                console.error('Failed to delete currency:', error);
            }
        },
        setDefaultCurrency: async (currencyId) => {
             try {
                const res = await fetch(`http://localhost:3000/api/currencies/${currencyId}/set-default`, {
                    method: 'POST',
                });
                if (res.ok) {
                    const updatedCurrency = await res.json();
                     // Since setting default changes other currencies (isDefault=false), we should reload all
                     const allRes = await fetch('http://localhost:3000/api/currencies');
                     const allData = await allRes.json();
                     if (Array.isArray(allData)) {
                        setCurrencies(allData);
                     }
                }
            } catch (error) {
                console.error('Failed to set default currency:', error);
            }
        },

        denominations,
        addDenomination: (data) => setDenominations(prev => [...prev, { ...data, id: `den-${Date.now()}` }]),
        updateDenomination: (data) => setDenominations(prev => prev.map(d => d.id === data.id ? data : d)),
        deleteDenomination: (id) => setDenominations(prev => prev.filter(d => d.id !== id)),

        purchases,
        addPurchase: (purchaseData) => {
            const newPurchase = { ...purchaseData, id: `pur-${Date.now()}`, date: new Date().toISOString() };
            setPurchases(prev => [...prev, newPurchase]);
            return newPurchase;
        },
        recordSupplierPayment: (purchaseId: string, amountPaid: number, paymentDate: string, paymentMethod: string, reference?: string, notes?: string) => {
            setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, paidAmount: (p.paidAmount || 0) + amountPaid } : p));
        },

        expenseCategories,
        addExpenseCategory: (categoryData) => {
            const newCat = { ...categoryData, id: `exp-cat-${Date.now()}` };
            setExpenseCategories(prev => [...prev, newCat]);
            return newCat;
        },
        updateExpenseCategory: (category) => setExpenseCategories(prev => prev.map(c => c.id === category.id ? category : c)),
        deleteExpenseCategory: (categoryId) => setExpenseCategories(prev => prev.filter(c => c.id !== categoryId)),

        expenses,
        addExpense: (expenseData) => {
            const categoryName = expenseCategories.find(c => c.id === expenseData.categoryId)?.name || 'Unknown';
            const newExpense = { ...expenseData, id: `exp-${Date.now()}`, categoryName, outletId: activeOutletIds[0] || 'unknown' };
            setExpenses(prev => [...prev, newExpense]);
            return newExpense;
        },
        updateExpense: (expense) => setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e)),
        deleteExpense: (expenseId) => setExpenses(prev => prev.filter(e => e.id !== expenseId)),
        
        wasteRecords,
        addWasteRecord: (recordData) => {
            const newRecord = { ...recordData, id: `waste-${Date.now()}`, date: new Date().toISOString() };
            setWasteRecords(prev => [...prev, newRecord]);
            return newRecord;
        },

        employees,
        addEmployee: (employeeData) => {
            const newEmployee = { ...employeeData, id: `emp-${Date.now()}` };
            setEmployees(prev => [...prev, newEmployee]);
            return newEmployee;
        },
        updateEmployee: (employee) => setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e)),
        deleteEmployee: (employeeId) => setEmployees(prev => prev.filter(e => e.id !== employeeId)),
        
        attendanceRecords,
        markOrUpdateAttendance: (records) => {
            setAttendanceRecords(prev => {
                const updated = [...prev];
                records.forEach(rec => {
                    const index = updated.findIndex(r => r.employeeId === rec.employeeId && r.date === rec.date);
                    const empName = employees.find(e => e.id === rec.employeeId)?.name || 'Unknown';
                    if (index > -1) {
                        updated[index] = { ...updated[index], ...rec };
                    } else {
                        updated.push({ ...rec, id: `${rec.employeeId}-${rec.date}`, employeeName: empName });
                    }
                });
                return updated;
            });
        },
        getAttendanceForDate: (date) => attendanceRecords.filter(r => r.date === date),

        payrollRecords,
        addOrUpdatePayrollRecord: (record) => {
            setPayrollRecords(prev => {
                const index = prev.findIndex(r => r.id === record.id);
                if (index > -1) {
                    const updated = [...prev];
                    updated[index] = record;
                    return updated;
                }
                return [...prev, record];
            });
        },
        
        paymentMethods,
        updatePaymentMethod: (method) => setPaymentMethods(prev => prev.map(p => p.id === method.id ? method : p)),

        deliveryPartners,
        addDeliveryPartner: (partnerData) => setDeliveryPartners(prev => [...prev, { ...partnerData, id: `dp-${Date.now()}` }]),
        updateDeliveryPartner: (partner) => setDeliveryPartners(prev => prev.map(p => p.id === partner.id ? partner : p)),
        deleteDeliveryPartner: (partnerId) => setDeliveryPartners(prev => prev.filter(p => p.id !== partnerId)),

        isSelfOrderEnabled, setSelfOrderStatus,
        isReservationOrderEnabled, setReservationOrderStatus,
        reservationOrderReceivingUserIds, setReservationOrderReceivingUserIds,
        reservationSettings, setReservationSettings,
        websiteSettings, 
        updateWebsiteSettings: (settings) => setWebsiteSettings(prev => ({...prev, ...settings})),
        applicationSettings,
        updateApplicationSettings: (settings) => setApplicationSettings(prev => ({...prev, ...settings})),
        soundSettings,
        updateSoundSettings: (settings) => setSoundSettings(prev => ({...prev, ...settings})),

        outlets, activeOutletIds, setActiveOutletIds,
        getActiveOutlets: () => outlets.filter(o => activeOutletIds.includes(o.id)),
        getSingleActiveOutlet: () => activeOutletIds.length === 1 ? outlets.find(o => o.id === activeOutletIds[0]) : undefined,
        addOutlet: (outletData) => {
            const newOutlet = { ...outletData, id: `outlet-${Date.now()}` };
            setOutlets(prev => [...prev, newOutlet]);
            return newOutlet;
        },
        updateOutlet: (outlet) => setOutlets(prev => prev.map(o => o.id === outlet.id ? outlet : o)),
        deleteOutlet: (outletId) => setOutlets(prev => prev.filter(o => o.id !== outletId)),
        
        roles, users,
        addUser: (userData) => setUsers(prev => [...prev, { ...userData, id: `user-${Date.now()}` }]),
        updateUser: (user) => setUsers(prev => prev.map(u => u.id === user.id ? user : u)),
        deleteUser: (userId) => setUsers(prev => prev.filter(u => u.id !== userId)),
        registerUser: async (username, password, restaurantName, fullName, mobile, address) => {
            if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
                return { success: false, message: "Username already exists." };
            }
            const newOutlet = {
                id: `outlet-${Date.now()}`,
                name: `${restaurantName} Main`,
                restaurantName,
                address,
                phone: mobile,
                outletType: 'Restaurant' as const,
                taxes: [{id: 'tax-1', name: 'VAT', rate: 5}],
                plan: 'Basic',
                subscriptionStatus: 'trialing' as const,
                registrationDate: new Date().toISOString()
            };
            setOutlets(prev => [...prev, newOutlet]);

            const newAdminUser = {
                id: `user-${Date.now()}`,
                username,
                passwordHash: password, // In real app, hash this
                roleId: 'role-admin',
                outletId: newOutlet.id,
                isActive: true,
            };
            setUsers(prev => [...prev, newAdminUser]);

            return { success: true, message: "Registration successful!", user: newAdminUser };
        },
        checkLogin: (username, password) => users.find(u => u.username === username && u.passwordHash === password) || null,
        
        saasWebsiteContent,
        updateSaasWebsiteContent: (updater) => setSaasWebsiteContent(updater),
        
        plans,
        addPlan: (planData) => setPlans(prev => [...prev, { ...planData, id: `plan-${Date.now()}` }]),
        updatePlan: (plan) => setPlans(prev => prev.map(p => p.id === plan.id ? plan : p)),
        deletePlan: (planId) => setPlans(prev => prev.filter(p => p.id !== planId)),

        saasSettings,
        updateSaaSSettings: (settings) => setSaaSSettings(prev => ({ ...prev, ...settings })),
        
        addonGroups,
        addAddonGroup: (group) => setAddonGroups(prev => [...prev, { ...group, id: `ag-${Date.now()}` }]),
        updateAddonGroup: (group) => setAddonGroups(prev => prev.map(g => g.id === group.id ? group : g)),
        deleteAddonGroup: (groupId) => setAddonGroups(prev => prev.filter(g => g.id !== groupId)),
    };


    // FIX: Replaced JSX with React.createElement to prevent parsing errors in a .ts file.
    return React.createElement(RestaurantDataContext.Provider, { value: contextValue }, children);
};

export const useRestaurantData = (): RestaurantDataContextType => {
    const context = useContext(RestaurantDataContext);
    if (context === undefined) {
        throw new Error('useRestaurantData must be used within a RestaurantDataProvider');
    }
    return context;
};