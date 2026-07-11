



import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiBarChart2, FiTool, FiCommand, FiSettings, FiGlobe, FiBookmark,
  FiBox, FiAnchor, FiDatabase, FiShoppingCart, FiCornerUpLeft, FiArrowDownCircle,
  FiCornerLeftDown, FiArrowLeftCircle, FiTrash2, FiUsers, FiClock, FiFileText, FiMessageSquare,
  FiCoffee, FiGrid, FiCalendar, FiDollarSign, FiChevronDown, FiChevronRight, FiChevronLeft, FiTag,
  FiMapPin, FiLayout, FiPrinter, FiMonitor, FiCreditCard, FiArchive, FiTrendingDown, FiAlertTriangle, FiClipboard,
  FiUploadCloud as ActualFiUploadCloud, FiKey as ActualFiKey, FiTruck, FiList, FiPlusCircle, FiActivity, FiTv,
  FiVolume2
} from 'react-icons/fi';
import Header from './Header';
import Footer from './Footer';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { useAuth } from '../../hooks/useAuth';

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
  isCollapsed?: boolean;
  onCollapsedNavigate?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, currentPath, isSubItem = false, isCollapsed = false, onCollapsedNavigate }) => {
  const isActive = currentPath === to;

  const linkClasses = `w-full flex items-center rounded-lg transition-all duration-200 ease-in-out relative ${isCollapsed ? 'justify-center p-2' : (isSubItem ? 'pl-9 space-x-2 p-1.5' : 'pl-3 space-x-3 p-2')
    } ${isSubItem && isCollapsed ? 'hidden' : ''} ${isActive
      ? 'bg-[#131a22] text-amber-200 shadow-md ring-1 ring-amber-400/25'
      : 'text-slate-200 hover:bg-white/5 hover:text-amber-100'
    }`;

  return (
    <Link
      to={to}
      className={linkClasses}
      aria-current={isActive ? "page" : undefined}
      onClick={() => {
        if (isCollapsed && onCollapsedNavigate) onCollapsedNavigate();
      }}
    >
      {isActive && !isSubItem && !isCollapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-amber-300 rounded-r-full"></div>
      )}
      {icon && React.cloneElement(icon, { size: isSubItem ? 13 : 15, className: "flex-shrink-0" })}
      {!isCollapsed && <span className={`font-medium truncate ${isSubItem ? 'text-[11px]' : 'text-xs'}`}>{label}</span>}
    </Link>
  );
};

interface SidebarLink {
  path: string;
  label: string;
  icon?: React.ReactElement<IconProps>;
  isCloudKitchenHidden?: boolean;
  featureKey?: string;
  requiredPermissions?: string[];
}

interface SidebarSection {
  key: string;
  label: string;
  icon: React.ReactElement<IconProps>;
  matchPaths: string[];
  items: SidebarLink[];
  isOperational?: boolean;
  isCloudKitchenHidden?: boolean;
  featureKey?: string;
  requiredPermissions?: string[];
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
  isCollapsed?: boolean;
  onCollapsedNavigate?: () => void;
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
  isCollapsed = false,
  onCollapsedNavigate,
}) => {
  if (isCollapsed) {
    const to = items[0]?.path || '/app/dashboard';
    return (
      <NavLink
        to={to}
        icon={icon}
        label={label}
        currentPath={currentPath}
        isCollapsed
        onCollapsedNavigate={onCollapsedNavigate}
      />
    );
  }

  const buttonClasses = `w-full flex items-center justify-between space-x-3 p-2 rounded-lg text-slate-200 hover:bg-white/5 hover:text-amber-100 transition-all duration-200 ease-in-out focus:outline-none relative ${isSectionActive ? 'bg-[#131a22] text-amber-200 ring-1 ring-amber-400/25' : ''
    }`;

  return (
    <div>
      <button type="button" onClick={onClick} className={buttonClasses} aria-expanded={isOpen} aria-controls={`sidebar-section-${name}`}>
        <div className="flex items-center space-x-3 pl-1">
          {isSectionActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-amber-300 rounded-r-full"></div>
          )}
          {React.cloneElement(icon, { size: 15 })}
          <span className="font-medium text-xs">{label}</span>
        </div>
        <FiChevronRight
          size={13}
          className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
        />
      </button>
      <div
        id={`sidebar-section-${name}`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { user } = useAuth();
  const { getSingleActiveOutlet, hasPlanFeature } = useRestaurantData();
  const singleActiveOutlet = getSingleActiveOutlet();
  const isAggregateView = !singleActiveOutlet;
  const isCloudKitchen = singleActiveOutlet?.outletType === 'CloudKitchen';

  const hasPermission = useCallback((requiredPermissions: string[] | undefined) => {
    if (!user) return false;
    if (user.isSuperAdmin || user.roleId === 'role-admin') return true;
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    const userPermissions = user.permissions || [];
    if (userPermissions.includes('*')) return true;
    return requiredPermissions.some(perm => userPermissions.includes(perm));
  }, [user]);

  const sidebarSections: SidebarSection[] = useMemo(() => {
    const allSections: SidebarSection[] = [
      {
        key: 'panel',
        label: 'Panel',
        icon: <FiCommand />,
        matchPaths: ['/app/panel/'],
        isOperational: true,
        items: [
          { path: "/app/panel/pos", label: "POS", icon: <FiShoppingCart />, featureKey: 'pos', requiredPermissions: ['pos.create_order', 'pos.edit_order'] },
          { path: "/app/panel/kitchen-display", label: "Kitchen Display", icon: <FiMonitor />, featureKey: 'kds', requiredPermissions: ['kitchen.display'] },
          { path: "/app/panel/customer-display", label: "Customer Display", icon: <FiTv />, featureKey: 'customerDisplay' },
          { path: "/app/mobile-scanner", label: "Mobile Scanner", icon: <FiLayout /> },
        ]
      },
      {
        key: 'operational',
        label: 'Operations',
        icon: <FiGrid />,
        matchPaths: ['/app/tables', '/app/reservations'],
        isOperational: true,
        isCloudKitchenHidden: true,
        featureKey: 'tables',
        items: [
          { path: "/app/tables", label: "Tables", icon: <FiGrid />, featureKey: 'tables' },
          { path: "/app/reservations", label: "Reservations", icon: <FiCalendar />, featureKey: 'reservations' },
        ]
      },
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        icon: <FiMessageSquare />,
        matchPaths: ['/app/whatsapp/'],
        isOperational: true,
        featureKey: 'whatsapp',
        items: [
          { path: "/app/whatsapp/order-menu", label: "Order Menu", icon: <FiShoppingCart />, featureKey: 'whatsapp' },
          { path: "/app/whatsapp/settings", label: "Settings", icon: <FiSettings />, featureKey: 'whatsapp' },
        ]
      },
      {
        key: 'item',
        label: 'Item Management',
        icon: <FiBox />,
        matchPaths: ['/app/item/', '/app/menu'],
        featureKey: 'menu',
        items: [
          { path: "/app/item/list-food-menu-category", label: "Food Categories", icon: <FiClipboard />, featureKey: 'menu', requiredPermissions: ['inventory.add_product', 'inventory.edit_product'] },
          { path: "/app/menu", label: "Food Menu", icon: <FiList />, featureKey: 'menu' },
          { path: "/app/item/list-pre-made-food", label: "Pre-Made Food", icon: <FiBox />, featureKey: 'menu' },
          { path: "/app/item/manage-addons", label: "Manage Add-ons", icon: <FiPlusCircle />, featureKey: 'menu' },
        ]
      },
      {
        key: 'stock',
        label: 'Stock Management',
        icon: <FiDatabase />,
        matchPaths: ['/app/stock/'],
        featureKey: 'inventory',
        items: [
          { path: "/app/stock/levels", label: "View Stock Levels", icon: <FiDatabase />, featureKey: 'inventory', requiredPermissions: ['inventory.view_reports'] },
          { path: "/app/stock/add-entry", label: "Add Stock Entry", icon: <FiArrowDownCircle />, featureKey: 'inventory', requiredPermissions: ['inventory.add_product'] },
          { path: "/app/stock/adjustments", label: "Stock Adjustments", icon: <FiTool />, featureKey: 'inventory', requiredPermissions: ['inventory.stock_adjustment'] },
          { path: "/app/stock/suppliers", label: "Manage Suppliers", icon: <FiUsers />, featureKey: 'inventory', requiredPermissions: ['inventory.add_product', 'inventory.edit_product'] },
          { path: "/app/stock/low-stock-report", label: "Low Stock Report", icon: <FiAlertTriangle />, featureKey: 'inventory', requiredPermissions: ['inventory.view_reports'] },
        ]
      },
      {
        key: 'sale',
        label: 'Sale & Customer',
        icon: <FiShoppingCart />,
        matchPaths: ['/app/sale', '/app/customer', '/app/customer-due-receive'],
        featureKey: 'customers',
        items: [
          { path: "/app/sale", label: "Sale History", icon: <FiActivity />, featureKey: 'customers', requiredPermissions: ['invoice.view'] },
          { path: "/app/customer", label: "Manage Customers", icon: <FiUsers />, featureKey: 'customers', requiredPermissions: ['customer.view', 'customer.edit'] },
          { path: "/app/customer-due-receive", label: "Customer Due Receive", icon: <FiDollarSign />, featureKey: 'customers', requiredPermissions: ['accounting.manage_payments'] },
        ]
      },
      {
        key: 'purchase',
        label: 'Purchase & Expense',
        icon: <FiCreditCard />,
        matchPaths: ['/app/purchase', '/app/supplier-due-payment', '/app/expense', '/app/waste'],
        featureKey: 'purchase',
        items: [
          { path: "/app/purchase", label: "List Purchases", icon: <FiShoppingCart />, featureKey: 'purchase' },
          { path: "/app/purchase/add", label: "Add New Purchase", icon: <FiPlusCircle />, featureKey: 'purchase' },
          { path: "/app/supplier-due-payment", label: "Supplier Due Payment", icon: <FiCreditCard />, featureKey: 'purchase' },
          { path: "/app/expense", label: "Expense Management", icon: <FiTrendingDown />, featureKey: 'purchase' },
          { path: "/app/waste", label: "Waste Management", icon: <FiTrash2 />, featureKey: 'purchase' },
        ]
      },
      {
        key: 'hr',
        label: 'Account & Employees',
        icon: <FiUsers />,
        matchPaths: ['/app/employees', '/app/account-user', '/app/attendance', '/app/payroll'],
        items: [
          { path: "/app/account-user", label: "Account and User", icon: <FiUsers />, requiredPermissions: ['users.view', 'users.create', 'users.edit'] },
          { path: "/app/employees", label: "Employees", icon: <FiUsers /> },
          { path: "/app/attendance", label: "Attendance", icon: <FiCalendar /> },
          { path: "/app/payroll", label: "Payroll", icon: <FiDollarSign /> },
        ]
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: <FiSettings />,
        matchPaths: ['/app/settings/'],
        items: [
          { path: "/app/settings/app-settings", label: "Application Settings", icon: <FiSettings />, requiredPermissions: ['settings.view', 'settings.edit'] },
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
        featureKey: 'selfOrder',
        items: [
          { path: "/app/self-order/enable-disable", label: "Enable/Disable", icon: <FiTool />, featureKey: 'selfOrder' },
          { path: "/app/self-order/qr-generator", label: "Table QR code Generator", icon: <FiGrid />, isCloudKitchenHidden: true, featureKey: 'selfOrder' },
          { path: "/app/self-order/receiving-user", label: "Order Receiving User", icon: <FiUsers />, featureKey: 'selfOrder' },
        ]
      },
      {
        key: 'website-settings',
        label: 'Website Order Setting',
        icon: <FiGlobe />,
        matchPaths: ['/app/website-settings/'],
        featureKey: 'website',
        items: [
          { path: "/app/website-settings/order-enable-disable", label: "Order Enable/Disable", featureKey: 'website' },
          { path: "/app/website-settings/order-receiving-user", label: "Order Receiving User", featureKey: 'website' },
          { path: "/app/website-settings/website-white-label", label: "Website White Label", featureKey: 'website' },
          { path: "/app/website-settings/home/content", label: "Homepage Content", featureKey: 'website' },
          { path: "/app/website-settings/home/add-photo", label: "Add Photo", featureKey: 'website' },
          { path: "/app/website-settings/home/list-photo", label: "List Photo", featureKey: 'website' },
          { path: "/app/website-settings/home/social-media", label: "Social Media", featureKey: 'website' },
          { path: "/app/website-settings/ai-website-builder", label: "AI Website Builder", featureKey: 'website' },
          { path: "/app/website-settings/available-online-foods", label: "Available Online Foods", featureKey: 'website' },
          { path: "/app/website-settings/about-us-content", label: "About Us Content", featureKey: 'website' },
          { path: "/app/website-settings/contact-us-content", label: "Contact Us Content", featureKey: 'website' },
          { path: "/app/website-settings/contact-list", label: "Contact List", featureKey: 'website' },
          { path: "/app/website-settings/common-menu-page", label: "Common Menu Page", featureKey: 'website' },
          { path: "/app/website-settings/social-login-setting", label: "Social Login Setting", featureKey: 'website' },
          { path: "/app/website-settings/email-setting", label: "Email Setting", featureKey: 'website' },
          { path: "/app/website-settings/payment-setting", label: "Payment Setting", featureKey: 'website' },
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

    // Filter out sections/items based on view mode and permissions
    return allSections
      .filter(section => isAggregateView ? !section.isOperational : true)
      .filter(section => !section.featureKey || hasPlanFeature(section.featureKey as any))
      .filter(section => hasPermission(section.requiredPermissions))
      .map(section => ({
        ...section,
        items: section.items.filter(item => (isCloudKitchen ? !item.isCloudKitchenHidden : true) && (!item.featureKey || hasPlanFeature(item.featureKey as any)) && hasPermission(item.requiredPermissions))
      }))
      .filter(section => section.items.length > 0);

  }, [isCloudKitchen, isAggregateView, hasPlanFeature, hasPermission]);

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

  const settingsSection = sidebarSections.find(section => section.key === 'settings');
  const saleCustomerSection = sidebarSections.find(section => section.key === 'sale');
  const sidebarSectionsWithoutSettings = sidebarSections.filter(section => section.key !== 'settings' && section.key !== 'sale');
  const sidebarSectionsOrdered = saleCustomerSection
    ? [saleCustomerSection, ...sidebarSectionsWithoutSettings]
    : sidebarSectionsWithoutSettings;

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [currentPath]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 md:z-0
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}
          bg-[#0b0f14] text-white p-4 space-y-2 shadow-2xl flex flex-col overflow-y-auto custom-scrollbar transition-all duration-300 border-r border-white/5 h-full
        `}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-white"
          >
            <FiChevronLeft size={24} />
          </button>
        </div>

        <div className="text-xl font-bold text-left text-white py-4 border-b border-white/10 mb-2 px-2 flex items-center">
          {isSidebarCollapsed ? (
            <img src="/logo.png" alt="RestoByte" className="h-8 w-auto" />
          ) : (
            <img src="/logo.png" alt="RestoByte" className="h-10 w-auto" />
          )}
        </div>
        <nav className="flex-grow space-y-1">
          <NavLink
            to="/app/dashboard"
            icon={<FiBarChart2 />}
            label="Dashboard"
            currentPath={currentPath}
            isCollapsed={isSidebarCollapsed}
            onCollapsedNavigate={() => {
              setIsSidebarCollapsed(false);
              setIsMobileSidebarOpen(false);
            }}
          />

          {sidebarSectionsOrdered.map(section => (
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
              isCollapsed={isSidebarCollapsed}
              onCollapsedNavigate={() => {
                setIsSidebarCollapsed(false);
                setIsMobileSidebarOpen(false);
              }}
            />
          ))}

          <div className="pt-4 border-t border-white/10">
            <NavLink
              to="/app/report"
              icon={<FiFileText />}
              label="Reports"
              currentPath={currentPath}
              isCollapsed={isSidebarCollapsed}
              onCollapsedNavigate={() => {
                setIsSidebarCollapsed(false);
                setIsMobileSidebarOpen(false);
              }}
            />
            <NavLink
              to="/app/send-sms"
              icon={<FiMessageSquare />}
              label="Send SMS"
              currentPath={currentPath}
              isCollapsed={isSidebarCollapsed}
              onCollapsedNavigate={() => {
                setIsSidebarCollapsed(false);
                setIsMobileSidebarOpen(false);
              }}
            />
            <NavLink
              to="/app/subscription"
              icon={<FiCreditCard />}
              label="Subscription"
              currentPath={currentPath}
              isCollapsed={isSidebarCollapsed}
              onCollapsedNavigate={() => {
                setIsSidebarCollapsed(false);
                setIsMobileSidebarOpen(false);
              }}
            />
            <NavLink
              to="/app/outlet-setting"
              icon={<FiTool />}
              label="Outlet Setting"
              currentPath={currentPath}
              isCollapsed={isSidebarCollapsed}
              onCollapsedNavigate={() => {
                setIsSidebarCollapsed(false);
                setIsMobileSidebarOpen(false);
              }}
            />
            {settingsSection && (
              <CollapsibleSidebarSection
                name="settings"
                label={settingsSection.label}
                icon={settingsSection.icon}
                items={settingsSection.items}
                isOpen={openMenuKey === 'settings'}
                isSectionActive={activeMenuKey === 'settings'}
                onClick={() => handleMenuClick('settings')}
                currentPath={currentPath}
                isCollapsed={isSidebarCollapsed}
                onCollapsedNavigate={() => {
                  setIsSidebarCollapsed(false);
                  setIsMobileSidebarOpen(false);
                }}
              />
            )}
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={currentPageLabel}
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setIsMobileSidebarOpen(v => !v);
            } else {
              setIsSidebarCollapsed(v => !v);
            }
          }}
          isSidebarCollapsed={isSidebarCollapsed || isMobileSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default RestaurantLayout;
