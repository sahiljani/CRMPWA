"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

interface AuthContextType {
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  isTokenSet: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load token from localStorage on initial client-side render
  useEffect(() => {
    const storedToken = localStorage.getItem('borderiq-authtoken');
    if (storedToken) {
      setAuthTokenState(storedToken);
    }
    setIsInitialized(true);
  }, []);

  const setAuthToken = (token: string | null) => {
    setAuthTokenState(token);
    if (token) {
      localStorage.setItem('borderiq-authtoken', token);
    } else {
      localStorage.removeItem('borderiq-authtoken');
    }
  };

  const isTokenSet = useMemo(() => !!authToken, [authToken]);

  // Prevent rendering children until token is loaded from localStorage
  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ authToken, setAuthToken, isTokenSet }}>
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
