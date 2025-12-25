import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { API_BASE_URL } from '../config';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, password: string, restaurantName: string, fullName: string, mobile: string, address: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = `${API_BASE_URL}/auth`;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

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

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);

        // Navigate based on user role
        if (data.user.isSuperAdmin) {
            navigate('/saas/dashboard');
        } else {
            navigate('/app/home');
        }
        return { success: true, message: 'Login successful!' };
      } else {
        return { success: false, message: data.message || 'Invalid username or password.' };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }, [navigate]);
  
  const register = useCallback(async (username: string, password: string, restaurantName: string, fullName: string, mobile: string, address: string) => {
      try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                name: fullName,
                mobile,
                address,
                // In a real SaaS app, we'd create an outlet here with restaurantName
                // For now, we just pass it or ignore it, maybe set as outletId if we generated one
            }),
        });

        const data = await response.json();

        if (response.ok) {
             // Automatically login or ask to login
             // For now, let's just return success
             return { success: true, message: 'Registration successful! Please login.', user: data.user };
        } else {
            return { success: false, message: data.message || 'Registration failed.' };
        }

      } catch (error) {
          console.error("Registration error:", error);
          return { success: false, message: 'Network error. Please try again.' };
      }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    navigate('/');
  }, [navigate]);

  const value = { isAuthenticated, user, login, register, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
