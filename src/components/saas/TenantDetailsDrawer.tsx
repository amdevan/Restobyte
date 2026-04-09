import React, { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import Card from '@/components/common/Card';
import { API_BASE_URL } from '@/config';

interface Props {
  tenantId: string | null;
  onClose: () => void;
}

const TenantDetailsDrawer: React.FC<Props> = ({ tenantId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <Modal isOpen={!!tenantId} onClose={onClose} title="Tenant Details" size="xl">
      {loading && <div className="p-4 text-gray-500">Loading...</div>}
      {error && <div className="p-2 text-red-600">{error}</div>}
      {data && (
        <div className="space-y-4">
          <Card title="Overview">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold">Name:</span> {data.name}</div>
              <div><span className="font-semibold">Plan:</span> {data.plan}</div>
              <div><span className="font-semibold">Status:</span> {data.subscriptionStatus}</div>
              <div><span className="font-semibold">Joining Date:</span> {new Date(data.createdAt).toLocaleDateString()}</div>
              <div><span className="font-semibold">Phone:</span> {data.phone || '-'}</div>
              <div><span className="font-semibold">Address:</span> {data.address || '-'}</div>
              <div><span className="font-semibold">Country:</span> {data.countryCode || '-'}</div>
              <div><span className="font-semibold">Currency:</span> {data.currencyCode || '-'}</div>
            </div>
          </Card>
          <Card title="Outlets">
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
                    <td className="py-2">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}</td>
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
                    <td className="py-2">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Payment History">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Method</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.payments?.length ? data.payments.map((p: any, i: number) => (
                  <tr key={p.id || i} className="border-t">
                    <td className="py-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="py-2">${p.amount?.toFixed(2)}</td>
                    <td className="py-2">{p.method || '-'}</td>
                    <td className="py-2 capitalize">{p.status}</td>
                    <td className="py-2">{p.notes || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-2 text-gray-500">No payments found.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default TenantDetailsDrawer;
