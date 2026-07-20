
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FiUserPlus, FiUser, FiLock, FiHome, FiPhone, FiMapPin } from 'react-icons/fi';
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
  submitLabel = 'Register',
  successMessage = 'Registration successful! You can now log in.',
}) => {
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

  // On native the NativeAuthScreen wrapper already renders the logo + brand
  // header, so we skip the duplicate heading there.
  const showHeading = !isNative;

  return (
    <div className={embedded ? 'w-full space-y-5' : 'w-full max-w-md p-4 bg-white rounded-2xl space-y-5'}>
        {showHeading && (
            <div className="text-center">
                {heading === 'RestoByte' ? (
                  <h1 className="text-3xl font-bold text-sky-700">
                      Resto<span className="text-amber-500">Byte</span>
                  </h1>
                ) : (
                  <h1 className="text-3xl font-bold text-[#8b2d1d]">{heading}</h1>
                )}
                <p className="text-gray-500 mt-2">{subtitle}</p>
            </div>
        )}

        {success ? (
        <div className="text-center p-4 bg-green-100 text-green-700 rounded-lg">
            <p>{success}</p>
             <Button onClick={onSwitchToLogin} className="mt-4" variant="success">
                Go to Login
            </Button>
        </div>
        ) : (
        <form onSubmit={handleRegister} className="rb-register-form space-y-4">
            <fieldset className="rb-fieldset">
                <legend className="rb-fieldset-legend">Restaurant Details</legend>
                <Input
                    label="Restaurant Name *"
                    id="restaurantName-modal"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required autoFocus leftIcon={<FiHome />}
                />
                <Input
                    label="Restaurant Address *"
                    id="address-modal"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required leftIcon={<FiMapPin />}
                />
            </fieldset>

            <fieldset className="rb-fieldset">
                <legend className="rb-fieldset-legend">Owner / Admin</legend>
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
            </fieldset>

            <fieldset className="rb-fieldset">
                <legend className="rb-fieldset-legend">Account Credentials</legend>
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
            </fieldset>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button
            type="submit"
            className="w-full !py-3 !text-base"
            leftIcon={<FiUserPlus />}
            isLoading={isLoading}
            disabled={isLoading}
            >
            {isLoading ? 'Registering...' : submitLabel}
            </Button>
        </form>
        )}

        <div className="text-center text-xs text-gray-400 pt-4 border-t">
            <p>Already have an account? <button type="button" onClick={onSwitchToLogin} className="font-semibold text-amber-600 hover:underline">Sign in here</button></p>
        </div>
    </div>
  );
};

export default RegisterPage;
