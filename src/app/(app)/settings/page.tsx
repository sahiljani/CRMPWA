"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Save } from 'lucide-react';

export default function SettingsPage() {
    const { authToken, setAuthToken } = useAuth();
    const [tokenInput, setTokenInput] = useState(authToken || '');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = () => {
        setIsSaving(true);
        // Basic validation - could add more robust check here if needed
        if (!tokenInput.trim()) {
             toast({
                variant: "destructive",
                title: "Invalid Token",
                description: "API Token cannot be empty.",
            });
             setIsSaving(false);
            return;
        }

        try {
            setAuthToken(tokenInput);
             toast({
                title: "Settings Saved",
                description: "Your API Token has been updated.",
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error Saving Settings",
                description: error instanceof Error ? error.message : "Could not save the token.",
            });
        } finally {
             setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <Card className="rounded-lg shadow-md">
                <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>Manage your BorderIQ CRM API Token.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="api-token" className="flex items-center">
                           <KeyRound className="w-4 h-4 mr-2"/> API Token
                        </Label>
                        <Input
                            id="api-token"
                            type="password" // Keep it masked
                            placeholder="Enter your BorderIQ API Token"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            className="rounded-md"
                        />
                        <p className="text-xs text-muted-foreground">
                            Changes will be saved locally in your browser.
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="rounded-full">
                         <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Token'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
