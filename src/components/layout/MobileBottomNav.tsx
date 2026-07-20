import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiGrid, FiList, FiShoppingCart, FiMoreHorizontal,
  FiFileText, FiUsers, FiDatabase, FiSettings, FiCreditCard,
  FiTool, FiLogOut, FiX, FiActivity, FiClipboard, FiBox, FiPlusCircle, FiBell,
} from 'react-icons/fi';
import { isNative } from '../../utils/capacitorService';
import { useMobile } from '../../hooks/useMobileApp';
import { useAuth } from '../../hooks/useAuth';
import { useRestaurantData } from '../../hooks/useRestaurantData';

// Primary tabs always visible on the bar.
// Note: the "Menu" tab is the POS (order-taking) screen. The food-menu
// management list ("Order") lives in the More sheet's Item Management group.
const PRIMARY_TABS = [
  { key: 'home',       label: 'Home',        path: '/app/dashboard',     icon: FiHome },
  { key: 'table',      label: 'Table',        path: '/app/tables',        icon: FiGrid },
  { key: 'menu',       label: 'Menu',         path: '/app/panel/pos',     icon: FiShoppingCart },
  { key: 'running',    label: 'Running',      path: '/app/running-orders', icon: FiActivity },
] as const;

// Secondary items shown when the "More" sheet is open.
// "Item Management" carries nested sub-items (Food Menu and friends) so the
// food-management screens are grouped together instead of scattered as tiles.
const MORE_ITEMS = [
  { label: 'Reports',      path: '/app/report',                  icon: FiFileText },
  { label: 'Sale History', path: '/app/sale',                     icon: FiCreditCard },
  { label: 'Customers',    path: '/app/customer',                 icon: FiUsers },
  { label: 'Stock',        path: '/app/stock/levels',             icon: FiDatabase },
  { label: 'Purchase',     path: '/app/purchase',                icon: FiShoppingCart },
  { label: 'Employees',    path: '/app/employees',               icon: FiUsers },
  {
    label: 'Item Management',
    path: '/app/item/list-food-menu-category',
    icon: FiList,
    items: [
      { label: 'Food Menu',        path: '/app/menu',                                icon: FiList },
      { label: 'Food Categories',  path: '/app/item/list-food-menu-category',        icon: FiClipboard },
      { label: 'Pre-Made Food',    path: '/app/item/list-pre-made-food',             icon: FiBox },
      { label: 'Manage Add-ons',   path: '/app/item/manage-addons',                  icon: FiPlusCircle },
    ],
  },
  { label: 'Waiter Calls', path: '/app/panel/pos',                icon: FiBell },
  { label: 'Settings',     path: '/app/settings/app-settings',   icon: FiSettings },
  { label: 'Outlet',       path: '/app/outlet-setting',          icon: FiTool },
  { label: 'Subscription', path: '/app/subscription',            icon: FiCreditCard },
] as const;

const MoreSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sheetRef = useRef<HTMLDivElement>(null);
  const { sales, tables, reservations } = useRestaurantData();

  // Live notification counts for the More-sheet tiles.
  const runningCount = (sales || []).filter((s: any) => s.assignedTableId && !(s.isClosed ?? s.isSettled)).length;
  const waiterCount = (tables || []).filter((t: any) => t.assistanceRequested).length;
  const reservationCount = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (reservations || []).filter((r: any) => new Date(r.dateTime) >= today).length;
  })();

  const tileBadges: Record<string, number> = {
    '/app/sale': runningCount,
    '/app/reservations': reservationCount,
    '/app/panel/pos': waiterCount,
  };

  // Close on hardware/browser back button while sheet is open.
  useEffect(() => {
    if (!open) return;
    const onPop = () => onClose();
    window.addEventListener('popstate', onPop);
    window.history.pushState({ rbMoreSheet: true }, '');
    return () => {
      window.removeEventListener('popstate', onPop);
      if (window.history.state?.rbMoreSheet) window.history.back();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="rb-bottom-sheet-root" role="dialog" aria-modal="true">
      <div className="rb-bottom-sheet-backdrop" onClick={onClose} />
      <div ref={sheetRef} className="rb-bottom-sheet">
        <div className="rb-bottom-sheet-handle" />
        <div className="rb-bottom-sheet-header">
          <span className="text-base font-semibold text-gray-800">More</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <FiX size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="rb-bottom-sheet-body">
          <div className="grid grid-cols-3 gap-2">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const hasSub = (item as any).items?.length;
              const badge = tileBadges[item.path];
              if (!hasSub) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className="rb-more-tile"
                  >
                    <div className="rb-more-tile-icon">
                      <Icon size={20} />
                      {badge ? <span className="rb-more-badge">{badge > 9 ? '9+' : badge}</span> : null}
                    </div>
                    <span className="rb-more-tile-label">{item.label}</span>
                  </button>
                );
              }
              // Item Management tile + nested sub-items rendered as a grouped block.
              return (
                <div key={item.path} className="rb-more-group">
                  <button
                    onClick={() => handleNavigate(item.path)}
                    className="rb-more-tile"
                  >
                    <div className="rb-more-tile-icon">
                      <Icon size={20} />
                    </div>
                    <span className="rb-more-tile-label">{item.label}</span>
                  </button>
                  <div className="rb-more-subgrid">
                    {(item as any).items.map((sub: any) => {
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.path}
                          onClick={() => handleNavigate(sub.path)}
                          className="rb-more-subtile"
                        >
                          <SubIcon size={15} />
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rb-more-user">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=0ea5e9&color=fff&size=64`}
              alt="avatar"
              className="w-11 h-11 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.username || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.username}@restobyte.app</p>
            </div>
            <button
              onClick={() => { onClose(); logout(); }}
              className="rb-more-logout"
              aria-label="Logout"
            >
              <FiLogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
        <div className="rb-bottom-sheet-safe" />
      </div>
    </div>
  );
};

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { haptic } = useMobile();
  const [moreOpen, setMoreOpen] = useState(false);

  // Determine which primary tab is active (by prefix match so sub-routes highlight the parent).
  const activeKey = (() => {
    const path = location.pathname;
    // Dashboard is exact — every other /app/* should still highlight Home only when exactly /app/dashboard or /app/home.
    if (path === '/app/dashboard' || path === '/app/home') return 'home';
    if (path.startsWith('/app/tables')) return 'table';
    if (path.startsWith('/app/panel/pos')) return 'menu';
    if (path.startsWith('/app/running-orders')) return 'running';
    return null;
  })();

  const handleTap = (path: string) => {
    haptic?.('light');
    // Don't re-navigate if we're already on the exact same path.
    if (location.pathname !== path) navigate(path);
  };

  const handleMoreTap = () => {
    haptic?.('medium');
    setMoreOpen(true);
  };

  // Don't render on web. This component is mounted unconditionally inside RestaurantLayout,
  // but it should only show its content on the native mobile app.
  if (!isNative) return null;

  return (
    <>
      <nav className="rb-bottom-nav" role="navigation" aria-label="Primary">
        <div className="rb-bottom-nav-inner">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeKey === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTap(tab.path)}
                className={`rb-bottom-tab ${active ? 'rb-bottom-tab-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="rb-bottom-tab-indicator" />
                <span className="rb-bottom-tab-icon">
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className="rb-bottom-tab-label">{tab.label}</span>
              </button>
            );
          })}
          {/* More — opens the slide-up sheet */}
          <button
            onClick={handleMoreTap}
            className={`rb-bottom-tab ${moreOpen ? 'rb-bottom-tab-active' : ''}`}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            <span className="rb-bottom-tab-indicator" />
            <span className="rb-bottom-tab-icon">
              <FiMoreHorizontal size={22} strokeWidth={moreOpen ? 2.4 : 2} />
            </span>
            <span className="rb-bottom-tab-label">More</span>
          </button>
        </div>
        <div className="rb-bottom-nav-safe" />
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
};

export default MobileBottomNav;
