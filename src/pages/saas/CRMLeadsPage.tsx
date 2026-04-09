import React, { useEffect, useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { API_BASE_URL } from '@/config';
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiUsers, FiArrowRightCircle } from 'react-icons/fi';

type Lead = { id: string; name: string; email?: string; phone?: string; company?: string; source?: string; stage: string; createdAt: string };

const LeadForm: React.FC<{ initial?: Partial<Lead>; onSubmit: (d: any) => void; loading?: boolean }> = ({ initial = {}, onSubmit, loading }) => {
  const [form, setForm] = useState({ name: initial.name || '', email: initial.email || '', phone: initial.phone || '', company: initial.company || '', source: initial.source || '', stage: initial.stage || 'New' });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <Input label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
        <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full border rounded p-2">
          {['New','Contacted','Qualified','Proposal','Won','Lost','Converted'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" isLoading={loading}>Save</Button>
      </div>
    </form>
  );
};

const CRMLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/crm/leads`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')||''}` }});
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (lead: Lead) => { setEditing(lead); setModalOpen(true); };

  const submitLead = async (payload: any) => {
    const url = editing ? `${API_BASE_URL}/crm/leads/${editing.id}` : `${API_BASE_URL}/crm/leads`;
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')||''}` }, body: JSON.stringify(payload) });
    if (res.ok) { setModalOpen(false); fetchLeads(); }
  };

  const removeLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`${API_BASE_URL}/crm/leads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('authToken')||''}` } });
    fetchLeads();
  };

  const convertLead = async (id: string) => {
    if (!confirm('Convert this lead to a tenant?')) return;
    const res = await fetch(`${API_BASE_URL}/crm/leads/${id}/convert`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('authToken')||''}` } });
    if (res.ok) {
      alert('Converted to tenant');
      fetchLeads();
    } else {
      alert('Conversion failed');
    }
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matches = l.name.toLowerCase().includes(q) || (l.company||'').toLowerCase().includes(q) || (l.email||'').toLowerCase().includes(q);
    const stageOk = stageFilter === 'all' || l.stage === stageFilter;
    return matches && stageOk;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center"><FiUsers className="mr-3" /> CRM Leads</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} containerClassName="mb-0"/>
          <select className="border rounded px-3 py-2" value={stageFilter} onChange={(e)=>setStageFilter(e.target.value)}>
            {['all','New','Contacted','Qualified','Proposal','Won','Lost','Converted'].map(s => <option key={s} value={s}>{s==='all'?'All Stages':s}</option>)}
          </select>
          <Button variant="outline" onClick={fetchLeads} leftIcon={<FiRefreshCw />}>Refresh</Button>
          <Button onClick={openNew} leftIcon={<FiPlus />}>Add Lead</Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        {loading ? <div className="p-4">Loading...</div> : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{l.name}</td>
                  <td className="py-3 px-4">{l.company || '-'}</td>
                  <td className="py-3 px-4">{l.email || '-'}</td>
                  <td className="py-3 px-4">{l.phone || '-'}</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">{l.stage}</span></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(l)} leftIcon={<FiEdit size={14}/>}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => removeLead(l.id)} leftIcon={<FiTrash2 size={14}/>}>Delete</Button>
                      <Button size="sm" onClick={() => convertLead(l.id)} leftIcon={<FiArrowRightCircle size={14}/>}>Convert</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Lead' : 'Add Lead'}>
        <LeadForm initial={editing||{}} onSubmit={submitLead} />
      </Modal>
    </div>
  );
};

export default CRMLeadsPage;
