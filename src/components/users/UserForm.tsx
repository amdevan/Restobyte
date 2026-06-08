
import React, { useState, useEffect } from 'react';
import { User, Role, Outlet } from '../../types';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle, FiUser as FiUserIcon, FiLock, FiBriefcase, FiHome, FiEye, FiEyeOff } from 'react-icons/fi';

interface UserFormProps {
  initialData?: User | null;
  onSubmit: (data: Omit<User, 'id'>) => Promise<{ success: boolean; message?: string }>;
  onUpdate: (data: User) => Promise<{ success: boolean; message?: string }>;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onUpdate, onClose }) => {
  const { roles, outlets } = useRestaurantData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [outletIds, setOutletIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username);
      setRoleId(initialData.roleId);
      const initialOutletIds = Array.isArray((initialData as any).outletIds) && (initialData as any).outletIds.length > 0
        ? (initialData as any).outletIds.map((v: any) => String(v)).filter(Boolean)
        : (initialData.outletId ? [String(initialData.outletId)] : []);
      setOutletIds(initialOutletIds);
      setIsActive(initialData.isActive);
      // Password fields are intentionally left blank for editing
      setPassword('');
      setConfirmPassword('');
    } else {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setRoleId('');
      setOutletIds([]);
      setIsActive(true);
    }
    setPasswordError('');
    setSubmitError('');
    setShowPassword(false);
    setIsSubmitting(false);
  }, [initialData]);

  useEffect(() => {
    if (initialData) return;
    setRoleId(prev => prev || roles[0]?.id || '');
    setOutletIds(prev => (prev.length > 0 ? prev : (outlets[0]?.id ? [outlets[0].id] : [])));
  }, [initialData, roles, outlets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setSubmitError('');
    if (isSubmitting) return;
    
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !roleId || outletIds.length === 0) return setSubmitError('Username, Role, and Outlet are required.');

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
        username: trimmedUsername,
        // In a real app, you would hash this password before storing.
        // We'll use the plain text here for simplicity, but name the property `passwordHash`.
        passwordHash: password || initialData?.passwordHash || '', 
        roleId,
        outletId: outletIds[0] || '',
        outletIds,
        isActive,
    };
    
    setIsSubmitting(true);
    try {
      if (initialData) {
        const result = await onUpdate({ ...initialData, ...userData });
        if (!result.success) {
          setSubmitError(result.message || 'Failed to update user.');
          return;
        }
      } else {
        const result = await onSubmit(userData);
        if (!result.success) {
          setSubmitError(result.message || 'Failed to add user.');
          return;
        }
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
      {submitError && <p className="text-xs text-red-600 -mt-2">{submitError}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Outlets *</label>
          <div className="w-full p-2 border border-gray-300 rounded-md max-h-32 overflow-y-auto space-y-2">
            {outlets.map(outlet => {
              const checked = outletIds.includes(outlet.id);
              return (
                <label key={outlet.id} className="flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 border-gray-300"
                    checked={checked}
                    onChange={() => {
                      setOutletIds(prev => {
                        const next = prev.includes(outlet.id)
                          ? prev.filter(id => id !== outlet.id)
                          : [...prev, outlet.id];
                        return next.length > 0 ? next : prev;
                      });
                    }}
                  />
                  <span className="ml-2">{outlet.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <input id="isActiveUser" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
        <label htmlFor="isActiveUser" className="ml-2 block text-sm text-gray-900">Active User</label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle />} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="primary" leftIcon={<FiSave />} disabled={isSubmitting}>
          {initialData ? 'Update User' : 'Save User'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
