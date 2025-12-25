
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FiLogIn, FiUser, FiLock } from 'react-icons/fi';

interface LoginPageProps {
    onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message);
        setIsLoading(false);
      }
      // On success, the useAuth hook now handles navigation
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-2xl space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-sky-700">
                Resto<span className="text-amber-500">Byte</span>
            </h1>
            <p className="text-gray-500 mt-2">Sign in to your dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
            <Input
            label="Username"
            id="username-modal"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            leftIcon={<FiUser />}
            placeholder="e.g., admin"
            />
            <Input
            label="Password"
            id="password-modal"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<FiLock />}
            placeholder="e.g., admin123"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
            type="submit"
            className="w-full !py-3 !text-base"
            leftIcon={<FiLogIn />}
            isLoading={isLoading}
            disabled={isLoading}
            >
            {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
        </form>
        <div className="text-center text-xs text-gray-400 pt-4 border-t">
            <p>Don't have an account? <button type="button" onClick={onSwitchToRegister} className="font-semibold text-sky-600 hover:underline">Register here</button></p>
            <p className="mt-2">Demo credentials: `admin`/`admin123` or `superadmin`/`superadmin123`</p>
        </div>
    </div>
  );
};

export default LoginPage;
