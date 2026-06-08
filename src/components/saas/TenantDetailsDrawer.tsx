import React, { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import Card from '@/components/common/Card';
import { API_BASE_URL } from '@/config';
import { FiClock, FiCreditCard, FiFileText, FiMapPin, FiMonitor } from 'react-icons/fi';

interface Props {
  tenantId: string | null;
  onClose: () => void;
}

const TenantDetailsDrawer: React.FC<Props> = ({ tenantId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  const formatMoney = (amount?: number | null) => {
    const currencyCode = data?.currencyCode || 'NPR';
    const safeAmount = typeof amount === 'number' ? amount : 0;
    return `${currencyCode === 'NPR' ? 'Rs' : currencyCode} ${safeAmount.toFixed(2)}`;
  };

  useEffect(() => {
    const run = async () => {
      if (!tenantId) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}/details`);
        if (!res.ok) throw new Error('Failed to load');
        const d = await res.json();
        setData(d);
      } catch {
        setError('Failed to load tenant details.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tenantId]);

  return (
    <Modal isOpen={!!tenantId} onClose={onClose} title="Tenant Details" size="2xl">
      {loading && <div className="p-4 text-gray-500">Loading...</div>}
      {error && <div className="p-2 text-red-600">{error}</div>}
      {data && (
        <div className="space-y-4">
          <Card title="Overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
              <div className="rounded-lg bg-sky-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-sky-700">Users</div>
                <div className="text-2xl font-bold text-sky-900">{data.users?.length || 0}</div>
              </div>
              <div className="rounded-lg bg-emerald-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-emerald-700">Outlets</div>
                <div className="text-2xl font-bold text-emerald-900">{data.outlets?.length || 0}</div>
              </div>
              <div className="rounded-lg bg-amber-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-amber-700">Invoices</div>
                <div className="text-2xl font-bold text-amber-900">{data.invoiceHistory?.length || 0}</div>
              </div>
              <div className="rounded-lg bg-violet-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-violet-700">Login Events</div>
                <div className="text-2xl font-bold text-violet-900">{data.loginHistory?.length || 0}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold">Name:</span> {data.name}</div>
              <div><span className="font-semibold">Plan:</span> {data.plan}</div>
              <div><span className="font-semibold">Status:</span> {data.subscriptionStatus}</div>
              <div><span className="font-semibold">Joining Date:</span> {formatDate(data.createdAt)}</div>
              <div><span className="font-semibold">Phone:</span> {data.phone || '-'}</div>
              <div><span className="font-semibold">Address:</span> {data.address || '-'}</div>
              <div><span className="font-semibold">Country:</span> {data.countryCode || '-'}</div>
              <div><span className="font-semibold">Currency:</span> {data.currencyCode || 'NPR'}</div>
              <div><span className="font-semibold">Trial Days:</span> {data.trialDays ?? '-'}</div>
              <div><span className="font-semibold">Trial Ends:</span> {formatDate(data.trialEndsAt)}</div>
            </div>
          </Card>

          <Card title="Active Devices" icon={<FiMonitor />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2">Device</th>
                    <th className="text-left py-2">IP Address</th>
                    <th className="text-left py-2">Users</th>
                    <th className="text-left py-2">Total Logins</th>
                    <th className="text-left py-2">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {data.devices?.length ? data.devices.map((device: any) => (
                    <tr key={device.id} className="border-t align-top">
                      <td className="py-2">
                        <div className="font-medium text-gray-900">{device.deviceLabel}</div>
                        <div className="text-xs text-gray-500 break-all">{device.userAgent || '-'}</div>
                      </td>
                      <td className="py-2">{device.ipAddress || '-'}</td>
                      <td className="py-2">{Array.isArray(device.usernames) && device.usernames.length ? device.usernames.join(', ') : '-'}</td>
                      <td className="py-2">{device.totalLogins || 0}</td>
                      <td className="py-2">{formatDate(device.lastLoginAt)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-2 text-gray-500">No device activity found yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Login History" icon={<FiMapPin />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2">Date & Time</th>
                    <th className="text-left py-2">Username</th>
                    <th className="text-left py-2">IP Address</th>
                    <th className="text-left py-2">Device</th>
                    <th className="text-left py-2">Login Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.loginHistory?.length ? data.loginHistory.map((entry: any) => (
                    <tr key={entry.id} className="border-t align-top">
                      <td className="py-2">{formatDate(entry.createdAt)}</td>
                      <td className="py-2">{entry.username}</td>
                      <td className="py-2">{entry.ipAddress || '-'}</td>
                      <td className="py-2">
                        <div>{entry.deviceLabel || '-'}</div>
                        <div className="text-xs text-gray-500 break-all">{entry.userAgent || '-'}</div>
                      </td>
                      <td className="py-2 capitalize">{entry.loginType || '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-2 text-gray-500">No login history found yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Invoice History" icon={<FiFileText />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2">Invoice</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoiceHistory?.length ? data.invoiceHistory.map((invoice: any) => (
                    <tr key={invoice.id} className="border-t">
                      <td className="py-2 font-medium">{invoice.invoiceNumber}</td>
                      <td className="py-2">{formatDate(invoice.issuedAt || invoice.createdAt)}</td>
                      <td className="py-2">{formatMoney(invoice.amount)}</td>
                      <td className="py-2">{invoice.method || '-'}</td>
                      <td className="py-2 capitalize">{invoice.status || '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-2 text-gray-500">No invoices found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Payment History" icon={<FiCreditCard />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Invoice</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments?.length ? data.payments.map((p: any, i: number) => (
                    <tr key={p.id || i} className="border-t">
                      <td className="py-2">{formatDate(p.createdAt)}</td>
                      <td className="py-2 font-medium">{p.invoiceNumber || '-'}</td>
                      <td className="py-2">{formatMoney(p.amount)}</td>
                      <td className="py-2">{p.method || '-'}</td>
                      <td className="py-2 capitalize">{p.status}</td>
                      <td className="py-2">{p.notes || '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="py-2 text-gray-500">No payments found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Outlets" icon={<FiClock />}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Phone</th>
                  <th className="text-left py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.outlets?.map((o: any) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2">{o.name}</td>
                    <td className="py-2">{o.phone || '-'}</td>
                    <td className="py-2">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Admin Users">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2">Username</th>
                  <th className="text-left py-2">Active</th>
                  <th className="text-left py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.users?.map((u: any) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2">{u.username}</td>
                    <td className="py-2">{u.isActive ? 'Yes' : 'No'}</td>
                    <td className="py-2">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default TenantDetailsDrawer;
