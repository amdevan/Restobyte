
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FiUserPlus, FiUser, FiLock, FiHome, FiPhone, FiMapPin } from 'react-icons/fi';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    if (!fullName || !mobile || !address) {
        setError('Please fill out all required fields.');
        return;
    }

    setIsLoading(true);
    try {
      const result = await register(username, password, restaurantName, fullName, mobile, address);
      if (result.success) {
        setSuccess('Registration successful! You can now log in.');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-2xl space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-sky-700">
                Resto<span className="text-amber-500">Byte</span>
            </h1>
            <p className="text-gray-500 mt-2">Create your restaurant account</p>
        </div>
        
        {success ? (
        <div className="text-center p-4 bg-green-100 text-green-700 rounded-lg">
            <p>{success}</p>
             <Button onClick={onSwitchToLogin} className="mt-4" variant="success">
                Go to Login
            </Button>
        </div>
        ) : (
        <form onSubmit={handleRegister} className="space-y-4">
            <Input
                label="Restaurant Name *"
                id="restaurantName-modal"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required autoFocus leftIcon={<FiHome />}
            />
            <Input
                label="Your Full Name *"
                id="fullName-modal"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required leftIcon={<FiUser />}
            />
            <Input
                label="Mobile Number *"
                id="mobile-modal"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required leftIcon={<FiPhone />}
            />
             <Input
                label="Restaurant Address *"
                id="address-modal"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required leftIcon={<FiMapPin />}
            />
            <Input
                label="Admin Username *"
                id="username-modal-reg"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required leftIcon={<FiUser />}
            />
            <Input
                label="Password *"
                id="password-modal-reg"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required leftIcon={<FiLock />}
            />
            <Input
                label="Confirm Password *"
                id="confirmPassword-modal-reg"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required leftIcon={<FiLock />}
            />
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <Button
            type="submit"
            className="w-full !py-3 !text-base"
            leftIcon={<FiUserPlus />}
            isLoading={isLoading}
            disabled={isLoading}
            >
            {isLoading ? 'Registering...' : 'Register'}
            </Button>
        </form>
        )}
        
        <div className="text-center text-xs text-gray-400 pt-4 border-t">
            <p>Already have an account? <button type="button" onClick={onSwitchToLogin} className="font-semibold text-sky-600 hover:underline">Sign in here</button></p>
        </div>
    </div>
  );
};

export default RegisterPage;