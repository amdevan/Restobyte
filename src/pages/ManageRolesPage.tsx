import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Role, PermissionKey, PERMISSION_GROUPS, ALL_PERMISSION_KEYS } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { FiPlusCircle, FiEdit, FiTrash2, FiShield, FiSearch, FiCheck, FiX, FiChevronDown, FiChevronRight, FiUsers, FiLock, FiUnlock, FiInfo } from 'react-icons/fi';

const ManageRolesPage: React.FC = () => {
  const { users, roles, addRole, updateRole, deleteRole } = useRestaurantData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(PERMISSION_GROUPS.map(g => g.resource)));
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  const sortedRoles = useMemo(() => {
    return [...roles]
      .filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (Boolean(a.isSystem) !== Boolean(b.isSystem)) return a.isSystem ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [roles, searchTerm]);

  const getUsersCountForRole = (roleId: string) => users.filter(u => u.roleId === roleId).length;

  const getRolePermissions = (role: Role): string[] => {
    return role.granularPermissions || role.permissions || [];
  };

  const handleOpenModalForAdd = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedPermissions([]);
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedPermissions(getRolePermissions(role).filter(p => ALL_PERMISSION_KEYS.includes(p as PermissionKey)) as PermissionKey[]);
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setRoleName('');
    setSelectedPermissions([]);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = roleName.trim();
    if (!trimmedName) {
      setError('Role name is required.');
      return;
    }

    const duplicateRole = roles.find(r => r.name.toLowerCase() === trimmedName.toLowerCase() && r.id !== editingRole?.id);
    if (duplicateRole) {
      setError('A role with this name already exists.');
      return;
    }

    if (selectedPermissions.length === 0) {
      setError('Please select at least one permission.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const result = editingRole
        ? await updateRole({ ...editingRole, name: trimmedName, permissions: selectedPermissions, granularPermissions: selectedPermissions })
        : await addRole({ name: trimmedName, permissions: selectedPermissions, granularPermissions: selectedPermissions, tenantId: undefined, isSystem: false });

      if (!result.success) {
        setError(result.message || 'Failed to save role.');
        return;
      }

      setSuccess(editingRole ? 'Role updated successfully!' : 'Role created successfully!');
      setTimeout(() => handleCloseModal(), 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      setError('System roles cannot be deleted.');
      return;
    }

    const usersCount = getUsersCountForRole(role.id);
    const confirmMessage = usersCount > 0
      ? `Delete "${role.name}"? ${usersCount} user(s) are assigned and will lose their role.`
      : `Delete "${role.name}"? This cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      const result = await deleteRole(role.id);
      if (!result.success) {
        setError(result.message || 'Failed to delete role.');
      } else {
        setSuccess(`Role "${role.name}" deleted.`);
        setTimeout(() => setSuccess(''), 3000);
      }
    }
  };

  const handleToggleGroup = (group: typeof PERMISSION_GROUPS[number], checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...new Set([...prev, ...group.permissions])]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => !group.permissions.includes(p)));
    }
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedPermissions(checked ? [...ALL_PERMISSION_KEYS] : []);
  };

  const toggleExpandedGroup = (resource: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(resource)) next.delete(resource);
      else next.add(resource);
      return next;
    });
  };

  const allSelected = ALL_PERMISSION_KEYS.every(p => selectedPermissions.includes(p));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiShield className="mr-3 text-sky-600" /> Manage Roles
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20} />} variant="primary">
          Add New Role
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
          <FiCheck className="text-green-600 mr-2" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      {error && !isModalOpen && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
          <FiX className="text-red-600 mr-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <FiShield className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{roles.length}</p>
              <p className="text-xs text-gray-500">Total Roles</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <FiLock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{roles.filter(r => r.isSystem).length}</p>
              <p className="text-xs text-gray-500">System Roles</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <FiUnlock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{roles.filter(r => !r.isSystem).length}</p>
              <p className="text-xs text-gray-500">Custom Roles</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <Input
            id="role-search"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<FiSearch />}
          />
        </div>
      </Card>

      {/* Roles List */}
      <div className="space-y-3">
        {sortedRoles.length === 0 ? (
          <Card className="p-10 text-center">
            <FiShield size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              {roles.length === 0 ? "No roles found. Create your first role!" : "No roles match your search."}
            </p>
          </Card>
        ) : (
          sortedRoles.map(role => {
            const permissions = getRolePermissions(role);
            const usersCount = getUsersCountForRole(role.id);
            const permCount = permissions.filter(p => ALL_PERMISSION_KEYS.includes(p as PermissionKey)).length;
            const isViewing = viewingRole?.id === role.id;

            return (
              <Card key={role.id}>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.isSystem ? 'bg-purple-100' : 'bg-sky-100'}`}>
                        <FiShield className={`w-6 h-6 ${role.isSystem ? 'text-purple-600' : 'text-sky-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{role.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${role.isSystem ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {role.isSystem ? 'System' : 'Custom'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiLock size={12} />
                            {permCount} permission{permCount !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiUsers size={12} />
                            {usersCount} user{usersCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingRole(isViewing ? null : role)}
                        className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="View permissions"
                      >
                        <FiInfo size={16} />
                      </button>
                      <Button
                        onClick={() => handleOpenModalForEdit(role)}
                        variant="secondary"
                        size="sm"
                        disabled={role.isSystem}
                        title={role.isSystem ? 'System roles cannot be edited' : 'Edit Role'}
                      >
                        <FiEdit size={14} />
                      </Button>
                      <Button
                        onClick={() => handleDeleteRole(role)}
                        variant="danger"
                        size="sm"
                        disabled={role.isSystem}
                        title={role.isSystem ? 'System roles cannot be deleted' : 'Delete Role'}
                      >
                        <FiTrash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Permissions View */}
                  {isViewing && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Assigned Permissions</h4>
                      {permissions.length > 0 ? (
                        <div className="space-y-2">
                          {PERMISSION_GROUPS.map(group => {
                            const groupPerms = permissions.filter(p => group.permissions.includes(p as PermissionKey));
                            if (groupPerms.length === 0) return null;
                            return (
                              <div key={group.resource}>
                                <p className="text-xs font-medium text-gray-600 mb-1">{group.label}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {groupPerms.map(p => (
                                    <span key={p} className="px-2 py-0.5 bg-sky-50 text-sky-700 text-xs rounded-md font-medium border border-sky-200">
                                      {String(p).split('.')[1] || p}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {/* Legacy permissions */}
                          {(() => {
                            const legacyPerms = permissions.filter(p => !ALL_PERMISSION_KEYS.includes(p as PermissionKey));
                            if (legacyPerms.length === 0) return null;
                            return (
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Legacy</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {legacyPerms.map(p => (
                                    <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
                                      {String(p)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No permissions assigned</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRole ? `Edit: ${editingRole.name}` : 'Create New Role'}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
          <Input
            label="Role Name *"
            value={roleName}
            onChange={e => setRoleName(e.target.value)}
            placeholder="e.g., Manager, Supervisor"
            required
            disabled={editingRole?.isSystem}
          />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Permissions ({selectedPermissions.length} / {ALL_PERMISSION_KEYS.length} selected)
              </label>
              <label className="flex items-center space-x-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => handleToggleAll(e.target.checked)}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-600">Select All</span>
              </label>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
              {PERMISSION_GROUPS.map(group => {
                const allGroupSelected = group.permissions.every(p => selectedPermissions.includes(p));
                const someGroupSelected = group.permissions.some(p => selectedPermissions.includes(p));
                const isExpanded = expandedGroups.has(group.resource);
                const groupCount = group.permissions.filter(p => selectedPermissions.includes(p)).length;

                return (
                  <div key={group.resource} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => toggleExpandedGroup(group.resource)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isExpanded ? <FiChevronDown size={14} className="text-gray-400" /> : <FiChevronRight size={14} className="text-gray-400" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-700">{group.label}</h4>
                            <span className="text-xs text-gray-400">({groupCount}/{group.permissions.length})</span>
                          </div>
                          <p className="text-xs text-gray-500">{group.description}</p>
                        </div>
                      </div>
                      <label
                        className="flex items-center space-x-1.5 cursor-pointer bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={allGroupSelected}
                          ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                          onChange={e => { e.stopPropagation(); handleToggleGroup(group, e.target.checked); }}
                          className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                        />
                        <span className="text-xs font-medium text-gray-600">All</span>
                      </label>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-gray-50">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {group.permissions.map(perm => (
                            <label key={perm} className="flex items-center space-x-2 cursor-pointer hover:bg-sky-50 p-1.5 rounded transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedPermissions(prev => [...prev, perm]);
                                  } else {
                                    setSelectedPermissions(prev => prev.filter(p => p !== perm));
                                  }
                                }}
                                className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                              />
                              <span className="text-xs text-gray-700">{String(perm).split('.')[1]}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error/Success in modal */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
              <FiX className="text-red-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
              <FiCheck className="text-green-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
              <FiX className="mr-1" /> Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || editingRole?.isSystem}>
              <FiCheck className="mr-1" />
              {isSubmitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageRolesPage;
