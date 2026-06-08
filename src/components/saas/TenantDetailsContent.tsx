import React, { useEffect, useState } from 'react';
import Card from '@/components/common/Card';
import { API_BASE_URL } from '@/config';
import Button from '@/components/common/Button';
import { FiBell, FiClock, FiCreditCard, FiDownload, FiFileText, FiMapPin, FiMonitor } from 'react-icons/fi';

interface Props {
  tenantId: string;
}

const TenantDetailsContent: React.FC<Props> = ({ tenantId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reminderLoadingId, setReminderLoadingId] = useState<string | null>(null);

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  const formatMoney = (amount?: number | null) => {
    const currencyCode = data?.currencyCode || 'NPR';
    const safeAmount = typeof amount === 'number' ? amount : 0;
    return `${currencyCode === 'NPR' ? 'Rs' : currencyCode} ${safeAmount.toFixed(2)}`;
  };

  const downloadDocument = (filename: string, title: string, bodyHtml: string) => {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
      .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 24px; max-width: 760px; margin: 0 auto; }
      h1 { margin: 0 0 16px; font-size: 28px; }
      .meta { margin-bottom: 20px; color: #4b5563; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
      td:first-child { width: 220px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      ${bodyHtml}
    </div>
  </body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadInvoice = (invoice: any) => {
    downloadDocument(
      `${invoice.invoiceNumber || 'invoice'}.html`,
      `Invoice ${invoice.invoiceNumber || ''}`.trim(),
      `<div class="meta">Tenant: ${data?.name || '-'}<br />Billing Email: ${data?.adminEmail || '-'}<br />Issued At: ${formatDate(invoice.issuedAt || invoice.createdAt)}</div>
      <table>
        <tr><td>Invoice Number</td><td>${invoice.invoiceNumber || '-'}</td></tr>
        <tr><td>Amount</td><td>${formatMoney(invoice.amount)}</td></tr>
        <tr><td>Status</td><td>${invoice.status || '-'}</td></tr>
        <tr><td>Method</td><td>${invoice.method || '-'}</td></tr>
        <tr><td>Notes</td><td>${invoice.notes || '-'}</td></tr>
      </table>`
    );
  };

  const handleDownloadReceipt = (payment: any) => {
    downloadDocument(
      `${payment.invoiceNumber || payment.id || 'payment-receipt'}-receipt.html`,
      `Payment Receipt ${payment.invoiceNumber || ''}`.trim(),
      `<div class="meta">Tenant: ${data?.name || '-'}<br />Billing Email: ${data?.adminEmail || '-'}<br />Paid At: ${formatDate(payment.createdAt)}</div>
      <table>
        <tr><td>Receipt For</td><td>${payment.invoiceNumber || payment.id || '-'}</td></tr>
        <tr><td>Amount Paid</td><td>${formatMoney(payment.amount)}</td></tr>
        <tr><td>Status</td><td>${payment.status || '-'}</td></tr>
        <tr><td>Method</td><td>${payment.method || '-'}</td></tr>
        <tr><td>Notes</td><td>${payment.notes || '-'}</td></tr>
      </table>`
    );
  };

  const handleSendReminder = async (invoice: any) => {
    const fallbackEmail = data?.adminEmail || '';
    const email = fallbackEmail || window.prompt('Enter billing email for reminder:', '') || '';
    if (!email) return;

    const token = localStorage.getItem('authToken') || '';
    setReminderLoadingId(invoice.id);
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}/invoices/${invoice.id}/remind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || 'Failed to send reminder');
      }
      setData((prev: any) => prev ? { ...prev, adminEmail: result.email || email } : prev);
      window.alert(`Reminder sent to ${result.email || email}`);
    } catch (err: any) {
      window.alert(err?.message || 'Failed to send reminder');
    } finally {
      setReminderLoadingId(null);
    }
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

  if (loading) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="p-2 text-red-600">{error}</div>;
  }

  if (!data) {
    return <div className="p-4 text-gray-500">No tenant details found.</div>;
  }

  return (
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
          <div><span className="font-semibold">Billing Email:</span> {data.adminEmail || '-'}</div>
          <div><span className="font-semibold">Country:</span> {data.countryCode || '-'}</div>
          <div><span className="font-semibold">Currency:</span> {data.currencyCode || 'NPR'}</div>
          <div><span className="font-semibold">Trial Ends:</span> {formatDate(data.trialEndsAt)}</div>
          <div><span className="font-semibold">Trial Days:</span> {data.trialDays ?? '-'}</div>
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
                <th className="text-left py-2">Actions</th>
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
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" leftIcon={<FiDownload />} onClick={() => handleDownloadInvoice(invoice)}>
                        Download
                      </Button>
                      <Button size="sm" variant="secondary" leftIcon={<FiBell />} isLoading={reminderLoadingId === invoice.id} onClick={() => handleSendReminder(invoice)}>
                        Send Reminder
                      </Button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-2 text-gray-500">No invoices found.</td></tr>
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
                <th className="text-left py-2">Receipt</th>
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
                  <td className="py-2">
                    <Button size="sm" variant="outline" leftIcon={<FiDownload />} onClick={() => handleDownloadReceipt(p)}>
                      Download Receipt
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="py-2 text-gray-500">No payments found.</td></tr>
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
  );
};

export default TenantDetailsContent;
