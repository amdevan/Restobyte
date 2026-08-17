
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FiLogIn, FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

interface LoginPageProps {
    onSwitchToRegister: () => void;
    variant?: 'page' | 'modal';
}

const REMEMBERED_USER_KEY = 'restobyte_remembered_user';

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, variant = 'page' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // Load remembered username on mount
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBERED_USER_KEY);
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_USER_KEY, username.trim());
        } else {
          localStorage.removeItem(REMEMBERED_USER_KEY);
        }
      } else {
        setError(result.message);
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const isModal = variant === 'modal';

  if (isModal) {
    return (
      <div className="w-full space-y-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md mb-2 border border-gray-100">
            <img src="/icons/icon logo.png" alt="RestoByte" className="h-10 w-10 object-contain" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Resto<span className="text-amber-600">Byte</span></h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Username"
            id="login-username-modal"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus={!username}
            leftIcon={<FiUser />}
            placeholder="Enter your username"
            autoComplete="username"
          />
          <div className="relative">
            <Input
              label="Password"
              id="login-password-modal"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<FiLock />}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors select-none">Remember me</span>
            </label>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full !py-3 !text-base !rounded-lg !font-semibold"
            leftIcon={<FiLogIn />}
            isLoading={isLoading}
            disabled={isLoading || !username || !password}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-xs text-gray-400 pt-2">
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToRegister} className="font-semibold text-amber-600 hover:underline">
            Start Free Trial
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-md mx-auto px-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 px-8 pt-10 pb-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute top-1/2 -right-4 w-20 h-20 bg-white/5 rounded-full" />
            </div>
            <div className="relative z-10 mx-auto mb-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-white flex items-center justify-center shadow-lg">
                <img src="/icons/icon logo.png" alt="RestoByte" className="h-16 w-16 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow-lg relative z-10 tracking-tight">
              Resto<span className="text-yellow-200">Byte</span>
            </h1>
            <p className="text-amber-100 mt-2 text-sm relative z-10 font-medium">Restaurant Management System</p>
          </div>

          {/* Form body */}
          <div className="px-8 py-8">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Welcome back</h2>
              <p className="text-sm text-gray-500 mt-0.5">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Username"
                id="login-username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus={!username}
                leftIcon={<FiUser />}
                placeholder="Enter your username"
                autoComplete="username"
              />
              <div className="relative">
                <Input
                  label="Password"
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  leftIcon={<FiLock />}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors select-none">Remember me</span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center animate-pulse">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full !py-3.5 !text-base !rounded-xl !font-semibold !shadow-lg hover:!shadow-xl transition-shadow"
                leftIcon={<FiLogIn />}
                isLoading={isLoading}
                disabled={isLoading || !username || !password}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center rounded-b-3xl">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold text-amber-600 hover:text-amber-700 hover:underline transition-colors"
              >
                Start Free Trial
              </button>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500/60 mt-6 font-medium">Powered by IT Relevant Pvt. Ltd</p>
      </div>
    </div>
  );
};

export default LoginPage;
