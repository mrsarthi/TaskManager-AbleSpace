import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Verify token is still valid and get latest user data
        api.getProfile()
          .then((response) => {
            if (response.success) {
              // Always update with latest data from server (including emailVerified status)
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            }
          })
          .catch(() => {
            localStorage.removeItem('user');
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch {
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    if (response.success) {
      // Refresh profile to get latest emailVerified status from server
      try {
        const profileResponse = await api.getProfile();
        if (profileResponse.success) {
          setUser(profileResponse.data);
          localStorage.setItem('user', JSON.stringify(profileResponse.data));
        } else {
          // Fallback to login response
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch {
        // Fallback to login response if profile fetch fails
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } else {
      throw new Error('Login failed');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await api.register({ email, password, name });
    if (response.success) {
      setUser(response.data);
    } else {
      throw new Error('Registration failed');
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateProfile = async (name: string) => {
    const response = await api.updateProfile({ name });
    if (response.success) {
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } else {
      throw new Error('Profile update failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

