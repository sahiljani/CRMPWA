"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from 'lucide-react'; // Using KeyRound icon

export default function LoginPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthToken } = useAuth();
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!tokenInput.trim()) {
      setError('Please enter your API token.');
      setIsLoading(false);
      return;
    }

    // Basic validation (you might want more robust validation)
    // For now, we just set the token and assume it's valid.
    // A better approach would be to make a test API call here.
    try {
        // Simulate API validation (optional)
        // const isValid = await validateToken(tokenInput); // Implement this function if needed
        // if (!isValid) throw new Error("Invalid API Token");

        setAuthToken(tokenInput);
        router.push('/'); // Redirect to dashboard on successful "login"

    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {/* Simple SVG logo */}
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
               <path d="M16 2L2 8.5V23.5L16 30L30 23.5V8.5L16 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 8.5L16 15L30 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 30V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M22 12L16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 12L16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M30 23.5L16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 23.5L16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Leads Navigator</CardTitle>
          <CardDescription>Enter your BorderIQ CRM API Token to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-token" className="flex items-center">
                <KeyRound className="w-4 h-4 mr-2"/> API Token
              </Label>
              <Input
                id="api-token"
                type="password"
                placeholder="Enter your token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                required
                className="rounded-md"
              />
            </div>
             {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Login'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground">
            Find your token in the BorderIQ admin area.
        </CardFooter>
      </Card>
    </div>
  );
}
