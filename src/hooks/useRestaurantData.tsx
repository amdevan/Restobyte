
import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode, useRef } from 'react';
import { 
    MenuItem, Table, TableStatus, Reservation, Sale, SaleItem, FoodMenuCategory, PreMadeFoodItem, 
    StockItem, StockEntry, StockEntryItem, StockAdjustment, StockAdjustmentItem, StockAdjustmentType,
    Supplier, Customer, AreaFloor, Kitchen, Printer, PrinterType, PrinterInterfaceType, PaperSize, Counter, Waiter,
    Currency, Denomination, Purchase, PurchaseItem, ExpenseCategory, Expense, WasteRecord, Employee,
    AttendanceRecord, AttendanceStatus, ReservationSettings, ReservationAvailability, WebsiteSettings,
    PaymentMethod, Outlet, User, Role, ApplicationSettings, Tax, SaleTaxDetail, DeliveryPartner, Split, CustomerPayment, RestaurantDataContextType, SaasWebsiteContent, SaasPost,
    Plan, AddonGroup, PayrollRecord, SaaSSettings, SoundSettings, TenantEntitlements, PlanFeatureKey
} from '../types';
import { INITIAL_TABLES_COUNT } from '../constants';
import { API_BASE_URL } from '../config';
import { CURRENCIES, DEFAULT_CURRENCY_BY_COUNTRY } from '@/constants/geo';
import { useAuth } from './useAuth';
import { printRawViaQzTray } from '@/utils/qzTray';

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
const initialSales: Sale[] = [
    {
        id: 'sale-1',
        saleDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
            { id: 'item-1', name: 'Burger', price: 15, quantity: 2, notes: 'No onions' },
            { id: 'item-2', name: 'Fries', price: 5, quantity: 1 }
        ],
        subTotal: 35,
        taxDetails: [{ id: 'tax-1', name: 'VAT', rate: 5, amount: 1.75 }],
        totalAmount: 36.75,
        orderType: 'Dine In',
        pax: 2,
        outletId: 'outlet-1',
        customerId: 'cust-1',
        customerName: 'Alice Wonderland',
        paymentMethod: 'Card',
        isSettled: true,
        isClosed: true
    },
    {
        id: 'sale-2',
        saleDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
            { id: 'item-3', name: 'Pizza', price: 25, quantity: 1 },
            { id: 'item-4', name: 'Coke', price: 3, quantity: 2 }
        ],
        subTotal: 31,
        taxDetails: [{ id: 'tax-1', name: 'VAT', rate: 5, amount: 1.55 }],
        totalAmount: 32.55,
        orderType: 'Takeaway',
        outletId: 'outlet-1',
        paymentMethod: 'Cash',
        isSettled: true,
        isClosed: true
    },
    {
        id: 'sale-3',
        saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
            { id: 'item-5', name: 'Pasta', price: 18, quantity: 1 },
            { id: 'item-6', name: 'Salad', price: 10, quantity: 1 }
        ],
        subTotal: 28,
        taxDetails: [{ id: 'tax-1', name: 'VAT', rate: 5, amount: 1.40 }],
        totalAmount: 29.40,
        orderType: 'Dine In',
        pax: 1,
        outletId: 'outlet-1',
        paymentMethod: 'Online',
        isSettled: true,
        isClosed: true
    },
    {
        id: 'sale-4',
        saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
            { id: 'item-7', name: 'Sandwich', price: 12, quantity: 3 }
        ],
        subTotal: 36,
        taxDetails: [{ id: 'tax-1', name: 'VAT', rate: 5, amount: 1.80 }],
        totalAmount: 37.80,
        orderType: 'Delivery',
        outletId: 'outlet-1',
        customerId: 'cust-2',
        customerName: 'Bob The Builder',
        paymentMethod: 'Fonepay',
        isSettled: true,
        isClosed: true
    },
    {
        id: 'sale-5',
        saleDate: new Date().toISOString(),
        items: [
            { id: 'item-8', name: 'Ice Cream', price: 8, quantity: 2 },
            { id: 'item-9', name: 'Coffee', price: 5, quantity: 2 }
        ],
        subTotal: 26,
        taxDetails: [{ id: 'tax-1', name: 'VAT', rate: 5, amount: 1.30 }],
        totalAmount: 27.30,
        orderType: 'Dine In',
        pax: 2,
        outletId: 'outlet-1',
        paymentMethod: 'Cash',
        isSettled: true,
        isClosed: true
    }
];

const mapBackendOrderToSale = (order: any): Sale => {
    const rawSale = order?.saleData && typeof order.saleData === 'object' ? order.saleData : {};
    const fallbackItems = Array.isArray(order?.items)
        ? order.items.map((item: any, index: number) => ({
            id: item?.menuItemId || item?.id || `order-item-${index}`,
            name: item?.menuItem?.name || item?.name || 'Item',
            price: Number(item?.unitPrice ?? 0),
            quantity: Number(item?.quantity ?? 0),
        }))
        : [];

    const items = Array.isArray(rawSale?.items) && rawSale.items.length > 0 ? rawSale.items : fallbackItems;
    const subTotal = Number(
        rawSale?.subTotal ??
        items.reduce((sum: number, item: any) => sum + Number(item?.price ?? item?.unitPrice ?? 0) * Number(item?.quantity ?? 0), 0)
    );
    const totalAmount = Number(rawSale?.totalAmount ?? order?.total ?? subTotal);

    return {
        id: String(order?.id || rawSale?.id),
        saleDate: String(rawSale?.saleDate || order?.createdAt || new Date().toISOString()),
        items,
        subTotal,
        taxDetails: Array.isArray(rawSale?.taxDetails) ? rawSale.taxDetails : [],
        totalAmount,
        orderType: String(rawSale?.orderType || 'Dine In'),
        pax: rawSale?.pax,
        waiterId: rawSale?.waiterId,
        waiterName: rawSale?.waiterName,
        assignedTableId: rawSale?.assignedTableId ?? null,
        assignedTableName: rawSale?.assignedTableName,
        outletId: String(rawSale?.outletId || order?.outletId || ''),
        customerId: rawSale?.customerId || order?.customerId || undefined,
        customerName: rawSale?.customerName || order?.customer?.name || undefined,
        orderNotes: rawSale?.orderNotes,
        paymentMethod: rawSale?.paymentMethod,
        partialPayments: Array.isArray(rawSale?.partialPayments) ? rawSale.partialPayments : undefined,
        isSettled: rawSale?.isSettled,
        isClosed: rawSale?.isClosed,
        deliveryPartnerId: rawSale?.deliveryPartnerId,
        deliveryPartnerName: rawSale?.deliveryPartnerName,
        deliveryCommission: rawSale?.deliveryCommission,
        discountType: rawSale?.discountType,
        discountAmount: rawSale?.discountAmount,
        tipAmount: rawSale?.tipAmount,
        splitDetails: Array.isArray(rawSale?.splitDetails) ? rawSale.splitDetails : undefined,
        kdsStatus: rawSale?.kdsStatus,
        kdsReadyTimestamp: rawSale?.kdsReadyTimestamp,
        paymentDate: rawSale?.paymentDate,
        paymentReference: rawSale?.paymentReference,
        receivedAmount: rawSale?.receivedAmount,
        returnAmount: rawSale?.returnAmount,
    };
};
const initialAreasFloors: AreaFloor[] = [
    { id: 'af-1', name: 'Ground Floor', description: 'Main dining area near the entrance.' },
    { id: 'af-2', name: 'Patio', description: 'Outdoor seating area.' },
];
const initialKitchens: Kitchen[] = [];
const initialPrinters: Printer[] = [
    { 
        id: 'printer-1', 
        name: 'Main Receipt Printer', 
        type: PrinterType.Receipt, 
        interfaceType: PrinterInterfaceType.Network, 
        ipAddress: '192.168.1.100', 
        port: '9100',
        isActive: true,
        paperSize: PaperSize['80mm'],
        autoPrintReceipt: true,
    },
    { 
        id: 'printer-2', 
        name: 'Kitchen KOT Printer', 
        type: PrinterType.KOT, 
        interfaceType: PrinterInterfaceType.Network, 
        ipAddress: '192.168.1.101', 
        port: '9100',
        isActive: true,
        paperSize: PaperSize['80mm'],
        autoPrintKOT: true,
    },
];
const initialCounters: Counter[] = [
    { id: 'counter-1', name: 'Main Counter', assignedPrinterIds: ['printer-1'] },
];
const initialWaiters: Waiter[] = [
    { id: 'waiter-1', name: 'John Doe', employeeId: 'EMP001' },
    { id: 'waiter-2', name: 'Jane Smith', employeeId: 'EMP002' },
];
const initialCurrencies: Currency[] = CURRENCIES.map(c => ({
    id: `cur-${c.code}`,
    name: c.name,
    code: c.code,
    symbol: c.symbol,
    exchangeRate: 1,
    isDefault: c.code === 'USD',
}));
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
     { id: 'emp-1', name: 'John Doe', employeeId: 'EMP001', phone: '555-0001', joiningDate: '2023-01-15', designation: 'Senior Waiter', isActive: true, isWaiter: true, waiterId: 'waiter-1', outletId: 'outlet-1' },
    { id: 'emp-2', name: 'Jane Smith', employeeId: 'EMP002', phone: '555-0002', joiningDate: '2023-02-20', designation: 'Waiter/Waitress', isActive: true, isWaiter: true, waiterId: 'waiter-2', outletId: 'outlet-1' },
    { id: 'emp-3', name: 'Peter Pan', employeeId: 'EMP003', phone: '555-0003', joiningDate: '2023-03-10', designation: 'Manager', isActive: true, isWaiter: false, salary: 50000, outletId: 'outlet-1' },
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
    kotPaperSize: PaperSize['80mm'],
    kotCharactersPerLine: 42,
    receiptPaperSize: PaperSize['80mm'],
    invoicePaperSize: PaperSize['80mm'],
    invoiceCharactersPerLine: 40,
    saleDetailsPaperSize: PaperSize['80mm'],
    saleDetailsCharactersPerLine: 40,
    invoiceFontSize: 12,
    invoiceSideMarginMm: 5,
    invoiceDividerStyle: 'dashed',
    defaultWalkInCustomerId: 'cust-walkin',
    defaultOrderType: 'Dine In',
    autoClearHistoryDays: 0, // 0 = NEVER auto-clear history - keep everything forever
    invoiceTitle: 'Invoice',
    invoiceFooterText: 'Thank you Visit Us Again!',
    invoiceShowLogo: true,
    invoiceShowQrCode: true,
    invoiceShowRestaurantDetails: true,
    invoiceRestaurantSectionTitle: '',
    invoiceShowRestaurantName: true,
    invoiceShowRestaurantAddress: true,
    invoiceShowRestaurantPhone: true,
    invoiceShowRestaurantEmail: true,
    invoiceShowCustomerDetails: true,
    invoiceCustomerSectionTitle: 'Customer Details',
    invoiceShowCustomerName: true,
    invoiceShowCustomerPhone: true,
    invoiceShowCustomerEmail: true,
    invoiceShowCustomerAddress: true,
    invoiceShowCustomerCompany: true,
    invoiceShowCustomerVatPan: true,
    invoiceShowTaxBreakdown: true,
    invoiceShowPaymentDetails: true,
    invoiceShowPaymentMethod: true,
    invoiceShowPaymentDate: true,
    invoiceShowPaymentReference: true,
    invoiceShowReceivedAmount: true,
    invoiceShowReturnAmount: true,
    invoiceShowReturnInformation: true,
    invoiceReturnPolicyText: 'Items can be returned within 7 days with receipt.',
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
    { id: 'plan-1', name: 'Basic', price: 2999, period: 'yearly', features: ['POS Billing', 'Food Menu', 'Customer Management', 'Basic Reports', 'Website Menu'], featureKeys: ['pos', 'menu', 'customers', 'reports', 'website', 'subscription'], trialDays: 14, limits: { maxTables: 25 }, isPublic: true, isActive: true },
    { id: 'plan-2', name: 'Pro', price: 5999, period: 'yearly', features: ['Everything in Basic', 'Kitchen Display', 'Tables', 'Reservations', 'Inventory', 'WhatsApp', 'Self Order'], featureKeys: ['pos', 'kds', 'customerDisplay', 'menu', 'tables', 'reservations', 'inventory', 'customers', 'purchase', 'reports', 'website', 'whatsapp', 'selfOrder', 'subscription'], trialDays: 30, limits: { maxTables: 100 }, isPublic: true, isActive: true, isFeatured: true },
];

const initialSaasWebsiteContent: SaasWebsiteContent = {
    sectionOrder: [],
    header: { brandName: 'RestoByte', logoUrl: '/logo.png', navLinks: [{id: 'l1', text: 'Features', url: '#features'}, {id: 'l2', text: 'Pricing', url: '#pricing'}] },
    footer: {
        brandTitle: 'RestoByte',
        brandDescription: 'Empower your restaurant with the modern tools it deserves.',
        poweredByText: 'Powered by IT Relevant Pvt. Ltd',
        copyright: '© 2024 RestoByte. All rights reserved.',
        columns: [],
        socialLinks: [],
    },
    seo: { title: 'RestoByte', description: '', faviconUrl: '' },
    pages: [
        {
            id: 'page-about-us',
            title: 'About Us',
            slug: 'about-us',
            content: '<h2>Our Mission</h2><p>RestoByte helps modern restaurants run faster, smarter, and with more confidence through one unified operating platform.</p>',
            imageUrl: '',
        },
        {
            id: 'page-contact',
            title: 'Contact',
            slug: 'contact',
            content: '<h2>Contact Our Team</h2><p>Need help with sales, onboarding, or support? Reach out to us and our team will get back to you quickly.</p><p>Email: support@restobyte.com</p><p>Phone: +977-0000000000</p>',
            imageUrl: '',
        },
        {
            id: 'page-career',
            title: 'Career',
            slug: 'career',
            content: '<h2>Join Our Team</h2><p>We are building the future of restaurant operations. If you love products, hospitality, and solving real business problems, we would love to hear from you.</p>',
            imageUrl: '',
        },
        {
            id: 'page-products',
            title: 'Products',
            slug: 'products',
            content: '<h2>Our Product Line</h2><p>Explore POS hardware, displays, printers, tablets, and software solutions built for restaurants of every size.</p>',
            imageUrl: '',
        },
        {
            id: 'page-privacy-policy',
            title: 'Privacy Policy',
            slug: 'privacy-policy',
            content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. This page explains how we collect, use, and protect your data.</p>',
            imageUrl: '',
        },
        {
            id: 'page-terms-of-service',
            title: 'Terms of Service',
            slug: 'terms-of-service',
            content: '<h2>Terms of Service</h2><p>By using RestoByte, you agree to our service terms and acceptable-use policies.</p>',
            imageUrl: '',
        },
    ],
    hero: { title: 'The Ultimate Restaurant Management Platform', subtitle: 'From point of sale to inventory management, streamline your operations and delight your customers.', imageUrl: 'https://placehold.co/1200x600' },
    trustedByLogos: [{id: 'tb1', name: 'Gourmet Grill', logoUrl: ''}, {id: 'tb2', name: 'The Cozy Cafe', logoUrl: ''}],
    statistics: [{id: 'st1', value: '1M+', label: 'Orders Processed'}],
    features: [{id: 'f1', icon: 'FiShoppingCart', title: 'POS System', description: 'A fast and reliable point of sale system.'}],
    cta: { title: 'Get Started with RestoByte', subtitle: 'Sign up today and see the difference.', buttonText: 'Start Free Trial'},
    pricing: [],
    testimonials: [],
    blogPosts: [],
    productsShop: {
        brandLabel: 'RestoByte Shop',
        title: 'Hardware & Accessories',
        subtitle: 'High-performance hardware fully integrated with RestoByte software. Build your dream setup today.',
        whatsappNumber: '+9779843927360',
        ctaTitle: 'Need a full restaurant setup?',
        ctaSubtitle: 'Our experts can help you choose the right hardware for your specific floor plan and kitchen volume.',
        ctaButtonText: 'Request a Custom Quote',
        categories: ['Hardware', 'Accessories', 'Infrastructure'],
        products: [
            {
                id: 'shop-1',
                name: 'Pro POS Terminal v4',
                category: 'Hardware',
                price: 599,
                rating: 4.9,
                imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=400',
                icon: 'FiMonitor',
                isInStock: true,
                description: 'A durable, high-performance POS terminal built for fast billing and peak-hour reliability.',
                highlights: ['Touch display', 'Fast boot', 'Built for long shifts']
            },
            {
                id: 'shop-2',
                name: 'Thermal Receipt Printer',
                category: 'Accessories',
                price: 129,
                rating: 4.8,
                imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=400',
                icon: 'FiPrinter',
                isInStock: true,
                description: 'High-speed thermal printer for crisp receipts with minimal maintenance.',
                highlights: ['Fast print', 'Low noise', 'Easy roll change']
            },
            {
                id: 'shop-3',
                name: 'Waiter Tablet Pro',
                category: 'Hardware',
                price: 249,
                rating: 4.7,
                imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400',
                icon: 'FiTablet',
                isInStock: true,
                description: 'Lightweight tablet designed for quick order-taking and table-side operations.',
                highlights: ['Long battery', 'Rugged body', 'Fast Wi‑Fi']
            },
            {
                id: 'shop-4',
                name: 'Kitchen KDS Controller',
                category: 'Infrastructure',
                price: 189,
                rating: 4.9,
                imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400',
                icon: 'FiCpu',
                isInStock: true,
                description: 'KDS controller to keep kitchen displays synced with orders in real time.',
                highlights: ['Realtime sync', 'Stable performance', 'Compact design']
            },
            {
                id: 'shop-5',
                name: 'Cash Drawer Pro',
                category: 'Accessories',
                price: 89,
                rating: 4.6,
                imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c02?auto=format&fit=crop&q=80&w=400',
                icon: 'FiDatabase',
                isInStock: true,
                description: 'Smooth, secure cash drawer compatible with standard POS setups.',
                highlights: ['Heavy duty', 'Secure lock', 'Easy integration']
            },
            {
                id: 'shop-6',
                name: 'Barcode Scanner v2',
                category: 'Accessories',
                price: 75,
                rating: 4.8,
                imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=400',
                icon: 'FiGrid',
                isInStock: true,
                description: 'Reliable scanner for quick item lookup and faster checkout workflows.',
                highlights: ['Quick scan', 'Comfort grip', 'Plug & play']
            }
        ]
    }
};

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const backupKey = `${key}_backup`;
    
    // State to hold the current key
    const [currentKey, setCurrentKey] = useState(key);
    
    const [storedValue, setStoredValue] = useState<T>(() => {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      try {
        // Try to get primary data first
        const item = window.localStorage.getItem(key);
        if (item) {
          try {
            return JSON.parse(item);
          } catch (parseError) {
            console.error(`Error parsing ${key}, trying backup...`, parseError);
            // If primary fails, try backup
            const backupItem = window.localStorage.getItem(backupKey);
            if (backupItem) {
              try {
                const backupData = JSON.parse(backupItem);
                console.log(`Restored ${key} from backup`);
                // Restore backup to primary
                window.localStorage.setItem(key, backupItem);
                return backupData;
              } catch (backupParseError) {
                console.error(`Error parsing backup for ${key}, using initial value`, backupParseError);
              }
            }
            return initialValue;
          }
        }
        return initialValue;
      } catch (error) {
        console.error(`Error loading ${key} from localStorage`, error);
        return initialValue;
      }
    });

    const storedValueRef = useRef(storedValue);
    const initialValueRef = useRef(initialValue);

    useEffect(() => {
        storedValueRef.current = storedValue;
    }, [storedValue]);

    useEffect(() => {
        initialValueRef.current = initialValue;
    }, [initialValue]);

    // Listen for changes in other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === currentKey) {
                try {
                    setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValueRef.current);
                } catch (error) {
                    console.error(error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentKey]);

    // Update stored value if key changes
    useEffect(() => {
        if (key === currentKey) return;
        
        setCurrentKey(key);
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                try {
                    setStoredValue(JSON.parse(item));
                } catch (parseError) {
                    console.error(`Error parsing ${key} on key change, trying backup...`, parseError);
                    const backupItem = window.localStorage.getItem(`${key}_backup`);
                    if (backupItem) {
                        try {
                            setStoredValue(JSON.parse(backupItem));
                        } catch (backupParseError) {
                            console.error(`Error parsing backup for ${key}`, backupParseError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error loading ${key} on key change`, error);
        }
    }, [key, currentKey]);
  
    const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback(value => {
      try {
        const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
            const serializedValue = JSON.stringify(valueToStore);
            window.localStorage.setItem(currentKey, serializedValue);
            // Also save a backup for safety
            window.localStorage.setItem(`${currentKey}_backup`, serializedValue);
            // Dispatch a custom event so the current window also updates if we have multiple hooks using the same key
            window.dispatchEvent(new StorageEvent('storage', { key: currentKey, newValue: serializedValue }));
        }
      } catch (error) {
        console.error(error);
      }
    }, [currentKey]);
  
    return [storedValue, setValue];
};

export const RestaurantDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, logout, isLoading } = useAuth();

    // Helper to generate outlet-specific keys
    const getKey = useCallback((baseKey: string) => user?.outletId ? `${baseKey}_${user.outletId}` : baseKey, [user?.outletId]);
    // Helper to generate tenant-specific keys (for settings that should not change with active outlet)
    const getTenantKey = useCallback((baseKey: string) => user?.tenantId ? `${baseKey}_${user.tenantId}` : baseKey, [user?.tenantId]);

    // Migrate data from legacy keys (without outlet/tenant ID) to new keys
    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated || !user?.outletId || !user?.tenantId) return;

        const outletSpecificKeys = [
            'reservations', 'customerPayments', 'preMadeFoodItems', 'stockItems', 'stockEntries',
            'stockAdjustment', 'suppliers', 'areasFloors', 'kitchens', 'printers',
            'counters', 'waiters', 'denominations', 'purchases', 'expenseCategories',
            'expenses', 'wasteRecords', 'employees', 'attendanceRecords',
            'payrollRecords', 'paymentMethods', 'deliveryPartners',
            'isSelfOrderEnabled', 'isReservationOrderEnabled',
            'reservationOrderReceivingUserIds', 'reservationSettings',
            'websiteSettings', 'applicationSettings', 'soundSettings', 'roles',
            'addonGroups'
        ];

        const tenantSpecificKeys = [
            'activeOutletIds', 'outlets'
        ];

        try {
            // Migrate outlet-specific keys
            outletSpecificKeys.forEach(baseKey => {
                const legacyKey = baseKey;
                const newKey = `${baseKey}_${user.outletId}`;
                const legacyValue = localStorage.getItem(legacyKey);
                if (legacyValue !== null) {
                    const currentValue = localStorage.getItem(newKey);
                    if (currentValue === null) {
                        localStorage.setItem(newKey, legacyValue);
                        console.log(`Migrated ${baseKey} from legacy key ${legacyKey} to new key ${newKey}`);
                    }
                    // Don't remove legacy key yet, just in case
                }
            });

            // Migrate tenant-specific keys
            tenantSpecificKeys.forEach(baseKey => {
                const legacyKey = baseKey;
                const newKey = `${baseKey}_${user.tenantId}`;
                const legacyValue = localStorage.getItem(legacyKey);
                if (legacyValue !== null) {
                    const currentValue = localStorage.getItem(newKey);
                    if (currentValue === null) {
                        localStorage.setItem(newKey, legacyValue);
                        console.log(`Migrated ${baseKey} from legacy key ${legacyKey} to new key ${newKey}`);
                    }
                }
            });
        } catch (error) {
            console.error("Error migrating localStorage data:", error);
        }
    }, [isLoading, isAuthenticated, user?.outletId, user?.tenantId]);

    const [activeOutletIds, setActiveOutletIds] = useState<string[]>([]);
    const selectedDataOutletId = activeOutletIds[0] || (user?.outletId ? String(user.outletId) : undefined);

    // This is a simplified implementation. A real app would use a more robust state management solution.
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [foodMenuCategories, setFoodMenuCategories] = useState<FoodMenuCategory[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const fetchOutlets = useCallback(async () => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem('authToken');
        if (!token) {
            setOutlets([]);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/outlets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 401) { logout(); return; }
            if (!res.ok) {
                setOutlets([]);
                return;
            }
            const data = await res.json();
            setOutlets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch outlets:", err);
            setOutlets([]);
        }
    }, [isAuthenticated, logout]);

    const fetchMenuItems = useCallback(async () => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem('authToken');
        if (!token || activeOutletIds.length === 0) {
            setMenuItems([]);
            return;
        }
        try {
            const results = await Promise.all(activeOutletIds.map(outletId =>
                fetch(`${API_BASE_URL}/menu-items?outletId=${encodeURIComponent(outletId)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(async res => {
                    if (res.status === 401) { logout(); return []; }
                    if (!res.ok) return [];
                    return res.json().catch(() => []);
                })
            ));
            const flat = results.flat().filter(Boolean);
            const deduped = Array.from(new Map(flat.map((it: any) => [String(it?.id || ''), it])).values()).filter((it: any) => it && it.id);
            setMenuItems(deduped);
        } catch (err) {
            console.error("Failed to fetch menu items:", err);
            setMenuItems([]);
        }
    }, [isAuthenticated, activeOutletIds, logout]);

    const fetchCategories = useCallback(async () => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem('authToken');
        if (!token || activeOutletIds.length === 0) {
            setFoodMenuCategories([]);
            return;
        }
        try {
            const results = await Promise.all(activeOutletIds.map(outletId =>
                fetch(`${API_BASE_URL}/categories?outletId=${encodeURIComponent(outletId)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(async res => {
                    if (res.status === 401) { logout(); return []; }
                    if (!res.ok) return [];
                    return res.json().catch(() => []);
                })
            ));
            const flat = results.flat().filter(Boolean);
            const deduped = Array.from(new Map(flat.map((it: any) => [String(it?.id || ''), it])).values()).filter((it: any) => it && it.id);
            setFoodMenuCategories(deduped);
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            setFoodMenuCategories([]);
        }
    }, [isAuthenticated, activeOutletIds, logout]);

    const fetchTables = useCallback(async () => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem('authToken');
        if (!token || activeOutletIds.length === 0) {
            setTables([]);
            return;
        }
        try {
            const results = await Promise.all(activeOutletIds.map(outletId =>
                fetch(`${API_BASE_URL}/tables?outletId=${encodeURIComponent(outletId)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(async res => {
                    if (res.status === 401) { logout(); return []; }
                    if (!res.ok) return [];
                    return res.json().catch(() => []);
                })
            ));
            const flat = results.flat().filter(Boolean);
            const deduped = Array.from(new Map(flat.map((it: any) => [String(it?.id || ''), it])).values()).filter((it: any) => it && it.id);
            setTables(deduped);
        } catch (err) {
            console.error("Failed to fetch tables:", err);
            setTables([]);
        }
    }, [isAuthenticated, activeOutletIds, logout]);

    const fetchCustomers = useCallback(async () => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem('authToken');
        if (!token || activeOutletIds.length === 0) {
            setCustomers([]);
            return;
        }
        try {
            const results = await Promise.all(activeOutletIds.map(outletId =>
                fetch(`${API_BASE_URL}/customers?outletId=${encodeURIComponent(outletId)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(async res => {
                    if (res.status === 401) { logout(); return []; }
                    if (!res.ok) return [];
                    return res.json().catch(() => []);
                })
            ));
            const flat = results.flat().filter(Boolean);
            const normalized = flat.map((c: any) => ({
                ...c,
                dueAmount: c?.dueAmount === undefined || c?.dueAmount === null ? 0 : Number(c.dueAmount),
                dob: c?.dob ? String(c.dob).slice(0, 10) : undefined,
            }));
            const deduped = Array.from(new Map(normalized.map((it: any) => [String(it?.id || ''), it])).values()).filter((it: any) => it && it.id);
            setCustomers(deduped);
        } catch (err) {
            console.error("Failed to fetch customers:", err);
            setCustomers([]);
        }
    }, [isAuthenticated, activeOutletIds, logout]);

    const fetchPrinters = useCallback(async () => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem('authToken');
        if (!token || activeOutletIds.length === 0) {
            setPrinters([]);
            return;
        }
        try {
            const results = await Promise.all(activeOutletIds.map(outletId =>
                fetch(`${API_BASE_URL}/printers?outletId=${encodeURIComponent(outletId)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(async res => {
                    if (res.status === 401) { logout(); return []; }
                    if (!res.ok) return [];
                    return res.json().catch(() => []);
                })
            ));
            const flat = results.flat().filter(Boolean);
            const deduped = Array.from(new Map(flat.map((it: any) => [String(it?.id || ''), it])).values()).filter((it: any) => it && it.id);
            setPrinters(deduped);
        } catch (err) {
            console.error("Failed to fetch printers:", err);
            setPrinters([]);
        }
    }, [isAuthenticated, activeOutletIds, logout]);

    const fetchSales = useCallback(async () => {
        if (!isAuthenticated) {
            setSales([]);
            return;
        }
        const token = localStorage.getItem('authToken');
        if (!token || activeOutletIds.length === 0) {
            setSales([]);
            return;
        }
        try {
            const results = await Promise.all(activeOutletIds.map((outletId) =>
                fetch(`${API_BASE_URL}/orders?outletId=${encodeURIComponent(outletId)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(async (res) => {
                    if (res.status === 401) {
                        logout();
                        return [];
                    }
                    if (!res.ok) return [];
                    return res.json().catch(() => []);
                })
            ));
            const flat = results.flat().filter(Boolean);
            const mapped = flat.map(mapBackendOrderToSale);
            const deduped = Array.from(new Map(mapped.map((sale) => [String(sale.id), sale])).values())
                .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
            setSales(deduped);
        } catch (err) {
            console.error('Failed to fetch sales:', err);
            setSales([]);
        }
    }, [isAuthenticated, activeOutletIds, logout]);

    useEffect(() => { fetchOutlets(); }, [fetchOutlets]);
    useEffect(() => { fetchMenuItems(); }, [fetchMenuItems]);
    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchTables(); }, [fetchTables]);
    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
    useEffect(() => { fetchPrinters(); }, [fetchPrinters]);
    useEffect(() => { fetchSales(); }, [fetchSales]);

    // Update activeOutletIds when outlets or user changes
    useEffect(() => {
        if (!isAuthenticated || outlets.length === 0) {
            setActiveOutletIds([]);
            return;
        }

        // Use user's outletId first, then fall back to first outlet
        const userOutletId = user?.outletId ? String(user.outletId) : undefined;
        const userOutletIds = Array.isArray((user as any)?.outletIds) ? (user as any).outletIds.map(String) : (userOutletId ? [userOutletId] : []);
        
        const allowedOutletIds = user?.isSuperAdmin ? outlets.map(o => o.id) : userOutletIds;

        const validActiveOutletIds = activeOutletIds.filter(id => allowedOutletIds.includes(id));
        
        if (validActiveOutletIds.length === 0 && allowedOutletIds.length > 0) {
            setActiveOutletIds([allowedOutletIds[0]]);
        } else if (validActiveOutletIds.length !== activeOutletIds.length || !validActiveOutletIds.every((id, i) => id === activeOutletIds[i])) {
            setActiveOutletIds(validActiveOutletIds);
        }
    }, [outlets, user, isAuthenticated]);

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
    const [preMadeFoodItems, setPreMadeFoodItems] = useState<PreMadeFoodItem[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems);
    const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
    const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [areasFloors, setAreasFloors] = useState<AreaFloor[]>(initialAreasFloors);
    const [kitchens, setKitchens] = useState<Kitchen[]>(initialKitchens);
    const [printers, setPrinters] = useState<Printer[]>(initialPrinters);
    const [counters, setCounters] = useState<Counter[]>(initialCounters);
    const [waiters, setWaiters] = useState<Waiter[]>(initialWaiters);
    const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/currencies`);
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data)) setCurrencies(data);
            } catch (err) {
                console.error('Failed to fetch currencies:', err);
            }
        };
        fetchCurrencies();
    }, []);

    const [denominations, setDenominations] = useState<Denomination[]>(initialDenominations);
    const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(initialWasteRecords);
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendanceRecords);
    const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(initialPayrollRecords);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
    const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>(initialDeliveryPartners);
    const [isSelfOrderEnabled, setSelfOrderStatus] = useState<boolean>(false);
    const [isReservationOrderEnabled, setReservationOrderStatus] = useState<boolean>(false);
    const [reservationOrderReceivingUserIds, setReservationOrderReceivingUserIds] = useState<string[]>([]);
    const [reservationSettings, setReservationSettings] = useState<ReservationSettings>({ enabled: true, availability: [] });
    const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>({ orderEnabled: true, orderReceivingUserIds: [], whiteLabel: { appName: 'RestoByte', primaryColor: '#0ea5e9' }, homePageContent: { bannerSection: { title: 'Welcome', subtitle: '' }, serviceSection: {services:[]}, exploreMenuSection: {title: 'Explore', subtitle: '', buttonText: 'View Menu'}, gallery: [], socialMedia: []}, availableOnlineFoodIds: [], aboutUsContent: {title: '', content: ''}, contactUsContent: {address: '', phone: '', email: ''}, contactMessages: [], commonMenuPage: {title: 'Our Menu'}, socialLogin: {google: false, facebook: false}, emailSettings: {mailer: 'log'}, paymentSettings: {paypalEnabled: false, stripeEnabled: false, fonepayEnabled: false} });
    const [applicationSettings, setApplicationSettings] = useState<ApplicationSettings>(initialApplicationSettings);
    const [soundSettings, setSoundSettings] = useState<SoundSettings>({ soundsEnabled: true });
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [users, setUsers] = useState<User[]>([]);
    const [saasWebsiteContent, setSaasWebsiteContent] = useState<SaasWebsiteContent>(initialSaasWebsiteContent);
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [tenantEntitlements, setTenantEntitlements] = useState<TenantEntitlements | null>(null);
    const [saasSettings, setSaaSSettings] = useState<SaaSSettings>(initialSaasSettings);
    const [addonGroups, setAddonGroups] = useState<AddonGroup[]>(initialAddonGroups);

    const outletAppDataReadyRef = useRef<Record<string, boolean>>({});
    const outletAppDataSerializedRef = useRef<Record<string, string>>({});
    const outletAppDataMutationVersionRef = useRef<Record<string, number>>({});
    const userAppDataReadyRef = useRef<Record<string, boolean>>({});
    const userAppDataSerializedRef = useRef<Record<string, string>>({});
    const globalAppDataReadyRef = useRef<Record<string, boolean>>({});
    const globalAppDataSerializedRef = useRef<Record<string, string>>({});
    const purchasesRef = useRef<Purchase[]>(initialPurchases);
    const expenseCategoriesRef = useRef<ExpenseCategory[]>(initialExpenseCategories);
    const expensesRef = useRef<Expense[]>(initialExpenses);
    const wasteRecordsRef = useRef<WasteRecord[]>(initialWasteRecords);
    const employeesRef = useRef<Employee[]>(initialEmployees);
    const deliveryPartnersRef = useRef<DeliveryPartner[]>(initialDeliveryPartners);

    const fetchOutletAppData = useCallback(async (key: string, outletId: string) => {
        if (!isAuthenticated) return null;
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        try {
            const res = await fetch(`${API_BASE_URL}/app-data/${encodeURIComponent(key)}?outletId=${encodeURIComponent(outletId)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                logout();
                return null;
            }

            if (!res.ok) return null;

            const payload = await res.json().catch(() => null);
            return payload?.data ?? null;
        } catch (err) {
            console.error(`Failed to fetch app data for ${key}:`, err);
            return null;
        }
    }, [isAuthenticated, logout]);

    const persistOutletAppData = useCallback(async (key: string, outletId: string, data: unknown) => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/app-data/${encodeURIComponent(key)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ outletId, data }),
            });

            if (res.status === 401) {
                logout();
                return;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                console.error(`Failed to persist app data for ${key}:`, err?.message || res.statusText);
            }
        } catch (err) {
            console.error(`Failed to persist app data for ${key}:`, err);
        }
    }, [isAuthenticated, logout]);

    const fetchUserAppData = useCallback(async (key: string) => {
        if (!isAuthenticated) return null;
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        try {
            const res = await fetch(`${API_BASE_URL}/app-data/user/${encodeURIComponent(key)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                logout();
                return null;
            }

            if (!res.ok) return null;

            const payload = await res.json().catch(() => null);
            return payload?.data ?? null;
        } catch (err) {
            console.error(`Failed to fetch user app data for ${key}:`, err);
            return null;
        }
    }, [isAuthenticated, logout]);

    const persistUserAppData = useCallback(async (key: string, data: unknown) => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/app-data/user/${encodeURIComponent(key)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ data }),
            });

            if (res.status === 401) {
                logout();
                return;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                console.error(`Failed to persist user app data for ${key}:`, err?.message || res.statusText);
            }
        } catch (err) {
            console.error(`Failed to persist user app data for ${key}:`, err);
        }
    }, [isAuthenticated, logout]);

    const fetchGlobalAppData = useCallback(async (key: string) => {
        if (!isAuthenticated || !user?.isSuperAdmin) return null;
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        try {
            const res = await fetch(`${API_BASE_URL}/app-data/global/${encodeURIComponent(key)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                logout();
                return null;
            }

            if (!res.ok) return null;

            const payload = await res.json().catch(() => null);
            return payload?.data ?? null;
        } catch (err) {
            console.error(`Failed to fetch global app data for ${key}:`, err);
            return null;
        }
    }, [isAuthenticated, logout, user?.isSuperAdmin]);

    const persistGlobalAppData = useCallback(async (key: string, data: unknown) => {
        if (!isAuthenticated || !user?.isSuperAdmin) return;
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/app-data/global/${encodeURIComponent(key)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ data }),
            });

            if (res.status === 401) {
                logout();
                return;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                console.error(`Failed to persist global app data for ${key}:`, err?.message || res.statusText);
            }
        } catch (err) {
            console.error(`Failed to persist global app data for ${key}:`, err);
        }
    }, [isAuthenticated, logout, user?.isSuperAdmin]);

    useEffect(() => {
        purchasesRef.current = purchases;
    }, [purchases]);

    useEffect(() => {
        expenseCategoriesRef.current = expenseCategories;
    }, [expenseCategories]);

    useEffect(() => {
        expensesRef.current = expenses;
    }, [expenses]);

    useEffect(() => {
        wasteRecordsRef.current = wasteRecords;
    }, [wasteRecords]);

    const markOutletAppDataMutated = useCallback((key: string, outletId: string) => {
        const scopeKey = `${outletId}:${key}`;
        outletAppDataMutationVersionRef.current[scopeKey] = (outletAppDataMutationVersionRef.current[scopeKey] || 0) + 1;
        return scopeKey;
    }, []);

    const persistOutletCollectionImmediately = useCallback((key: string, outletId: string, data: unknown) => {
        const scopeKey = `${outletId}:${key}`;
        outletAppDataReadyRef.current[scopeKey] = true;
        outletAppDataSerializedRef.current[scopeKey] = JSON.stringify(data);
        void persistOutletAppData(key, outletId, data);
    }, [persistOutletAppData]);

    const resolveOutletDataId = useCallback((preferredOutletId?: string | null) => {
        if (typeof preferredOutletId === 'string' && preferredOutletId.trim().length > 0) {
            return preferredOutletId.trim();
        }

        if (selectedDataOutletId) return selectedDataOutletId;
        if (activeOutletIds.length > 0) return activeOutletIds[0];
        if (user?.outletId) return String(user.outletId);
        return undefined;
    }, [activeOutletIds, selectedDataOutletId, user?.outletId]);

    useEffect(() => {
        if (!isAuthenticated || !selectedDataOutletId) return;

        let cancelled = false;
        const configs: Array<{ key: string; fallback: unknown; getValue: () => unknown; setValue: (value: any) => void }> = [
            { key: 'reservations', fallback: [] as Reservation[], getValue: () => reservations, setValue: (value) => setReservations(value) },
            { key: 'customerPayments', fallback: [] as CustomerPayment[], getValue: () => customerPayments, setValue: (value) => setCustomerPayments(value) },
            { key: 'preMadeFoodItems', fallback: [] as PreMadeFoodItem[], getValue: () => preMadeFoodItems, setValue: (value) => setPreMadeFoodItems(value) },
            { key: 'stockItems', fallback: initialStockItems, getValue: () => stockItems, setValue: (value) => setStockItems(value) },
            { key: 'stockEntries', fallback: [] as StockEntry[], getValue: () => stockEntries, setValue: (value) => setStockEntries(value) },
            { key: 'stockAdjustments', fallback: [] as StockAdjustment[], getValue: () => stockAdjustments, setValue: (value) => setStockAdjustments(value) },
            { key: 'suppliers', fallback: [] as Supplier[], getValue: () => suppliers, setValue: (value) => setSuppliers(value) },
            { key: 'areasFloors', fallback: initialAreasFloors, getValue: () => areasFloors, setValue: (value) => setAreasFloors(value) },
            { key: 'kitchens', fallback: initialKitchens, getValue: () => kitchens, setValue: (value) => setKitchens(value) },
            { 
                key: 'printers', 
                fallback: initialPrinters, 
                getValue: () => printers, 
                setValue: (value) => { 
                    // Migrate printers to ensure all new fields exist
                    const migrated = Array.isArray(value) ? value.map(p => ({
                        isActive: true,
                        paperSize: undefined,
                        printerModel: undefined,
                        timeoutMs: 5000,
                        retries: 3,
                        autoPrintReceipt: false,
                        autoPrintKOT: false,
                        autoPrintLabel: false,
                        notes: undefined,
                        ...p
                    })) : initialPrinters;
                    setPrinters(migrated);
                } 
            },
            { key: 'counters', fallback: initialCounters, getValue: () => counters, setValue: (value) => setCounters(value) },
            { key: 'waiters', fallback: initialWaiters, getValue: () => waiters, setValue: (value) => setWaiters(value) },
            { key: 'denominations', fallback: initialDenominations, getValue: () => denominations, setValue: (value) => setDenominations(value) },
            { key: 'purchases', fallback: initialPurchases, getValue: () => purchasesRef.current, setValue: (value) => setPurchases(value) },
            { key: 'expenseCategories', fallback: initialExpenseCategories, getValue: () => expenseCategoriesRef.current, setValue: (value) => setExpenseCategories(value) },
            { key: 'expenses', fallback: initialExpenses, getValue: () => expensesRef.current, setValue: (value) => setExpenses(value) },
            { key: 'wasteRecords', fallback: initialWasteRecords, getValue: () => wasteRecordsRef.current, setValue: (value) => setWasteRecords(value) },
            { key: 'employees', fallback: initialEmployees, getValue: () => employeesRef.current, setValue: (value) => { employeesRef.current = value; setEmployees(value); } },
            { key: 'attendanceRecords', fallback: initialAttendanceRecords, getValue: () => attendanceRecords, setValue: (value) => setAttendanceRecords(value) },
            { key: 'payrollRecords', fallback: initialPayrollRecords, getValue: () => payrollRecords, setValue: (value) => setPayrollRecords(value) },
            { key: 'paymentMethods', fallback: initialPaymentMethods, getValue: () => paymentMethods, setValue: (value) => setPaymentMethods(value) },
            { key: 'deliveryPartners', fallback: initialDeliveryPartners, getValue: () => deliveryPartnersRef.current, setValue: (value) => { deliveryPartnersRef.current = value; setDeliveryPartners(value); } },
            { key: 'isSelfOrderEnabled', fallback: false, getValue: () => isSelfOrderEnabled, setValue: (value) => setSelfOrderStatus(Boolean(value)) },
            { key: 'isReservationOrderEnabled', fallback: false, getValue: () => isReservationOrderEnabled, setValue: (value) => setReservationOrderStatus(Boolean(value)) },
            { key: 'reservationOrderReceivingUserIds', fallback: [] as string[], getValue: () => reservationOrderReceivingUserIds, setValue: (value) => setReservationOrderReceivingUserIds(Array.isArray(value) ? value : []) },
            { key: 'reservationSettings', fallback: { enabled: true, availability: [] } as ReservationSettings, getValue: () => reservationSettings, setValue: (value) => setReservationSettings(value) },
            { key: 'websiteSettings', fallback: { orderEnabled: true, orderReceivingUserIds: [], whiteLabel: { appName: 'RestoByte', primaryColor: '#0ea5e9' }, homePageContent: { bannerSection: { title: 'Welcome', subtitle: '' }, serviceSection: { services: [] }, exploreMenuSection: { title: 'Explore', subtitle: '', buttonText: 'View Menu' }, gallery: [], socialMedia: [] }, availableOnlineFoodIds: [], aboutUsContent: { title: '', content: '' }, contactUsContent: { address: '', phone: '', email: '' }, contactMessages: [], commonMenuPage: { title: 'Our Menu' }, socialLogin: { google: false, facebook: false }, emailSettings: { mailer: 'log' }, paymentSettings: { paypalEnabled: false, stripeEnabled: false, fonepayEnabled: false } } as WebsiteSettings, getValue: () => websiteSettings, setValue: (value) => setWebsiteSettings(value) },
            {
                key: 'applicationSettings',
                fallback: initialApplicationSettings,
                getValue: () => applicationSettings,
                setValue: (value) => setApplicationSettings({ ...initialApplicationSettings, ...(value || {}) })
            },
            { key: 'soundSettings', fallback: { soundsEnabled: true } as SoundSettings, getValue: () => soundSettings, setValue: (value) => setSoundSettings(value) },
            { key: 'addonGroups', fallback: initialAddonGroups, getValue: () => addonGroups, setValue: (value) => setAddonGroups(value) },
        ];

        void Promise.all(configs.map(async ({ key, fallback, getValue, setValue }) => {
            const scopeKey = `${selectedDataOutletId}:${key}`;
            outletAppDataReadyRef.current[scopeKey] = false;
            const mutationVersionAtLoadStart = outletAppDataMutationVersionRef.current[scopeKey] || 0;

            const loaded = await fetchOutletAppData(key, selectedDataOutletId);
            if (cancelled) return;

            const mutationVersionAfterLoad = outletAppDataMutationVersionRef.current[scopeKey] || 0;
            if (mutationVersionAfterLoad !== mutationVersionAtLoadStart) {
                const currentValue = getValue();
                outletAppDataSerializedRef.current[scopeKey] = JSON.stringify(currentValue);
                outletAppDataReadyRef.current[scopeKey] = true;
                return;
            }

            const nextValue = loaded ?? fallback;
            outletAppDataSerializedRef.current[scopeKey] = JSON.stringify(nextValue);
            setValue(nextValue);
            outletAppDataReadyRef.current[scopeKey] = true;
        }));

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, selectedDataOutletId, fetchOutletAppData]);

    useEffect(() => {
        if (!isAuthenticated || !selectedDataOutletId) return;

        const configs = [
            { key: 'reservations', value: reservations },
            { key: 'customerPayments', value: customerPayments },
            { key: 'preMadeFoodItems', value: preMadeFoodItems },
            { key: 'stockItems', value: stockItems },
            { key: 'stockEntries', value: stockEntries },
            { key: 'stockAdjustments', value: stockAdjustments },
            { key: 'suppliers', value: suppliers },
            { key: 'areasFloors', value: areasFloors },
            { key: 'kitchens', value: kitchens },
            { key: 'printers', value: printers },
            { key: 'counters', value: counters },
            { key: 'waiters', value: waiters },
            { key: 'denominations', value: denominations },
            { key: 'purchases', value: purchases },
            { key: 'expenseCategories', value: expenseCategories },
            { key: 'expenses', value: expenses },
            { key: 'wasteRecords', value: wasteRecords },
            { key: 'employees', value: employees },
            { key: 'attendanceRecords', value: attendanceRecords },
            { key: 'payrollRecords', value: payrollRecords },
            { key: 'paymentMethods', value: paymentMethods },
            { key: 'deliveryPartners', value: deliveryPartners },
            { key: 'isSelfOrderEnabled', value: isSelfOrderEnabled },
            { key: 'isReservationOrderEnabled', value: isReservationOrderEnabled },
            { key: 'reservationOrderReceivingUserIds', value: reservationOrderReceivingUserIds },
            { key: 'reservationSettings', value: reservationSettings },
            { key: 'websiteSettings', value: websiteSettings },
            { key: 'applicationSettings', value: applicationSettings },
            { key: 'soundSettings', value: soundSettings },
            { key: 'addonGroups', value: addonGroups },
        ];

        configs.forEach(({ key, value }) => {
            const scopeKey = `${selectedDataOutletId}:${key}`;
            if (!outletAppDataReadyRef.current[scopeKey]) return;

            const serialized = JSON.stringify(value);
            if (outletAppDataSerializedRef.current[scopeKey] === serialized) return;

            outletAppDataSerializedRef.current[scopeKey] = serialized;
            void persistOutletAppData(key, selectedDataOutletId, value);
        });
    }, [
        isAuthenticated,
        selectedDataOutletId,
        reservations,
        customerPayments,
        preMadeFoodItems,
        stockItems,
        stockEntries,
        stockAdjustments,
        suppliers,
        areasFloors,
        kitchens,
        printers,
        counters,
        waiters,
        denominations,
        purchases,
        expenseCategories,
        expenses,
        wasteRecords,
        employees,
        attendanceRecords,
        payrollRecords,
        paymentMethods,
        deliveryPartners,
        isSelfOrderEnabled,
        isReservationOrderEnabled,
        reservationOrderReceivingUserIds,
        reservationSettings,
        websiteSettings,
        applicationSettings,
        soundSettings,
        addonGroups,
        persistOutletAppData,
    ]);

    useEffect(() => {
        if (!isAuthenticated) return;

        let cancelled = false;
        userAppDataReadyRef.current.activeOutletIds = false;

        const loadActiveOutletIds = async () => {
            const legacyValue = (() => {
                try {
                    return localStorage.getItem(getTenantKey('activeOutletIds')) || localStorage.getItem(getKey('activeOutletIds'));
                } catch {
                    return null;
                }
            })();

            const legacyIds = (() => {
                if (!legacyValue) return [];
                try {
                    const parsed = JSON.parse(legacyValue);
                    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
                } catch {
                    return [];
                }
            })();

            const fallbackIds = legacyIds.length > 0
                ? legacyIds
                : (user?.outletId ? [String(user.outletId)] : []);

            const loaded = await fetchUserAppData('activeOutletIds');
            if (cancelled) return;

            const nextValue = Array.isArray(loaded) ? loaded.map(String).filter(Boolean) : fallbackIds;
            const normalized = nextValue.length > 0 ? nextValue : fallbackIds;
            userAppDataSerializedRef.current.activeOutletIds = JSON.stringify(normalized);
            setActiveOutletIds(normalized);
            userAppDataReadyRef.current.activeOutletIds = true;
        };

        void loadActiveOutletIds();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?.outletId, fetchUserAppData, getKey, getTenantKey]);

    useEffect(() => {
        if (!isAuthenticated || !userAppDataReadyRef.current.activeOutletIds) return;

        const serialized = JSON.stringify(activeOutletIds);
        if (userAppDataSerializedRef.current.activeOutletIds === serialized) return;

        userAppDataSerializedRef.current.activeOutletIds = serialized;
        void persistUserAppData('activeOutletIds', activeOutletIds);
    }, [isAuthenticated, activeOutletIds, persistUserAppData]);

    useEffect(() => {
        if (!isAuthenticated || !user?.isSuperAdmin) return;

        let cancelled = false;
        globalAppDataReadyRef.current.saasSettings = false;

        const loadSaasSettings = async () => {
            const loaded = await fetchGlobalAppData('saasSettings');
            if (cancelled) return;

            const nextValue = loaded && typeof loaded === 'object'
                ? { ...initialSaasSettings, ...(loaded as Partial<SaaSSettings>) }
                : initialSaasSettings;

            globalAppDataSerializedRef.current.saasSettings = JSON.stringify(nextValue);
            setSaaSSettings(nextValue);
            globalAppDataReadyRef.current.saasSettings = true;
        };

        void loadSaasSettings();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?.isSuperAdmin, fetchGlobalAppData]);

    useEffect(() => {
        if (!isAuthenticated || !user?.isSuperAdmin || !globalAppDataReadyRef.current.saasSettings) return;

        const serialized = JSON.stringify(saasSettings);
        if (globalAppDataSerializedRef.current.saasSettings === serialized) return;

        globalAppDataSerializedRef.current.saasSettings = serialized;
        void persistGlobalAppData('saasSettings', saasSettings);
    }, [isAuthenticated, user?.isSuperAdmin, saasSettings, persistGlobalAppData]);

    useEffect(() => {
        if (!isAuthenticated) return;
        try {
            localStorage.removeItem(getKey('activeOutletIds'));
            localStorage.removeItem(getTenantKey('activeOutletIds'));
        } catch {
        }
    }, [isAuthenticated, getKey, getTenantKey]);

    useEffect(() => {
        if (!isAuthenticated) return;
        if (user?.isSuperAdmin) return;
        if (user?.roleId === 'role-admin') return;

        const allowedOutletIds = Array.isArray((user as any)?.outletIds) && (user as any).outletIds.length > 0
            ? (user as any).outletIds.map(String)
            : (user?.outletId ? [String(user.outletId)] : []);
        if (allowedOutletIds.length === 0) return;

        const filtered = activeOutletIds.filter(id => allowedOutletIds.includes(String(id)));
        const next = filtered.length > 0 ? filtered : [allowedOutletIds[0]!];
        if (next.length === activeOutletIds.length && next.every((id, i) => id === activeOutletIds[i])) return;
        setActiveOutletIds(next);
    }, [isAuthenticated, user?.roleId, user?.outletId, user?.isSuperAdmin, (user as any)?.outletIds, activeOutletIds, setActiveOutletIds]);

    const generateId = () => {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }
        return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };
    const normalizeSaasWebsiteContent = (raw: any): SaasWebsiteContent => {
        const safeObj = raw && typeof raw === 'object' ? raw : {};

        const headerRaw = safeObj.header && typeof safeObj.header === 'object' ? safeObj.header : {};
        const navLinksRaw = Array.isArray(headerRaw.navLinks) ? headerRaw.navLinks : [];
        const navLinks = navLinksRaw
            .map((link: any) => {
                const id = typeof link?.id === 'string' && link.id.trim() ? link.id : generateId();
                const text = typeof link?.text === 'string' ? link.text : (typeof link?.label === 'string' ? link.label : '');
                const url = typeof link?.url === 'string' ? link.url : (typeof link?.href === 'string' ? link.href : '');
                const subLinksRaw = Array.isArray(link?.subLinks) ? link.subLinks : Array.isArray(link?.children) ? link.children : [];
                const subLinks = subLinksRaw
                    .map((sub: any) => ({
                        id: typeof sub?.id === 'string' && sub.id.trim() ? sub.id : generateId(),
                        text: typeof sub?.text === 'string' ? sub.text : (typeof sub?.label === 'string' ? sub.label : ''),
                        url: typeof sub?.url === 'string' ? sub.url : (typeof sub?.href === 'string' ? sub.href : ''),
                    }))
                    .filter((sub: any) => sub.text.trim() && sub.url.trim());
                return { id, text, url, ...(subLinks.length > 0 ? { subLinks } : {}) };
            })
            .filter((link: any) => link.text.trim() && link.url.trim());

        const footerRaw = safeObj.footer && typeof safeObj.footer === 'object' ? safeObj.footer : {};
        const columnsRaw = Array.isArray(footerRaw.columns) ? footerRaw.columns : [];
        const columns = columnsRaw.map((col: any) => {
            const id = typeof col?.id === 'string' && col.id.trim() ? col.id : generateId();
            const title = typeof col?.title === 'string' ? col.title : '';
            const linksRaw = Array.isArray(col?.links) ? col.links : [];
            const links = linksRaw
                .map((l: any) => ({
                    id: typeof l?.id === 'string' && l.id.trim() ? l.id : generateId(),
                    text: typeof l?.text === 'string' ? l.text : (typeof l?.label === 'string' ? l.label : ''),
                    url: typeof l?.url === 'string' ? l.url : (typeof l?.href === 'string' ? l.href : ''),
                }))
                .filter((l: any) => l.text.trim() && l.url.trim());
            return { id, title, links };
        }).filter((c: any) => c.title.trim());

        const socialLinksRaw = Array.isArray(footerRaw.socialLinks) ? footerRaw.socialLinks : [];
        const socialLinks = socialLinksRaw
            .map((s: any) => ({
                id: typeof s?.id === 'string' && s.id.trim() ? s.id : generateId(),
                platform: typeof s?.platform === 'string' ? s.platform : '',
                url: typeof s?.url === 'string' ? s.url : '',
            }))
            .filter((s: any) => s.platform.trim());

        const seoRaw = safeObj.seo && typeof safeObj.seo === 'object' ? safeObj.seo : {};
        const seo = {
            title: typeof seoRaw.title === 'string' ? seoRaw.title : 'RestoByte',
            description: typeof seoRaw.description === 'string' ? seoRaw.description : '',
            faviconUrl: typeof seoRaw.faviconUrl === 'string' ? seoRaw.faviconUrl : '',
        };

        const pagesRaw = Array.isArray(safeObj.pages) ? safeObj.pages : [];
        const pages = pagesRaw.map((p: any) => ({
            id: typeof p?.id === 'string' && p.id.trim() ? p.id : generateId(),
            title: typeof p?.title === 'string' ? p.title : '',
            slug: typeof p?.slug === 'string' ? p.slug : '',
            content: typeof p?.content === 'string' ? p.content : '',
            imageUrl: typeof p?.imageUrl === 'string' ? p.imageUrl : '',
        })).filter((p: any) => p.title.trim() && p.slug.trim());
        const mergedPages = [...pages];
        initialSaasWebsiteContent.pages.forEach((defaultPage) => {
            if (!mergedPages.some((page) => page.slug === defaultPage.slug)) {
                mergedPages.push(defaultPage);
            }
        });

        const heroRaw = safeObj.hero && typeof safeObj.hero === 'object' ? safeObj.hero : {};
        const hero = {
            title: typeof heroRaw.title === 'string' ? heroRaw.title : '',
            subtitle: typeof heroRaw.subtitle === 'string' ? heroRaw.subtitle : '',
            imageUrl: typeof heroRaw.imageUrl === 'string' ? heroRaw.imageUrl : '',
        };

        const trustedByRaw = Array.isArray(safeObj.trustedByLogos) ? safeObj.trustedByLogos : [];
        const trustedByLogos = trustedByRaw.map((l: any) => {
            if (typeof l === 'string') {
                return { id: generateId(), name: '', logoUrl: l };
            }
            return {
                id: typeof l?.id === 'string' && l.id.trim() ? l.id : generateId(),
                name: typeof l?.name === 'string' ? l.name : '',
                logoUrl: typeof l?.logoUrl === 'string' ? l.logoUrl : '',
            };
        }).filter((l: any) => l.name.trim() || l.logoUrl.trim());

        const statisticsRaw = Array.isArray(safeObj.statistics) ? safeObj.statistics : [];
        const statistics = statisticsRaw.map((s: any) => ({
            id: typeof s?.id === 'string' && s.id.trim() ? s.id : generateId(),
            value: typeof s?.value === 'string' ? s.value : (s?.value != null ? String(s.value) : ''),
            label: typeof s?.label === 'string' ? s.label : '',
        })).filter((s: any) => s.label.trim());

        const featuresRaw = Array.isArray(safeObj.features) ? safeObj.features : [];
        const features = featuresRaw.map((f: any) => ({
            id: typeof f?.id === 'string' && f.id.trim() ? f.id : generateId(),
            icon: typeof f?.icon === 'string' ? f.icon : 'FiGift',
            title: typeof f?.title === 'string' ? f.title : '',
            description: typeof f?.description === 'string' ? f.description : '',
        })).filter((f: any) => f.title.trim());

        const ctaRaw = safeObj.cta && typeof safeObj.cta === 'object' ? safeObj.cta : {};
        const cta = {
            title: typeof ctaRaw.title === 'string' ? ctaRaw.title : '',
            subtitle: typeof ctaRaw.subtitle === 'string' ? ctaRaw.subtitle : '',
            buttonText: typeof ctaRaw.buttonText === 'string' ? ctaRaw.buttonText : '',
        };

        const pricingRaw = Array.isArray(safeObj.pricing) ? safeObj.pricing : [];
        const pricing = pricingRaw.map((p: any) => ({
            id: typeof p?.id === 'string' && p.id.trim() ? p.id : generateId(),
            name: typeof p?.name === 'string' ? p.name : '',
            price: typeof p?.price === 'string' ? p.price : (p?.price != null ? String(p.price) : ''),
            period: typeof p?.period === 'string' ? p.period : (typeof p?.interval === 'string' ? p.interval : ''),
            features: Array.isArray(p?.features) ? p.features.filter((x: any) => typeof x === 'string') : [],
            isFeatured: typeof p?.isFeatured === 'boolean'
                ? p.isFeatured
                : (typeof p?.isPopular === 'boolean' ? p.isPopular : Boolean(p?.isPopular)),
        })).filter((p: any) => p.name.trim());

        const testimonialsRaw = Array.isArray(safeObj.testimonials) ? safeObj.testimonials : [];
        const testimonials = testimonialsRaw.map((t: any) => {
            const personName = typeof t?.name === 'string' ? t.name : '';
            const role = typeof t?.role === 'string' ? t.role : '';
            const resultFromLegacy = [personName, role].filter(Boolean).join(', ');

            return {
                id: typeof t?.id === 'string' && t.id.trim() ? t.id : generateId(),
                storeName: typeof t?.storeName === 'string' ? t.storeName : (typeof t?.company === 'string' ? t.company : ''),
                result: typeof t?.result === 'string' ? t.result : resultFromLegacy,
                description: typeof t?.description === 'string' ? t.description : (typeof t?.content === 'string' ? t.content : ''),
                imageUrl: typeof t?.imageUrl === 'string' ? t.imageUrl : (typeof t?.avatarUrl === 'string' ? t.avatarUrl : ''),
            };
        }).filter((t: any) => t.storeName.trim() || t.result.trim() || t.description.trim());

        const blogPostsRaw = Array.isArray(safeObj.blogPosts) ? safeObj.blogPosts : [];
        const blogPosts = blogPostsRaw.map((b: any) => ({
            id: typeof b?.id === 'string' && b.id.trim() ? b.id : generateId(),
            title: typeof b?.title === 'string' ? b.title : '',
            category: typeof b?.category === 'string' ? b.category : (typeof b?.tag === 'string' ? b.tag : ''),
            date: typeof b?.date === 'string' ? b.date : '',
            excerpt: typeof b?.excerpt === 'string' ? b.excerpt : '',
            imageUrl: typeof b?.imageUrl === 'string' ? b.imageUrl : '',
        })).filter((b: any) => b.title.trim());

        const productsShopRaw = safeObj.productsShop && typeof safeObj.productsShop === 'object' ? safeObj.productsShop : {};
        const productsRaw = Array.isArray((productsShopRaw as any).products) ? (productsShopRaw as any).products : [];
        const products = productsRaw.map((p: any) => {
            const priceRaw = p?.price;
            const price =
                typeof priceRaw === 'number'
                    ? priceRaw
                    : typeof priceRaw === 'string'
                        ? Number(priceRaw)
                        : 0;
            const ratingRaw = p?.rating;
            const rating =
                typeof ratingRaw === 'number'
                    ? ratingRaw
                    : typeof ratingRaw === 'string'
                        ? Number(ratingRaw)
                        : undefined;
            const isInStock = typeof p?.isInStock === 'boolean' ? p.isInStock : true;
            const highlightsRaw = Array.isArray(p?.highlights) ? p.highlights : [];
            const highlights = highlightsRaw.filter((x: any) => typeof x === 'string' && x.trim()).map((x: string) => x.trim());

            return {
                id: typeof p?.id === 'string' && p.id.trim() ? p.id : generateId(),
                name: typeof p?.name === 'string' ? p.name : '',
                category: typeof p?.category === 'string' ? p.category : '',
                price: Number.isFinite(price) ? price : 0,
                rating: rating != null && Number.isFinite(rating) ? rating : undefined,
                imageUrl: typeof p?.imageUrl === 'string' ? p.imageUrl : (typeof p?.image === 'string' ? p.image : ''),
                icon: typeof p?.icon === 'string' ? p.icon : undefined,
                isInStock,
                description: typeof p?.description === 'string' ? p.description : '',
                highlights,
            };
        }).filter((p: any) => p.name.trim());

        const categoriesRaw = Array.isArray((productsShopRaw as any).categories) ? (productsShopRaw as any).categories : [];
        const categoriesFromRaw = categoriesRaw.filter((c: any) => typeof c === 'string' && c.trim()).map((c: string) => c.trim());
        const categoriesFromProducts = Array.from(new Set(products.map((p: any) => p.category).filter((c: any) => typeof c === 'string' && c.trim())));
        const categories = categoriesFromRaw.length > 0
            ? categoriesFromRaw
            : categoriesFromProducts.length > 0
                ? categoriesFromProducts
                : (initialSaasWebsiteContent.productsShop.categories || []);

        const productsShop = {
            brandLabel: typeof (productsShopRaw as any).brandLabel === 'string' ? (productsShopRaw as any).brandLabel : initialSaasWebsiteContent.productsShop.brandLabel,
            title: typeof (productsShopRaw as any).title === 'string' ? (productsShopRaw as any).title : initialSaasWebsiteContent.productsShop.title,
            subtitle: typeof (productsShopRaw as any).subtitle === 'string' ? (productsShopRaw as any).subtitle : initialSaasWebsiteContent.productsShop.subtitle,
            whatsappNumber: typeof (productsShopRaw as any).whatsappNumber === 'string' ? (productsShopRaw as any).whatsappNumber : initialSaasWebsiteContent.productsShop.whatsappNumber,
            ctaTitle: typeof (productsShopRaw as any).ctaTitle === 'string' ? (productsShopRaw as any).ctaTitle : initialSaasWebsiteContent.productsShop.ctaTitle,
            ctaSubtitle: typeof (productsShopRaw as any).ctaSubtitle === 'string' ? (productsShopRaw as any).ctaSubtitle : initialSaasWebsiteContent.productsShop.ctaSubtitle,
            ctaButtonText: typeof (productsShopRaw as any).ctaButtonText === 'string' ? (productsShopRaw as any).ctaButtonText : initialSaasWebsiteContent.productsShop.ctaButtonText,
            categories,
            products: products.length > 0 ? products : initialSaasWebsiteContent.productsShop.products,
        };

        const sectionOrderRaw = Array.isArray(safeObj.sectionOrder) ? safeObj.sectionOrder : [];
        const sectionOrder = sectionOrderRaw.filter((k: any) => typeof k === 'string') as string[];

        return {
            sectionOrder: sectionOrder.length > 0 ? sectionOrder : initialSaasWebsiteContent.sectionOrder,
            header: {
                brandName: typeof headerRaw.brandName === 'string' ? headerRaw.brandName : initialSaasWebsiteContent.header.brandName,
                logoUrl: typeof headerRaw.logoUrl === 'string' ? headerRaw.logoUrl : '',
                navLinks,
            },
            footer: {
                brandTitle: typeof footerRaw.brandTitle === 'string' ? footerRaw.brandTitle : initialSaasWebsiteContent.footer.brandTitle,
                brandDescription: typeof footerRaw.brandDescription === 'string' ? footerRaw.brandDescription : initialSaasWebsiteContent.footer.brandDescription,
                poweredByText: typeof footerRaw.poweredByText === 'string' ? footerRaw.poweredByText : initialSaasWebsiteContent.footer.poweredByText,
                copyright: typeof footerRaw.copyright === 'string' ? footerRaw.copyright : '',
                columns,
                socialLinks,
            },
            seo,
            pages: mergedPages,
            hero,
            trustedByLogos,
            statistics,
            features,
            cta,
            pricing,
            testimonials,
            blogPosts,
            productsShop,
        };
    };

    const fetchSaasWebsiteContent = async () => {
        const env = 'default';
        const adminUrl = `${API_BASE_URL}/saas/website-content?env=${encodeURIComponent(env)}`;
        const publicUrl = `${API_BASE_URL}/public/saas-website-content?env=${encodeURIComponent(env)}`;

        try {
            const tryFetch = async (url: string, headers: Record<string, string>) => {
                const res = await fetch(url, { headers });
                if (res.status === 401) {
                    return { ok: false as const, status: 401 as const, data: null as any };
                }
                if (res.status === 403) {
                    return { ok: false as const, status: 403 as const, data: null as any };
                }
                if (!res.ok) {
                    return { ok: false as const, status: res.status, data: null as any };
                }
                const data = await res.json().catch(() => null);
                return { ok: true as const, status: res.status, data };
            };

            let result:
                | { ok: true; status: number; data: any }
                | { ok: false; status: number; data: any };

            if (isAuthenticated && user?.isSuperAdmin) {
                const token = localStorage.getItem('authToken') || '';
                result = await tryFetch(adminUrl, token ? { Authorization: `Bearer ${token}` } : {});
                if (!result.ok && result.status === 401) {
                    logout();
                }
                if (!result.ok && (result.status === 401 || result.status === 403)) {
                    result = await tryFetch(publicUrl, {});
                }
            } else {
                result = await tryFetch(publicUrl, {});
            }

            if (!result.ok) throw new Error('Failed to fetch SaaS website content');

            const data = result.data;
            if (data?.content && typeof data.content === 'object') {
                const normalized = normalizeSaasWebsiteContent(data.content);
                setSaasWebsiteContent(() => normalized);
                return normalized;
            }
        } catch (err) {
            console.error('Failed to fetch SaaS website content:', err);
        }
        return null;
    };

    const updateSaasWebsiteContent = async (updater: (prev: SaasWebsiteContent) => SaasWebsiteContent) => {
        const env = 'default';
        const next = normalizeSaasWebsiteContent(updater(saasWebsiteContent));
        setSaasWebsiteContent(() => next);

        if (!isAuthenticated || !user?.isSuperAdmin) {
            throw new Error('Forbidden: only Super Admin can save website content.');
        }
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Unauthorized. Please log in again.');
        }

        try {
            const res = await fetch(`${API_BASE_URL}/saas/website-content?env=${encodeURIComponent(env)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(next),
            });

            if (res.status === 401) {
                logout();
                throw new Error('Unauthorized. Please log in again.');
            }

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || `Failed to save (${res.status})`);
            }

            const data = await res.json().catch(() => null);
            if (data?.content && typeof data.content === 'object') {
                const normalized = normalizeSaasWebsiteContent(data.content);
                setSaasWebsiteContent(() => normalized);
            }
        } catch (err) {
            console.error('Failed to update SaaS website content:', err);
            await fetchSaasWebsiteContent();
            throw err instanceof Error ? err : new Error('Failed to save website content.');
        }
    };

    useEffect(() => {
        fetchSaasWebsiteContent();
    }, [isAuthenticated, user?.isSuperAdmin]);

    useEffect(() => {
        const run = async () => {
            if (!isAuthenticated) return;
            const token = localStorage.getItem('authToken');
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE_URL}/outlets`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 401) {
                    logout();
                    return;
                }
                if (!res.ok) return;
                const data = await res.json().catch(() => null);
                if (!Array.isArray(data)) return;

                const normalized: Outlet[] = data.map((o: any) => {
                    const outletType = o?.outletType === 'CloudKitchen' ? 'CloudKitchen' : 'Restaurant';
                    const remoteTaxes = Array.isArray(o?.taxes) ? o.taxes : [];
                    const taxes: Tax[] = remoteTaxes
                        .map((t: any) => ({
                            id: typeof t?.id === 'string' ? t.id : `tax-${Math.random().toString(16).slice(2)}`,
                            name: typeof t?.name === 'string' ? t.name : '',
                            rate: typeof t?.rate === 'number' ? t.rate : Number(t?.rate),
                        }))
                        .filter((t: any) => typeof t.name === 'string' && t.name.trim() && Number.isFinite(t.rate) && t.rate >= 0);

                    return {
                        id: String(o.id),
                        name: String(o.name),
                        restaurantName: typeof o?.restaurantName === 'string' && o.restaurantName.trim() ? o.restaurantName : String(o.name),
                        outletType,
                        address: typeof o.address === 'string' ? o.address : '',
                        phone: typeof o.phone === 'string' ? o.phone : '',
                        email: typeof o.email === 'string' ? o.email : undefined,
                        logoUrl: typeof o.logoUrl === 'string' ? o.logoUrl : undefined,
                        taxes,
                        whatsappNumber: typeof o.whatsappNumber === 'string' ? o.whatsappNumber : undefined,
                        whatsappOrderingEnabled: Boolean(o.whatsappOrderingEnabled),
                        whatsappDefaultMessage: typeof o.whatsappDefaultMessage === 'string' ? o.whatsappDefaultMessage : undefined,
                        fonepayIsEnabled: Boolean(o.fonepayIsEnabled),
                        fonepayMerchantCode: typeof o.fonepayMerchantCode === 'string' ? o.fonepayMerchantCode : undefined,
                        fonepayTerminalId: typeof o.fonepayTerminalId === 'string' ? o.fonepayTerminalId : undefined,
                        fonepayCurrency: typeof o.fonepayCurrency === 'string' ? o.fonepayCurrency : undefined,
                        plan: typeof o.plan === 'string' ? o.plan : undefined,
                        subscriptionStatus: typeof o.subscriptionStatus === 'string' ? o.subscriptionStatus : undefined,
                        registrationDate: typeof o.createdAt === 'string' ? o.createdAt : undefined,
                        planExpiryDate: typeof o.planExpiryDate === 'string' ? o.planExpiryDate : undefined,
                    };
                });

                setOutlets(prev => {
                    return normalized.map(o => {
                        const existing = prev.find(p => p.id === o.id);
                        return {
                            ...existing,
                            ...o,
                            restaurantName: o.restaurantName || existing?.restaurantName || o.name,
                            outletType: o.outletType || existing?.outletType || 'Restaurant',
                            address: o.address || existing?.address || '',
                            phone: o.phone || existing?.phone || '',
                            taxes: o.taxes?.length ? o.taxes : (existing?.taxes || []),
                        };
                    });
                });

                setActiveOutletIds(prev => {
                    const allowedIds = new Set(normalized.map(o => o.id));
                    const next = prev.filter(id => allowedIds.has(id));
                    if (next.length > 0) return next;
                    if (user?.outletId && allowedIds.has(String(user.outletId))) {
                        return [String(user.outletId)];
                    }
                    const first = normalized[0]?.id;
                    return first ? [first] : [];
                });
            } catch (err) {
                console.error('Failed to fetch outlets:', err);
            }
        };
        void run();
    }, [isAuthenticated, logout, setOutlets, setActiveOutletIds, user?.outletId, user?.tenantId]);

    const fetchPlans = useCallback(async () => {
        try {
            const primaryUrl = `${API_BASE_URL}/plans`;
            const localFallbackUrl =
                typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname.endsWith('.localhost') ||
                    window.location.hostname === '127.0.0.1')
                    ? 'http://localhost:3000/api/plans'
                    : null;

            const tryFetch = async (url: string) => {
                const res = await fetch(url);
                const data = res.ok ? await res.json().catch(() => null) : null;
                return { ok: res.ok, status: res.status, data };
            };

            let result = await tryFetch(primaryUrl);
            if (!result.ok && localFallbackUrl && primaryUrl !== localFallbackUrl) {
                result = await tryFetch(localFallbackUrl);
            }

            const data = result.ok ? result.data : null;
            const incoming = Array.isArray(data?.plans)
                ? data.plans
                : Array.isArray(data)
                    ? data
                    : [];
            if (incoming.length === 0) {
                setPlans(initialPlans);
                return;
            }
            const normalized: Plan[] = incoming.map((plan: any) => ({
                id: String(plan.id),
                name: String(plan.name),
                price: Number(plan.price) || 0,
                period: plan.period === 'yearly' ? 'yearly' : 'monthly',
                features: Array.isArray(plan.features) ? plan.features.map((v: any) => String(v)).filter(Boolean) : [],
                featureKeys: Array.isArray(plan.featureKeys) ? plan.featureKeys.map((v: any) => String(v) as PlanFeatureKey).filter(Boolean) : [],
                trialDays: Number(plan.trialDays) || 0,
                limits: typeof plan.limits === 'object' && plan.limits ? { maxTables: Number((plan.limits as any).maxTables) || 0 } : undefined,
                isPublic: Boolean(plan.isPublic),
                isActive: Boolean(plan.isActive),
                isFeatured: Boolean(plan.isFeatured),
            }));
            setPlans(normalized);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        }
    }, []);

    useEffect(() => {
        void fetchPlans();
    }, [fetchPlans]);

    useEffect(() => {
        const run = async () => {
            if (!isAuthenticated || !user?.tenantId || user?.isSuperAdmin) {
                setTenantEntitlements(null);
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/tenants/me-entitlements`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
                });
                const data = res.ok ? await res.json().catch(() => null) : null;
                if (!data || !Array.isArray(data.featureKeys)) {
                    setTenantEntitlements(null);
                    return;
                }
                setTenantEntitlements({
                    planName: String(data.planName || ''),
                    subscriptionStatus: (data.subscriptionStatus === 'inactive' ? 'inactive' : data.subscriptionStatus === 'active' ? 'active' : 'trialing'),
                    trialDays: Number(data.trialDays) || 0,
                    trialEndsAt: typeof data.trialEndsAt === 'string' ? data.trialEndsAt : null,
                    featureKeys: data.featureKeys.map((v: any) => String(v) as PlanFeatureKey),
                    features: Array.isArray(data.features) ? data.features.map((v: any) => String(v)).filter(Boolean) : [],
                    limits: typeof data.limits === 'object' && data.limits ? { maxTables: Number((data.limits as any).maxTables) || 0 } : undefined,
                    currencyCode: typeof data.currencyCode === 'string' ? data.currencyCode : null,
                    countryCode: typeof data.countryCode === 'string' ? data.countryCode : null,
                });
            } catch (error) {
                console.error('Failed to fetch tenant entitlements:', error);
            }
        };
        void run();
    }, [isAuthenticated, user?.tenantId, user?.isSuperAdmin]);

    useEffect(() => {
        const run = async () => {
            if (!isAuthenticated) {
                setRoles(initialRoles);
                setUsers([]);
                return;
            }
            const token = localStorage.getItem('authToken');
            if (!token) {
                setRoles(initialRoles);
                setUsers([]);
                return;
            }
            try {
                const rolesRes = await fetch(`${API_BASE_URL}/roles`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (rolesRes.status === 401) {
                    logout();
                    return;
                }
                if (rolesRes.ok) {
                    const roleData = await rolesRes.json().catch(() => null);
                    if (Array.isArray(roleData)) {
                        const normalizedRoles: Role[] = roleData.map((role: any) => ({
                            id: String(role.id),
                            name: String(role.name),
                            permissions: Array.isArray(role.permissions) ? role.permissions.map((v: any) => String(v)).filter(Boolean) : [],
                            tenantId: role.tenantId ? String(role.tenantId) : undefined,
                            isSystem: Boolean(role.isSystem),
                        }));
                        setRoles(normalizedRoles.length > 0 ? normalizedRoles : initialRoles);
                    }
                }

                const res = await fetch(`${API_BASE_URL}/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 401) {
                    logout();
                    return;
                }
                if (!res.ok) return;
                const data = await res.json().catch(() => null);
                if (!Array.isArray(data)) return;
                const normalized = data.map((u: any) => ({
                    id: String(u.id),
                    username: String(u.username),
                    passwordHash: '',
                    roleId: u.roleId ? String(u.roleId) : '',
                    outletId: u.outletId ? String(u.outletId) : '',
                    outletIds: Array.isArray(u.outletIds) ? u.outletIds.map((v: any) => String(v)).filter(Boolean) : (u.outletId ? [String(u.outletId)] : []),
                    tenantId: u.tenantId ? String(u.tenantId) : '',
                    isActive: Boolean(u.isActive),
                    isSuperAdmin: Boolean(u.isSuperAdmin),
                }));
                setUsers(normalized);
            } catch (err) {
                console.error('Failed to fetch users:', err);
            }
        };
        void run();
    }, [isAuthenticated, logout]);
    
    // Align default currency with tenant preference (fallback to browser locale)
    useEffect(() => {
        const run = async () => {
            if (!isAuthenticated) return;
            try {
                const res = await fetch(`${API_BASE_URL}/tenants/me-currency`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
                });
                const data = res.ok ? await res.json().catch(() => ({})) : {};
                const explicitCode: string | undefined = data?.currencyCode || undefined;
                const explicitCountry: string | undefined = data?.countryCode || undefined;

                const locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
                const localeRegion = locale.split(/[-_]/).pop();
                const inferredCountry = (explicitCountry && typeof explicitCountry === 'string' ? explicitCountry : undefined)
                    || (localeRegion && localeRegion.length === 2 ? localeRegion.toUpperCase() : undefined);

                setCurrencies(prev => {
                    if (!explicitCode && prev.some(c => c.isDefault)) {
                        return prev;
                    }

                    const code = explicitCode
                        || (inferredCountry ? DEFAULT_CURRENCY_BY_COUNTRY[inferredCountry] : undefined)
                        || 'NPR';

                    const exists = prev.find(c => c.code === code);
                    if (exists) {
                        return prev.map(c => ({ ...c, isDefault: c.code === code }));
                    }
                    const meta = CURRENCIES.find(c => c.code === code);
                    const newCurrency = {
                        id: `cur-${code}`,
                        name: meta?.name || code,
                        code,
                        symbol: meta?.symbol || 'Rs',
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

    const setAndPersistTableStatus = useCallback(async (tableId: string, newStatus: TableStatus) => {
        setTables(prev => prev.map(t => {
            if (t.id !== tableId) return t;
            const nextOccupiedSince = newStatus === TableStatus.Occupied
                ? (t.occupiedSince || new Date().toISOString())
                : undefined;
            return { ...t, status: newStatus, occupiedSince: nextOccupiedSince };
        }));

        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/tables/${tableId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.status === 401) {
                logout();
                return;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                alert(err?.message || `Failed to update table status (${res.status})`);
                return;
            }

            const updatedTable = await res.json().catch(() => null);
            if (updatedTable && typeof updatedTable === 'object' && 'id' in updatedTable) {
                const normalizedOccupiedSince = (updatedTable as any).occupiedSince ? String((updatedTable as any).occupiedSince) : undefined;
                setTables(prev => prev.map(t => t.id === (updatedTable as any).id ? { ...t, ...(updatedTable as any), occupiedSince: normalizedOccupiedSince } : t));
            }
        } catch (err) {
            console.error("Failed to update table status:", err);
        }
    }, [logout]);

    const upsertSaleInState = useCallback((sale: Sale) => {
        setSales((prev) => {
            const exists = prev.some((entry) => entry.id === sale.id);
            const next = exists ? prev.map((entry) => entry.id === sale.id ? sale : entry) : [sale, ...prev];
            return next.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
        });
    }, []);

    const persistSaleToBackend = useCallback(async (sale: Sale, mode: 'create' | 'update') => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Unauthorized. Please log in again.');
            return null;
        }
        if (!sale.outletId) {
            alert('A valid outlet is required before saving a sale.');
            return null;
        }

        try {
            const url = mode === 'create'
                ? `${API_BASE_URL}/orders?outletId=${encodeURIComponent(sale.outletId)}`
                : `${API_BASE_URL}/orders/${encodeURIComponent(sale.id)}`;

            const res = await fetch(url, {
                method: mode === 'create' ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customerId: sale.customerId ?? null,
                    items: sale.items,
                    status: sale.isClosed ? 'COMPLETED' : 'PENDING',
                    outletId: sale.outletId,
                    total: sale.totalAmount,
                    saleData: sale,
                }),
            });

            if (res.status === 401) {
                logout();
                return null;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                alert(err?.message || `Failed to save sale (${res.status})`);
                return null;
            }

            const savedOrder = await res.json().catch(() => null);
            const savedSale = mapBackendOrderToSale(savedOrder);
            upsertSaleInState(savedSale);

            if (savedSale.assignedTableId && savedSale.orderType === 'Dine In') {
                const nextStatus = (savedSale.isClosed ?? savedSale.isSettled) ? TableStatus.Free : TableStatus.Occupied;
                void setAndPersistTableStatus(savedSale.assignedTableId, nextStatus);
            }

            return savedSale;
        } catch (err) {
            console.error('Failed to save sale:', err);
            alert('Failed to save sale. Please try again.');
            return null;
        }
    }, [logout, setAndPersistTableStatus, upsertSaleInState]);

    const sendBackendPrintJob = useCallback(async (
        printerId: string,
        content: string | undefined,
        printType: 'test' | 'invoice' | 'kot'
    ): Promise<string> => {
        const selectedOutletId = activeOutletIds.length === 1 ? activeOutletIds[0] : undefined;
        if (!selectedOutletId) {
            const label = printType === 'invoice' ? 'an invoice' : printType === 'kot' ? 'a KOT' : 'a test page';
            throw new Error(`Please select a single outlet before printing ${label}.`);
        }

        const res = await fetch(`${API_BASE_URL}/printers/print?outletId=${encodeURIComponent(selectedOutletId)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ printerId, content, printType })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.message || `Failed to print ${printType} (${res.status})`);
        }

        const result = await res.json().catch(() => null);
        return result?.message || 'Print job sent successfully!';
    }, [activeOutletIds]);

    const sendPrinterJob = useCallback(async (
        printerId: string,
        content: string | undefined,
        printType: 'test' | 'invoice' | 'kot'
    ): Promise<string> => {
        const printer = printers.find((item) => item.id === printerId);
        if (!printer) {
            throw new Error('Printer not found.');
        }

        if (printer.interfaceType === PrinterInterfaceType.QZTray) {
            await printRawViaQzTray(printer.name, String(content || ''));
            const label = printType === 'invoice' ? 'Invoice' : printType === 'kot' ? 'KOT' : 'Test print';
            return `${label} sent successfully via QZ Tray!`;
        }

        return sendBackendPrintJob(printerId, content, printType);
    }, [printers, sendBackendPrintJob]);


    const contextValue: RestaurantDataContextType = {
        // Implement all functions from RestaurantDataContextType
        menuItems,
        addMenuItem: async (item, imageUrl, isVeg) => {
            try {
                if (!item.categoryId) {
                    alert('Please select a valid category before adding a menu item.');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/menu-items`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ ...item, imageUrl, isVegetarian: isVeg })
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to add menu item (${res.status})`);
                    return;
                }
                await fetchMenuItems(); // Use the centralized fetcher
            } catch (err) {
                const message =
                    err instanceof Error
                        ? `Failed to add menu item. (${err.message})`
                        : 'Failed to add menu item.';
                console.error("Failed to add menu item:", err);
                alert(message);
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
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to update menu item (${res.status})`);
                    return;
                }
                const updatedItem = await res.json();
                setMenuItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
            } catch (err) {
                const message =
                    err instanceof Error
                        ? `Failed to update menu item. (${err.message})`
                        : 'Failed to update menu item.';
                console.error("Failed to update menu item:", err);
                alert(message);
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
            await setAndPersistTableStatus(tableId, newStatus);
        },
        addTable: async (name, capacity, areaFloorId) => {
            try {
                const selectedOutletId = activeOutletIds.length === 1 ? activeOutletIds[0] : undefined;
                if (!selectedOutletId) {
                    alert('Please select a single outlet before adding a table.');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/tables?outletId=${encodeURIComponent(selectedOutletId)}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ name, capacity, areaFloorId })
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to add table (${res.status})`);
                    return;
                }
                const newTable = await res.json();
                setTables(prev => [...prev, newTable]);
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
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to update table (${res.status})`);
                    return;
                }
                const updatedTable = await res.json();
                setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
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
        addReservation: (reservation) => {
            const created = { ...reservation, id: `res-${Date.now()}` };
            setReservations(prev => [...prev, created]);

            if (created.tableId) {
                const table = tables.find(t => t.id === created.tableId);
                if (table && table.status === TableStatus.Free) {
                    void setAndPersistTableStatus(created.tableId, TableStatus.Reserved);
                }
            }
        },
        updateReservation: (reservation) => {
            const previous = reservations.find(r => r.id === reservation.id);

            setReservations(prev => prev.map(r => r.id === reservation.id ? reservation : r));

            const previousTableId = previous?.tableId;
            const nextTableId = reservation.tableId;

            if (previousTableId && previousTableId !== nextTableId) {
                const stillReferenced = reservations.some(r => r.id !== reservation.id && r.tableId === previousTableId);
                const table = tables.find(t => t.id === previousTableId);
                if (!stillReferenced && table && table.status === TableStatus.Reserved) {
                    void setAndPersistTableStatus(previousTableId, TableStatus.Free);
                }
            }

            if (nextTableId && nextTableId !== previousTableId) {
                const table = tables.find(t => t.id === nextTableId);
                if (table && table.status === TableStatus.Free) {
                    void setAndPersistTableStatus(nextTableId, TableStatus.Reserved);
                }
            }
        },
        deleteReservation: (reservationId) => {
            const existing = reservations.find(r => r.id === reservationId);
            setReservations(prev => prev.filter(r => r.id !== reservationId));

            if (existing?.tableId) {
                const stillReferenced = reservations.some(r => r.id !== reservationId && r.tableId === existing.tableId);
                const table = tables.find(t => t.id === existing.tableId);
                if (!stillReferenced && table && table.status === TableStatus.Reserved) {
                    void setAndPersistTableStatus(existing.tableId, TableStatus.Free);
                }
            }
        },
        getAvailableTables: (dateTime, partySize) => {
            // This is a simplified logic
            return tables.filter(t => t.capacity >= partySize && t.status === TableStatus.Free);
        },
        
        sales,
        recordSale: async (saleData) => {
            const isClosed = saleData.isClosed ?? saleData.isSettled ?? false;
            const newSale = { ...saleData, isClosed, id: `sale-${Date.now()}`, saleDate: new Date().toISOString() };
            return await persistSaleToBackend(newSale, 'create');
        },
        updateSale: async (updatedSale) => {
            const existing = sales.find(s => s.id === updatedSale.id);
            const isClosed = updatedSale.isClosed ?? updatedSale.isSettled ?? false;
            const normalized = { ...updatedSale, isClosed };
            const savedSale = await persistSaleToBackend(normalized, 'update');
            if (!savedSale) return null;

            if (updatedSale.orderType === 'Dine In' && updatedSale.assignedTableId) {
                const wasClosed = Boolean(existing?.isClosed ?? existing?.isSettled);
                const nextClosed = Boolean(isClosed);

                if (!wasClosed && nextClosed) {
                    void setAndPersistTableStatus(updatedSale.assignedTableId, TableStatus.Free);
                } else if (wasClosed && !nextClosed) {
                    void setAndPersistTableStatus(updatedSale.assignedTableId, TableStatus.Occupied);
                }
            }
            return savedSale;
        },
        updateKdsOrderStatus: async (saleId, status) => {
            const existing = sales.find((sale) => sale.id === saleId);
            if (!existing) return;
            await persistSaleToBackend({
                ...existing,
                kdsStatus: status,
                kdsReadyTimestamp: status === 'ready' ? new Date().toISOString() : existing.kdsReadyTimestamp,
            }, 'update');
        },
        
        foodMenuCategories,
        addFoodMenuCategory: async (categoryData) => {
            try {
                const selectedOutletId = activeOutletIds.length >= 1 ? activeOutletIds[0] : (user?.outletId ? String(user.outletId) : undefined);
                if (!selectedOutletId) {
                    alert('Please select at least one outlet before adding a category.');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/categories?outletId=${encodeURIComponent(selectedOutletId)}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(categoryData)
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to add category (${res.status})`);
                    return;
                }
                await fetchCategories(); // Re-fetch all categories to ensure consistency
            } catch (err) {
                console.error("Failed to add category:", err);
            }
        },
        updateFoodMenuCategory: async (category) => {
            try {
                const selectedOutletId = activeOutletIds.length >= 1 ? activeOutletIds[0] : (user?.outletId ? String(user.outletId) : undefined);
                if (!selectedOutletId) {
                    alert('Please select at least one outlet before updating a category.');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/categories/${category.id}?outletId=${encodeURIComponent(selectedOutletId)}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(category)
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to update category (${res.status})`);
                    return;
                }
                const updatedCategory = await res.json();
                setFoodMenuCategories(prev => prev.map(c => c.id === category.id ? updatedCategory : c));
            } catch (err) {
                console.error("Failed to update category:", err);
            }
        },
        deleteFoodMenuCategory: async (categoryId) => {
             try {
                const selectedOutletId = activeOutletIds.length >= 1 ? activeOutletIds[0] : (user?.outletId ? String(user.outletId) : undefined);
                if (!selectedOutletId) {
                    alert('Please select at least one outlet before deleting a category.');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/categories/${categoryId}?outletId=${encodeURIComponent(selectedOutletId)}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to delete category (${res.status})`);
                    return;
                }
                setFoodMenuCategories(prev => prev.filter(c => c.id !== categoryId));
            } catch (err) {
                console.error("Failed to delete category:", err);
            }
        },

        preMadeFoodItems,
        addPreMadeFoodItem: (item, imageUrl, isVeg) => {
            const normalizedPrice =
                typeof item.price === 'number'
                    ? item.price
                    : (item.variations?.[0]?.price ?? 0);
            const normalizedItem = {
                ...item,
                price: normalizedPrice,
                isVegetarian: item.isVegetarian === undefined ? (isVeg === undefined ? true : isVeg) : item.isVegetarian,
            };
            setPreMadeFoodItems(prev => [...prev, { ...normalizedItem, id: `pmf-${Date.now()}`, imageUrl }]);
        },
        updatePreMadeFoodItem: (item) => {
            const normalizedPrice =
                typeof item.price === 'number'
                    ? item.price
                    : (item.variations?.[0]?.price ?? 0);
            const normalizedItem = {
                ...item,
                price: normalizedPrice,
                isVegetarian: item.isVegetarian === undefined ? ((item as any).isVeg === undefined ? true : (item as any).isVeg) : item.isVegetarian,
            };
            setPreMadeFoodItems(prev => prev.map(i => i.id === item.id ? normalizedItem : i));
        },
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
        customerPayments,
        addCustomer: async (customerData) => {
            try {
                const outletId = activeOutletIds.length >= 1 ? String(activeOutletIds[0]) : (user?.outletId ? String(user.outletId) : undefined);
                if (!outletId) {
                    alert('Please select at least one outlet before adding a customer.');
                    return;
                }
                const payload = {
                    ...customerData,
                    ...(customerData && typeof customerData === 'object' && 'outletId' in (customerData as any)
                        ? {}
                        : outletId
                            ? { outletId }
                            : {}),
                };

                const res = await fetch(`${API_BASE_URL}/customers`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const newCustomer = await res.json();
                    const normalized = {
                        ...newCustomer,
                        dueAmount: newCustomer?.dueAmount === undefined || newCustomer?.dueAmount === null ? 0 : Number(newCustomer.dueAmount),
                        dob: newCustomer?.dob ? String(newCustomer.dob).slice(0, 10) : undefined,
                    };
                    setCustomers(prev => [...prev, normalized]);
                    return normalized;
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
                if (res.status === 401) {
                    logout();
                    return;
                }
                if (res.ok) {
                    const updatedCustomer = await res.json();
                    const normalized = {
                        ...updatedCustomer,
                        dueAmount: updatedCustomer?.dueAmount === undefined || updatedCustomer?.dueAmount === null ? 0 : Number(updatedCustomer.dueAmount),
                        dob: updatedCustomer?.dob ? String(updatedCustomer.dob).slice(0, 10) : undefined,
                    };
                    setCustomers(prev => prev.map(c => c.id === customer.id ? normalized : c));
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
        applyCustomerDueDelta: async (customerId: string, deltaAmount: number) => {
            const customer = customers.find(c => c.id === customerId);
            if (!customer) return;
            if (!Number.isFinite(deltaAmount) || deltaAmount === 0) return;

            const previousDueAmount = Number((customer as any).dueAmount) || 0;
            const nextDueAmount = Math.max(0, previousDueAmount + deltaAmount);

            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: nextDueAmount } : c));

            const token = localStorage.getItem('authToken');
            if (!token) {
                setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: previousDueAmount } : c));
                alert('Unauthorized. Please log in again.');
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ dueAmount: nextDueAmount })
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: previousDueAmount } : c));
                    alert(err?.message || `Failed to update customer due (${res.status})`);
                    return;
                }
                const updatedCustomer = await res.json().catch(() => null);
                if (updatedCustomer && typeof updatedCustomer === 'object') {
                    const normalized = {
                        ...updatedCustomer,
                        dueAmount: updatedCustomer?.dueAmount === undefined || updatedCustomer?.dueAmount === null ? 0 : Number(updatedCustomer.dueAmount),
                        dob: updatedCustomer?.dob ? String(updatedCustomer.dob).slice(0, 10) : undefined,
                    };
                    setCustomers(prev => prev.map(c => c.id === customerId ? normalized : c));
                }
            } catch (err) {
                console.error("Failed to update customer due:", err);
                setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: previousDueAmount } : c));
                alert('Failed to update customer due. Please try again.');
            }
        },
        receiveCustomerPayment: async (customerId: string, amountReceived: number, paymentMethod: string, notes?: string) => {
            const customer = customers.find(c => c.id === customerId);
            if (!customer) return;

            const previousDueAmount = Number((customer as any).dueAmount) || 0;
            if (!Number.isFinite(amountReceived) || amountReceived <= 0) {
                alert('Please enter a valid positive amount.');
                return;
            }
            const newDueAmount = Math.max(0, previousDueAmount - amountReceived);
            
            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: newDueAmount } : c));
            const newPayment: CustomerPayment = {
                id: generateId(),
                customerId,
                amount: amountReceived,
                paymentMethod,
                date: new Date().toISOString(),
                notes,
            };
            setCustomerPayments(prev => [...prev, newPayment]);

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: previousDueAmount } : c));
                    alert('Unauthorized. Please log in again.');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ dueAmount: newDueAmount })
                });
                if (res.status === 401) {
                    logout();
                    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: previousDueAmount } : c));
                    alert('Session expired. Please log in again.');
                    return;
                }
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: previousDueAmount } : c));
                    alert(err?.message || `Failed to record customer payment (${res.status})`);
                    return;
                }
                const updatedCustomer = await res.json().catch(() => null);
                if (updatedCustomer && typeof updatedCustomer === 'object') {
                    const normalized = {
                        ...updatedCustomer,
                        dueAmount: updatedCustomer?.dueAmount === undefined || updatedCustomer?.dueAmount === null ? 0 : Number(updatedCustomer.dueAmount),
                        dob: updatedCustomer?.dob ? String(updatedCustomer.dob).slice(0, 10) : undefined,
                    };
                    setCustomers(prev => prev.map(c => c.id === customerId ? normalized : c));
                }
            } catch (err) {
                console.error("Failed to update customer payment:", err);
                setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueAmount: previousDueAmount } : c));
                alert('Failed to record customer payment. Please try again.');
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
        addPrinter: async (printerData) => {
            try {
                const selectedOutletId = activeOutletIds.length === 1 ? activeOutletIds[0] : undefined;
                if (!selectedOutletId) {
                    alert('Please select a single outlet before adding a printer.');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/printers?outletId=${encodeURIComponent(selectedOutletId)}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(printerData)
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to add printer (${res.status})`);
                    return;
                }
                const newPrinter = await res.json();
                setPrinters(prev => [...prev, newPrinter]);
            } catch (err) {
                console.error("Failed to add printer:", err);
            }
        },
        updatePrinter: async (printer) => {
            try {
                const selectedOutletId = activeOutletIds.length === 1 ? activeOutletIds[0] : undefined;
                if (!selectedOutletId) {
                    alert('Please select a single outlet before updating a printer.');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/printers/${printer.id}?outletId=${encodeURIComponent(selectedOutletId)}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(printer)
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to update printer (${res.status})`);
                    return;
                }
                const updatedPrinter = await res.json();
                setPrinters(prev => prev.map(p => p.id === printer.id ? updatedPrinter : p));
            } catch (err) {
                console.error("Failed to update printer:", err);
            }
        },
        deletePrinter: async (printerId) => {
            try {
                const selectedOutletId = activeOutletIds.length === 1 ? activeOutletIds[0] : undefined;
                if (!selectedOutletId) {
                    alert('Please select a single outlet before deleting a printer.');
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/printers/${printerId}?outletId=${encodeURIComponent(selectedOutletId)}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (res.ok) {
                    setPrinters(prev => prev.filter(p => p.id !== printerId));
                }
            } catch (err) {
                console.error("Failed to delete printer:", err);
            }
        },
        printTest: async (printerId, content) => {
            try {
                const message = await sendPrinterJob(printerId, content, 'test');
                alert(message || 'Test print sent successfully!');
            } catch (err) {
                console.error("Failed to print test page:", err);
                alert(err instanceof Error ? err.message : 'Failed to print test page');
            }
        },
        printInvoice: async (printerId, content) => {
            try {
                const message = await sendPrinterJob(printerId, content, 'invoice');
                alert(message || 'Invoice print sent successfully!');
            } catch (err) {
                console.error("Failed to print invoice:", err);
                alert(err instanceof Error ? err.message : 'Failed to print invoice');
            }
        },
        printKot: async (printerId, content) => {
            try {
                const message = await sendPrinterJob(printerId, content, 'kot');
                alert(message || 'KOT print sent successfully!');
            } catch (err) {
                console.error("Failed to print KOT:", err);
                alert(err instanceof Error ? err.message : 'Failed to print KOT');
            }
        },

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
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to update currency (${res.status})`);
                    return;
                }
                const updated = await res.json();
                setCurrencies(prev => prev.map(c => c.id === currency.id ? updated : c));
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
                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    alert(err?.message || `Failed to set default currency (${res.status})`);
                    return;
                }
                await res.json().catch(() => null);
                const allRes = await fetch(`${API_BASE_URL}/currencies`);
                const allData = await allRes.json().catch(() => null);
                if (Array.isArray(allData)) {
                    setCurrencies(allData);
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
            const outletId = resolveOutletDataId(purchaseData.outletId);
            const newPurchase = {
                ...purchaseData,
                id: `pur-${Date.now()}`,
                date: new Date().toISOString(),
                outletId: outletId || purchaseData.outletId,
            };
            const nextPurchases = [...purchasesRef.current, newPurchase];
            purchasesRef.current = nextPurchases;
            setPurchases(nextPurchases);
            if (outletId) {
                markOutletAppDataMutated('purchases', outletId);
                persistOutletCollectionImmediately('purchases', outletId, nextPurchases);
            }
            return newPurchase;
        },
        updatePurchase: (purchase) => {
            const outletId = resolveOutletDataId(purchase.outletId);
            const nextPurchases = purchasesRef.current.map(p => p.id === purchase.id ? purchase : p);
            purchasesRef.current = nextPurchases;
            setPurchases(nextPurchases);
            if (outletId) {
                markOutletAppDataMutated('purchases', outletId);
                persistOutletCollectionImmediately('purchases', outletId, nextPurchases);
            }
        },
        deletePurchase: (purchaseId) => {
            const existingPurchase = purchasesRef.current.find((purchase) => purchase.id === purchaseId);
            const outletId = resolveOutletDataId(existingPurchase?.outletId);
            const nextPurchases = purchasesRef.current.filter(p => p.id !== purchaseId);
            purchasesRef.current = nextPurchases;
            setPurchases(nextPurchases);
            if (outletId) {
                markOutletAppDataMutated('purchases', outletId);
                persistOutletCollectionImmediately('purchases', outletId, nextPurchases);
            }
        },
        recordSupplierPayment: (purchaseId: string, amountPaid: number, paymentDate: string, paymentMethod: string, reference?: string, notes?: string) => {
            const existingPurchase = purchasesRef.current.find((purchase) => purchase.id === purchaseId);
            const outletId = resolveOutletDataId(existingPurchase?.outletId);
            const newPayment: any = {
                id: `payment-${Date.now()}`,
                amountPaid,
                paymentDate,
                paymentMethod,
                reference,
                notes,
            };
            const nextPurchases = purchasesRef.current.map((purchase) => purchase.id === purchaseId ? {
                ...purchase,
                paidAmount: (purchase.paidAmount || 0) + amountPaid,
                payments: [...(purchase.payments || []), newPayment],
            } : purchase);
            purchasesRef.current = nextPurchases;
            setPurchases(nextPurchases);
            if (outletId) {
                markOutletAppDataMutated('purchases', outletId);
                persistOutletCollectionImmediately('purchases', outletId, nextPurchases);
            }
        },

        expenseCategories,
        addExpenseCategory: (categoryData) => {
            const newCat = { ...categoryData, id: `exp-cat-${Date.now()}` };
            expenseCategoriesRef.current = [...expenseCategoriesRef.current, newCat];
            setExpenseCategories(expenseCategoriesRef.current);
            if (selectedDataOutletId) {
                markOutletAppDataMutated('expenseCategories', selectedDataOutletId);
                persistOutletCollectionImmediately('expenseCategories', selectedDataOutletId, expenseCategoriesRef.current);
            }
            return newCat;
        },
        updateExpenseCategory: (category) => {
            const nextCategories = expenseCategoriesRef.current.map(c => c.id === category.id ? category : c);
            expenseCategoriesRef.current = nextCategories;
            setExpenseCategories(nextCategories);
            if (selectedDataOutletId) {
                markOutletAppDataMutated('expenseCategories', selectedDataOutletId);
                persistOutletCollectionImmediately('expenseCategories', selectedDataOutletId, nextCategories);
            }
        },
        deleteExpenseCategory: (categoryId) => {
            const nextCategories = expenseCategoriesRef.current.filter(c => c.id !== categoryId);
            expenseCategoriesRef.current = nextCategories;
            setExpenseCategories(nextCategories);
            if (selectedDataOutletId) {
                markOutletAppDataMutated('expenseCategories', selectedDataOutletId);
                persistOutletCollectionImmediately('expenseCategories', selectedDataOutletId, nextCategories);
            }
        },

        expenses,
        addExpense: (expenseData) => {
            const categoryName = expenseCategories.find(c => c.id === expenseData.categoryId)?.name || 'Unknown';
            const outletId = resolveOutletDataId(expenseData.outletId);
            const newExpense = { ...expenseData, id: `exp-${Date.now()}`, categoryName, outletId: outletId || 'unknown' };
            const nextExpenses = [...expensesRef.current, newExpense];
            expensesRef.current = nextExpenses;
            setExpenses(nextExpenses);
            if (outletId) {
                markOutletAppDataMutated('expenses', outletId);
                persistOutletCollectionImmediately('expenses', outletId, nextExpenses);
            }
            return newExpense;
        },
        updateExpense: (expense) => {
            const outletId = resolveOutletDataId(expense.outletId);
            const nextExpenses = expensesRef.current.map(e => e.id === expense.id ? expense : e);
            expensesRef.current = nextExpenses;
            setExpenses(nextExpenses);
            if (outletId) {
                markOutletAppDataMutated('expenses', outletId);
                persistOutletCollectionImmediately('expenses', outletId, nextExpenses);
            }
        },
        deleteExpense: (expenseId) => {
            const existingExpense = expensesRef.current.find((expense) => expense.id === expenseId);
            const outletId = resolveOutletDataId(existingExpense?.outletId);
            const nextExpenses = expensesRef.current.filter(e => e.id !== expenseId);
            expensesRef.current = nextExpenses;
            setExpenses(nextExpenses);
            if (outletId) {
                markOutletAppDataMutated('expenses', outletId);
                persistOutletCollectionImmediately('expenses', outletId, nextExpenses);
            }
        },
        
        wasteRecords,
        addWasteRecord: (recordData) => {
            const outletId = resolveOutletDataId(recordData.outletId);
            const totalEstimatedLoss = typeof recordData.totalEstimatedLoss === 'number'
                ? recordData.totalEstimatedLoss
                : recordData.items.reduce((sum, item) => sum + (Number(item.quantityWasted) || 0) * (Number(item.costAtTimeOfWaste) || 0), 0);
            const newRecord = {
                ...recordData,
                id: `waste-${Date.now()}`,
                date: recordData.date || new Date().toISOString(),
                totalEstimatedLoss,
                outletId: outletId || recordData.outletId,
            };
            const nextWasteRecords = [...wasteRecordsRef.current, newRecord];
            wasteRecordsRef.current = nextWasteRecords;
            setWasteRecords(nextWasteRecords);
            if (outletId) {
                markOutletAppDataMutated('wasteRecords', outletId);
                persistOutletCollectionImmediately('wasteRecords', outletId, nextWasteRecords);
            }
            return newRecord;
        },

        employees,
        addEmployee: (employeeData) => {
            const outletId = resolveOutletDataId(employeeData.outletId);
            const newEmployee = { ...employeeData, id: `emp-${Date.now()}`, outletId: outletId || 'unknown' };
            const nextEmployees = [...employeesRef.current, newEmployee];
            employeesRef.current = nextEmployees;
            setEmployees(nextEmployees);
            if (outletId) {
                markOutletAppDataMutated('employees', outletId);
                persistOutletCollectionImmediately('employees', outletId, nextEmployees);
            }
            return newEmployee;
        },
        updateEmployee: (employee) => {
            const outletId = resolveOutletDataId(employee.outletId);
            const nextEmployees = employeesRef.current.map(e => e.id === employee.id ? employee : e);
            employeesRef.current = nextEmployees;
            setEmployees(nextEmployees);
            if (outletId) {
                markOutletAppDataMutated('employees', outletId);
                persistOutletCollectionImmediately('employees', outletId, nextEmployees);
            }
        },
        deleteEmployee: (employeeId) => {
            const existingEmployee = employeesRef.current.find((emp) => emp.id === employeeId);
            const outletId = resolveOutletDataId(existingEmployee?.outletId);
            const nextEmployees = employeesRef.current.filter(e => e.id !== employeeId);
            employeesRef.current = nextEmployees;
            setEmployees(nextEmployees);
            if (outletId) {
                markOutletAppDataMutated('employees', outletId);
                persistOutletCollectionImmediately('employees', outletId, nextEmployees);
            }
        },
        
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
        addDeliveryPartner: (partnerData) => {
            const outletId = resolveOutletDataId(partnerData.outletId);
            const newPartner = { ...partnerData, id: `dp-${Date.now()}`, outletId: outletId || 'unknown' };
            const nextPartners = [...deliveryPartnersRef.current, newPartner];
            deliveryPartnersRef.current = nextPartners;
            setDeliveryPartners(nextPartners);
            if (outletId) {
                markOutletAppDataMutated('deliveryPartners', outletId);
                persistOutletCollectionImmediately('deliveryPartners', outletId, nextPartners);
            }
            return newPartner;
        },
        updateDeliveryPartner: (partner) => {
            const outletId = resolveOutletDataId(partner.outletId);
            const nextPartners = deliveryPartnersRef.current.map(p => p.id === partner.id ? partner : p);
            deliveryPartnersRef.current = nextPartners;
            setDeliveryPartners(nextPartners);
            if (outletId) {
                markOutletAppDataMutated('deliveryPartners', outletId);
                persistOutletCollectionImmediately('deliveryPartners', outletId, nextPartners);
            }
        },
        deleteDeliveryPartner: (partnerId) => {
            const existingPartner = deliveryPartnersRef.current.find((p) => p.id === partnerId);
            const outletId = resolveOutletDataId(existingPartner?.outletId);
            const nextPartners = deliveryPartnersRef.current.filter(p => p.id !== partnerId);
            deliveryPartnersRef.current = nextPartners;
            setDeliveryPartners(nextPartners);
            if (outletId) {
                markOutletAppDataMutated('deliveryPartners', outletId);
                persistOutletCollectionImmediately('deliveryPartners', outletId, nextPartners);
            }
        },

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
        addOutlet: async (outletData) => {
            const tempId = `tmp-outlet-${Date.now()}`;
            const optimistic: Outlet = { ...outletData, id: tempId };
            setOutlets(prev => [...prev, optimistic]);

            const token = localStorage.getItem('authToken');
            if (!token) {
                setOutlets(prev => prev.filter(o => o.id !== tempId));
                return { success: false, message: 'Unauthorized. Please log in again.' };
            }

            try {
                const res = await fetch(`${API_BASE_URL}/outlets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: outletData.name,
                        restaurantName: outletData.restaurantName,
                        outletType: outletData.outletType,
                        address: outletData.address,
                        phone: outletData.phone,
                        email: outletData.email,
                        logoUrl: outletData.logoUrl,
                        taxes: outletData.taxes,
                        whatsappNumber: outletData.whatsappNumber,
                        whatsappOrderingEnabled: outletData.whatsappOrderingEnabled,
                        whatsappDefaultMessage: outletData.whatsappDefaultMessage,
                        fonepayIsEnabled: outletData.fonepayIsEnabled,
                        fonepayMerchantCode: outletData.fonepayMerchantCode,
                        fonepayTerminalId: outletData.fonepayTerminalId,
                        fonepayCurrency: outletData.fonepayCurrency,
                        plan: outletData.plan,
                        subscriptionStatus: outletData.subscriptionStatus,
                        planExpiryDate: outletData.planExpiryDate,
                    }),
                });

                if (res.status === 401) {
                    logout();
                    setOutlets(prev => prev.filter(o => o.id !== tempId));
                    return { success: false, message: 'Unauthorized. Please log in again.' };
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    setOutlets(prev => prev.filter(o => o.id !== tempId));
                    return { success: false, message: err?.message || `Failed to create outlet (${res.status})` };
                }

                const created = await res.json().catch(() => null);
                if (!created) {
                    setOutlets(prev => prev.filter(o => o.id !== tempId));
                    return { success: false, message: 'Failed to create outlet.' };
                }

                const createdOutlet: Outlet = {
                    ...optimistic,
                    id: String(created.id),
                    name: String(created.name),
                    restaurantName: typeof created.restaurantName === 'string' && created.restaurantName.trim() ? created.restaurantName : optimistic.restaurantName,
                    outletType: created.outletType === 'CloudKitchen' ? 'CloudKitchen' : optimistic.outletType,
                    address: typeof created.address === 'string' ? created.address : optimistic.address,
                    phone: typeof created.phone === 'string' ? created.phone : optimistic.phone,
                    email: typeof created.email === 'string' ? created.email : optimistic.email,
                    logoUrl: typeof created.logoUrl === 'string' ? created.logoUrl : optimistic.logoUrl,
                    taxes: Array.isArray(created.taxes) ? created.taxes : optimistic.taxes,
                    whatsappNumber: typeof created.whatsappNumber === 'string' ? created.whatsappNumber : optimistic.whatsappNumber,
                    whatsappOrderingEnabled: Boolean(created.whatsappOrderingEnabled),
                    whatsappDefaultMessage: typeof created.whatsappDefaultMessage === 'string' ? created.whatsappDefaultMessage : optimistic.whatsappDefaultMessage,
                    fonepayIsEnabled: Boolean(created.fonepayIsEnabled),
                    fonepayMerchantCode: typeof created.fonepayMerchantCode === 'string' ? created.fonepayMerchantCode : optimistic.fonepayMerchantCode,
                    fonepayTerminalId: typeof created.fonepayTerminalId === 'string' ? created.fonepayTerminalId : optimistic.fonepayTerminalId,
                    fonepayCurrency: typeof created.fonepayCurrency === 'string' ? created.fonepayCurrency : optimistic.fonepayCurrency,
                    plan: typeof created.plan === 'string' ? created.plan : optimistic.plan,
                    subscriptionStatus: typeof created.subscriptionStatus === 'string' ? created.subscriptionStatus : optimistic.subscriptionStatus,
                    registrationDate: typeof created.createdAt === 'string' ? created.createdAt : optimistic.registrationDate,
                    planExpiryDate: typeof created.planExpiryDate === 'string' ? created.planExpiryDate : optimistic.planExpiryDate,
                };

                setOutlets(prev => prev.map(o => (o.id === tempId ? createdOutlet : o)));
                return { success: true };
            } catch (err) {
                console.error('Failed to create outlet:', err);
                setOutlets(prev => prev.filter(o => o.id !== tempId));
                return { success: false, message: 'Failed to create outlet. Please try again.' };
            }
        },
        updateOutlet: async (outlet) => {
            const prevOutlet = outlets.find(o => o.id === outlet.id);
            setOutlets(prev => prev.map(o => o.id === outlet.id ? outlet : o));

            const token = localStorage.getItem('authToken');
            if (!token) {
                if (prevOutlet) setOutlets(prev => prev.map(o => o.id === prevOutlet.id ? prevOutlet : o));
                return { success: false, message: 'Unauthorized. Please log in again.' };
            }

            try {
                const res = await fetch(`${API_BASE_URL}/outlets/${outlet.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: outlet.name,
                        restaurantName: outlet.restaurantName,
                        outletType: outlet.outletType,
                        address: outlet.address,
                        phone: outlet.phone,
                        email: outlet.email,
                        logoUrl: outlet.logoUrl,
                        taxes: outlet.taxes,
                        whatsappNumber: outlet.whatsappNumber,
                        whatsappOrderingEnabled: outlet.whatsappOrderingEnabled,
                        whatsappDefaultMessage: outlet.whatsappDefaultMessage,
                        fonepayIsEnabled: outlet.fonepayIsEnabled,
                        fonepayMerchantCode: outlet.fonepayMerchantCode,
                        fonepayTerminalId: outlet.fonepayTerminalId,
                        fonepayCurrency: outlet.fonepayCurrency,
                        plan: outlet.plan,
                        subscriptionStatus: outlet.subscriptionStatus,
                        planExpiryDate: outlet.planExpiryDate,
                    }),
                });

                if (res.status === 401) {
                    logout();
                    if (prevOutlet) setOutlets(prev => prev.map(o => o.id === prevOutlet.id ? prevOutlet : o));
                    return { success: false, message: 'Unauthorized. Please log in again.' };
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    if (prevOutlet) setOutlets(prev => prev.map(o => o.id === prevOutlet.id ? prevOutlet : o));
                    return { success: false, message: err?.message || `Failed to update outlet (${res.status})` };
                }

                const updated = await res.json().catch(() => null);
                if (!updated) {
                    if (prevOutlet) setOutlets(prev => prev.map(o => o.id === prevOutlet.id ? prevOutlet : o));
                    return { success: false, message: 'Failed to update outlet.' };
                }

                setOutlets(prev => prev.map(o => {
                    if (o.id !== outlet.id) return o;
                    const outletType = updated.outletType === 'CloudKitchen' ? 'CloudKitchen' : 'Restaurant';
                    return {
                        ...o,
                        id: String(updated.id),
                        name: String(updated.name),
                        restaurantName: typeof updated.restaurantName === 'string' && updated.restaurantName.trim() ? updated.restaurantName : o.restaurantName,
                        outletType,
                        address: typeof updated.address === 'string' ? updated.address : o.address,
                        phone: typeof updated.phone === 'string' ? updated.phone : o.phone,
                        email: typeof updated.email === 'string' ? updated.email : o.email,
                        logoUrl: typeof updated.logoUrl === 'string' ? updated.logoUrl : o.logoUrl,
                        taxes: Array.isArray(updated.taxes) ? updated.taxes : o.taxes,
                        whatsappNumber: typeof updated.whatsappNumber === 'string' ? updated.whatsappNumber : o.whatsappNumber,
                        whatsappOrderingEnabled: Boolean(updated.whatsappOrderingEnabled),
                        whatsappDefaultMessage: typeof updated.whatsappDefaultMessage === 'string' ? updated.whatsappDefaultMessage : o.whatsappDefaultMessage,
                        fonepayIsEnabled: Boolean(updated.fonepayIsEnabled),
                        fonepayMerchantCode: typeof updated.fonepayMerchantCode === 'string' ? updated.fonepayMerchantCode : o.fonepayMerchantCode,
                        fonepayTerminalId: typeof updated.fonepayTerminalId === 'string' ? updated.fonepayTerminalId : o.fonepayTerminalId,
                        fonepayCurrency: typeof updated.fonepayCurrency === 'string' ? updated.fonepayCurrency : o.fonepayCurrency,
                        plan: typeof updated.plan === 'string' ? updated.plan : o.plan,
                        subscriptionStatus: typeof updated.subscriptionStatus === 'string' ? updated.subscriptionStatus : o.subscriptionStatus,
                        registrationDate: typeof updated.createdAt === 'string' ? updated.createdAt : o.registrationDate,
                        planExpiryDate: typeof updated.planExpiryDate === 'string' ? updated.planExpiryDate : o.planExpiryDate,
                    };
                }));
                return { success: true };
            } catch (err) {
                console.error('Failed to update outlet:', err);
                if (prevOutlet) setOutlets(prev => prev.map(o => o.id === prevOutlet.id ? prevOutlet : o));
                return { success: false, message: 'Failed to update outlet. Please try again.' };
            }
        },
        deleteOutlet: async (outletId) => {
            const prevOutlets = outlets;
            const prevActive = activeOutletIds;
            setOutlets(prev => prev.filter(o => o.id !== outletId));
            setActiveOutletIds(prev => {
                const next = prev.filter(id => id !== outletId);
                if (next.length > 0) return next;
                const remaining = prevOutlets.filter(o => o.id !== outletId);
                const first = remaining[0]?.id;
                return first ? [first] : [];
            });

            const token = localStorage.getItem('authToken');
            if (!token) {
                setOutlets(prevOutlets);
                setActiveOutletIds(prevActive);
                return { success: false, message: 'Unauthorized. Please log in again.' };
            }

            try {
                const res = await fetch(`${API_BASE_URL}/outlets/${outletId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 401) {
                    logout();
                    setOutlets(prevOutlets);
                    setActiveOutletIds(prevActive);
                    return { success: false, message: 'Unauthorized. Please log in again.' };
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    setOutlets(prevOutlets);
                    setActiveOutletIds(prevActive);
                    return { success: false, message: err?.message || `Failed to delete outlet (${res.status})` };
                }

                return { success: true };
            } catch (err) {
                console.error('Failed to delete outlet:', err);
                setOutlets(prevOutlets);
                setActiveOutletIds(prevActive);
                return { success: false, message: 'Failed to delete outlet. Please try again.' };
            }
        },
        
        roles,
        addRole: async (roleData) => {
            const token = localStorage.getItem('authToken');
            if (!token) return { success: false, message: 'Unauthorized. Please log in again.' };

            try {
                const res = await fetch(`${API_BASE_URL}/roles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: roleData.name,
                        permissions: roleData.permissions,
                    }),
                });

                if (res.status === 401) {
                    logout();
                    return { success: false, message: 'Unauthorized. Please log in again.' };
                }

                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    return { success: false, message: data?.message || `Failed to add role (${res.status})` };
                }

                const normalized: Role = {
                    id: String(data.id),
                    name: String(data.name),
                    permissions: Array.isArray(data.permissions) ? data.permissions.map((v: any) => String(v)).filter(Boolean) : [],
                    tenantId: data.tenantId ? String(data.tenantId) : undefined,
                    isSystem: Boolean(data.isSystem),
                };
                setRoles(prev => [...prev, normalized].sort((a, b) => a.name.localeCompare(b.name)));
                return { success: true };
            } catch (err) {
                console.error('Failed to add role:', err);
                return { success: false, message: 'Failed to add role. Please try again.' };
            }
        },
        updateRole: async (role) => {
            const token = localStorage.getItem('authToken');
            if (!token) return { success: false, message: 'Unauthorized. Please log in again.' };

            try {
                const res = await fetch(`${API_BASE_URL}/roles/${encodeURIComponent(role.id)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: role.name,
                        permissions: role.permissions,
                    }),
                });

                if (res.status === 401) {
                    logout();
                    return { success: false, message: 'Unauthorized. Please log in again.' };
                }

                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    return { success: false, message: data?.message || `Failed to update role (${res.status})` };
                }

                const normalized: Role = {
                    id: String(data.id),
                    name: String(data.name),
                    permissions: Array.isArray(data.permissions) ? data.permissions.map((v: any) => String(v)).filter(Boolean) : [],
                    tenantId: data.tenantId ? String(data.tenantId) : undefined,
                    isSystem: Boolean(data.isSystem),
                };
                setRoles(prev => prev.map(r => (r.id === normalized.id ? normalized : r)));
                return { success: true };
            } catch (err) {
                console.error('Failed to update role:', err);
                return { success: false, message: 'Failed to update role. Please try again.' };
            }
        },
        deleteRole: async (roleId) => {
            const token = localStorage.getItem('authToken');
            if (!token) return { success: false, message: 'Unauthorized. Please log in again.' };

            try {
                const res = await fetch(`${API_BASE_URL}/roles/${encodeURIComponent(roleId)}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 401) {
                    logout();
                    return { success: false, message: 'Unauthorized. Please log in again.' };
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    return { success: false, message: err?.message || `Failed to delete role (${res.status})` };
                }

                setRoles(prev => prev.filter(role => role.id !== roleId));
                return { success: true };
            } catch (err) {
                console.error('Failed to delete role:', err);
                return { success: false, message: 'Failed to delete role. Please try again.' };
            }
        },
        users,
        addUser: async (userData) => {
            const token = localStorage.getItem('authToken');
            if (!token) return { success: false, message: 'Unauthorized. Please log in again.' };

            try {
                const outletIds = Array.isArray((userData as any).outletIds) && (userData as any).outletIds.length > 0
                    ? (userData as any).outletIds.map((v: any) => String(v)).filter(Boolean)
                    : (userData.outletId ? [String(userData.outletId)] : []);
                const res = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        username: userData.username,
                        password: userData.passwordHash,
                        roleId: userData.roleId,
                        outletId: outletIds[0] || userData.outletId,
                        outletIds,
                        isActive: userData.isActive,
                        isSuperAdmin: Boolean((userData as any).isSuperAdmin),
                    }),
                });

                if (res.status === 401) {
                    logout();
                    return { success: false, message: 'Unauthorized. Please log in again.' };
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    return { success: false, message: err?.message || `Failed to add user (${res.status})` };
                }

                const created = await res.json().catch(() => null);
                if (!created) return { success: false, message: 'Failed to add user.' };

                const normalized: User = {
                    id: String(created.id),
                    username: String(created.username),
                    passwordHash: '',
                    roleId: created.roleId ? String(created.roleId) : '',
                    outletId: created.outletId ? String(created.outletId) : '',
                    outletIds: Array.isArray(created.outletIds) ? created.outletIds.map((v: any) => String(v)).filter(Boolean) : (created.outletId ? [String(created.outletId)] : []),
                    tenantId: created.tenantId ? String(created.tenantId) : '',
                    isActive: Boolean(created.isActive),
                    isSuperAdmin: Boolean(created.isSuperAdmin),
                };
                setUsers(prev => [...prev, normalized]);
                return { success: true };
            } catch (err) {
                console.error('Failed to add user:', err);
                return { success: false, message: 'Failed to add user. Please try again.' };
            }
        },
        updateUser: async (userToUpdate) => {
            const token = localStorage.getItem('authToken');
            if (!token) return { success: false, message: 'Unauthorized. Please log in again.' };

            try {
                const outletIds = Array.isArray((userToUpdate as any).outletIds) && (userToUpdate as any).outletIds.length > 0
                    ? (userToUpdate as any).outletIds.map((v: any) => String(v)).filter(Boolean)
                    : (userToUpdate.outletId ? [String(userToUpdate.outletId)] : []);
                const payload: any = {
                    username: userToUpdate.username,
                    roleId: userToUpdate.roleId,
                    outletId: outletIds[0] || userToUpdate.outletId,
                    outletIds,
                    isActive: userToUpdate.isActive,
                    isSuperAdmin: Boolean(userToUpdate.isSuperAdmin),
                };

                if (userToUpdate.passwordHash && userToUpdate.passwordHash.length >= 6) {
                    payload.password = userToUpdate.passwordHash;
                }

                const res = await fetch(`${API_BASE_URL}/users/${userToUpdate.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                if (res.status === 401) {
                    logout();
                    return { success: false, message: 'Unauthorized. Please log in again.' };
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    return { success: false, message: err?.message || `Failed to update user (${res.status})` };
                }

                const updated = await res.json().catch(() => null);
                if (!updated) return { success: false, message: 'Failed to update user.' };

                const normalized: User = {
                    id: String(updated.id),
                    username: String(updated.username),
                    passwordHash: '',
                    roleId: updated.roleId ? String(updated.roleId) : '',
                    outletId: updated.outletId ? String(updated.outletId) : '',
                    outletIds: Array.isArray(updated.outletIds) ? updated.outletIds.map((v: any) => String(v)).filter(Boolean) : (updated.outletId ? [String(updated.outletId)] : []),
                    tenantId: updated.tenantId ? String(updated.tenantId) : '',
                    isActive: Boolean(updated.isActive),
                    isSuperAdmin: Boolean(updated.isSuperAdmin),
                };

                setUsers(prev => prev.map(u => (u.id === userToUpdate.id ? normalized : u)));
                return { success: true };
            } catch (err) {
                console.error('Failed to update user:', err);
                return { success: false, message: 'Failed to update user. Please try again.' };
            }
        },
        deleteUser: async (userId) => {
            const token = localStorage.getItem('authToken');
            if (!token) return { success: false, message: 'Unauthorized. Please log in again.' };

            try {
                const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 401) {
                    logout();
                    return { success: false, message: 'Unauthorized. Please log in again.' };
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    return { success: false, message: err?.message || `Failed to delete user (${res.status})` };
                }

                setUsers(prev => prev.filter(u => u.id !== userId));
                return { success: true };
            } catch (err) {
                console.error('Failed to delete user:', err);
                return { success: false, message: 'Failed to delete user. Please try again.' };
            }
        },

        saasWebsiteContent, fetchSaasWebsiteContent,
        updateSaasWebsiteContent,
        registerUser: async (username, password, restaurantName, fullName, mobile, address) => {
            // Simplified registration mock or proxy to backend if it existed
            return { success: false, message: 'Registration not implemented in this provider yet.' };
        },
        checkLogin: (username, password) => {
            return users.find(u => u.username === username) || null;
        },
        plans,
        addPlan: async (planData) => {
            const res = await fetch(`${API_BASE_URL}/plans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planData),
            });
            if (!res.ok) throw new Error('Failed to create plan');
            await fetchPlans();
        },
        updatePlan: async (updatedPlan) => {
            const res = await fetch(`${API_BASE_URL}/plans/${updatedPlan.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPlan),
            });
            if (!res.ok) throw new Error('Failed to update plan');
            await fetchPlans();
        },
        deletePlan: async (planId) => {
            const res = await fetch(`${API_BASE_URL}/plans/${planId}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 204) throw new Error('Failed to delete plan');
            await fetchPlans();
        },
        selectPlan: async (planName) => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Unauthorized');
            }

            const res = await fetch(`${API_BASE_URL}/tenants/me-plan`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ planName }),
            });

            if (res.status === 401) {
                logout();
                throw new Error('Unauthorized');
            }

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || 'Failed to update plan');
            }

            const updatedEntitlements = await res.json();
            setTenantEntitlements({
                planName: String(updatedEntitlements.planName || ''),
                subscriptionStatus: (updatedEntitlements.subscriptionStatus === 'inactive' ? 'inactive' : updatedEntitlements.subscriptionStatus === 'active' ? 'active' : 'trialing'),
                trialDays: Number(updatedEntitlements.trialDays) || 0,
                trialEndsAt: typeof updatedEntitlements.trialEndsAt === 'string' ? updatedEntitlements.trialEndsAt : null,
                featureKeys: updatedEntitlements.featureKeys.map((v: any) => String(v) as PlanFeatureKey),
                features: Array.isArray(updatedEntitlements.features) ? updatedEntitlements.features.map((v: any) => String(v)).filter(Boolean) : [],
                limits: typeof updatedEntitlements.limits === 'object' && updatedEntitlements.limits ? { maxTables: Number((updatedEntitlements.limits as any).maxTables) || 0 } : undefined,
                currencyCode: typeof updatedEntitlements.currencyCode === 'string' ? updatedEntitlements.currencyCode : null,
                countryCode: typeof updatedEntitlements.countryCode === 'string' ? updatedEntitlements.countryCode : null,
            });

            // Refresh outlets to get updated plan info
            const outletRes = await fetch(`${API_BASE_URL}/outlets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (outletRes.ok) {
                const data = await outletRes.json().catch(() => null);
                if (Array.isArray(data)) {
                    const normalized: Outlet[] = data.map((o: any) => {
                        const outletType = o?.outletType === 'CloudKitchen' ? 'CloudKitchen' : 'Restaurant';
                        const remoteTaxes = Array.isArray(o?.taxes) ? o.taxes : [];
                        const taxes: Tax[] = remoteTaxes
                            .map((t: any) => ({
                                id: typeof t?.id === 'string' ? t.id : `tax-${Math.random().toString(16).slice(2)}`,
                                name: typeof t?.name === 'string' ? t.name : '',
                                rate: typeof t?.rate === 'number' ? t.rate : Number(t?.rate),
                            }))
                            .filter((t: any) => typeof t.name === 'string' && t.name.trim() && Number.isFinite(t.rate) && t.rate >= 0);

                        return {
                            id: String(o.id),
                            name: String(o.name),
                            restaurantName: typeof o?.restaurantName === 'string' && o.restaurantName.trim() ? o.restaurantName : String(o.name),
                            outletType,
                            address: typeof o.address === 'string' ? o.address : '',
                            phone: typeof o.phone === 'string' ? o.phone : '',
                            email: typeof o.email === 'string' ? o.email : undefined,
                            logoUrl: typeof o.logoUrl === 'string' ? o.logoUrl : undefined,
                            taxes,
                            whatsappNumber: typeof o.whatsappNumber === 'string' ? o.whatsappNumber : undefined,
                            whatsappOrderingEnabled: Boolean(o.whatsappOrderingEnabled),
                            whatsappDefaultMessage: typeof o.whatsappDefaultMessage === 'string' ? o.whatsappDefaultMessage : undefined,
                            fonepayIsEnabled: Boolean(o.fonepayIsEnabled),
                            fonepayMerchantCode: typeof o.fonepayMerchantCode === 'string' ? o.fonepayMerchantCode : undefined,
                            fonepayTerminalId: typeof o.fonepayTerminalId === 'string' ? o.fonepayTerminalId : undefined,
                            fonepayCurrency: typeof o.fonepayCurrency === 'string' ? o.fonepayCurrency : undefined,
                            plan: typeof o.plan === 'string' ? o.plan : undefined,
                            subscriptionStatus: typeof o.subscriptionStatus === 'string' ? o.subscriptionStatus : undefined,
                            registrationDate: typeof o.createdAt === 'string' ? o.createdAt : undefined,
                            planExpiryDate: typeof o.planExpiryDate === 'string' ? o.planExpiryDate : undefined,
                        };
                    });
                    setOutlets(normalized);
                }
            }
        },
        tenantEntitlements,
        hasPlanFeature: (featureKey) => {
            if (user?.isSuperAdmin) return true;
            if (!tenantEntitlements) return true;
            return tenantEntitlements.featureKeys.includes(featureKey);
        },
        saasSettings,
        updateSaaSSettings: async (settings) => {
            const nextSettings = { ...saasSettings, ...settings };
            setSaaSSettings(nextSettings);

            if (!user?.isSuperAdmin) return;

            globalAppDataSerializedRef.current.saasSettings = JSON.stringify(nextSettings);
            await persistGlobalAppData('saasSettings', nextSettings);
            globalAppDataReadyRef.current.saasSettings = true;
        },
        addonGroups,
        addAddonGroup: (group) => setAddonGroups(prev => [...prev, { ...group, id: `ag-${Date.now()}` }]),
        updateAddonGroup: (group) => setAddonGroups(prev => prev.map(g => g.id === group.id ? group : g)),
        deleteAddonGroup: (id) => setAddonGroups(prev => prev.filter(g => g.id !== id)),
    };

    return (
        <RestaurantDataContext.Provider value={contextValue}>
            {children}
        </RestaurantDataContext.Provider>
    );
};

export const useRestaurantData = () => {
    const context = useContext(RestaurantDataContext);
    if (context === undefined) {
        throw new Error('useRestaurantData must be used within a RestaurantDataProvider');
    }
    return context;
};
