import React, { useState, useMemo, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { User, Role, PermissionKey, PERMISSION_GROUPS } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import UserForm from '@/components/users/UserForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiUsers, FiSearch, FiCheckCircle, FiXCircle as FiStatusX, FiShield, FiCheck, FiX, FiInfo } from 'react-icons/fi';

const AccountAndUserPage: React.FC = () => {
  const { users, roles, outlets, addUser, updateUser, deleteUser, addRole, updateRole, deleteRole } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [roleError, setRoleError] = useState('');
  const [roleSuccess, setRoleSuccess] = useState('');
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  useEffect(() => {
    if (!isRoleModalOpen) {
      setEditingRole(null);
      setRoleName('');
      setSelectedPermissions([]);
      setRoleError('');
      setRoleSuccess('');
      setIsRoleSubmitting(false);
      return;
    }

    setRoleName(editingRole?.name || '');
    setSelectedPermissions(editingRole?.granularPermissions || editingRole?.permissions?.filter(p => PERMISSION_GROUPS.some(g => g.permissions.includes(p as PermissionKey))) as PermissionKey[] || []);
    setRoleError('');
    setRoleSuccess('');
    setIsRoleSubmitting(false);
  }, [isRoleModalOpen, editingRole]);

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.id === 'user-admin') {
      alert("The default admin user cannot be deleted.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the user "${userToDelete?.username}"?`)) {
      const result = await deleteUser(userId);
      if (!result.success) {
        alert(result.message || 'Failed to delete user.');
      }
    }
  };

  const handleOpenRoleModalForAdd = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenRoleModalForEdit = (role: Role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      setRoleError('System roles cannot be deleted.');
      return;
    }
    
    const usersWithRole = users.filter(u => u.roleId === role.id);
    const confirmMessage = usersWithRole.length > 0
      ? `Are you sure you want to delete the role "${role.name}"? ${usersWithRole.length} user(s) are assigned to this role and will lose their role assignment.`
      : `Are you sure you want to delete the role "${role.name}"?`;
    
    if (window.confirm(confirmMessage)) {
      const result = await deleteRole(role.id);
      if (!result.success) {
        setRoleError(result.message || 'Failed to delete role.');
      } else {
        setRoleSuccess(`Role "${role.name}" deleted successfully.`);
      }
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRoleSubmitting) return;

    const trimmedName = roleName.trim();
    const permissions = selectedPermissions;

    if (!trimmedName) {
      setRoleError('Role name is required.');
      return;
    }

    // Check for duplicate name
    const duplicateRole = roles.find(r => r.name.toLowerCase() === trimmedName.toLowerCase() && r.id !== editingRole?.id);
    if (duplicateRole) {
      setRoleError('A role with this name already exists.');
      return;
    }

    setIsRoleSubmitting(true);
    setRoleError('');
    setRoleSuccess('');

    try {
      const result = editingRole
        ? await updateRole({ ...editingRole, name: trimmedName, permissions, granularPermissions: permissions })
        : await addRole({ name: trimmedName, permissions, granularPermissions: permissions, tenantId: undefined, isSystem: false });

      if (!result.success) {
        setRoleError(result.message || 'Failed to save role.');
        return;
      }

      setRoleSuccess(editingRole ? 'Role updated successfully!' : 'Role created successfully!');
      setTimeout(() => {
        handleCloseRoleModal();
      }, 1000);
    } finally {
      setIsRoleSubmitting(false);
    }
  };

  const handleToggleAllPermissions = (group: typeof PERMISSION_GROUPS[number], checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...new Set([...prev, ...group.permissions])]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => !group.permissions.includes(p)));
    }
  };

  const handleToggleAllModule = (checked: boolean) => {
    const allPermissions = PERMISSION_GROUPS.flatMap(g => g.permissions);
    if (checked) {
      setSelectedPermissions(allPermissions);
    } else {
      setSelectedPermissions([]);
    }
  };
  
  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'Unknown Role';
  const getOutletName = (outletId: string) => outlets.find(o => o.id === outletId)?.name || 'Unknown Outlet';
  const getOutletNames = (user: User) => {
    const ids = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
      ? (user as any).outletIds
      : (user.outletId ? [user.outletId] : []);
    const names = ids.map((id: string) => getOutletName(id));
    return names.join(', ');
  };

  const getUsersCountForRole = (roleId: string) => {
    return users.filter(u => u.roleId === roleId).length;
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    return users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoleName(user.roleId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getOutletNames(user).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, roles, outlets, searchTerm]);

  const sortedRoles = useMemo(
    () => [...roles].sort((a, b) => {
      if (Boolean(a.isSystem) !== Boolean(b.isSystem)) return a.isSystem ? -1 : 1;
      return a.name.localeCompare(b.name);
    }),
    [roles]
  );

  const allPermissionsSelected = PERMISSION_GROUPS.every(g =>
    g.permissions.every(p => selectedPermissions.includes(p))
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiUsers className="mr-3 text-sky-600"/> Account and User Management
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
             <Input
                id="user-search"
                type="text"
                placeholder="Search by username, role, outlet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10"
                containerClassName="mb-0 flex-grow sm:flex-grow-0"
                leftIcon={<FiSearch className="h-5 w-5" />}
            />
            <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary" className="w-full sm:w-auto">
                Add New User
            </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10">
            <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
                {users.length === 0 
                    ? "No users found. Add your first user!" 
                    : "No users match your search criteria."}
            </p>
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
                      <Button onClick={() => handleOpenModalForEdit(user)} variant="secondary" size="sm" aria-label="Edit User">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(user.id)} variant="danger" size="sm" aria-label="Delete User" disabled={user.id === 'user-admin'}>
                        <FiTrash2 />
                      </Button>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FiShield className="mr-2 text-sky-600" /> Role Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage roles and permissions for your team members.</p>
          </div>
          <Button onClick={handleOpenRoleModalForAdd} leftIcon={<FiPlusCircle size={18} />} variant="primary">
            Add New Role
          </Button>
        </div>

        {roleSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3 flex items-center">
            <FiCheckCircle className="text-green-600 mr-2" />
            <p className="text-sm text-green-700">{roleSuccess}</p>
          </div>
        )}

        {sortedRoles.length === 0 ? (
          <div className="text-center py-8">
            <FiShield size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No roles found. Create your first role!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRoles.map(role => {
              const usersCount = getUsersCountForRole(role.id);
              const isExpanded = expandedRole === role.id;
              const permissions = role.granularPermissions || role.permissions || [];
              
              return (
                <div key={role.id} className={`border rounded-lg transition-all ${role.isSystem ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-white hover:border-sky-300'}`}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.isSystem ? 'bg-purple-100' : 'bg-sky-100'}`}>
                        <FiShield className={`w-5 h-5 ${role.isSystem ? 'text-purple-600' : 'text-sky-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-800">{role.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${role.isSystem ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {role.isSystem ? 'System' : 'Custom'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {permissions.length} permission(s)
                          </span>
                          <span className="text-xs text-gray-500">
                            {usersCount} user(s) assigned
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <FiInfo size={16} />
                      </button>
                      <Button
                        onClick={() => handleOpenRoleModalForEdit(role)}
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
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Permissions</h4>
                        {permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {permissions.map(p => (
                              <span key={p} className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-md font-medium">
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No permissions assigned</p>
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingUser ? "Edit User" : "Add New User"}
        size="lg"
      >
        <UserForm
          initialData={editingUser}
          onSubmit={addUser}
          onUpdate={updateUser}
          onClose={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={isRoleModalOpen}
        onClose={handleCloseRoleModal}
        title={editingRole ? 'Edit Role' : 'Add New Role'}
        size="lg"
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4">
          <Input 
            label="Role Name *" 
            value={roleName} 
            onChange={(e) => setRoleName(e.target.value)} 
            placeholder="e.g., Manager, Supervisor, etc."
            required 
            disabled={editingRole?.isSystem}
          />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Permissions</label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allPermissionsSelected}
                  onChange={(e) => handleToggleAllModule(e.target.checked)}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </label>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {PERMISSION_GROUPS.map((group) => {
                const allGroupSelected = group.permissions.every(p => selectedPermissions.includes(p));
                const someGroupSelected = group.permissions.some(p => selectedPermissions.includes(p));
                
                return (
                  <div key={group.resource} className="bg-white rounded-md p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">{group.label}</h4>
                        <p className="text-xs text-gray-500">{group.description}</p>
                      </div>
                      <label className="flex items-center space-x-1.5 cursor-pointer bg-gray-100 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={allGroupSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someGroupSelected && !allGroupSelected;
                          }}
                          onChange={(e) => handleToggleAllPermissions(group, e.target.checked)}
                          className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                        />
                        <span className="text-xs font-medium text-gray-600">All</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
                      {group.permissions.map((perm) => (
                        <label key={perm} className="flex items-center space-x-2 cursor-pointer hover:bg-sky-50 p-1.5 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPermissions(prev => [...prev, perm]);
                              } else {
                                setSelectedPermissions(prev => prev.filter(p => p !== perm));
                              }
                            }}
                            className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-700">{perm.split('.')[1]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedPermissions.length} of {PERMISSION_GROUPS.flatMap(g => g.permissions).length} permissions selected
            </p>
          </div>

          {roleError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
              <FiX className="text-red-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{roleError}</p>
            </div>
          )}

          {roleSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center">
              <FiCheck className="text-green-600 mr-2 flex-shrink-0" />
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
