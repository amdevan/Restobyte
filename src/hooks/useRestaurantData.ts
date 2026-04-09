
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
import { API_BASE_URL } from '../config';
import { CURRENCIES } from '@/constants/geo';
import { useAuth } from './useAuth';

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
    { id: 'outlet-1', name: 'Main Branch', restaurantName: 'RestoByte Main', address: '123 Main St, Anytown', phone: '555-111-2222', outletType: 'Restaurant', taxes: [{id: 'tax-1', name: 'VAT', rate: 5}], plan: 'Pro', subscriptionStatus: 'active', registrationDate: new Date().toISOString() },
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
    maintenance: { isEnabled: false, message: '' },
    email: {
        provider: '',
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: '',
        smtpPass: '',
        fromName: 'RestoByte',
        fromEmail: ''
    }
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

    // Listen for changes in other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key) {
                try {
                    setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
                } catch (error) {
                    console.error(error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, initialValue]);

    // Update stored value if key changes
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            setStoredValue(item ? JSON.parse(item) : initialValue);
        } catch (error) {
            console.error(error);
            setStoredValue(initialValue);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
  
    const setValue: React.Dispatch<React.SetStateAction<T>> = value => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          // Dispatch a custom event so the current window also updates if we have multiple hooks using the same key (unlikely here but good practice)
          window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(valueToStore) }));
        }
      } catch (error) {
        console.error(error);
      }
    };
  
    return [storedValue, setValue];
};

export const RestaurantDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    // This is a simplified implementation. A real app would use a more robust state management solution.
    // const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>('menuItems', []);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    useEffect(() => {
        if (isAuthenticated && user?.outletId) {
            fetch(`${API_BASE_URL}/menu-items`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch menu items');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setMenuItems(data);
                } else {
                    console.error("Menu items data is not an array:", data);
                    setMenuItems([]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch menu items:", err);
                setMenuItems([]);
            });
        } else {
             setMenuItems([]);
        }
    }, [isAuthenticated, user?.outletId]);
    // const [tables, setTables] = useLocalStorage<Table[]>('tables', generateInitialTables());
    const [tables, setTables] = useState<Table[]>([]);

    useEffect(() => {
        if (isAuthenticated && user?.outletId) {
            fetch(`${API_BASE_URL}/tables`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch tables');
                return res.json();
            })
            .then(data => setTables(data))
            .catch(err => console.error("Failed to fetch tables:", err));
        } else {
             setTables([]);
        }
    }, [isAuthenticated, user?.outletId]);
    // Helper to generate outlet-specific keys
    const getKey = (baseKey: string) => user?.outletId ? `${baseKey}_${user.outletId}` : baseKey;

    const [reservations, setReservations] = useLocalStorage<Reservation[]>(getKey('reservations'), []);
    const [sales, setSales] = useLocalStorage<Sale[]>(getKey('sales'), []);
    // const [foodMenuCategories, setFoodMenuCategories] = useLocalStorage<FoodMenuCategory[]>('foodMenuCategories', []);
    const [foodMenuCategories, setFoodMenuCategories] = useState<FoodMenuCategory[]>([]);

    useEffect(() => {
        if (isAuthenticated && user?.outletId) {
            fetch(`${API_BASE_URL}/categories`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch categories');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setFoodMenuCategories(data);
                } else {
                    console.error("Categories data is not an array:", data);
                    setFoodMenuCategories([]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch categories:", err);
                setFoodMenuCategories([]);
            });
        } else {
             setFoodMenuCategories([]);
        }
    }, [isAuthenticated, user?.outletId]);

    const [preMadeFoodItems, setPreMadeFoodItems] = useLocalStorage<PreMadeFoodItem[]>(getKey('preMadeFoodItems'), []);
    const [stockItems, setStockItems] = useLocalStorage<StockItem[]>(getKey('stockItems'), initialStockItems);
    const [stockEntries, setStockEntries] = useLocalStorage<StockEntry[]>(getKey('stockEntries'), []);
    const [stockAdjustments, setStockAdjustments] = useLocalStorage<StockAdjustment[]>(getKey('stockAdjustments'), []);
    const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>(getKey('suppliers'), []);
    // const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', initialCustomers);
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        if (isAuthenticated && user?.outletId) {
            fetch(`${API_BASE_URL}/customers`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch customers');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setCustomers(data);
                } else {
                    console.error("Customers data is not an array:", data);
                    setCustomers([]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch customers:", err);
                setCustomers([]);
            });
        } else {
             setCustomers([]);
        }
    }, [isAuthenticated, user?.outletId]);
    const [areasFloors, setAreasFloors] = useLocalStorage<AreaFloor[]>(getKey('areasFloors'), initialAreasFloors);
    const [kitchens, setKitchens] = useLocalStorage<Kitchen[]>(getKey('kitchens'), initialKitchens);
    const [printers, setPrinters] = useLocalStorage<Printer[]>(getKey('printers'), initialPrinters);
    const [counters, setCounters] = useLocalStorage<Counter[]>(getKey('counters'), initialCounters);
    const [waiters, setWaiters] = useLocalStorage<Waiter[]>(getKey('waiters'), initialWaiters);
    // const [currencies, setCurrencies] = useLocalStorage<Currency[]>('currencies', initialCurrencies);
    const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/currencies`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setCurrencies(data);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch currencies:', err);
            }
        };
        fetchCurrencies();
    }, []);

    const [denominations, setDenominations] = useLocalStorage<Denomination[]>(getKey('denominations'), initialDenominations);
    const [purchases, setPurchases] = useLocalStorage<Purchase[]>(getKey('purchases'), initialPurchases);
    const [expenseCategories, setExpenseCategories] = useLocalStorage<ExpenseCategory[]>(getKey('expenseCategories'), initialExpenseCategories);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>(getKey('expenses'), initialExpenses);
    const [wasteRecords, setWasteRecords] = useLocalStorage<WasteRecord[]>(getKey('wasteRecords'), initialWasteRecords);
    const [employees, setEmployees] = useLocalStorage<Employee[]>(getKey('employees'), initialEmployees);
    const [attendanceRecords, setAttendanceRecords] = useLocalStorage<AttendanceRecord[]>(getKey('attendanceRecords'), initialAttendanceRecords);
    const [payrollRecords, setPayrollRecords] = useLocalStorage<PayrollRecord[]>(getKey('payrollRecords'), initialPayrollRecords);
    const [paymentMethods, setPaymentMethods] = useLocalStorage<PaymentMethod[]>(getKey('paymentMethods'), initialPaymentMethods);
    const [deliveryPartners, setDeliveryPartners] = useLocalStorage<DeliveryPartner[]>(getKey('deliveryPartners'), initialDeliveryPartners);
    const [isSelfOrderEnabled, setSelfOrderStatus] = useLocalStorage<boolean>(getKey('isSelfOrderEnabled'), false);
    const [isReservationOrderEnabled, setReservationOrderStatus] = useLocalStorage<boolean>(getKey('isReservationOrderEnabled'), false);
    const [reservationOrderReceivingUserIds, setReservationOrderReceivingUserIds] = useLocalStorage<string[]>(getKey('reservationOrderReceivingUserIds'), []);
    const [reservationSettings, setReservationSettings] = useLocalStorage<ReservationSettings>(getKey('reservationSettings'), { enabled: true, availability: [] });
    const [websiteSettings, setWebsiteSettings] = useLocalStorage<WebsiteSettings>(getKey('websiteSettings'), { orderEnabled: true, orderReceivingUserIds: [], whiteLabel: { appName: 'RestoByte', primaryColor: '#0ea5e9' }, homePageContent: { bannerSection: { title: 'Welcome', subtitle: '' }, serviceSection: {services:[]}, exploreMenuSection: {title: 'Explore', subtitle: '', buttonText: 'View Menu'}, gallery: [], socialMedia: []}, availableOnlineFoodIds: [], aboutUsContent: {title: '', content: ''}, contactUsContent: {address: '', phone: '', email: ''}, contactMessages: [], commonMenuPage: {title: 'Our Menu'}, socialLogin: {google: false, facebook: false}, emailSettings: {mailer: 'log'}, paymentSettings: {paypalEnabled: false, stripeEnabled: false, fonepayEnabled: false} });
    const [applicationSettings, setApplicationSettings] = useLocalStorage<ApplicationSettings>(getKey('applicationSettings'), initialApplicationSettings);
    const [soundSettings, setSoundSettings] = useLocalStorage<SoundSettings>(getKey('soundSettings'), { soundsEnabled: true });
    const [outlets, setOutlets] = useLocalStorage<Outlet[]>(getKey('outlets'), initialOutlets);
    const [activeOutletIds, setActiveOutletIds] = useLocalStorage<string[]>(getKey('activeOutletIds'), [initialOutlets[0]?.id].filter(Boolean));
    const [roles, setRoles] = useLocalStorage<Role[]>(getKey('roles'), initialRoles);
    const [users, setUsers] = useLocalStorage<User[]>(getKey('users'), initialUsers);
    const [saasWebsiteContent, setSaasWebsiteContent] = useLocalStorage<SaasWebsiteContent>('saasWebsiteContent', initialSaasWebsiteContent);
    const [plans, setPlans] = useLocalStorage<Plan[]>(getKey('plans'), initialPlans);
    const [saasSettings, setSaaSSettings] = useLocalStorage<SaaSSettings>(getKey('saasSettings'), initialSaasSettings);
    const [addonGroups, setAddonGroups] = useLocalStorage<AddonGroup[]>(getKey('addonGroups'), initialAddonGroups);

    const fetchSaasWebsiteContent = async () => {
        const env = 'default';
        const url = isAuthenticated && user?.isSuperAdmin 
            ? `${API_BASE_URL}/saas/website-content?env=${encodeURIComponent(env)}`
            : `${API_BASE_URL}/public/saas-website-content?env=${encodeURIComponent(env)}`;
        
        try {
            const res = await fetch(url, {
                headers: isAuthenticated && user?.isSuperAdmin ? {
                    Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
                } : {}
            });
            if (!res.ok) throw new Error('Failed to fetch SaaS website content');
            const data = await res.json();
            if (data?.content && typeof data.content === 'object') {
                setSaasWebsiteContent(() => data.content as SaasWebsiteContent);
                return data.content as SaasWebsiteContent;
            }
        } catch (err) {
            console.error('Failed to fetch SaaS website content:', err);
        }
        return null;
    };

    useEffect(() => {
        fetchSaasWebsiteContent();
    }, [isAuthenticated, user?.isSuperAdmin]);
    
    // Align default currency with tenant preference
    useEffect(() => {
        const run = async () => {
            if (!isAuthenticated) return;
            try {
                const res = await fetch(`${API_BASE_URL}/tenants/me-currency`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                const code: string | undefined = data?.currencyCode || undefined;
                if (!code) return;
                setCurrencies(prev => {
                    const exists = prev.find(c => c.code === code);
                    if (exists) {
                        return prev.map(c => ({ ...c, isDefault: c.code === code }));
                    }
                    const meta = CURRENCIES.find(c => c.code === code);
                    const newCurrency = {
                        id: `cur-${code}`,
                        name: meta?.name || code,
                        code,
                        symbol: meta?.symbol || '$',
                        exchangeRate: 1,
                        isDefault: true
                    };
                    return [newCurrency, ...prev.map(c => ({ ...c, isDefault: false }))];
                });
            } catch (e) {
                // ignore
            }
        };
        run();
    }, [isAuthenticated]);


    const contextValue: RestaurantDataContextType = {
        // Implement all functions from RestaurantDataContextType
        menuItems,
        addMenuItem: async (item, imageUrl, isVeg) => {
            try {
                const res = await fetch(`${API_BASE_URL}/menu-items`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ ...item, imageUrl, isVegetarian: isVeg })
                });
                if (res.ok) {
                    const newItem = await res.json();
                    setMenuItems(prev => [...prev, newItem]);
                }
            } catch (err) {
                console.error("Failed to add menu item:", err);
            }
        },
        updateMenuItem: async (item) => {
            try {
                const res = await fetch(`${API_BASE_URL}/menu-items/${item.id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(item)
                });
                if (res.ok) {
                    const updatedItem = await res.json();
                    setMenuItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
                }
            } catch (err) {
                console.error("Failed to update menu item:", err);
            }
        },
        deleteMenuItem: async (itemId) => {
             try {
                const res = await fetch(`${API_BASE_URL}/menu-items/${itemId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (res.ok) {
                    setMenuItems(prev => prev.filter(i => i.id !== itemId));
                }
            } catch (err) {
                console.error("Failed to delete menu item:", err);
            }
        },
        
        tables,
        updateTableStatus: async (tableId, newStatus) => {
            setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: newStatus, occupiedSince: newStatus === TableStatus.Occupied ? new Date().toISOString() : undefined } : t));
            try {
                await fetch(`${API_BASE_URL}/tables/${tableId}/status`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });
            } catch (err) {
                console.error("Failed to update table status:", err);
            }
        },
        addTable: async (name, capacity, areaFloorId) => {
            try {
                const res = await fetch(`${API_BASE_URL}/tables`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ name, capacity, areaFloorId })
                });
                if (res.ok) {
                    const newTable = await res.json();
                    setTables(prev => [...prev, newTable]);
                }
            } catch (err) {
                console.error("Failed to add table:", err);
            }
        },
        updateTableSettings: async (tableId, name, capacity, areaFloorId) => {
            try {
                const res = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ name, capacity, areaFloorId })
                });
                if (res.ok) {
                    const updatedTable = await res.json();
                    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
                }
            } catch (err) {
                console.error("Failed to update table settings:", err);
            }
        },
        deleteTable: async (tableId) => {
            try {
                const res = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (res.ok) {
                    setTables(prev => prev.filter(t => t.id !== tableId));
                }
            } catch (err) {
                console.error("Failed to delete table:", err);
            }
        },
        updateTableNotes: async (tableId, notes) => {
            setTables(prev => prev.map(t => t.id === tableId ? { ...t, notes } : t));
            try {
                await fetch(`${API_BASE_URL}/tables/${tableId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ notes })
                });
            } catch (err) {
                console.error("Failed to update table notes:", err);
            }
        },
        requestTableAssistance: async (tableId) => {
            const now = new Date().toISOString();
            setTables(prev => prev.map(t => t.id === tableId ? { ...t, assistanceRequested: true, assistanceRequestedAt: now } : t));
            try {
                await fetch(`${API_BASE_URL}/tables/${tableId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ assistanceRequested: true, assistanceRequestedAt: now })
                });
            } catch (err) {
                console.error("Failed to request assistance:", err);
            }
        },
        resolveTableAssistance: async (tableId) => {
            setTables(prev => prev.map(t => t.id === tableId ? { ...t, assistanceRequested: false } : t));
            try {
                await fetch(`${API_BASE_URL}/tables/${tableId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ assistanceRequested: false })
                });
            } catch (err) {
                console.error("Failed to resolve assistance:", err);
            }
        },
        resolveFoodReady: async (tableId) => {
            setTables(prev => prev.map(t => t.id === tableId ? { ...t, foodReady: false } : t));
            try {
                await fetch(`${API_BASE_URL}/tables/${tableId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ foodReady: false })
                });
            } catch (err) {
                console.error("Failed to resolve food ready:", err);
            }
        },
        
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
        addFoodMenuCategory: async (categoryData) => {
            try {
                const res = await fetch(`${API_BASE_URL}/categories`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(categoryData)
                });
                if (res.ok) {
                    const newCategory = await res.json();
                    setFoodMenuCategories(prev => [...prev, newCategory]);
                }
            } catch (err) {
                console.error("Failed to add category:", err);
            }
        },
        updateFoodMenuCategory: async (category) => {
            try {
                const res = await fetch(`${API_BASE_URL}/categories/${category.id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(category)
                });
                if (res.ok) {
                    const updatedCategory = await res.json();
                    setFoodMenuCategories(prev => prev.map(c => c.id === category.id ? updatedCategory : c));
                }
            } catch (err) {
                console.error("Failed to update category:", err);
            }
        },
        deleteFoodMenuCategory: async (categoryId) => {
             try {
                const res = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (res.ok) {
                    setFoodMenuCategories(prev => prev.filter(c => c.id !== categoryId));
                }
            } catch (err) {
                console.error("Failed to delete category:", err);
            }
        },

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
        addCustomer: async (customerData) => {
            try {
                const res = await fetch(`${API_BASE_URL}/customers`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(customerData)
                });
                if (res.ok) {
                    const newCustomer = await res.json();
                    setCustomers(prev => [...prev, newCustomer]);
                    return newCustomer;
                }
            } catch (err) {
                console.error("Failed to add customer:", err);
            }
        },
        updateCustomer: async (customer) => {
             try {
                const res = await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(customer)
                });
                if (res.ok) {
                    const updatedCustomer = await res.json();
                    setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
                }
            } catch (err) {
                console.error("Failed to update customer:", err);
            }
        },
        deleteCustomer: async (customerId) => {
             try {
                const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (res.ok) {
                    setCustomers(prev => prev.filter(c => c.id !== customerId));
                }
            } catch (err) {
                console.error("Failed to delete customer:", err);
            }
        },
        getAllCustomers: () => customers,
        receiveCustomerPayment: async (customerId: string, amountReceived: number, paymentMethod: string, notes?: string) => {
            const customer = customers.find(c => c.id === customerId);
            if (!customer) return;

            const newDueAmount = Math.max(0, (customer.dueAmount || 0) - amountReceived);
            
            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: newDueAmount } : c));

            try {
                await fetch(`${API_BASE_URL}/customers/${customerId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ dueAmount: newDueAmount })
                });
            } catch (err) {
                console.error("Failed to update customer payment:", err);
                // Revert on failure? For now, just log.
            }
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
                const res = await fetch(`${API_BASE_URL}/currencies`, {
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
                const res = await fetch(`${API_BASE_URL}/currencies/${currency.id}`, {
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
                const res = await fetch(`${API_BASE_URL}/currencies/${currencyId}`, {
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
                const res = await fetch(`${API_BASE_URL}/currencies/${currencyId}/set-default`, {
                    method: 'POST',
                });
                if (res.ok) {
                    const updatedCurrency = await res.json();
                     // Since setting default changes other currencies (isDefault=false), we should reload all
                     const allRes = await fetch(`${API_BASE_URL}/currencies`);
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
            console.log('Attempting to register user:', { username, restaurantName });
            const trimmedUsername = username.trim();
            const trimmedPassword = password.trim();
            if (users.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
                console.warn('Registration failed: Username already exists', trimmedUsername);
                return { success: false, message: "Username already exists." };
            }
            const newOutlet = {
                id: `outlet-${Date.now()}`,
                name: restaurantName,
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
                username: trimmedUsername,
                passwordHash: trimmedPassword, // In real app, hash this
                roleId: 'role-admin',
                outletId: newOutlet.id,
                isActive: true,
            };
            setUsers(prev => {
                const newUsers = [...prev, newAdminUser];
                console.log('User registered successfully. New Users List:', newUsers);
                return newUsers;
            });

            return { success: true, message: "Registration successful!", user: newAdminUser };
        },
        checkLogin: (username, password) => {
            console.log('Checking login for:', username);
            const trimmedUsername = username.trim().toLowerCase();
            const trimmedPassword = password.trim();
            const foundUser = users.find(u => u.username.toLowerCase() === trimmedUsername && u.passwordHash === trimmedPassword);
            
            if (foundUser) {
                console.log('Login successful for:', username);
            } else {
                console.warn('Login failed for:', username);
                const userMatch = users.find(u => u.username.toLowerCase() === trimmedUsername);
                if (userMatch) {
                     console.log('User found but password mismatch.');
                     console.log('Stored Password:', JSON.stringify(userMatch.passwordHash));
                     console.log('Input Password:', JSON.stringify(trimmedPassword));
                } else {
                     console.log('User not found.');
                }
                console.log('Available users (usernames):', users.map(u => `${u.username} (${u.passwordHash})`));
            }
            return foundUser || null;
        },
        
        saasWebsiteContent,
        fetchSaasWebsiteContent,
        updateSaasWebsiteContent: (updater) => {
            const env = 'default';
            setSaasWebsiteContent(prev => {
                const next = updater(prev);
                if (isAuthenticated && user?.isSuperAdmin) {
                    fetch(`${API_BASE_URL}/saas/website-content?env=${encodeURIComponent(env)}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
                        },
                        body: JSON.stringify(next)
                    }).catch(() => {
                    });
                }
                return next;
            });
        },
        
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
