import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';

// Frontend user type that matches what the API returns (without password)
type AuthUser = {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
};

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is stored in localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('tanihitung_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Validate stored user data
        if (parsedUser && parsedUser.id && parsedUser.email) {
          setUser({
            ...parsedUser,
            created_at: new Date(parsedUser.created_at),
            updated_at: new Date(parsedUser.updated_at)
          });
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('tanihitung_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await trpc.auth.login.mutate({ email, password });
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('tanihitung_user', JSON.stringify(response.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await trpc.auth.register.mutate({ name, email, password });
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('tanihitung_user', JSON.stringify(response.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tanihitung_user');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        register, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}