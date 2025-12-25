
import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { User, Role, Outlet } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import UserForm from '@/components/users/UserForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiUsers, FiSearch, FiCheckCircle, FiXCircle as FiStatusX } from 'react-icons/fi';

const AccountAndUserPage: React.FC = () => {
  const { users, roles, outlets, addUser, updateUser, deleteUser } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDelete = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.id === 'user-admin') {
      alert("The default admin user cannot be deleted.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the user "${userToDelete?.username}"?`)) {
      deleteUser(userId);
    }
  };
  
  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'Unknown Role';
  const getOutletName = (outletId: string) => outlets.find(o => o.id === outletId)?.name || 'Unknown Outlet';

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    return users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoleName(user.roleId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getOutletName(user.outletId).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, roles, outlets, searchTerm]);

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
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned Outlet</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{user.username}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{getRoleName(user.roleId)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{getOutletName(user.outletId)}</td>
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
    </div>
  );
};

export default AccountAndUserPage;
