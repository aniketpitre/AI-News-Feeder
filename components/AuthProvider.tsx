'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from '@/lib/firebase';
import { Button } from './ui/button';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const isAdmin = user?.email === 'pitreaniket@gmail.com' && user?.emailVerified;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: !!isAdmin, login, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
