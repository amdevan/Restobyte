import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { API_BASE_URL } from '@/config';
import { isSaaSDomain } from '@/utils/domain';
// no local data needed; using backend API

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string, options?: { skipNavigation?: boolean, isPublic?: boolean }) => Promise<{ success: boolean; message: string }>;
  register: (username: string, password: string, restaurantName: string, fullName: string, mobile: string, address: string) => Promise<{ success: boolean; message: string; user?: User }>;
  publicRegister: (name: string, email: string, password: string, outletId?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  const buildHttpErrorMessage = useCallback(async (action: string, url: string, res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    const serverMessage = await (async () => {
      if (contentType.includes('application/json')) {
        const err = await res.json().catch(() => null);
        const msg =
          err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string'
            ? ((err as any).message as string)
            : '';
        return msg;
      }
      const text = await res.text().catch(() => '');
      return text ? text.slice(0, 180) : '';
    })();
    const base = `${action} failed (${res.status}) at ${url}.`;
    return serverMessage ? `${base} ${serverMessage}` : base;
  }, []);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('authUser');
      const token = localStorage.getItem('authToken');
      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to parse auth user from localStorage", error);
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string, options?: { skipNavigation?: boolean, isPublic?: boolean }): Promise<{ success: boolean; message: string }> => {
    try {
      const url = `${API_BASE_URL}/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      if (!res.ok) {
        const message = await buildHttpErrorMessage('Login', url, res);
        return { success: false, message };
      }
      const data = await res.json();
      const authUser: User = {
        id: data.user.id,
        username: data.user.username,
        isSuperAdmin: !!data.user.isSuperAdmin,
        roleId: data.user.roleId || '',
        outletId: data.user.outletId || '',
        isActive: data.user.isActive,
        passwordHash: ''
      };
      setUser(authUser);
      setIsAuthenticated(true);
      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('authToken', data.token);

      if (!options?.skipNavigation) {
        if (options?.isPublic) {
          if (authUser.roleId === 'role-customer') {
            navigate('/customer/dashboard');
          } else {
            navigate('/public/restaurant');
          }
        } else if (authUser.isSuperAdmin) {
          navigate('/saas/dashboard');
        } else {
          navigate('/app/dashboard');
        }
      }
      return { success: true, message: data.message || 'Login successful!' };
    } catch (error) {
      const url = `${API_BASE_URL}/auth/login`;
      const message =
        error instanceof Error
          ? `Network error at ${url}. Check API URL and backend is running. (${error.message})`
          : `Network error at ${url}. Check API URL and backend is running.`;
      return { success: false, message };
    }
  }, [buildHttpErrorMessage, navigate]);
  
  const publicRegister = useCallback(async (name: string, email: string, password: string, outletId?: string) => {
    try {
      const payload = {
        username: email.trim(),
        password: password.trim(),
        name: name.trim(),
        roleId: 'role-customer',
        outletId,
        isSuperAdmin: false
      };

      const url = `${API_BASE_URL}/auth/register`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const message = await buildHttpErrorMessage('Registration', url, res);
        return { success: false, message };
      }

      await res.json().catch(() => null);
      return { success: true, message: 'Registration successful! Please login.' };
    } catch (error) {
      const url = `${API_BASE_URL}/auth/register`;
      const message =
        error instanceof Error
          ? `Network error at ${url}. Check API URL and backend is running. (${error.message})`
          : `Network error at ${url}. Check API URL and backend is running.`;
      return { success: false, message };
    }
  }, [buildHttpErrorMessage]);

  const register = useCallback(async (username: string, password: string, restaurantName: string, fullName: string, mobile: string, address: string) => {
    try {
      const url = `${API_BASE_URL}/tenants`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName,
          fullName,
          mobile,
          address,
          username: username.trim(),
          password: password.trim()
        })
      });
      if (!res.ok) {
        const message = await buildHttpErrorMessage('Registration', url, res);
        return { success: false, message };
      }
      const data = await res.json();
      const newUser: User = {
        id: data.adminUser.id,
        username: data.adminUser.username,
        isSuperAdmin: false,
        roleId: 'role-admin',
        outletId: data.outlet?.id || '',
        isActive: true,
        passwordHash: ''
      };
      return { success: true, message: 'Registration successful! Please login.', user: newUser };
    } catch (error) {
      const url = `${API_BASE_URL}/tenants`;
      const message =
        error instanceof Error
          ? `Network error at ${url}. Check API URL and backend is running. (${error.message})`
          : `Network error at ${url}. Check API URL and backend is running.`;
      return { success: false, message };
    }
  }, [buildHttpErrorMessage]);

  const logout = useCallback(() => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    const path = location.pathname || '/';
    if (isSaaSDomain()) {
      navigate('/login', { replace: true });
      return;
    }
    if (path.startsWith('/saas')) {
      navigate('/saas/login', { replace: true });
      return;
    }
    if (path.startsWith('/customer')) {
      navigate('/public/login', { replace: true });
      return;
    }
    if (path.startsWith('/public')) {
      navigate('/public/restaurant', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  }, [location.pathname, navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, publicRegister, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
