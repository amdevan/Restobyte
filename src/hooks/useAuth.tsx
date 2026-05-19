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
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const message =
          (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string' && (err as any).message) ||
          `Login failed (${res.status}).`;
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
      const message =
        error instanceof Error
          ? `Network error. Check API URL and backend is running. (${error.message})`
          : 'Network error. Check API URL and backend is running.';
      return { success: false, message };
    }
  }, [navigate]);
  
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

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const message =
          (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string' && (err as any).message) ||
          `Registration failed (${res.status}).`;
        return { success: false, message };
      }

      await res.json().catch(() => null);
      return { success: true, message: 'Registration successful! Please login.' };
    } catch (error) {
      const message =
        error instanceof Error
          ? `Network error. Check API URL and backend is running. (${error.message})`
          : 'Network error. Check API URL and backend is running.';
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (username: string, password: string, restaurantName: string, fullName: string, mobile: string, address: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tenants`, {
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
        const err = await res.json().catch(() => null);
        const message =
          (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string' && (err as any).message) ||
          `Registration failed (${res.status}).`;
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
      const message =
        error instanceof Error
          ? `Network error. Check API URL and backend is running. (${error.message})`
          : 'Network error. Check API URL and backend is running.';
      return { success: false, message };
    }
  }, []);

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
