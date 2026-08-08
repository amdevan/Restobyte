import React, { useState, useEffect, useCallback } from 'react';
import { FiDownload, FiUpload, FiClock, FiCheckCircle, FiAlertTriangle, FiDatabase, FiHardDrive, FiTrash2, FiRefreshCw, FiShield, FiArchive, FiCloud, FiPlay, FiSettings } from 'react-icons/fi';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface BackupRecord {
  id: string;
  filename: string;
  type: string;
  label: string | null;
  sizeBytes: number;
  checksum: string | null;
  encrypted: boolean;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

interface BackupStats {
  totalBackups: number;
  lastBackupDate: string | null;
  lastBackupStatus: string | null;
  failedCount: number;
  totalSizeBytes: number;
  diskFiles: number;
  diskSizeBytes: number;
}

const BACKUP_TYPES = [
  { value: 'full', label: 'Full System', desc: 'Complete database backup', icon: <FiDatabase /> },
  { value: 'sales', label: 'Sales Only', desc: 'Orders, invoices, payments', icon: <FiArchive /> },
  { value: 'products', label: 'Products Only', desc: 'Menu items, categories, variations', icon: <FiArchive /> },
  { value: 'customers', label: 'Customers Only', desc: 'Customer records', icon: <FiArchive /> },
  { value: 'inventory', label: 'Inventory Only', desc: 'Stock data and entries', icon: <FiArchive /> },
  { value: 'settings', label: 'Settings Only', desc: 'Outlets, printers, roles, currencies', icon: <FiArchive /> },
  { value: 'employees', label: 'Employees Only', desc: 'Users and employee data', icon: <FiArchive /> },
];

const RESTORE_TYPES = [
  { value: 'full', label: 'Complete System' },
  { value: 'sales', label: 'Sales Only' },
  { value: 'products', label: 'Products Only' },
  { value: 'customers', label: 'Customers Only' },
  { value: 'inventory', label: 'Inventory Only' },
  { value: 'settings', label: 'Settings Only' },
  { value: 'employees', label: 'Employees Only' },
];

const BackupDashboardPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupType, setBackupType] = useState('full');
  const [backupLabel, setBackupLabel] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [useEncryption, setUseEncryption] = useState(false);
  const [restoreType, setRestoreType] = useState('full');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'history' | 'cloud' | 'auto'>('backup');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-backup schedule state
  const [schedule, setSchedule] = useState({ enabled: false, frequency: 'daily', time: '02:00', type: 'full', encrypt: false, password: '', retentionDays: 30 });
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState<{ lastRun: string | null; nextRun: string | null }>({ lastRun: null, nextRun: null });
  const [triggeringBackup, setTriggeringBackup] = useState(false);

  // Google Drive state
  const [gdriveConnected, setGdriveConnected] = useState(false);
  const [gdriveConfigured, setGdriveConfigured] = useState(false);
  const [gdriveEmail, setGdriveEmail] = useState<string | null>(null);
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveBackupType, setDriveBackupType] = useState('full');
  const [driveRestoring, setDriveRestoring] = useState(false);
  const [driveRestoreType, setDriveRestoreType] = useState('full');

  const token = localStorage.getItem('authToken');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [backupsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/backups`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/backups/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (backupsRes.ok) setBackups(await backupsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch backup data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Auto-Backup Schedule Functions ──
  const fetchSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/backups/schedule`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSchedule({
          enabled: data.enabled ?? false,
          frequency: data.frequency ?? 'daily',
          time: data.time ?? '02:00',
          type: data.type ?? 'full',
          encrypt: data.encrypt ?? false,
          password: data.password ?? '',
          retentionDays: data.retentionDays ?? 30,
        });
        setScheduleInfo({ lastRun: data.lastRun || null, nextRun: data.nextRun || null });
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setScheduleLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/backups/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(schedule),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to save schedule');
      }
      const data = await res.json();
      setScheduleInfo({ lastRun: data.lastRun || null, nextRun: data.nextRun || null });
      setMessage({ type: 'success', text: `Auto-backup schedule ${schedule.enabled ? 'enabled' : 'saved'}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save schedule' });
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleTriggerBackup = async () => {
    setTriggeringBackup(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/backups/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: schedule.type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Trigger failed');
      }
      setMessage({ type: 'success', text: 'Backup triggered successfully! Check history for results.' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Backup trigger failed' });
    } finally {
      setTriggeringBackup(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  const handleBackup = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/backups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: backupType,
          label: backupLabel || `${backupType} backup`,
          password: useEncryption ? backupPassword : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `Backup failed (${res.status})`);
      }

      // Download the file
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || `backup-${Date.now()}.sql`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: `Backup created successfully: ${filename}` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Backup failed' });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!confirmRestore) {
      setConfirmRestore(true);
      return;
    }

    setRestoring(true);
    setMessage(null);

    try {
      if (restoreFile) {
        // Upload and restore from file
        const formData = new FormData();
        formData.append('backupFile', restoreFile);

        const uploadRes = await fetch(`${API_BASE_URL}/backups/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Upload failed');

        const { backup } = await uploadRes.json();

        const restoreRes = await fetch(`${API_BASE_URL}/backups/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: backup.filename,
            type: restoreType,
            password: restorePassword || undefined,
          }),
        });

        if (!restoreRes.ok) {
          const err = await restoreRes.json().catch(() => null);
          throw new Error(err?.message || 'Restore failed');
        }
      } else {
        // Restore from server backup
        const selectedBackup = backups.find(b => b.id === (document.getElementById('restore-select') as HTMLSelectElement)?.value);
        if (!selectedBackup) {
          setMessage({ type: 'error', text: 'Please select a backup to restore from' });
          setRestoring(false);
          return;
        }

        const restoreRes = await fetch(`${API_BASE_URL}/backups/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: selectedBackup.filename,
            type: restoreType,
            password: restorePassword || undefined,
          }),
        });

        if (!restoreRes.ok) {
          const err = await restoreRes.json().catch(() => null);
          throw new Error(err?.message || 'Restore failed');
        }
      }

      setMessage({ type: 'success', text: 'Restore completed successfully! Please refresh the page.' });
      setShowRestoreModal(false);
      setConfirmRestore(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Restore failed' });
    } finally {
      setRestoring(false);
      setConfirmRestore(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this backup record?')) return;
    try {
      await fetch(`${API_BASE_URL}/backups/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // ── Google Drive Functions ──
  const checkGdriveStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/google-drive/status`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setGdriveConfigured(data.configured);
        setGdriveConnected(data.connected);
        setGdriveEmail(data.email);
      }
    } catch {}
  }, [token]);

  useEffect(() => { checkGdriveStatus(); }, [checkGdriveStatus]);

  // Check URL params for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gdrive') === 'connected') {
      setMessage({ type: 'success', text: 'Google Drive connected successfully!' });
      checkGdriveStatus();
      window.history.replaceState({}, '', '/app/backup');
    } else if (params.get('gdrive') === 'error') {
      setMessage({ type: 'error', text: 'Google Drive connection failed. Please try again.' });
      window.history.replaceState({}, '', '/app/backup');
    }
  }, [checkGdriveStatus]);

  const handleGdriveConnect = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/google-drive/auth-url`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setMessage({ type: 'error', text: data.message || 'Google Drive not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend .env' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to initiate Google Drive connection' });
    }
  };

  const handleGdriveDisconnect = async () => {
    if (!confirm('Disconnect Google Drive?')) return;
    try {
      await fetch(`${API_BASE_URL}/google-drive/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setGdriveConnected(false);
      setGdriveEmail(null);
      setDriveBackups([]);
      setMessage({ type: 'success', text: 'Google Drive disconnected' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to disconnect' });
    }
  };

  const handleGdriveBackup = async () => {
    setDriveLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/google-drive/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: driveBackupType, label: `Cloud backup - ${driveBackupType}` }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Backup failed');
      }
      const data = await res.json();
      setMessage({ type: 'success', text: `Backup uploaded to Google Drive: ${data.fileName}` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Cloud backup failed' });
    } finally {
      setDriveLoading(false);
    }
  };

  const loadDriveBackups = async () => {
    setDriveLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/google-drive/backups`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDriveBackups(await res.json());
    } catch {} finally {
      setDriveLoading(false);
    }
  };

  const handleGdriveRestore = async (fileId: string) => {
    if (!confirm('Restore from this Google Drive backup? This will overwrite current data.')) return;
    setDriveRestoring(true);
    try {
      const res = await fetch(`${API_BASE_URL}/google-drive/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileId, type: driveRestoreType }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Restore failed');
      }
      setMessage({ type: 'success', text: 'Restore from Google Drive completed!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Restore failed' });
    } finally {
      setDriveRestoring(false);
    }
  };

  const handleGdriveDelete = async (fileId: string) => {
    if (!confirm('Delete this backup from Google Drive?')) return;
    try {
      await fetch(`${API_BASE_URL}/google-drive/backups/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadDriveBackups();
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Backup & Restore</h1>
        <Button variant="secondary" onClick={fetchData} leftIcon={<FiRefreshCw size={16} />} disabled={loading}>
          Refresh
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FiDatabase size={20} /></div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalBackups}</p>
                <p className="text-xs text-gray-500">Total Backups</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg text-green-600"><FiCheckCircle size={20} /></div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{stats.lastBackupDate ? formatDate(stats.lastBackupDate) : 'Never'}</p>
                <p className="text-xs text-gray-500">Last Backup</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><FiHardDrive size={20} /></div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{formatBytes(stats.diskSizeBytes)}</p>
                <p className="text-xs text-gray-500">Disk Usage ({stats.diskFiles} files)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.failedCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {stats.failedCount > 0 ? <FiAlertTriangle size={20} /> : <FiShield size={20} />}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.failedCount}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {(['backup', 'restore', 'auto', 'cloud', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); if (tab === 'cloud') loadDriveBackups(); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'backup' ? 'Create Backup' : tab === 'restore' ? 'Restore' : tab === 'auto' ? 'Auto Backup' : tab === 'cloud' ? 'Cloud Backup' : 'Backup History'}
          </button>
        ))}
      </div>

      {/* Create Backup Tab */}
      {activeTab === 'backup' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Backup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Backup Type</label>
                <div className="space-y-2">
                  {BACKUP_TYPES.map(bt => (
                    <label key={bt.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${backupType === bt.value ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="backupType" value={bt.value} checked={backupType === bt.value} onChange={(e) => setBackupType(e.target.value)} className="text-sky-600" />
                      <span className="text-gray-600">{bt.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{bt.label}</p>
                        <p className="text-xs text-gray-500">{bt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
                <input
                  type="text"
                  value={backupLabel}
                  onChange={(e) => setBackupLabel(e.target.value)}
                  placeholder="e.g., Before migration, Weekly backup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={useEncryption} onChange={(e) => setUseEncryption(e.target.checked)} className="rounded text-sky-600" />
                  <span className="text-sm font-medium text-gray-700">Encrypt backup (AES-256)</span>
                </label>
                {useEncryption && (
                  <input
                    type="password"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="Encryption password"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  />
                )}
              </div>

              <Button
                variant="primary"
                onClick={handleBackup}
                disabled={creating || (useEncryption && !backupPassword)}
                leftIcon={<FiDownload size={16} />}
                className="w-full"
              >
                {creating ? 'Creating Backup...' : 'Download Backup'}
              </Button>

              <p className="text-xs text-gray-400">
                The backup file will be downloaded to your computer. Keep it in a safe location.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Restore Tab */}
      {activeTab === 'restore' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Restore from Backup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Restore Source</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-gray-200 hover:bg-gray-50">
                    <input type="radio" name="restoreSource" defaultChecked onChange={() => setRestoreFile(null)} className="text-sky-600" />
                    <FiHardDrive className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">From Server Backup</p>
                      <p className="text-xs text-gray-500">Select from existing backups on the server</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-gray-200 hover:bg-gray-50">
                    <input type="radio" name="restoreSource" onChange={() => {}} className="text-sky-600" />
                    <FiUpload className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Upload Backup File</p>
                      <p className="text-xs text-gray-500">Upload a .sql or .sql.enc file from your computer</p>
                    </div>
                  </label>
                </div>
              </div>

              {!restoreFile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Backup</label>
                  <select id="restore-select" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500">
                    <option value="">-- Select a backup --</option>
                    {backups.filter(b => b.status === 'SUCCESS').map(b => (
                      <option key={b.id} value={b.id}>
                        {b.label || b.filename} ({formatBytes(b.sizeBytes)}) - {formatDate(b.createdAt)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                <input
                  type="file"
                  accept=".sql,.enc,.zip"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What to Restore</label>
                <select
                  value={restoreType}
                  onChange={(e) => setRestoreType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                >
                  {RESTORE_TYPES.map(rt => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Selective restore — only the chosen data will be overwritten.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decryption Password (if encrypted)</label>
                <input
                  type="password"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  placeholder="Leave blank if not encrypted"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800 font-medium">Warning</p>
                <p className="text-xs text-amber-700 mt-1">
                  Restoring will overwrite existing data. A backup will be created automatically before restore.
                  This action cannot be undone.
                </p>
              </div>

              <Button
                variant={confirmRestore ? 'danger' : 'primary'}
                onClick={handleRestore}
                disabled={restoring || (!restoreFile && !backups.some(b => b.status === 'SUCCESS'))}
                leftIcon={<FiUpload size={16} />}
                className="w-full"
              >
                {restoring ? 'Restoring...' : confirmRestore ? 'Confirm Restore — Overwrite Data' : 'Start Restore'}
              </Button>

              {confirmRestore && (
                <Button variant="secondary" onClick={() => setConfirmRestore(false)} className="w-full">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Auto Backup Tab */}
      {activeTab === 'auto' && (
        <div className="space-y-6">
          {/* Schedule Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${schedule.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <FiSettings size={24} className={schedule.enabled ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Automatic Backup</h3>
                  <p className="text-sm text-gray-500">
                    {schedule.enabled
                      ? `Runs ${schedule.frequency} at ${schedule.time}`
                      : 'Automatic backups are disabled'}
                  </p>
                </div>
              </div>
              <Button
                variant={schedule.enabled ? 'secondary' : 'primary'}
                onClick={() => { setSchedule(prev => ({ ...prev, enabled: !prev.enabled })); }}
                size="sm"
              >
                {schedule.enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>

            {/* Schedule Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${schedule.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-800">{schedule.enabled ? 'Active' : 'Disabled'}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Last Backup</p>
                <p className="text-sm font-medium text-gray-800">{scheduleInfo.lastRun ? formatDate(scheduleInfo.lastRun) : 'Never'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Next Scheduled</p>
                <p className="text-sm font-medium text-gray-800">{scheduleInfo.nextRun ? formatDate(scheduleInfo.nextRun) : '—'}</p>
              </div>
            </div>
          </Card>

          {/* Schedule Configuration */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Schedule Settings</h3>
            {scheduleLoading ? (
              <div className="text-center py-8 text-gray-500">Loading schedule...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                    <div className="space-y-2">
                      {[
                        { value: 'daily', label: 'Daily', desc: 'Back up every day' },
                        { value: 'weekly', label: 'Weekly', desc: 'Back up every Sunday' },
                        { value: 'monthly', label: 'Monthly', desc: 'Back up on the 1st of each month' },
                      ].map(opt => (
                        <label key={opt.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${schedule.frequency === opt.value ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="frequency" value={opt.value} checked={schedule.frequency === opt.value} onChange={(e) => setSchedule(prev => ({ ...prev, frequency: e.target.value as any }))} className="text-sky-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Backup Time</label>
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => setSchedule(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Server local time</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Backup Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Type</label>
                    <select
                      value={schedule.type}
                      onChange={(e) => setSchedule(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                    >
                      {BACKUP_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                    </select>
                  </div>

                  {/* Retention */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retention (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={schedule.retentionDays}
                      onChange={(e) => setSchedule(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Old backups beyond this age are automatically deleted</p>
                  </div>

                  {/* Encryption */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schedule.encrypt}
                        onChange={(e) => setSchedule(prev => ({ ...prev, encrypt: e.target.checked }))}
                        className="rounded text-sky-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Encrypt automatic backups (AES-256)</span>
                    </label>
                    {schedule.encrypt && (
                      <input
                        type="password"
                        value={schedule.password}
                        onChange={(e) => setSchedule(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Encryption password"
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Save & Trigger Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleSaveSchedule}
                disabled={scheduleSaving || scheduleLoading || (schedule.encrypt && !schedule.password)}
                leftIcon={<FiCheckCircle size={16} />}
              >
                {scheduleSaving ? 'Saving...' : 'Save Schedule'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleTriggerBackup}
                disabled={triggeringBackup}
                leftIcon={<FiPlay size={16} />}
              >
                {triggeringBackup ? 'Running Backup...' : 'Run Backup Now'}
              </Button>
            </div>
          </Card>

          {/* How It Works */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-3">How Automatic Backup Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="text-sky-500 font-bold text-lg">1</span>
                <div>
                  <p className="font-medium text-gray-800">Configure Schedule</p>
                  <p className="text-xs text-gray-500">Set frequency, time, and backup type</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-sky-500 font-bold text-lg">2</span>
                <div>
                  <p className="font-medium text-gray-800">Auto-Run</p>
                  <p className="text-xs text-gray-500">Backup runs automatically at scheduled time</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-sky-500 font-bold text-lg">3</span>
                <div>
                  <p className="font-medium text-gray-800">Auto-Cleanup</p>
                  <p className="text-xs text-gray-500">Old backups deleted based on retention policy</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Cloud Backup Tab */}
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          {/* Connection Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${gdriveConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <FiCloud size={24} className={gdriveConnected ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Google Drive</h3>
                  <p className="text-sm text-gray-500">
                    {gdriveConnected ? `Connected as ${gdriveEmail}` : gdriveConfigured ? 'Not connected' : 'Not configured — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend .env'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {gdriveConnected ? (
                  <Button variant="secondary" onClick={handleGdriveDisconnect} size="sm">Disconnect</Button>
                ) : (
                  <Button variant="primary" onClick={handleGdriveConnect} size="sm" disabled={!gdriveConfigured} leftIcon={<FiCloud size={14} />}>
                    Connect Google Drive
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Backup to Cloud */}
          {gdriveConnected && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Backup to Google Drive</h3>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backup Type</label>
                  <select
                    value={driveBackupType}
                    onChange={(e) => setDriveBackupType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                  >
                    {BACKUP_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                  </select>
                </div>
                <Button variant="primary" onClick={handleGdriveBackup} disabled={driveLoading} leftIcon={<FiCloud size={14} />}>
                  {driveLoading ? 'Backing up...' : 'Backup Now'}
                </Button>
              </div>
            </Card>
          )}

          {/* Cloud Backups List */}
          {gdriveConnected && (
            <Card className="overflow-x-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Cloud Backups</h3>
                <Button variant="secondary" size="sm" onClick={loadDriveBackups} leftIcon={<FiRefreshCw size={14} />} disabled={driveLoading}>
                  Refresh
                </Button>
              </div>
              {driveBackups.length === 0 ? (
                <div className="text-center py-10">
                  <FiCloud size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No cloud backups yet. Create one above.</p>
                </div>
              ) : (
                <table className="w-full min-w-max">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Filename</th>
                      <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase">Size</th>
                      <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {driveBackups.map((file: any) => (
                      <tr key={file.id} className="hover:bg-sky-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{file.createdTime ? new Date(file.createdTime).toLocaleString() : '-'}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{file.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">{formatBytes(Number(file.size || 0))}</td>
                        <td className="py-3 px-4 text-sm text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleGdriveRestore(file.id)}
                              disabled={driveRestoring}
                              className="text-sky-600 hover:text-sky-800 text-xs font-medium"
                            >
                              {driveRestoring ? 'Restoring...' : 'Restore'}
                            </button>
                            <button onClick={() => handleGdriveDelete(file.id)} className="text-red-400 hover:text-red-600" title="Delete">
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card className="overflow-x-auto">
          {backups.length === 0 ? (
            <div className="text-center py-10">
              <FiClock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No backup history yet.</p>
            </div>
          ) : (
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Label</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase">Size</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">Encrypted</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map(backup => (
                  <tr key={backup.id} className="hover:bg-sky-50">
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(backup.createdAt)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{backup.label || backup.filename}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{backup.type}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{formatBytes(backup.sizeBytes)}</td>
                    <td className="py-3 px-4 text-sm text-center">
                      {backup.encrypted ? <FiShield className="inline text-green-600" size={16} /> : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-center">
                      <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                        backup.status === 'SUCCESS' ? 'text-green-600 bg-green-100' :
                        backup.status === 'FAILED' ? 'text-red-600 bg-red-100' :
                        'text-amber-600 bg-amber-100'
                      }`}>
                        {backup.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-center">
                      <button onClick={() => handleDelete(backup.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Delete">
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
};

export default BackupDashboardPage;
