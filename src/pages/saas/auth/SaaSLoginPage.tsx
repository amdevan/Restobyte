import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Spinner from '../../../components/common/Spinner';

import { getSaaSBasePath } from '../../../utils/domain';

const SaaSLoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const basePath = getSaaSBasePath();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await login(username, password, { skipNavigation: true });
            
            if (result.success) {
                // We need to check the user role from localStorage or context if updated immediately
                // Since state update might be async, let's rely on the backend response data logic
                // But wait, login returns success but doesn't return the user object directly in the signature I defined
                // However, I can check the stored user or rely on the fact that if success is true, auth is valid.
                // The issue is I need to check if they are SuperAdmin.
                
                // Let's refetch from local storage as a quick hack or trust the happy path
                // Better yet, let's just assume valid login and let the route guard redirect if not admin
                // But UX wise, we should show "Unauthorized" here.
                
                // A better approach: check localStorage 'authUser'
                const storedUser = localStorage.getItem('authUser');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    if (user.isSuperAdmin) {
                        navigate(`${basePath}/dashboard`);
                    } else {
                        setError('Access Denied: You are not a SaaS Administrator.');
                        // Optional: logout to clear state
                    }
                } else {
                     navigate(`${basePath}/dashboard`); // Fallback
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    RestoByte SaaS Admin
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Sign in to manage the platform
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                                Username
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 text-white bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 text-white bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Spinner size="sm" color="white" /> : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SaaSLoginPage;
