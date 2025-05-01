"use client";

import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import BottomNav from '@/components/bottom-nav'; // Import BottomNav

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isTokenSet } = useAuth();
  const router = useRouter();

  // Use useEffect to check auth state only on the client-side after mount
  useEffect(() => {
    // Redirect to login if token is not set and check is done on client
    if (typeof window !== 'undefined' && !isTokenSet) {
      router.push('/login');
    }
  }, [isTokenSet, router]);

  // Show loading or placeholder while checking auth state or redirecting
  if (typeof window !== 'undefined' && !isTokenSet) {
     // You might want to show a loading indicator here
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }


  return (
    <div className="flex flex-col min-h-screen">
        {/* Main content takes up available space, with padding at the bottom to avoid overlapping with BottomNav */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24"> {/* Increased pb-24 for larger bottom nav space */}
          {children}
        </main>
        {/* Bottom navigation */}
        <BottomNav />
    </div>
  );
}
