import React, { useMemo, useEffect, useState, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantDataFields } from '../hooks/useRestaurantData';
import { isNative, vibrate } from '../utils/capacitorService';
import { FiUser, FiClock, FiGrid, FiShoppingCart, FiBell, FiRefreshCw } from 'react-icons/fi';
import Money from '../components/common/Money';
import { API_BASE_URL } from '../config';
import { useAuth } from '../hooks/useAuth';

interface RunningOrdersPageProps {}

const stableStr = (v: unknown): string => {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStr).join(',') + ']';
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStr((v as Record<string, unknown>)[k])).join(',') + '}';
};
const deepEq = (a: unknown, b: unknown): boolean => stableStr(a) === stableStr(b);

const timeSince = (dateString?: string, nowMs: number = Date.now()) => {
  if (!dateString) return '';
  const seconds = Math.floor((nowMs - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const i = (n: number) => Math.floor(seconds / n);
  if (i(31536000) > 1) return `${i(31536000)}y ago`;
  if (i(2592000) > 1) return `${i(2592000)}m ago`;
  if (i(86400) > 1) return `${i(86400)}d ago`;
  if (i(3600) > 1) return `${i(3600)}h ago`;
  if (i(60) > 1) return `${i(60)}m ago`;
  return `${seconds}s ago`;
};

interface RunningOrderCardProps {
  order: any;
  nowMs: number;
  onOpen: (tableId?: string) => void;
}

const areRunningOrderPropsEqual = (p: RunningOrderCardProps, n: RunningOrderCardProps) => {
  if (p.onOpen !== n.onOpen) return false;
  if (Math.floor(p.nowMs / 60000) !== Math.floor(n.nowMs / 60000)) return false;
  return deepEq(p.order, n.order);
};

const RunningOrderCard = memo<RunningOrderCardProps>(({ order, nowMs, onOpen }) => {
  const age = useMemo(() => timeSince(order.saleDate, nowMs), [order.saleDate, nowMs]);
  return (
    <button
      key={order.id}
      onClick={() => onOpen(order.assignedTableId)}
      className="rb-ro-card"
    >
      <div className="rb-ro-card-left">
        <span className="rb-ro-icon"><FiShoppingCart size={18} /></span>
        <div className="min-w-0">
          <div className="rb-ro-title">
            <FiGrid size={14} className="rb-ro-title-icon" />
            {order.assignedTableName}
          </div>
          <div className="rb-ro-sub">
            <FiUser size={12} className="inline mr-1" />
            {order.customerName || 'Walk-in'}
            <span className="rb-ro-dot">•</span>
            <FiClock size={12} className="inline mr-1" />
            {age}
          </div>
        </div>
      </div>
      <div className="rb-ro-amount"><Money amount={order.totalAmount} /></div>
    </button>
  );
}, areRunningOrderPropsEqual);
RunningOrderCard.displayName = 'RunningOrderCard';

interface WaiterRequestCardProps {
  table: any;
  nowMs: number;
  onOpen: (tableId?: string) => void;
}

const areWaiterPropsEqual = (p: WaiterRequestCardProps, n: WaiterRequestCardProps) => {
  if (p.onOpen !== n.onOpen) return false;
  if (Math.floor(p.nowMs / 60000) !== Math.floor(n.nowMs / 60000)) return false;
  return deepEq(p.table, n.table);
};

const WaiterRequestCard = memo<WaiterRequestCardProps>(({ table, nowMs, onOpen }) => {
  const age = useMemo(() => timeSince(table.assistanceRequestedAt, nowMs), [table.assistanceRequestedAt, nowMs]);
  return (
    <button
      key={table.id}
      onClick={() => onOpen(table.id)}
      className="rb-ro-card"
    >
      <div className="rb-ro-card-left">
        <span className="rb-ro-icon rb-ro-icon-amber"><FiBell size={18} /></span>
        <div className="min-w-0">
          <div className="rb-ro-title">
            <FiGrid size={14} className="rb-ro-title-icon" />
            {table.name}
          </div>
          <div className="rb-ro-sub">
            <FiClock size={12} className="inline mr-1" />
            {age}
          </div>
        </div>
      </div>
      <span className="rb-ro-tag">Assist</span>
    </button>
  );
}, areWaiterPropsEqual);
WaiterRequestCard.displayName = 'WaiterRequestCard';

interface ReservationCardProps {
  reservation: any;
  onNavigate: () => void;
}

const areReservationPropsEqual = (p: ReservationCardProps, n: ReservationCardProps) => {
  if (p.onNavigate !== n.onNavigate) return false;
  return deepEq(p.reservation, n.reservation);
};

const ReservationCard = memo<ReservationCardProps>(({ reservation, onNavigate }) => {
  const timeStr = useMemo(
    () => new Date(reservation.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [reservation.dateTime]
  );
  return (
    <button
      key={reservation.id}
      onClick={onNavigate}
      className="rb-ro-card"
    >
      <div className="rb-ro-card-left">
        <span className="rb-ro-icon rb-ro-icon-emerald"><FiUser size={18} /></span>
        <div className="min-w-0">
          <div className="rb-ro-title">{reservation.customerName}</div>
          <div className="rb-ro-sub">Pax: {reservation.partySize}</div>
        </div>
      </div>
      <span className="rb-ro-time">{timeStr}</span>
    </button>
  );
}, areReservationPropsEqual);
ReservationCard.displayName = 'ReservationCard';

const RunningOrdersPage: React.FC<RunningOrdersPageProps> = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { sales: contextSales, tables: contextTables, reservations: contextReservations, activeOutletIds } = useRestaurantDataFields([
    'sales', 'tables', 'reservations', 'activeOutletIds'
  ] as const) as any;

  const [localSales, setLocalSalesState] = useState(contextSales);
  const [localTables, setLocalTablesState] = useState(contextTables);
  const [localReservations] = useState(contextReservations);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const pollingRef = useRef<boolean>(false);

  const setLocalSales = useCallback((next: any) => {
    setLocalSalesState((prev: any) => deepEq(prev, next) ? prev : next);
  }, []);
  const setLocalTables = useCallback((next: any) => {
    setLocalTablesState((prev: any) => deepEq(prev, next) ? prev : next);
  }, []);

  const fetchSalesLocal = useCallback(async () => {
    if (!isAuthenticated) { setLocalSales([]); return; }
    const token = localStorage.getItem('authToken');
    if (!token || activeOutletIds.length === 0) { setLocalSales([]); return; }
    try {
      const results = await Promise.all(activeOutletIds.map((outletId: string) =>
        fetch(`${API_BASE_URL}/orders?outletId=${encodeURIComponent(outletId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(async (res) => {
          if (res.status === 401) { logout(); return []; }
          if (!res.ok) return [];
          return res.json().catch(() => []);
        })
      ));
      const flat = results.flat().filter(Boolean);
      setLocalSales(flat);
    } catch (err) {
      console.error("Failed to fetch sales:", err);
      setLocalSales([]);
    }
  }, [isAuthenticated, activeOutletIds, logout, setLocalSales]);

  const fetchTablesLocal = useCallback(async () => {
    if (!isAuthenticated) { setLocalTables([]); return; }
    const token = localStorage.getItem('authToken');
    if (!token || activeOutletIds.length === 0) { setLocalTables([]); return; }
    try {
      const results = await Promise.all(activeOutletIds.map((outletId: string) =>
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
      setLocalTables(deduped);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
      setLocalTables([]);
    }
  }, [isAuthenticated, activeOutletIds, logout, setLocalTables]);

  const refreshData = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      await Promise.all([fetchSalesLocal(), fetchTablesLocal()]);
      setLastUpdated(prev => {
        const n = new Date();
        return prev && Math.abs(n.getTime() - prev.getTime()) < 1000 ? prev : n;
      });
    } catch (err) {
      console.error('refreshData failed:', err);
    } finally {
      pollingRef.current = false;
    }
  }, [fetchSalesLocal, fetchTablesLocal]);

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  useEffect(() => {
    let active = true;
    const tick = setInterval(() => {
      if (!active) return;
      refreshData();
      const nowN = Date.now();
      setNow(prev => (Math.floor(prev / 60000) !== Math.floor(nowN / 60000) ? nowN : prev));
    }, 15000);
    const clock = setInterval(() => {
      const nowN = Date.now();
      setNow(prev => (Math.floor(prev / 60000) !== Math.floor(nowN / 60000) ? nowN : prev));
    }, 15000);
    refreshData();
    return () => { active = false; clearInterval(tick); clearInterval(clock); };
  }, [refreshData]);

  const runningOrders = useMemo(
    () =>
      (localSales || [])
        .filter((s: any) => s.assignedTableId && !(s.isClosed ?? s.isSettled))
        .sort((a: any, b: any) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()),
    [localSales]
  );

  const assistanceRequests = useMemo(
    () => (localTables || []).filter((t: any) => t.assistanceRequested),
    [localTables]
  );

  const todaysReservations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (localReservations || [])
      .filter((r: any) => new Date(r.dateTime) >= today)
      .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [localReservations]);

  const openOrder = useCallback((tableId?: string) => {
    vibrate();
    if (tableId) navigate(`/app/panel/pos/${tableId}`);
    else navigate('/app/panel/pos');
  }, [navigate]);

  const openReservations = useCallback(() => navigate('/app/reservations'), [navigate]);

  const updatedAgo = useMemo(() => {
    if (!lastUpdated) return '';
    const secs = Math.max(0, Math.floor((now - new Date(lastUpdated).getTime()) / 1000));
    if (secs < 2) return 'just now';
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ago`;
  }, [lastUpdated, now]);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <header className="rb-live-header">
        <div className="rb-live-title">
          <span className="rb-live-dot" />
          <span className="rb-live-title-text">Live Orders</span>
          {!isNative && <span className="rb-live-sub">Running Orders</span>}
        </div>
        <div className="rb-live-meta">
          <span className="rb-live-updated">{updatedAgo ? `Updated ${updatedAgo}` : ''}</span>
          <button
            onClick={doRefresh}
            className={`rb-live-refresh ${refreshing ? 'rb-live-refresh-spin' : ''}`}
            aria-label="Refresh now"
          >
            <FiRefreshCw size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Running Orders</h2>
            {runningOrders.length > 0 && (
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                {runningOrders.length}
              </span>
            )}
          </div>

          {runningOrders.length > 0 ? (
            <div className="space-y-3">
              {runningOrders.map((order: any) => (
                <RunningOrderCard key={order.id} order={order} nowMs={now} onOpen={openOrder} />
              ))}
            </div>
          ) : (
            <p className="rb-ro-empty">No active orders at the moment.</p>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Waiter Requests</h2>
            {assistanceRequests.length > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {assistanceRequests.length}
              </span>
            )}
          </div>

          {assistanceRequests.length > 0 ? (
            <div className="space-y-3">
              {assistanceRequests.map((table: any) => (
                <WaiterRequestCard key={table.id} table={table} nowMs={now} onOpen={openOrder} />
              ))}
            </div>
          ) : (
            <p className="rb-ro-empty">No active requests.</p>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Upcoming Reservations</h2>
            {todaysReservations.length > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {todaysReservations.length}
              </span>
            )}
          </div>

          {todaysReservations.length > 0 ? (
            <div className="space-y-3">
              {todaysReservations.map((res: any) => (
                <ReservationCard key={res.id} reservation={res} onNavigate={openReservations} />
              ))}
            </div>
          ) : (
            <p className="rb-ro-empty">No upcoming reservations.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default RunningOrdersPage;
