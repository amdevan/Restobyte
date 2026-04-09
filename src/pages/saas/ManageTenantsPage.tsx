import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import ServerTenantEditModal from '@/components/saas/ServerTenantEditModal';
import { API_BASE_URL } from '@/config';
import { FiUsers, FiSearch, FiRefreshCw, FiEdit, FiTrash2, FiLogIn, FiPlus, FiCheckCircle, FiPauseCircle, FiDownload, FiCalendar } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import AddTenantModal from '@/components/saas/AddTenantModal';
import TenantDetailsDrawer from '@/components/saas/TenantDetailsDrawer';

const ManageTenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailsTenantId, setDetailsTenantId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchTenants = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/tenants`);
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch {
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleDelete = async (id: string) => {
      if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;
      
      setActionLoading(true);
      try {
          const res = await fetch(`${API_BASE_URL}/tenants/${id}`, {
              method: 'DELETE'
          });
          if (res.ok) {
              setTenants(prev => prev.filter(t => t.id !== id));
          } else {
              alert('Failed to delete tenant');
          }
      } catch (error) {
          alert('Error deleting tenant');
      } finally {
          setActionLoading(false);
      }
  };

  const handleEditClick = (tenant: any) => {
      setSelectedTenant(tenant);
      setIsEditModalOpen(true);
  };

  const handleImpersonate = async (tenant: any) => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/auth/impersonate/${tenant.id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            alert('Impersonation failed');
            return;
        }
        const data = await res.json();
        localStorage.setItem('authUser', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        window.location.href = '/app/home';
      } catch {
        alert('Network error');
      }
  };
  const handleUpdate = async (updatedData: any) => {
      if (!selectedTenant) return;
      setActionLoading(true);
      try {
          const res = await fetch(`${API_BASE_URL}/tenants/${selectedTenant.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedData)
          });
          
          if (res.ok) {
              setIsEditModalOpen(false);
              fetchTenants(); // Refresh list to get updated data
          } else {
              alert('Failed to update tenant');
          }
      } catch (error) {
          alert('Error updating tenant');
      } finally {
          setActionLoading(false);
      }
  };

  const planOptions = useMemo(() => ['all', ...Array.from(new Set((tenants || []).map((t: any) => t.plan).filter(Boolean)))], [tenants]);
  const statusOptions = useMemo(() => ['all', 'active', 'inactive', 'trialing'], []);

  const filtered = tenants.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchesQuery = t.name?.toLowerCase().includes(q) || t.phone?.toLowerCase().includes(q);
    const matchesPlan = planFilter === 'all' || t.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || t.subscriptionStatus === statusFilter;
    const createdOk =
      (!dateFrom || new Date(t.createdAt) >= new Date(dateFrom)) &&
      (!dateTo || new Date(t.createdAt) <= new Date(dateTo));
    return matchesQuery && matchesPlan && matchesStatus && createdOk;
  });

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(t => t.id));
    }
    setSelectAll(!selectAll);
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-start">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FiUsers className="mr-3" /> Tenants ({filtered.length})
          </h1>
        </div>
        <div className="flex items-center justify-center flex-wrap gap-3 w-full">
          <Input
            placeholder="Search..."
            leftIcon={<FiSearch />}
            containerClassName="mb-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
            title="Filter by Plan"
          >
            {planOptions.map(p => <option key={p} value={p}>{p === 'all' ? 'All Plans' : p}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
            title="Filter by Status"
          >
            {statusOptions.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-500" />
            <input type="date" className="border rounded px-2 py-1 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" className="border rounded px-2 py-1 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <Button variant="outline" onClick={fetchTenants} leftIcon={<FiRefreshCw />}>
            Refresh
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<FiPlus />}>
            Add Tenant
          </Button>
        </div>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" leftIcon={<FiCheckCircle />} onClick={async () => {
            for (const id of selectedIds) {
              await fetch(`${API_BASE_URL}/tenants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionStatus: 'active' }) });
            }
            fetchTenants();
          }} disabled={selectedIds.length === 0}>Activate Selected</Button>
          <Button size="sm" variant="secondary" leftIcon={<FiPauseCircle />} onClick={async () => {
            for (const id of selectedIds) {
              await fetch(`${API_BASE_URL}/tenants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionStatus: 'inactive' }) });
            }
            fetchTenants();
          }} disabled={selectedIds.length === 0}>Deactivate Selected</Button>
          <Button size="sm" variant="danger" leftIcon={<FiTrash2 />} onClick={async () => {
            if (!window.confirm('Delete selected tenants?')) return;
            for (const id of selectedIds) {
              await fetch(`${API_BASE_URL}/tenants/${id}`, { method: 'DELETE' });
            }
            setSelectedIds([]);
            setSelectAll(false);
            fetchTenants();
          }} disabled={selectedIds.length === 0}>Delete Selected</Button>
          <Button size="sm" variant="secondary" leftIcon={<FiDownload />} onClick={() => {
            const headers = ['Name', 'Phone', 'Plan', 'Status', 'Created'];
            const rows = filtered.map(t => [
              t.name ?? '',
              t.phone ?? '',
              t.plan ?? '',
              t.subscriptionStatus ?? '',
              new Date(t.createdAt).toISOString()
            ]);
            const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'tenants_filtered.csv';
            link.click();
            URL.revokeObjectURL(url);
          }}>Export Filtered</Button>
          <div className="text-sm text-gray-500 ml-auto">{selectedIds.length} selected</div>
        </div>
      </Card>
      <Card className="overflow-x-auto">
        {error && <div className="text-red-600 text-sm p-2">{error}</div>}
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : filtered.length > 0 ? (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4">
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setDetailsTenantId(t.id)}>
                  <td className="py-3 px-4">
                    <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                  </td>
                  <td className="py-3 px-4 font-medium">{t.name}</td>
                  <td className="py-3 px-4">{t.phone || '-'}</td>
                  <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {t.plan}
                      </span>
                  </td>
                  <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                          t.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 
                          t.subscriptionStatus === 'trialing' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                      }`}>
                        {t.subscriptionStatus}
                      </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleEditClick(t)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                              <FiEdit size={18} />
                          </button>
                          <button 
                            onClick={() => handleImpersonate(t)}
                            className="text-sky-600 hover:text-sky-800 p-1 rounded hover:bg-sky-50"
                            title="Impersonate"
                          >
                              <FiLogIn size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                              <FiTrash2 size={18} />
                          </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-gray-500">No tenants found.</div>
        )}
      </Card>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Tenant">
          <ServerTenantEditModal 
              initialData={selectedTenant}
              onUpdate={handleUpdate}
              onClose={() => setIsEditModalOpen(false)}
              loading={actionLoading}
          />
      </Modal>
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); fetchTenants(); }} title="Create Tenant">
        <AddTenantModal onClose={() => { setIsAddModalOpen(false); fetchTenants(); }} />
      </Modal>
      <TenantDetailsDrawer tenantId={detailsTenantId} onClose={() => setDetailsTenantId(null)} />
    </div>
  );
};

export default ManageTenantsPage;
