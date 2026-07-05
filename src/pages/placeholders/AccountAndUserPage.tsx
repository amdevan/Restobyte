y
import React, { useState, useMemo, useEffect } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { User, Role } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import UserForm from '@/components/users/UserForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiUsers, FiSearch, FiCheckCircle, FiXCircle as FiStatusX, FiShield } from 'react-icons/fi';

const AccountAndUserPage: React.FC = () => {
  const { users, roles, outlets, addUser, updateUser, deleteUser, addRole, updateRole, deleteRole } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState('');
  const [roleError, setRoleError] = useState('');
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);

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
      setRolePermissions('');
      setRoleError('');
      setIsRoleSubmitting(false);
      return;
    }

    setRoleName(editingRole?.name || '');
    setRolePermissions(editingRole?.permissions?.join(', ') || '');
    setRoleError('');
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
      alert('System roles cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      const result = await deleteRole(role.id);
      if (!result.success) {
        alert(result.message || 'Failed to delete role.');
      }
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRoleSubmitting) return;

    const trimmedName = roleName.trim();
    const permissions = rolePermissions
      .split(',')
      .map((permission) => permission.trim())
      .filter(Boolean);

    if (!trimmedName) {
      setRoleError('Role name is required.');
      return;
    }

    setIsRoleSubmitting(true);
    setRoleError('');

    try {
      const result = editingRole
        ? await updateRole({ ...editingRole, name: trimmedName, permissions })
        : await addRole({ name: trimmedName, permissions, tenantId: undefined, isSystem: false });

      if (!result.success) {
        setRoleError(result.message || 'Failed to save role.');
        return;
      }

      handleCloseRoleModal();
    } finally {
      setIsRoleSubmitting(false);
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

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FiShield className="mr-2 text-sky-600" /> Role Management
            </h2>
            <p className="text-sm text-gray-500">Database-backed roles now sync across devices.</p>
          </div>
          <Button onClick={handleOpenRoleModalForAdd} leftIcon={<FiPlusCircle size={18} />}>
            Add Role
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Permissions</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRoles.map(role => (
                <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{role.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{role.permissions.length > 0 ? role.permissions.join(', ') : 'No permissions set'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{role.isSystem ? 'System' : 'Custom'}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleOpenRoleModalForEdit(role)} variant="secondary" size="sm" aria-label="Edit Role" disabled={role.isSystem}>
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDeleteRole(role)} variant="danger" size="sm" aria-label="Delete Role" disabled={role.isSystem}>
                        <FiTrash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        title={editingRole ? 'Edit Role' : 'Add Role'}
        size="md"
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4">
          <Input label="Role Name *" value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
            <textarea
              value={rolePermissions}
              onChange={(e) => setRolePermissions(e.target.value)}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="pos, sales_history, reports"
            />
            <p className="text-xs text-gray-500 mt-1">Use comma-separated permission keys.</p>
          </div>
          {roleError && <p className="text-xs text-red-600">{roleError}</p>}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseRoleModal} disabled={isRoleSubmitting}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isRoleSubmitting}>
              {editingRole ? 'Update Role' : 'Save Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountAndUserPage;
