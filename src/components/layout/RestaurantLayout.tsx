



import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiBarChart2, FiTool, FiCommand, FiSettings, FiGlobe, FiBookmark, 
  FiBox, FiAnchor, FiDatabase, FiShoppingCart, FiCornerUpLeft, FiArrowDownCircle, 
  FiCornerLeftDown, FiArrowLeftCircle, FiTrash2, FiUsers, FiClock, FiFileText, FiMessageSquare,
  FiCoffee, FiGrid, FiCalendar, FiDollarSign, FiChevronDown, FiChevronRight, FiTag,
  FiMapPin, FiLayout, FiPrinter, FiMonitor, FiCreditCard, FiArchive, FiTrendingDown, FiAlertTriangle, FiClipboard,
  FiUploadCloud as ActualFiUploadCloud, FiKey as ActualFiKey, FiTruck, FiList, FiPlusCircle, FiActivity, FiTv,
  FiVolume2
} from 'react-icons/fi';
import Header from './Header';
import Footer from './Footer';
import { useRestaurantData } from '../../hooks/useRestaurantData';

// Moved temporary icon definitions here
const FiPercent: React.FC<{ className?: string, size?: string | number }> = ({ className, size }) => <span className={className} style={{ fontSize: size ? `${size}px` : undefined }}>%</span>;

interface IconProps {
  size?: string | number;
  className?: string;
}

interface NavLinkProps {
  to: string;
  icon?: React.ReactElement<IconProps>;
  label: string;
  currentPath: string;
  isSubItem?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, currentPath, isSubItem = false }) => {
  const isActive = currentPath === to;
  
  const linkClasses = `w-full flex items-center rounded-lg transition-all duration-200 ease-in-out relative transform hover:-translate-y-px ${
    isSubItem ? 'pl-12 space-x-2 p-2' : 'pl-4 space-x-3 p-3'
  } ${
    isActive
      ? 'bg-sky-600 text-white shadow-md'
      : 'text-sky-200 hover:bg-sky-600/70 hover:text-white'
  }`;

  return (
    <Link to={to} className={linkClasses} aria-current={isActive ? "page" : undefined}>
      {isActive && !isSubItem && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-amber-400 rounded-r-full"></div>
      )}
      {icon && React.cloneElement(icon, { size: isSubItem ? 16 : 18, className: "flex-shrink-0" })}
      <span className={`font-medium truncate ${isSubItem ? 'text-sm' : 'text-base'}`}>{label}</span>
    </Link>
  );
};

interface SidebarLink {
  path: string;
  label: string;
  icon?: React.ReactElement<IconProps>;
  isCloudKitchenHidden?: boolean;
}

interface SidebarSection {
  key: string;
  label: string;
  icon: React.ReactElement<IconProps>;
  matchPaths: string[];
  items: SidebarLink[];
  isOperational?: boolean;
  isCloudKitchenHidden?: boolean;
}

interface CollapsibleSidebarSectionProps {
  name: string;
  label: string;
  icon: React.ReactElement<IconProps>;
  items: SidebarLink[];
  isOpen: boolean;
  isSectionActive: boolean;
  onClick: () => void;
  currentPath: string;
}

const CollapsibleSidebarSection: React.FC<CollapsibleSidebarSectionProps> = ({
  name,
  label,
  icon,
  items,
  isOpen,
  isSectionActive,
  onClick,
  currentPath,
}) => {
  const buttonClasses = `w-full flex items-center justify-between space-x-3 p-3 rounded-lg text-sky-200 hover:bg-sky-600/70 hover:text-white transition-all duration-200 ease-in-out focus:outline-none relative transform hover:-translate-y-px ${
    isSectionActive ? 'bg-sky-600 text-white' : ''
  }`;

  return (
    <div>
      <button onClick={onClick} className={buttonClasses}>
        <div className="flex items-center space-x-3 pl-1">
          {isSectionActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-amber-400 rounded-r-full"></div>
          )}
          {React.cloneElement(icon, { size: 18 })}
          <span className="font-medium text-base">{label}</span>
        </div>
        <FiChevronRight
          size={16}
          className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <div className="pt-2 space-y-1">
          {items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              label={item.label}
              currentPath={currentPath}
              isSubItem={true}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};


const RestaurantLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  const { getSingleActiveOutlet } = useRestaurantData();
  const singleActiveOutlet = getSingleActiveOutlet();
  const isAggregateView = !singleActiveOutlet;
  const isCloudKitchen = singleActiveOutlet?.outletType === 'CloudKitchen';

  const sidebarSections: SidebarSection[] = useMemo(() => {
    const allSections: SidebarSection[] = [
    { 
        key: 'panel', 
        label: 'Panel', 
        icon: <FiCommand />, 
        matchPaths: ['/app/panel/'],
        isOperational: true,
        items: [
            { path: "/app/panel/pos", label: "POS", icon: <FiShoppingCart /> },
            { path: "/app/panel/kitchen-display", label: "Kitchen Display", icon: <FiMonitor /> },
            { path: "/app/panel/customer-display", label: "Customer Display", icon: <FiTv /> },
        ]
    },
    {
        key: 'operational', 
        label: 'Operations', 
        icon: <FiGrid />, 
        matchPaths: ['/app/tables', '/app/reservations'],
        isOperational: true,
        isCloudKitchenHidden: true,
        items: [
            { path: "/app/tables", label: "Tables", icon: <FiGrid /> },
            { path: "/app/reservations", label: "Reservations", icon: <FiCalendar /> },
        ]
    },
    {
        key: 'whatsapp', 
        label: 'WhatsApp', 
        icon: <FiMessageSquare />, 
        matchPaths: ['/app/whatsapp/'],
        isOperational: true,
        items: [
            { path: "/app/whatsapp/order-menu", label: "Order Menu", icon: <FiShoppingCart /> },
            { path: "/app/whatsapp/settings", label: "Settings", icon: <FiSettings /> },
        ]
    },
    {
        key: 'item', 
        label: 'Item Management', 
        icon: <FiBox />, 
        matchPaths: ['/app/item/', '/app/menu'],
        items: [
            { path: "/app/item/list-food-menu-category", label: "Food Categories", icon: <FiClipboard /> },
            { path: "/app/menu", label: "Food Menu", icon: <FiList /> }, 
            { path: "/app/item/list-pre-made-food", label: "Pre-Made Food", icon: <FiBox /> },
            { path: "/app/item/manage-addons", label: "Manage Add-ons", icon: <FiPlusCircle /> },
        ]
    },
    {
        key: 'stock', 
        label: 'Stock Management', 
        icon: <FiDatabase />, 
        matchPaths: ['/app/stock/'],
        items: [
            { path: "/app/stock/levels", label: "View Stock Levels", icon: <FiDatabase /> },
            { path: "/app/stock/add-entry", label: "Add Stock Entry", icon: <FiArrowDownCircle /> },
            { path: "/app/stock/adjustments", label: "Stock Adjustments", icon: <FiTool /> },
            { path: "/app/stock/suppliers", label: "Manage Suppliers", icon: <FiUsers /> },
            { path: "/app/stock/low-stock-report", label: "Low Stock Report", icon: <FiAlertTriangle /> },
        ]
    },
    {
        key: 'sale', 
        label: 'Sale & Customer', 
        icon: <FiShoppingCart />, 
        matchPaths: ['/app/sale', '/app/customer', '/app/customer-due-receive'],
        items: [
            { path: "/app/sale", label: "Sale History", icon: <FiActivity /> },
            { path: "/app/customer", label: "Manage Customers", icon: <FiUsers /> },
            { path: "/app/customer-due-receive", label: "Customer Due Receive", icon: <FiDollarSign /> },
        ]
    },
    {
        key: 'purchase', 
        label: 'Purchase & Expense', 
        icon: <FiCreditCard />, 
        matchPaths: ['/app/purchase', '/app/supplier-due-payment', '/app/expense', '/app/waste'],
        items: [
            { path: "/app/purchase", label: "List Purchases", icon: <FiShoppingCart /> }, 
            { path: "/app/purchase/add", label: "Add New Purchase", icon: <FiPlusCircle /> },
            { path: "/app/supplier-due-payment", label: "Supplier Due Payment", icon: <FiCreditCard /> },
            { path: "/app/expense", label: "Expense Management", icon: <FiTrendingDown /> },
            { path: "/app/waste", label: "Waste Management", icon: <FiTrash2 /> },
        ]
    },
    {
        key: 'hr', 
        label: 'Account & Employees', 
        icon: <FiUsers />, 
        matchPaths: ['/app/employees', '/app/account-user', '/app/attendance', '/app/payroll'],
        items: [
            { path: "/app/account-user", label: "Account and User", icon: <FiUsers /> },
            { path: "/app/employees", label: "Employees", icon: <FiUsers /> }, 
            { path: "/app/attendance", label: "Attendance", icon: <FiCalendar/> },
            { path: "/app/payroll", label: "Payroll", icon: <FiDollarSign/> },
        ]
    },
    {
        key: 'settings', 
        label: 'Settings', 
        icon: <FiSettings />, 
        matchPaths: ['/app/settings/'],
        items: [
            { path: "/app/settings/app-settings", label: "Application Settings", icon: <FiSettings/> }, 
            { path: "/app/settings/sound-settings", label: "Sound Settings", icon: <FiVolume2 /> },
            { path: "/app/settings/white-label", label: "White Label", icon: <FiTool /> },
            { path: "/app/settings/list-printer", label: "Printer", icon: <FiPrinter /> },
            { path: "/app/settings/list-counter", label: "Counter", icon: <FiMonitor /> }, 
            { path: "/app/settings/tax-setting", label: "Tax Setting", icon: <FiPercent /> }, 
            { path: "/app/settings/list-multiple-currency", label: "Multiple Currencies", icon: <FiDollarSign /> },
            { path: "/app/settings/expense-categories", label: "Expense Categories", icon: <FiTag /> },
            { path: "/app/settings/list-payment-method", label: "Payment Methods", icon: <FiCreditCard /> },
            { path: "/app/settings/list-denomination", label: "Denominations", icon: <FiArchive /> }, 
            { path: "/app/settings/list-delivery-partner", label: "Delivery Partners", icon: <FiTruck /> }, 
            { path: "/app/settings/list-area-floor", label: "Areas/Floors", icon: <FiMapPin />, isCloudKitchenHidden: true },
            { path: "/app/settings/list-table", label: "Table", icon: <FiGrid />, isCloudKitchenHidden: true },
            { path: "/app/settings/floor-area-plan-design", label: "Floor/Area Plan Design", icon: <FiLayout />, isCloudKitchenHidden: true },
            { path: "/app/settings/kitchens", label: "Manage Kitchens", icon: <FiCoffee /> },
            { path: "/app/settings/waiters", label: "Manage Waiters", icon: <FiUsers />, isCloudKitchenHidden: true },
        ]
    },
    {
        key: 'self-order', 
        label: 'Self Order Setting', 
        icon: <FiTool />, 
        isOperational: true,
        matchPaths: ['/app/self-order/'],
        items: [
            { path: "/app/self-order/enable-disable", label: "Enable/Disable", icon: <FiTool /> },
            { path: "/app/self-order/qr-generator", label: "Table QR code Generator", icon: <FiGrid />, isCloudKitchenHidden: true },
            { path: "/app/self-order/receiving-user", label: "Order Receiving User", icon: <FiUsers /> },
        ]
    },
    {
        key: 'website-settings', 
        label: 'Website Order Setting', 
        icon: <FiGlobe />, 
        matchPaths: ['/app/website-settings/'],
        items: [
            { path: "/app/website-settings/order-enable-disable", label: "Order Enable/Disable" },
            { path: "/app/website-settings/order-receiving-user", label: "Order Receiving User" },
            { path: "/app/website-settings/website-white-label", label: "Website White Label" },
            { path: "/app/website-settings/home/content", label: "Homepage Content" },
            { path: "/app/website-settings/home/add-photo", label: "Add Photo" },
            { path: "/app/website-settings/home/list-photo", label: "List Photo" },
            { path: "/app/website-settings/home/social-media", label: "Social Media" },
            { path: "/app/website-settings/ai-website-builder", label: "AI Website Builder" },
            { path: "/app/website-settings/available-online-foods", label: "Available Online Foods" },
            { path: "/app/website-settings/about-us-content", label: "About Us Content" },
            { path: "/app/website-settings/contact-us-content", label: "Contact Us Content" },
            { path: "/app/website-settings/contact-list", label: "Contact List" },
            { path: "/app/website-settings/common-menu-page", label: "Common Menu Page" },
            { path: "/app/website-settings/social-login-setting", label: "Social Login Setting" },
            { path: "/app/website-settings/email-setting", label: "Email Setting" },
            { path: "/app/website-settings/payment-setting", label: "Payment Setting" },
        ]
    },
    {
        key: 'reservation-settings', 
        label: 'Reservation Setting', 
        icon: <FiBookmark />, 
        matchPaths: ['/app/reservation-settings/'],
        items: [
            { path: "/app/reservation-settings/enable-disable-reservation", label: "Enable/Disable (Reservation)", icon: <FiCalendar /> },
            { path: "/app/reservation-settings/enable-disable", label: "Order Enable/Disable", icon: <FiTool /> },
            { path: "/app/reservation-settings/receiving-user", label: "Order Receiving User", icon: <FiUsers /> },
        ]
    }
  ];

    // Filter out sections/items based on view mode
    return allSections
      .filter(section => isAggregateView ? !section.isOperational : true)
      .map(section => ({
        ...section,
        items: section.items.filter(item => (isCloudKitchen ? !item.isCloudKitchenHidden : true))
      }))
      .filter(section => section.items.length > 0);
      
  }, [isCloudKitchen, isAggregateView]);

  const getMenuKeyForPath = useCallback((path: string) => {
    let bestMatch: string | null = null;
    let longestMatch = 0;

    for (const section of sidebarSections) {
      for (const matchPath of section.matchPaths) {
        if (path.startsWith(matchPath) && matchPath.length > longestMatch) {
          bestMatch = section.key;
          longestMatch = matchPath.length;
        }
      }
    }
    return bestMatch;
  }, [sidebarSections]);
  
  const activeMenuKey = useMemo(() => getMenuKeyForPath(currentPath), [currentPath, getMenuKeyForPath]);

  const currentPageLabel = useMemo(() => {
    if (currentPath === '/app/home') return 'Home';
    if (currentPath === '/app/dashboard') return 'Dashboard';
    
    const allLinks = [
      { path: '/app/outlet-setting', label: 'Outlet Setting' },
      { path: '/app/subscription', label: 'Subscription' },
      { path: '/app/report', label: 'Reports' },
      { path: '/app/send-sms', label: 'Send SMS' },
      ...sidebarSections.flatMap(s => s.items)
    ];

    const match = allLinks.find(link => link.path === currentPath);
    if (match) return match.label;
    
    // Fallbacks for dynamic routes or routes not in the sidebar
    if (currentPath.startsWith('/app/panel/pos/')) return 'Point of Sale';
    if (currentPath.startsWith('/app/purchase/add')) return 'Add New Purchase';
    if (currentPath === '/app/settings') return 'Application Settings';
    if (currentPath === '/app/stock') return 'View Stock Levels';

    const sectionMatch = sidebarSections.find(s => s.matchPaths.some(p => currentPath.startsWith(p)));
    if (sectionMatch) return sectionMatch.label;
    
    return 'RestoByte';
  }, [currentPath, sidebarSections]);

  useEffect(() => {
    setOpenMenuKey(activeMenuKey);
  }, [activeMenuKey]);

  const handleMenuClick = (key: string) => {
    setOpenMenuKey(prevKey => (prevKey === key ? null : key));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-80 bg-sky-700 text-white p-4 space-y-2 shadow-lg flex flex-col overflow-y-auto custom-scrollbar">
        <div className="text-3xl font-bold text-center text-white py-4 border-b border-sky-600 mb-2">
          Resto<span className="text-amber-400">Byte</span>
        </div>
        <nav className="flex-grow space-y-1">
          <NavLink to="/app/home" icon={<FiHome />} label="Home" currentPath={currentPath} />
          <NavLink to="/app/dashboard" icon={<FiBarChart2 />} label="Dashboard" currentPath={currentPath} />
          <NavLink to="/app/outlet-setting" icon={<FiTool />} label="Outlet Setting" currentPath={currentPath} />
          <NavLink to="/app/subscription" icon={<FiCreditCard />} label="Subscription" currentPath={currentPath} />

          {sidebarSections.map(section => (
            <CollapsibleSidebarSection
              key={section.key}
              name={section.key}
              label={section.label}
              icon={section.icon}
              items={section.items}
              isOpen={openMenuKey === section.key}
              isSectionActive={activeMenuKey === section.key}
              onClick={() => handleMenuClick(section.key)}
              currentPath={currentPath}
            />
          ))}

          <div className="pt-4 border-t border-sky-600/50">
            <NavLink to="/app/report" icon={<FiFileText />} label="Reports" currentPath={currentPath} />
            <NavLink to="/app/send-sms" icon={<FiMessageSquare />} label="Send SMS" currentPath={currentPath} />
          </div>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentPageLabel} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6"> 
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default RestaurantLayout;
