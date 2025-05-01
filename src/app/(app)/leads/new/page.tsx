"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { addLead } from '@/services/borderiq-crm';
import type { CreateLeadData } from '@/services/borderiq-crm';
import LeadForm from '@/components/lead-form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default function AddLeadPage() {
  const { authToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateLeadData) => {
    if (!authToken) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You are not logged in." });
        return;
    };
    setIsSubmitting(true);

    try {
      // Filter out empty optional fields before sending to API, if necessary
       const payload: CreateLeadData = Object.entries(data).reduce((acc, [key, value]) => {
            if (value !== '' && value !== undefined && value !== null) {
                acc[key as keyof CreateLeadData] = value;
            }
            return acc;
        }, {} as CreateLeadData);


      await addLead(authToken, payload);
      toast({
        title: "Lead Created",
        description: `Lead "${data.name}" has been successfully added.`,
      });
      router.push('/leads'); // Redirect to leads list after successful creation
    } catch (error) {
      console.error("Failed to add lead:", error);
       toast({
        variant: "destructive",
        title: "Error Creating Lead",
        description: error instanceof Error ? error.message : "Could not add the lead.",
      });
       setIsSubmitting(false); // Keep the form enabled if there was an error
    }
    // No finally block setting isSubmitting to false here, because redirection handles unmounting.
    // Only set to false on error.
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
            <Link href="/leads" passHref legacyBehavior>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Leads</span>
                </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-semibold">Add New Lead</h1>
      </div>
      <LeadForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        mode="create"
      />
    </div>
  );
}
