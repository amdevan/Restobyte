
import React, { useState, useEffect } from 'react';
import { User, Role, Outlet } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiUser as FiUserIcon, FiLock, FiBriefcase, FiHome, FiEye, FiEyeOff } from 'react-icons/fi';

interface UserFormProps {
  initialData?: User | null;
  onSubmit: (data: Omit<User, 'id'>) => void;
  onUpdate: (data: User) => void;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const { roles, outlets } = useRestaurantData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [outletId, setOutletId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username);
      setRoleId(initialData.roleId);
      setOutletId(initialData.outletId);
      setIsActive(initialData.isActive);
      // Password fields are intentionally left blank for editing
      setPassword('');
      setConfirmPassword('');
    } else {
      // Reset for new user
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setRoleId(roles[0]?.id || '');
      setOutletId(outlets[0]?.id || '');
      setIsActive(true);
    }
  }, [initialData, roles, outlets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!username.trim() || !roleId || !outletId) {
      alert('Username, Role, and Outlet are required.');
      return;
    }

    // Password validation
    if (!initialData && !password) { // Required for new users
        setPasswordError('Password is required for new users.');
        return;
    }
    if (password && password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (password && password.length < 6) {
        setPasswordError('Password must be at least 6 characters long.');
        return;
    }

    const userData = {
        username,
        // In a real app, you would hash this password before storing.
        // We'll use the plain text here for simplicity, but name the property `passwordHash`.
        passwordHash: password || initialData?.passwordHash || '', 
        roleId,
        outletId,
        isActive,
    };
    
    if (initialData) {
        // If password field was empty, keep the old hash
        if (!password) {
            userData.passwordHash = initialData.passwordHash;
        }
      onUpdate({ ...initialData, ...userData });
    } else {
      onSubmit(userData);
    }
    onClose(); 
  };
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Username *" value={username} onChange={(e) => setUsername(e.target.value)} required leftIcon={<FiUserIcon />} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Input label={initialData ? "New Password (optional)" : "Password *"} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<FiLock />} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
            {showPassword ? <FiEyeOff/> : <FiEye/>}
          </button>
        </div>
        <Input label="Confirm Password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} leftIcon={<FiLock />} />
      </div>
      {passwordError && <p className="text-xs text-red-600 -mt-2">{passwordError}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Outlet *</label>
          <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
            {outlets.map(outlet => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center">
        <input id="isActiveUser" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
        <label htmlFor="isActiveUser" className="ml-2 block text-sm text-gray-900">Active User</label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />}>Cancel</Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />}>{initialData ? 'Update User' : 'Save User'}</Button>
      </div>
    </form>
  );
};

export default UserForm;
