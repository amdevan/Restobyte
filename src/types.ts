

export interface Variation {
  name: string;
  price: number;
}

export interface Addon {
  id: string;
  name:string;
  price: number;
}

export interface AddonGroup {
  id: string;
  name: string; // e.g., "Toppings", "Sizes"
  addons: Addon[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  variations: Variation[];
  addonGroupIds?: string[];
  category: string;
  imageUrl?: string;
  isVeg?: boolean;
}

// Alias for clarity, can be evolved if pre-made items need different fields later
export type PreMadeFoodItem = MenuItem;


export enum TableStatus {
  Free = 'Free',
  Occupied = 'Occupied',
  Reserved = 'Reserved',
}

export interface Table {
  id: string;
  name: string; // e.g., "Table 1", "Patio A"
  capacity: number;
  status: TableStatus;
  areaFloorId?: string; // Optional: ID of the AreaFloor this table belongs to
  occupiedSince?: string; // ISO string timestamp for when the table became occupied
  notes?: string; // Optional notes for the table
  assistanceRequested?: boolean;
  assistanceRequestedAt?: string; // ISO string
  foodReady?: boolean; // True when an order for this table is ready for pickup
}

export interface Reservation {
  id:string;
  customerName: string;
  phone?: string;
  dateTime: string; // ISO string for simplicity, can be parsed to Date
  partySize: number;
  tableId?: string; // Assigned table ID
  notes?: string;
  outletId: string;
}

export enum Page {
  Dashboard = 'Dashboard',
  Menu = 'Menu',
  Tables = 'Tables',
  Reservations = 'Reservations',
}

// New types for recording sales
export interface SaleItem {
  id: string; // MenuItem ID
  name: string;
  price: number; // Price per unit at the time of sale
  basePrice?: number;
  quantity: number;
  isVeg?: boolean;
  notes?: string; // For item-specific notes like "no onions"
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // Made phone required for new customer quick add
  email?: string;
  address?: string; 
  dob?: string; // Date of Birth YYYY-MM-DD
  dueAmount?: number; // Outstanding due amount from the customer
  companyName?: string;
  vatPan?: string;
}

export interface Waiter {
  id: string;
  name: string;
  employeeId?: string; // Optional: for identification
  phone?: string; // Optional
  employeeProfileId?: string; // Link to the Employee record
}

export interface SaleTaxDetail {
  id: string; // tax id from outlet at time of sale
  name: string;
  rate: number; // rate at time of sale
  amount: number; // calculated tax amount
}

export interface PartialPayment {
    method: string;
    amount: number;
}

export interface Split {
  id: string;
  items?: SaleItem[]; // Optional now
  description?: string; // For non-item splits like "Equal Share"
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  isPaid: boolean;
  payments: PartialPayment[]; // payments made for this split
  tipAmount: number;
}

export interface Sale {
  id: string; // Unique ID for the sale
  saleDate: string; // ISO String for the date of sale
  items: SaleItem[];
  subTotal: number;
  taxDetails: SaleTaxDetail[];
  totalAmount: number;
  orderType: string; // e.g., "Dine In", "Delivery", "Pickup"
  pax?: number | string;
  waiterId?: string; // Changed from waiter: string to waiterId: string
  waiterName?: string; // To store waiter name directly
  assignedTableId?: string | null;
  assignedTableName?: string; // Added to store table name directly
  outletId: string;
  
  // Advanced POS fields
  customerId?: string; // Link to a Customer object
  customerName?: string; // Denormalized for quick display on receipts/lists
  orderNotes?: string;
  paymentMethod?: string; // e.g., "Cash", "Card", "Online", "Split"
  partialPayments?: PartialPayment[]; // For split payments
  isSettled?: boolean; // True if payment complete, false if due (e.g., 'Other' payment method)

  // Delivery Partner Info
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryCommission?: number; // Commission rate at the time of sale
  
  // Discount Info
  discountType?: 'fixed' | 'percentage';
  discountAmount?: number; // The value of the discount (e.g., 5 for $5 or 10 for 10%)
  tipAmount?: number;
  splitDetails?: Split[]; // To store the details of how the bill was split
  kdsStatus?: 'new' | 'in-progress' | 'ready' | 'served' | 'on-hold'; // Status for Kitchen Display System
  kdsReadyTimestamp?: string; // ISO string for when order is marked 'ready'
}

export interface FoodMenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string; // for base64 data or external URL
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string; // e.g., 'kg', 'ltr', 'pcs'
  lowStockThreshold: number;
  costPerUnit?: number; // Average or last cost per unit, for waste estimation
}

// Types for Stock Entries
export interface StockEntryItem {
  stockItemId: string; // References StockItem.id
  stockItemName: string; // For display and record keeping
  quantityAdded: number;
  unit: string; // For display and record keeping
  costPerUnit?: number; // Optional
}

export interface StockEntry {
  id: string;
  date: string; // ISO string
  supplier?: string; // Could be Supplier ID later if Manage Suppliers is implemented
  referenceNumber?: string; // Can be supplier invoice or internal ref
  items: StockEntryItem[];
  notes?: string;
  purchaseId?: string; // Optional: Link to a Purchase record
  outletId: string;
}

// Types for Stock Adjustments
export type StockAdjustmentType = 'Increase' | 'Decrease' | 'SetTo';

export interface StockAdjustmentItem {
  stockItemId: string; // References StockItem.id
  stockItemName: string; // For display and record keeping
  unit: string; // For display and record keeping
  adjustmentType: StockAdjustmentType;
  quantity: number; // The amount to adjust by, or the new total quantity if "SetTo"
  reasonForItem?: string; // Optional reason for this specific item's adjustment
}

export interface StockAdjustment {
  id: string;
  date: string; // ISO string
  overallReason: string; // e.g., "Spoilage", "Inventory Count Correction", "Internal Use"
  overallNotes?: string;
  items: StockAdjustmentItem[];
  outletId: string;
}

// Type for Suppliers
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

// Purchase Management Types
export interface PurchaseItem {
  id: string; // Can be a temporary ID before linking to stockItem or just for the line item itself
  stockItemId?: string; // Becomes StockItem.id once found/created
  itemName: string; // Name entered by user, used to find/create StockItem
  category: string; // Category for new StockItem
  unit: string; // Unit for new StockItem
  lowStockThreshold: number; // For new StockItem
  quantityPurchased: number;
  costPerUnit: number;
  subTotal: number; // quantityPurchased * costPerUnit
}

export interface Purchase {
  id: string; // Unique ID for the purchase
  purchaseNumber: string; // Auto-generated or user-input
  date: string; // ISO string
  supplierId?: string; // Link to Supplier
  supplierName?: string; // Denormalized for display
  supplierInvoiceNumber?: string; // Optional
  items: PurchaseItem[];
  subTotalAmount: number; // Sum of all PurchaseItem.subTotal
  taxAmount?: number; // Optional
  discountAmount?: number; // Optional
  grandTotalAmount: number;
  paidAmount?: number; // Amount paid for this purchase, defaults to 0
  notes?: string;
  stockEntryId?: string; // ID of the StockEntry created from this purchase
  outletId: string;
}


// Type for Areas/Floors
export interface AreaFloor {
  id: string;
  name: string;
  description?: string;
}

// Type for Kitchens
export interface Kitchen {
  id: string;
  name: string;
}

// Printer Types
export enum PrinterType {
  Receipt = 'Receipt',
  KOT = 'Kitchen Order Ticket (KOT)',
  Label = 'Label',
}

export enum PrinterInterfaceType {
  Network = 'Network (IP/Ethernet)',
  USB = 'USB',
  Bluetooth = 'Bluetooth',
  Serial = 'Serial',
}

export interface Printer {
  id: string;
  name: string;
  type: PrinterType;
  interfaceType: PrinterInterfaceType;
  ipAddress?: string; // For Network printers
  port?: string;      // For Network printers
  // Potentially other fields for USB path, Bluetooth MAC, etc.
}

// Type for Counters
export interface Counter {
  id: string;
  name: string;
  assignedPrinterIds?: string[]; // Array of Printer IDs
}

// Type for Currencies
export interface Currency {
  id: string;
  name: string; // e.g., "US Dollar"
  code: string; // e.g., "USD"
  symbol: string; // e.g., "$"
  exchangeRate: number; // Relative to a base/default currency (default will be 1)
  isDefault: boolean;
}

// Type for Denominations
export interface Denomination {
  id: string;
  name: string; // e.g., "$100 Bill", "$1 Coin"
  value: number;
}

// Expense Management Types
export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  date: string; // ISO string date
  categoryId: string; // Link to ExpenseCategory
  categoryName: string; // Denormalized for display
  amount: number;
  payee?: string; // Person or company paid
  description?: string;
  paymentMethod: string; // e.g., "Cash", "Card", "Bank Transfer"
  referenceNumber?: string; // Optional: Invoice, receipt number
  outletId: string;
}

// Waste Management Types
export interface WasteItem {
  stockItemId: string;
  stockItemName: string; // Denormalized
  quantityWasted: number;
  unit: string; // Denormalized
  costAtTimeOfWaste?: number; // Cost per unit of the item when wasted
  reasonForItem?: string; // e.g., "Dropped", "Burnt"
}

export interface WasteRecord {
  id: string;
  date: string; // ISO string
  reason: string; // Overall reason, e.g., "Spoilage", "Expired", "Cooking Error", "Damaged Goods"
  responsiblePerson?: string; // Optional
  items: WasteItem[];
  totalEstimatedLoss?: number; // Calculated: sum(item.quantityWasted * item.costAtTimeOfWaste)
  notes?: string;
  outletId: string;
}

// Employee Management Types
export interface Employee {
  id: string;
  name: string;
  employeeId: string; // Unique Employee ID
  phone: string;
  email?: string;
  address?: string;
  dob?: string; // Date of Birth, YYYY-MM-DD
  joiningDate: string; // Date of Joining, YYYY-MM-DD
  designation: string; // e.g., Manager, Chef, Waiter, Cashier
  salary?: number; // Monthly or hourly salary
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean; // True for active employees, false for inactive/former
  isWaiter: boolean; // True if this employee also functions as a waiter
  waiterId?: string; // ID of the associated Waiter record if isWaiter is true
  photoUrl?: string; // Data URL or actual URL for employee photo
}

// Attendance Types
export enum AttendanceStatus {
  Present = 'Present',
  Absent = 'Absent',
  Late = 'Late',
  HalfDay = 'Half-Day',
  OnLeave = 'On Leave',
}

export interface AttendanceRecord {
  id: string; // Composite key: employeeId-YYYY-MM-DD
  employeeId: string;
  employeeName: string; // Denormalized for easier display
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string; // HH:MM
  checkOutTime?: string; // HH:MM
  notes?: string;
}

// Payroll Types
export interface PayrollRecord {
  id: string; // e.g., `empId-year-month`
  employeeId: string;
  employeeName: string;
  month: number; // 1-12
  year: number;
  baseSalary: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  deductions: number;
  netSalary: number;
  status: 'Pending' | 'Paid';
  paidDate?: string; // ISO string
}


// Dashboard Specific Types
export interface SalesTrendDataPoint {
  date: string; // e.g., "Mon", "Tue" or "YYYY-MM-DD"
  sales: number;
}

export interface TopSellingItemData {
  id: string;
  name: string;
  quantity: number;
  price?: number; // Optional: if you want to show price as well
}

export interface OrderTypeDataPoint {
    type: string;
    count: number;
    percentage: number;
    color: string; // Tailwind CSS color class e.g. 'bg-blue-500'
}

export interface PaymentMethodDataPoint {
    method: string;
    count: number;
    percentage: number;
    color: string; // Tailwind CSS color class e.g. 'bg-green-500'
}

export interface ReservationAvailability {
  day: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  isAvailable: boolean;
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
}

export interface ReservationSettings {
  enabled: boolean;
  availability: ReservationAvailability[];
}

export interface WebsiteWhiteLabelSettings {
  appName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
}

export interface WebsiteBannerSection {
  title: string;
  subtitle: string;
  imageUrl?: string;
}

export interface WebsiteService {
  id: string;
  title: string;
  description: string;
  icon: string; // e.g., 'FiAward'
}

export interface WebsiteExploreMenuSection {
  title: string;
  subtitle: string;
  buttonText: string;
  imageUrl?: string;
}

export interface WebsiteGalleryPhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface WebsiteSocialMediaLink {
  id:string;
  platform: 'Facebook' | 'Twitter' | 'Instagram' | 'LinkedIn' | 'YouTube';
  url: string;
}

export interface WebsiteAboutUsContent {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface WebsiteContactUsContent {
  address: string;
  phone: string;
  email: string;
  mapUrl?: string;
}

export interface WebsiteContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  receivedAt: string; // ISO String
}

export interface WebsiteCommonMenuPage {
  title: string;
}

export interface WebsiteSocialLoginSettings {
  google: boolean;
  facebook: boolean;
}

export interface WebsiteEmailSettings {
  mailer: 'smtp' | 'sendmail' | 'log';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  encryption?: 'none' | 'tls' | 'ssl';
  fromAddress?: string;
  fromName?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  isEnabled: boolean;
}

export interface WebsitePaymentSettings {
  paypalEnabled: boolean;
  paypalClientId?: string;
  stripeEnabled: boolean;
  stripePublicKey?: string;
  stripeSecretKey?: string;
  fonepayEnabled: boolean;
  fonepayMerchantId?: string;
}

export interface WebsiteHomePageContent {
  bannerSection: WebsiteBannerSection;
  serviceSection: {
    services: WebsiteService[];
  };
  exploreMenuSection: WebsiteExploreMenuSection;
  gallery: WebsiteGalleryPhoto[];
  socialMedia: WebsiteSocialMediaLink[];
}

export interface WebsiteSettings {
  orderEnabled: boolean;
  orderReceivingUserIds: string[];
  whiteLabel: WebsiteWhiteLabelSettings;
  homePageContent: WebsiteHomePageContent;
  availableOnlineFoodIds: string[];
  aboutUsContent: WebsiteAboutUsContent;
  contactUsContent: WebsiteContactUsContent;
  contactMessages: WebsiteContactMessage[];
  commonMenuPage: WebsiteCommonMenuPage;
  socialLogin: WebsiteSocialLoginSettings;
  emailSettings: WebsiteEmailSettings;
  paymentSettings: WebsitePaymentSettings;
}

export interface ApplicationSettings {
  dateFormat: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY';
  timeFormat: '12h' | '24h';
  currencySymbolPosition: 'before' | 'after';
  decimalPlaces: number;
  kotCharactersPerLine: number;
  defaultWalkInCustomerId: string;
  defaultOrderType: 'Dine In' | 'Delivery' | 'Pickup' | 'WhatsApp';
}

export interface Tax {
  id: string;
  name: string;
  rate: number; // Stored as percentage, e.g., 5 for 5%
}

export interface Outlet {
  id: string;
  name: string; // Internal name, e.g., "Downtown Branch"
  restaurantName: string; // Public name for receipts
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  outletType: 'Restaurant' | 'CloudKitchen';
  taxes: Tax[];
  whatsappNumber?: string;
  whatsappOrderingEnabled?: boolean;
  whatsappDefaultMessage?: string;
  // Fonepay settings (per-tenant/per-outlet)
  fonepayIsEnabled?: boolean;
  fonepayMerchantCode?: string;
  fonepayTerminalId?: string;
  fonepayCurrency?: string; // e.g., 'NPR'
  plan?: string;
  subscriptionStatus?: 'active' | 'inactive' | 'trialing';
  registrationDate?: string;
  planExpiryDate?: string;
}

export interface Role {
  id: string;
  name: string;
  // In a real app, this would be a more robust permission system
  permissions: string[]; 
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // This would be a salted hash in a real app
  roleId: string;
  outletId: string; // Every user is assigned to one outlet
  isActive: boolean;
  isSuperAdmin?: boolean;
}

export interface DeliveryPartner {
    id: string;
    name: string;
    commissionRate?: number; // as a percentage, e.g., 15 for 15%
    isEnabled: boolean;
}

export interface KOT {
  kotNumber: string;
  table?: string;
  waiter?: string;
  timestamp: string;
  items: SaleItem[];
}

// New types for SaaS Website CMS
export interface SaasFeature {
    id: string;
    icon: string; // e.g., FiAward
    title: string;
    description: string;
}

export interface SaasPricingPlan {
    id: string;
    name: string; // e.g., "Basic", "Pro"
    price: string; // e.g., "$99"
    period: string; // e.g., "/ month"
    features: string[];
    isFeatured: boolean;
}

export interface SaasTrustedByLogo {
    id: string;
    name: string;
    logoUrl: string;
}

export interface SaasStatistic {
    id: string;
    value: string;
    label: string;
}

export interface SaasCallToAction {
    title: string;
    subtitle: string;
    buttonText: string;
}

export interface SaasTestimonial {
    id: string;
    storeName: string;
    result: string;
    description: string;
    imageUrl?: string;
}

export interface SaasPost {
    id: string;
    title: string;
    category: string;
    date: string; // YYYY-MM-DD
    excerpt: string;
    imageUrl: string;
}

export interface SaasNavLink {
    id: string;
    text: string;
    url: string;
}

export interface SaasHeader {
    logoUrl: string;
    navLinks: SaasNavLink[];
}

export interface SaasFooterLink {
    id: string;
    text: string;
    url: string;
}

export interface SaasFooterColumn {
    id: string;
    title: string;
    links: SaasFooterLink[];
}

export interface SaasFooter {
    copyright: string;
    columns: SaasFooterColumn[];
    socialLinks: WebsiteSocialMediaLink[];
}

export interface SaasSeo {
    title: string;
    description: string;
    faviconUrl: string;
}

export interface SaasPage {
    id: string;
    slug: string;
    title: string;
    content: string;
    imageUrl?: string;
}

export interface SaasWebsiteContent {
    sectionOrder: string[];
    header: SaasHeader;
    footer: SaasFooter;
    seo: SaasSeo;
    pages: SaasPage[];
    hero: {
        title: string;
        subtitle: string;
        imageUrl: string;
    };
    trustedByLogos: SaasTrustedByLogo[];
    statistics: SaasStatistic[];
    features: SaasFeature[];
    cta: SaasCallToAction;
    pricing: SaasPricingPlan[];
    testimonials: SaasTestimonial[];
    blogPosts: SaasPost[];
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  isPublic: boolean; // Show on landing page
  isActive: boolean; // Can be assigned to new tenants
  isFeatured?: boolean;
}

export interface SaasSmsSettings {
    provider: 'twilio' | 'nexmo' | 'custom' | '';
    apiKey: string;
    apiSecret?: string;
    senderId: string;
}

export interface SaasPaymentGatewaySettings {
    stripe: {
        isEnabled: boolean;
        publicKey: string;
        secretKey: string;
    };
    khalti: {
        isEnabled: boolean;
        publicKey: string;
        secretKey: string;
    };
}

export interface SaasLegalSettings {
    termsOfService: string;
    privacyPolicy: string;
}

export interface SaasMaintenanceSettings {
    isEnabled: boolean;
    message: string;
}

export interface SaaSSettings {
    sms: SaasSmsSettings;
    paymentGateways: SaasPaymentGatewaySettings;
    legal: SaasLegalSettings;
    maintenance: SaasMaintenanceSettings;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SoundSettings {
  soundsEnabled: boolean;
}

export interface RestaurantDataContextType {
    menuItems: MenuItem[];
    addMenuItem: (item: Omit<MenuItem, 'id' | 'imageUrl'>, imageUrl?: string, isVeg?: boolean) => void;
    updateMenuItem: (item: MenuItem) => void;
    deleteMenuItem: (itemId: string) => void;
    
    tables: Table[];
    updateTableStatus: (tableId: string, newStatus: TableStatus) => void;
    addTable: (name: string, capacity: number, areaFloorId?: string) => void;
    updateTableSettings: (tableId: string, name: string, capacity: number, areaFloorId?: string) => void;
    deleteTable: (tableId: string) => void;
    updateTableNotes: (tableId: string, notes: string) => void;
    requestTableAssistance: (tableId: string) => void;
    resolveTableAssistance: (tableId: string) => void;
    resolveFoodReady: (tableId: string) => void;
    
    reservations: Reservation[];
    addReservation: (reservation: Omit<Reservation, 'id'>) => void;
    updateReservation: (reservation: Reservation) => void;
    deleteReservation: (reservationId: string) => void;
    getAvailableTables: (dateTime: string, partySize: number) => Table[];
    
    sales: Sale[];
    recordSale: (saleData: Omit<Sale, 'id' | 'saleDate'>) => Sale; 
    updateSale: (updatedSale: Sale) => void;
    updateKdsOrderStatus: (saleId: string, status: 'new' | 'in-progress' | 'ready' | 'served' | 'on-hold') => void;
    
    foodMenuCategories: FoodMenuCategory[];
    addFoodMenuCategory: (categoryData: Omit<FoodMenuCategory, 'id'>) => void;
    updateFoodMenuCategory: (category: FoodMenuCategory) => void;
    deleteFoodMenuCategory: (categoryId: string) => void;

    preMadeFoodItems: PreMadeFoodItem[];
    addPreMadeFoodItem: (item: Omit<PreMadeFoodItem, 'id' | 'imageUrl'>, imageUrl?: string, isVeg?: boolean) => void;
    updatePreMadeFoodItem: (item: PreMadeFoodItem) => void;
    deletePreMadeFoodItem: (itemId: string) => void;

    stockItems: StockItem[];
    updateStockItemQuantity: (itemId: string, quantityValue: number, changeType?: 'increase' | 'decrease' | 'set') => void;
    findOrCreateStockItem: (details: { name: string; category: string; unit: string; lowStockThreshold: number, costPerUnit?: number }) => StockItem;

    stockEntries: StockEntry[];
    addStockEntry: (entryData: Omit<StockEntry, 'id' | 'date'>) => StockEntry; 

    stockAdjustments: StockAdjustment[];
    addStockAdjustment: (adjustmentData: Omit<StockAdjustment, 'id' | 'date'>) => void;

    suppliers: Supplier[];
    addSupplier: (supplierData: Omit<Supplier, 'id'>) => Supplier;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (supplierId: string) => void;

    customers: Customer[];
    addCustomer: (customerData: Omit<Customer, 'id'>) => Customer;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (customerId: string) => void;
    getAllCustomers: () => Customer[];
    receiveCustomerPayment: (customerId: string, amountReceived: number, paymentMethod: string, notes?: string) => void;

    areasFloors: AreaFloor[];
    addAreaFloor: (areaFloorData: Omit<AreaFloor, 'id'>) => void;
    updateAreaFloor: (areaFloor: AreaFloor) => void;
    deleteAreaFloor: (areaFloorId: string) => void;

    kitchens: Kitchen[];
    addKitchen: (kitchenData: Omit<Kitchen, 'id'>) => void;
    updateKitchen: (kitchen: Kitchen) => void;
    deleteKitchen: (kitchenId: string) => void;

    printers: Printer[];
    addPrinter: (printerData: Omit<Printer, 'id'>) => void;
    updatePrinter: (printer: Printer) => void;
    deletePrinter: (printerId: string) => void;

    counters: Counter[];
    addCounter: (counterData: Omit<Counter, 'id' | 'assignedPrinterIds'> & { assignedPrinterIds?: string[] }) => void;
    updateCounter: (counter: Counter) => void;
    deleteCounter: (counterId: string) => void;

    waiters: Waiter[];
    addWaiter: (waiterData: Omit<Waiter, 'id'>) => Waiter;
    updateWaiter: (waiter: Waiter) => void;
    deleteWaiter: (waiterId: string) => void;

    currencies: Currency[];
    addCurrency: (currencyData: Omit<Currency, 'id' | 'isDefault'>) => void;
    updateCurrency: (currency: Currency) => void;
    deleteCurrency: (currencyId: string) => void;
    setDefaultCurrency: (currencyId: string) => void;

    denominations: Denomination[];
    addDenomination: (data: Omit<Denomination, 'id'>) => void;
    updateDenomination: (data: Denomination) => void;
    deleteDenomination: (id: string) => void;

    purchases: Purchase[];
    addPurchase: (purchaseData: Omit<Purchase, 'id' | 'date' | 'stockEntryId'>) => Purchase;
    recordSupplierPayment: (purchaseId: string, amountPaid: number, paymentDate: string, paymentMethod: string, reference?: string, notes?: string) => void;

    expenseCategories: ExpenseCategory[];
    addExpenseCategory: (categoryData: Omit<ExpenseCategory, 'id'>) => ExpenseCategory;
    updateExpenseCategory: (category: ExpenseCategory) => void;
    deleteExpenseCategory: (categoryId: string) => void;

    expenses: Expense[];
    addExpense: (expenseData: Omit<Expense, 'id'>) => Expense;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (expenseId: string) => void;

    wasteRecords: WasteRecord[];
    addWasteRecord: (recordData: Omit<WasteRecord, 'id' | 'date'>) => WasteRecord;

    employees: Employee[];
    addEmployee: (employeeData: Omit<Employee, 'id'>) => Employee;
    updateEmployee: (employee: Employee) => void;
    deleteEmployee: (employeeId: string) => void;

    attendanceRecords: AttendanceRecord[];
    markOrUpdateAttendance: (recordsToUpdate: Array<Omit<AttendanceRecord, 'id' | 'employeeName'>>) => void;
    getAttendanceForDate: (date: string) => AttendanceRecord[];

    payrollRecords: PayrollRecord[];
    addOrUpdatePayrollRecord: (recordData: PayrollRecord) => void;

    paymentMethods: PaymentMethod[];
    updatePaymentMethod: (method: PaymentMethod) => void;

    deliveryPartners: DeliveryPartner[];
    addDeliveryPartner: (partnerData: Omit<DeliveryPartner, 'id'>) => void;
    updateDeliveryPartner: (partner: DeliveryPartner) => void;
    deleteDeliveryPartner: (partnerId: string) => void;

    isSelfOrderEnabled: boolean;
    setSelfOrderStatus: (isEnabled: boolean) => void;
    isReservationOrderEnabled: boolean;
    setReservationOrderStatus: (isEnabled: boolean) => void;
    reservationOrderReceivingUserIds: string[];
    setReservationOrderReceivingUserIds: (ids: string[]) => void;
    reservationSettings: ReservationSettings;
    setReservationSettings: (settings: ReservationSettings) => void;
    websiteSettings: WebsiteSettings;
    updateWebsiteSettings: (settings: Partial<WebsiteSettings>) => void;
    applicationSettings: ApplicationSettings;
    updateApplicationSettings: (settings: Partial<ApplicationSettings>) => void;
    soundSettings: SoundSettings;
    updateSoundSettings: (settings: Partial<SoundSettings>) => void;

    // Multi-Outlet Support
    outlets: Outlet[];
    activeOutletIds: string[];
    setActiveOutletIds: (outletIds: string[]) => void;
    getActiveOutlets: () => Outlet[];
    getSingleActiveOutlet: () => Outlet | undefined;
    addOutlet: (outletData: Omit<Outlet, 'id'>) => Outlet;
    updateOutlet: (outlet: Outlet) => void;
    deleteOutlet: (outletId: string) => void;
    
    // User Management
    roles: Role[];
    users: User[];
    addUser: (userData: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    registerUser: (username: string, password: string, restaurantName: string, fullName: string, mobile: string, address: string) => Promise<{ success: boolean; message: string; user?: User }>;
    checkLogin: (username: string, password: string) => User | null;

    // SaaS Content Management
    saasWebsiteContent: SaasWebsiteContent;
    updateSaasWebsiteContent: (updater: (prev: SaasWebsiteContent) => SaasWebsiteContent) => void;

    // SaaS Plan Management
    plans: Plan[];
    addPlan: (planData: Omit<Plan, 'id'>) => void;
    updatePlan: (updatedPlan: Plan) => void;
    deletePlan: (planId: string) => void;

    // SaaS Settings
    saasSettings: SaaSSettings;
    updateSaaSSettings: (settings: Partial<SaaSSettings>) => void;
    
    addonGroups: AddonGroup[];
    addAddonGroup: (group: Omit<AddonGroup, 'id'>) => void;
    updateAddonGroup: (group: AddonGroup) => void;
    deleteAddonGroup: (groupId: string) => void;
}
