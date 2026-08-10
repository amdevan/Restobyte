import React, { useState, useMemo, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { User, Role, PermissionKey, PERMISSION_GROUPS, ALL_PERMISSION_KEYS } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import UserForm from '@/components/users/UserForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiUsers, FiSearch, FiCheckCircle, FiXCircle as FiStatusX, FiShield, FiCheck, FiX, FiInfo, FiChevronDown, FiChevronRight, FiLock, FiUnlock } from 'react-icons/fi';

const AccountAndUserPage: React.FC = () => {
  const { users, roles, outlets, addUser, updateUser, deleteUser, addRole, updateRole, deleteRole } = useRestaurantData();

  // User state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Role state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [roleError, setRoleError] = useState('');
  const [roleSuccess, setRoleSuccess] = useState('');
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(PERMISSION_GROUPS.map(g => g.resource)));
  const [roleSearch, setRoleSearch] = useState('');

  // ===== User Handlers =====
  const handleOpenModalForAdd = () => { setEditingUser(null); setIsModalOpen(true); };
  const handleOpenModalForEdit = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingUser(null); };

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.id === 'user-admin') { alert("The default admin user cannot be deleted."); return; }
    if (window.confirm(`Are you sure you want to delete the user "${userToDelete?.username}"?`)) {
      const result = await deleteUser(userId);
      if (!result.success) alert(result.message || 'Failed to delete user.');
    }
  };

  // ===== Role Handlers =====
  const resetRoleState = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedPermissions([]);
    setRoleError('');
    setRoleSuccess('');
    setIsRoleSubmitting(false);
  };

  useEffect(() => {
    if (!isRoleModalOpen) { resetRoleState(); return; }
    setRoleName(editingRole?.name || '');
    const perms = editingRole?.permissions || [];
    setSelectedPermissions(perms.filter(p => ALL_PERMISSION_KEYS.includes(p as PermissionKey)) as PermissionKey[]);
    setRoleError('');
    setRoleSuccess('');
    setIsRoleSubmitting(false);
  }, [isRoleModalOpen, editingRole]);

  const handleOpenRoleModalForAdd = () => { setEditingRole(null); setIsRoleModalOpen(true); };
  const handleOpenRoleModalForEdit = (role: Role) => { setEditingRole(role); setIsRoleModalOpen(true); };
  const handleCloseRoleModal = () => { setIsRoleModalOpen(false); };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) { setRoleError('System roles cannot be deleted.'); return; }
    const usersCount = users.filter(u => u.roleId === role.id).length;
    const msg = usersCount > 0
      ? `Delete "${role.name}"? ${usersCount} user(s) are assigned and will lose their role.`
      : `Delete "${role.name}"? This cannot be undone.`;
    if (window.confirm(msg)) {
      const result = await deleteRole(role.id);
      if (!result.success) { setRoleError(result.message || 'Failed to delete role.'); }
      else { setRoleSuccess(`Role "${role.name}" deleted.`); setTimeout(() => setRoleSuccess(''), 3000); }
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRoleSubmitting) return;
    const trimmedName = roleName.trim();
    if (!trimmedName) { setRoleError('Role name is required.'); return; }
    if (roles.find(r => r.name.toLowerCase() === trimmedName.toLowerCase() && r.id !== editingRole?.id)) {
      setRoleError('A role with this name already exists.'); return;
    }
    if (selectedPermissions.length === 0) { setRoleError('Please select at least one permission.'); return; }

    setIsRoleSubmitting(true);
    setRoleError('');
    setRoleSuccess('');
    try {
      const result = editingRole
        ? await updateRole({ ...editingRole, name: trimmedName, permissions: selectedPermissions, granularPermissions: selectedPermissions })
        : await addRole({ name: trimmedName, permissions: selectedPermissions, granularPermissions: selectedPermissions, tenantId: undefined, isSystem: false });
      if (!result.success) { setRoleError(result.message || 'Failed to save role.'); return; }
      setRoleSuccess(editingRole ? 'Role updated!' : 'Role created!');
      setTimeout(handleCloseRoleModal, 800);
    } finally { setIsRoleSubmitting(false); }
  };

  const handleToggleGroup = (group: typeof PERMISSION_GROUPS[number], checked: boolean) => {
    setSelectedPermissions(prev => checked
      ? [...new Set([...prev, ...group.permissions])]
      : prev.filter(p => !group.permissions.includes(p))
    );
  };
  const handleToggleAll = (checked: boolean) => setSelectedPermissions(checked ? [...ALL_PERMISSION_KEYS] : []);
  const toggleExpandedGroup = (resource: string) => {
    setExpandedGroups(prev => { const next = new Set(prev); next.has(resource) ? next.delete(resource) : next.add(resource); return next; });
  };

  // ===== Computed =====
  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'Unknown Role';
  const getOutletName = (outletId: string) => outlets.find(o => o.id === outletId)?.name || 'Unknown Outlet';
  const getOutletNames = (user: User) => {
    const ids = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
      ? (user as any).outletIds : (user.outletId ? [user.outletId] : []);
    return ids.map((id: string) => getOutletName(id)).join(', ');
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const s = searchTerm.toLowerCase();
    return users.filter(u => u.username.toLowerCase().includes(s) || getRoleName(u.roleId).toLowerCase().includes(s) || getOutletNames(u).toLowerCase().includes(s));
  }, [users, roles, outlets, searchTerm]);

  const sortedRoles = useMemo(() => {
    const s = roleSearch.toLowerCase();
    return [...roles]
      .filter(r => !s || r.name.toLowerCase().includes(s))
      .sort((a, b) => { if (Boolean(a.isSystem) !== Boolean(b.isSystem)) return a.isSystem ? -1 : 1; return a.name.localeCompare(b.name); });
  }, [roles, roleSearch]);

  const allSelected = ALL_PERMISSION_KEYS.every(p => selectedPermissions.includes(p));
  const totalPermissions = ALL_PERMISSION_KEYS.length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
          <FiUsers className="mr-3 text-sky-600" /> Account & User Management
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Input
            id="user-search"
            type="text"
            placeholder="Search users, roles, outlets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-10"
            containerClassName="mb-0 flex-grow sm:flex-grow-0"
            leftIcon={<FiSearch className="h-5 w-5" />}
          />
          <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20} />} variant="primary" className="w-full sm:w-auto">
            Add New User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><FiUsers className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-2xl font-bold text-gray-800">{users.length}</p><p className="text-xs text-gray-500">Users</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><FiLock className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-gray-800">{roles.filter(r => r.isSystem).length}</p><p className="text-xs text-gray-500">System Roles</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><FiUnlock className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-800">{roles.filter(r => !r.isSystem).length}</p><p className="text-xs text-gray-500">Custom Roles</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><FiShield className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-gray-800">{roles.length}</p><p className="text-xs text-gray-500">Total Roles</p></div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10">
            <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">{users.length === 0 ? "No users found. Add your first user!" : "No users match your search."}</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Username</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned Outlets</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{user.username}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{getRoleName(user.roleId)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{getOutletNames(user)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? <FiCheckCircle className="mr-1" /> : <FiStatusX className="mr-1" />}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenModalForEdit(user)} variant="secondary" size="sm" aria-label="Edit User"><FiEdit /></Button>
                      <Button onClick={() => handleDelete(user.id)} variant="danger" size="sm" aria-label="Delete User" disabled={user.id === 'user-admin'}><FiTrash2 /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Role Management Section */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FiShield className="mr-2 text-sky-600" /> Role Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">Create roles and assign granular permissions to control access.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="role-search"
              placeholder="Search roles..."
              value={roleSearch}
              onChange={e => setRoleSearch(e.target.value)}
              leftIcon={<FiSearch />}
              containerClassName="mb-0"
              className="w-48"
            />
            <Button onClick={handleOpenRoleModalForAdd} leftIcon={<FiPlusCircle size={18} />} variant="primary">
              Add Role
            </Button>
          </div>
        </div>

        {roleSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
            <FiCheckCircle className="text-green-600 mr-2" />
            <p className="text-sm text-green-700">{roleSuccess}</p>
          </div>
        )}
        {roleError && !isRoleModalOpen && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
            <FiX className="text-red-600 mr-2" />
            <p className="text-sm text-red-700">{roleError}</p>
          </div>
        )}

        {sortedRoles.length === 0 ? (
          <div className="text-center py-8">
            <FiShield size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">{roles.length === 0 ? "No roles found. Create your first role!" : "No roles match your search."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRoles.map(role => {
              const permissions = role.permissions || [];
              const usersCount = users.filter(u => u.roleId === role.id).length;
              const isExpanded = expandedRole === role.id;
              const granularPerms = permissions.filter((p: string) => ALL_PERMISSION_KEYS.includes(p as PermissionKey));
              const legacyPerms = permissions.filter((p: string) => !ALL_PERMISSION_KEYS.includes(p as PermissionKey));

              return (
                <div key={role.id} className={`border rounded-xl transition-all ${role.isSystem ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-white hover:border-sky-300'}`}>
                  <div className="flex items-center justify-between p-4">
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
                          <span className="flex items-center gap-1"><FiLock size={12} />{granularPerms.length} permission{granularPerms.length !== 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1"><FiUsers size={12} />{usersCount} user{usersCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                        className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title={isExpanded ? 'Collapse' : 'View permissions'}
                      >
                        <FiInfo size={16} />
                      </button>
                      <Button onClick={() => handleOpenRoleModalForEdit(role)} variant="secondary" size="sm" disabled={role.isSystem} title={role.isSystem ? 'System roles cannot be edited' : 'Edit Role'}>
                        <FiEdit size={14} />
                      </Button>
                      <Button onClick={() => handleDeleteRole(role)} variant="danger" size="sm" disabled={role.isSystem} title={role.isSystem ? 'System roles cannot be deleted' : 'Delete Role'}>
                        <FiTrash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Assigned Permissions</h4>
                        {granularPerms.length > 0 ? (
                          <div className="space-y-2">
                            {PERMISSION_GROUPS.map(group => {
                              const groupPerms = granularPerms.filter((p: string) => group.permissions.includes(p as PermissionKey));
                              if (groupPerms.length === 0) return null;
                              return (
                                <div key={group.resource}>
                                  <p className="text-xs font-medium text-gray-600 mb-1">{group.label}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {groupPerms.map((p: string) => (
                                      <span key={p} className="px-2 py-0.5 bg-sky-50 text-sky-700 text-xs rounded-md font-medium border border-sky-200">
                                        {String(p).split('.')[1] || p}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : permissions.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No permissions assigned</p>
                        ) : null}
                        {legacyPerms.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Legacy</p>
                            <div className="flex flex-wrap gap-1.5">
                              {legacyPerms.map((p: string) => (
                                <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* User Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingUser ? "Edit User" : "Add New User"} size="lg">
        <UserForm initialData={editingUser} onSubmit={addUser} onUpdate={updateUser} onClose={handleCloseModal} />
      </Modal>

      {/* Role Modal */}
      <Modal isOpen={isRoleModalOpen} onClose={handleCloseRoleModal} title={editingRole ? `Edit: ${editingRole.name}` : 'Create New Role'} size="2xl">
        <form onSubmit={handleRoleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
          <Input
            label="Role Name *"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g., Manager, Supervisor"
            required
            disabled={editingRole?.isSystem}
          />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Permissions ({selectedPermissions.length} / {totalPermissions} selected)
              </label>
              <label className="flex items-center space-x-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleToggleAll(e.target.checked)}
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
                        {isExpanded ? <FiChevronDown size={14} className="text-gray-400 flex-shrink-0" /> : <FiChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
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
                                onChange={(e) => {
                                  setSelectedPermissions(prev => e.target.checked ? [...prev, perm] : prev.filter(p => p !== perm));
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

          {roleError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
              <FiX className="text-red-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{roleError}</p>
            </div>
          )}
          {roleSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
              <FiCheck className="text-green-600 mr-2" />
              <p className="text-sm text-green-700">{roleSuccess}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseRoleModal} disabled={isRoleSubmitting}>
              <FiX className="mr-1" /> Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isRoleSubmitting || editingRole?.isSystem}>
              <FiCheck className="mr-1" />
              {isRoleSubmitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountAndUserPage;
