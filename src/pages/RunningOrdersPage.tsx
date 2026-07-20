import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { isNative, vibrate } from '../utils/capacitorService';
import { FiActivity, FiUser, FiClock, FiGrid, FiShoppingCart, FiBell } from 'react-icons/fi';
import Money from '../components/common/Money';

interface RunningOrdersPageProps {}

const timeSince = (dateString?: string) => {
  if (!dateString) return '';
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const i = (n: number) => Math.floor(seconds / n);
  if (i(31536000) > 1) return `${i(31536000)}y ago`;
  if (i(2592000) > 1) return `${i(2592000)}m ago`;
  if (i(86400) > 1) return `${i(86400)}d ago`;
  if (i(3600) > 1) return `${i(3600)}h ago`;
  if (i(60) > 1) return `${i(60)}m ago`;
  return `${seconds}s ago`;
};

const RunningOrdersPage: React.FC<RunningOrdersPageProps> = () => {
  const navigate = useNavigate();
  const { sales, tables, reservations } = useRestaurantData();

  const runningOrders = useMemo(
    () =>
      (sales || [])
        .filter((s: any) => s.assignedTableId && !(s.isClosed ?? s.isSettled))
        .sort((a: any, b: any) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()),
    [sales]
  );

  const assistanceRequests = useMemo(
    () => (tables || []).filter((t: any) => t.assistanceRequested),
    [tables]
  );

  const todaysReservations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (reservations || [])
      .filter((r: any) => new Date(r.dateTime) >= today)
      .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [reservations]);

  const openOrder = (tableId?: string) => {
    vibrate();
    if (tableId) navigate(`/app/panel/pos/${tableId}`);
    else navigate('/app/panel/pos');
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {!isNative && (
        <header className="bg-white shadow-sm p-4 flex items-center z-20 flex-shrink-0">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            <FiActivity className="mr-3 text-sky-600" /> Running Orders
          </h1>
        </header>
      )}

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Running Orders */}
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
                <button
                  key={order.id}
                  onClick={() => openOrder(order.assignedTableId)}
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
                        {timeSince(order.saleDate)}
                      </div>
                    </div>
                  </div>
                  <div className="rb-ro-amount"><Money amount={order.totalAmount} /></div>
                </button>
              ))}
            </div>
          ) : (
            <p className="rb-ro-empty">No active orders at the moment.</p>
          )}
        </section>

        {/* Waiter Requests */}
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
                <button
                  key={table.id}
                  onClick={() => openOrder(table.id)}
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
                        {timeSince(table.assistanceRequestedAt)}
                      </div>
                    </div>
                  </div>
                  <span className="rb-ro-tag">Assist</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rb-ro-empty">No active requests.</p>
          )}
        </section>

        {/* Upcoming Reservations */}
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
                <button
                  key={res.id}
                  onClick={() => navigate('/app/reservations')}
                  className="rb-ro-card"
                >
                  <div className="rb-ro-card-left">
                    <span className="rb-ro-icon rb-ro-icon-emerald"><FiUser size={18} /></span>
                    <div className="min-w-0">
                      <div className="rb-ro-title">{res.customerName}</div>
                      <div className="rb-ro-sub">Pax: {res.partySize}</div>
                    </div>
                  </div>
                  <span className="rb-ro-time">
                    {new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
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
