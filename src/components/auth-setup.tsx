"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function AuthSetup({ children }: { children: React.ReactNode }) {
  const { isTokenSet } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only run this check on the client-side after the component has mounted
    // and the auth state has potentially been updated from localStorage.
    if (typeof window !== 'undefined' && !isTokenSet) {
      router.push('/login');
    }
  }, [isTokenSet, router]);

  // Render children only if the token is set (or while checking on the server/initial render)
  // Or render a loading state while redirecting
  if (typeof window !== 'undefined' && !isTokenSet) {
    return <div className="flex justify-center items-center h-screen">Redirecting to login...</div>; // Or a loading spinner
  }

  return <>{children}</>;
}
