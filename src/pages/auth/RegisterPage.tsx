
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FiUserPlus, FiUser, FiLock, FiHome, FiPhone, FiMapPin, FiEye, FiEyeOff } from 'react-icons/fi';
import { isNative } from '../../utils/capacitorService';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
    embedded?: boolean;
    heading?: string;
    subtitle?: string;
    submitLabel?: string;
    successMessage?: string;
}

const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
  embedded = false,
  heading = 'RestoByte',
  subtitle = 'Create your restaurant account',
  submitLabel = 'Start Free Trial',
  successMessage = 'Registration successful! You can now log in.',
}) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        setSuccess(successMessage);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showHeading = !isNative;

  // Embedded mode (used inside NativeAuthScreen) - minimal card layout
  if (embedded) {
    return (
      <div className="w-full space-y-5">
        {showHeading && (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-sky-700">
              Resto<span className="text-amber-500">Byte</span>
            </h1>
            <p className="text-gray-500 mt-2">{subtitle}</p>
          </div>
        )}
        {success ? (
          <div className="text-center p-4 bg-green-100 text-green-700 rounded-lg">
            <p>{success}</p>
            <Button onClick={onSwitchToLogin} className="mt-4" variant="success">Go to Login</Button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <fieldset className="rb-fieldset">
              <legend className="rb-fieldset-legend">Restaurant Details</legend>
              <Input label="Restaurant Name *" id="rest-name-emb" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required autoFocus leftIcon={<FiHome />} />
              <Input label="Restaurant Address *" id="rest-addr-emb" value={address} onChange={(e) => setAddress(e.target.value)} required leftIcon={<FiMapPin />} />
            </fieldset>
            <fieldset className="rb-fieldset">
              <legend className="rb-fieldset-legend">Owner / Admin</legend>
              <Input label="Your Full Name *" id="full-name-emb" value={fullName} onChange={(e) => setFullName(e.target.value)} required leftIcon={<FiUser />} />
              <Input label="Mobile Number *" id="mobile-emb" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required leftIcon={<FiPhone />} />
            </fieldset>
            <fieldset className="rb-fieldset">
              <legend className="rb-fieldset-legend">Account Credentials</legend>
              <Input label="Admin Username *" id="username-emb" value={username} onChange={(e) => setUsername(e.target.value)} required leftIcon={<FiUser />} />
              <Input label="Password *" id="password-emb" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required leftIcon={<FiLock />} />
              <Input label="Confirm Password *" id="confirm-emb" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required leftIcon={<FiLock />} />
            </fieldset>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">{error}</div>}
            <Button type="submit" className="w-full !py-3 !text-base" leftIcon={<FiUserPlus />} isLoading={isLoading} disabled={isLoading}>
              {isLoading ? 'Registering...' : submitLabel}
            </Button>
          </form>
        )}
        <div className="text-center text-xs text-gray-400 pt-4 border-t">
          <p>Already have an account? <button type="button" onClick={onSwitchToLogin} className="font-semibold text-amber-600 hover:underline">Sign in here</button></p>
        </div>
      </div>
    );
  }

  // Full-page layout
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden py-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-lg mx-auto px-4 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 px-8 pt-8 pb-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute top-1/2 -right-4 w-20 h-20 bg-white/5 rounded-full" />
            </div>
            <div className="relative z-10 mx-auto mb-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-white flex items-center justify-center shadow-lg">
                <img src="/icons/icon logo.png" alt="RestoByte" className="h-14 w-14 object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white drop-shadow-lg relative z-10 tracking-tight">
              Resto<span className="text-yellow-200">Byte</span>
            </h1>
            <p className="text-amber-100 mt-1 text-sm relative z-10 font-medium">{subtitle}</p>
          </div>

          {/* Form body */}
          <div className="px-8 py-6">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <FiUserPlus size={32} className="text-green-600" />
                </div>
                <p className="text-green-700 font-medium text-lg mb-1">{success}</p>
                <p className="text-gray-500 text-sm mb-4">You can now sign in to your dashboard.</p>
                <Button onClick={onSwitchToLogin} className="!rounded-xl !py-3 !px-8" variant="success">
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Restaurant Details */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Restaurant Details</h3>
                  <div className="space-y-3">
                    <Input
                      label="Restaurant Name *"
                      id="register-restaurant"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      required autoFocus leftIcon={<FiHome />}
                      placeholder="e.g. Pizza Palace"
                    />
                    <Input
                      label="Restaurant Address *"
                      id="register-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required leftIcon={<FiMapPin />}
                      placeholder="Street, City"
                    />
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Owner Details */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Owner / Admin</h3>
                  <div className="space-y-3">
                    <Input
                      label="Your Full Name *"
                      id="register-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required leftIcon={<FiUser />}
                      placeholder="John Doe"
                    />
                    <Input
                      label="Mobile Number *"
                      id="register-mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required leftIcon={<FiPhone />}
                      placeholder="+977 9800000000"
                    />
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Credentials */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Credentials</h3>
                  <div className="space-y-3">
                    <Input
                      label="Admin Username *"
                      id="register-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required leftIcon={<FiUser />}
                      placeholder="Choose a username"
                      autoComplete="username"
                    />
                    <div className="relative">
                      <Input
                        label="Password *"
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required leftIcon={<FiLock />}
                        placeholder="Min 6 characters"
                        autoComplete="new-password"
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
                    <Input
                      label="Confirm Password *"
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required leftIcon={<FiLock />}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 -mt-2">Passwords do not match</p>
                    )}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center animate-pulse">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full !py-3.5 !text-base !rounded-xl !font-semibold !shadow-lg hover:!shadow-xl transition-shadow"
                  leftIcon={<FiUserPlus />}
                  isLoading={isLoading}
                  disabled={isLoading || !restaurantName || !fullName || !mobile || !address || !username || !password || !confirmPassword}
                >
                  {isLoading ? 'Creating Account...' : submitLabel}
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center rounded-b-3xl">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-semibold text-amber-600 hover:text-amber-700 hover:underline transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500/60 mt-6 font-medium">Powered by IT Relevant Pvt. Ltd</p>
      </div>
    </div>
  );
};

export default RegisterPage;
