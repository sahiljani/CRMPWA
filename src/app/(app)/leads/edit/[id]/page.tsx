"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getLead, updateLead } from '@/services/borderiq-crm';
import type { Lead, UpdateLeadData } from '@/services/borderiq-crm';
import LeadForm from '@/components/lead-form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Keep Card for overall page structure


// Define the type for the simplified data received from the form
type SimplifiedLeadData = {
    name: string;
    phonenumber?: string;
};

export default function EditLeadPage() {
  const { authToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leadId = params.id as string; // Get lead ID from route params

  useEffect(() => {
    const fetchLeadData = async () => {
      if (!authToken || !leadId) return;
      setIsLoading(true);
      try {
        const fetchedLead = await getLead(authToken, leadId);
        setLead(fetchedLead);
      } catch (error) {
        console.error("Failed to fetch lead data:", error);
        toast({
          variant: "destructive",
          title: "Error Fetching Lead",
          description: error instanceof Error ? error.message : "Could not load lead data.",
        });
        // Optionally redirect back if lead not found or error occurs
         router.push('/leads');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeadData();
  }, [authToken, leadId, toast, router]);

  const handleSubmit = async (data: SimplifiedLeadData) => {
    if (!authToken || !leadId || !lead) {
        toast({ variant: "destructive", title: "Error", description: "Cannot update lead data." });
        return;
    };
    setIsSubmitting(true);

    try {
        // Merge the updated fields (name, phonenumber) with the existing lead data
        const fullUpdateData: UpdateLeadData = {
            ...lead, // Spread existing lead data
            name: data.name, // Update name
            phonenumber: data.phonenumber || undefined, // Update phone number (or set to undefined if empty)
            // Ensure mandatory fields are present (they should be from the fetched lead)
            source: lead.source || '5', // Fallback if somehow missing
            status: lead.status || '1', // Fallback if somehow missing
            assigned: lead.assigned || '1', // Fallback if somehow missing
        };

         // Filter out empty optional fields if needed by API, but keep required ones
         const payload: UpdateLeadData = Object.entries(fullUpdateData).reduce((acc, [key, value]) => {
            // Keep mandatory fields even if potentially empty (API should handle validation)
            const mandatoryFields = ['name', 'source', 'status', 'assigned'];
            if (mandatoryFields.includes(key) || (value !== '' && value !== undefined && value !== null)) {
                acc[key as keyof UpdateLeadData] = value;
            }
            return acc;
        }, {} as UpdateLeadData);


      await updateLead(authToken, leadId, payload);
      toast({
        title: "Lead Updated",
        description: `Lead "${data.name}" has been successfully updated.`,
      });
      router.push('/leads'); // Redirect to leads list after successful update
    } catch (error) {
      console.error("Failed to update lead:", error);
       toast({
        variant: "destructive",
        title: "Error Updating Lead",
        description: error instanceof Error ? error.message : "Could not update the lead.",
      });
       setIsSubmitting(false); // Keep form enabled on error
    }
     // Only set to false on error, redirect handles unmounting otherwise
  };

  if (isLoading) {
    return (
       <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading lead details...</p>
       </div>
    );
  }

   if (!lead) {
     // This case might be handled by the redirect in fetchLeadData error handling,
     // but it's good practice to have a fallback.
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] gap-4">
             <p className="text-destructive">Could not load lead data.</p>
             <Link href="/leads" passHref legacyBehavior>
                 <Button variant="outline">Back to Leads</Button>
             </Link>
        </div>
        );
  }


  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto"> {/* Center and constrain width */}
        <div className="flex items-center gap-4 mb-4">
            <Link href="/leads" passHref legacyBehavior>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Leads</span>
                </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-semibold">Edit Lead</h1>
      </div>
        {/* Use Card for the form section */}
       <Card className="rounded-lg shadow-md">
            <CardHeader>
                <CardTitle>Edit Lead Details</CardTitle>
                <CardDescription>Modify the lead's name or contact number below.</CardDescription>
            </CardHeader>
            <CardContent>
                 <LeadForm
                    initialData={lead}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    mode="edit"
                 />
            </CardContent>
       </Card>
    </div>
  );
}


    