import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiBell, FiCalendar, FiAlertCircle, FiGlobe, FiActivity, FiX } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useRestaurantData } from '../../hooks/useRestaurantData';

interface MobilePageHeaderProps {
  title: string;
}

/**
 * Compact top bar shown ONLY on the native mobile app (the full web <Header>
 * is hidden on native — the bottom nav already handles navigation, so we just
 * need a small, glanceable title + quick action icons + user menu).
 *
 * The bell doubles as a notification hub: tapping it opens a popover that
 * breaks active notifications down by category (Waiter Calls, Online Orders,
 * Running Orders, Reservations) with live counts and one-tap navigation.
 */
const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { sales, tables, reservations } = useRestaurantData();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // ----- Notification counts -----
  const runningOrders = useMemo(
    () => (sales || []).filter((s: any) => s.assignedTableId && !(s.isClosed ?? s.isSettled)),
    [sales]
  );
  const waiterCalls = useMemo(
    () => (tables || []).filter((t: any) => t.assistanceRequested),
    [tables]
  );
  // Online orders = remote (non dine-in) unsettled orders.
  const onlineOrders = useMemo(
    () => (sales || []).filter(
      (s: any) => !s.isClosed && !s.isSettled && (s.orderType === 'Delivery' || s.orderType === 'Pickup')
    ),
    [sales]
  );
  const reservationCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (reservations || []).filter((r: any) => new Date(r.dateTime) >= today).length;
  }, [reservations]);

  const totalNotifications = runningOrders.length + waiterCalls.length + onlineOrders.length + reservationCount;

  // Close the popover on outside tap / back.
  useEffect(() => {
    if (!notifOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notifOpen]);

  const go = (path: string) => {
    setNotifOpen(false);
    navigate(path);
  };

  const notifItems = [
    { key: 'waiter', label: 'Waiter Calls', count: waiterCalls.length, icon: <FiAlertCircle />, path: '/app/panel/pos', color: 'text-red-600 bg-red-50' },
    { key: 'online', label: 'Online Orders', count: onlineOrders.length, icon: <FiGlobe />, path: '/app/running-orders', color: 'text-amber-600 bg-amber-50' },
    { key: 'running', label: 'Running Orders', count: runningOrders.length, icon: <FiActivity />, path: '/app/running-orders', color: 'text-sky-600 bg-sky-50' },
    { key: 'resv', label: 'Reservations', count: reservationCount, icon: <FiCalendar />, path: '/app/reservations', color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="rb-mobile-header safe-top">
      <div className="rb-mobile-header-row">
        <div className="rb-mobile-header-title">{title}</div>
        <div className="rb-mobile-header-actions">
          {/* Notification hub trigger */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(o => !o)}
              className="rb-mobile-header-icon"
              aria-label="Notifications"
            >
              <FiBell size={18} />
              {totalNotifications > 0 && (
                <span className="rb-mobile-header-badge">{totalNotifications > 9 ? '9+' : totalNotifications}</span>
              )}
            </button>

            {notifOpen && (
              <div className="rb-notif-popover">
                <div className="rb-notif-popover-head">
                  <span className="font-semibold text-gray-800">Notifications</span>
                  <button onClick={() => setNotifOpen(false)} className="rb-notif-popover-close" aria-label="Close">
                    <FiX size={16} />
                  </button>
                </div>
                <div className="rb-notif-popover-body">
                  {notifItems.map(item => {
                    const active = item.count > 0;
                    return (
                      <button
                        key={item.key}
                        disabled={!active}
                        onClick={() => go(item.path)}
                        className={`rb-notif-row ${active ? '' : 'rb-notif-row-empty'}`}
                      >
                        <span className={`rb-notif-row-icon ${item.color}`}>{item.icon}</span>
                        <span className="rb-notif-row-label">{item.label}</span>
                        <span className={`rb-notif-row-count ${active ? 'rb-notif-row-count-active' : ''}`}>
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/app/reservations')}
            className="rb-mobile-header-icon"
            aria-label="Reservations"
          >
            <FiCalendar size={18} />
            {reservationCount > 0 && (
              <span className="rb-mobile-header-badge rb-mobile-header-badge-cal">{reservationCount > 9 ? '9+' : reservationCount}</span>
            )}
          </button>
          <div className="rb-mobile-header-user" onClick={() => navigate('/app/account-user')}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=0ea5e9&color=fff&size=36`}
              alt="User"
              className="rb-mobile-header-avatar"
            />
          </div>
          <button
            onClick={logout}
            className="rb-mobile-header-icon"
            aria-label="Logout"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilePageHeader;
