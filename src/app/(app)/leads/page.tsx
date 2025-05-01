"use client";

import type { Lead, CreateLeadData } from '@/services/borderiq-crm'; // Added CreateLeadData
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getAllLeads, searchLeads, deleteLead, updateLead, leadStatuses, addLead } from '@/services/borderiq-crm'; // Import leadStatuses, updateLead, addLead
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Search, Trash2, Edit, Loader2, ChevronDown } from 'lucide-react'; // Added Check icon
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog"; // Import Dialog components
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import LeadForm from '@/components/lead-form'; // Import LeadForm

// Define the type for the simplified data received from the form
type SimplifiedLeadData = {
    name: string;
    phonenumber?: string;
};


export default function LeadsPage() {
  const { authToken } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track deleting lead ID
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null); // Track updating lead ID
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // State for add lead modal
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false); // State for add lead submission


  const getStatusName = (statusId: string): string => {
    return leadStatuses.find(s => s.id === statusId)?.name || 'Unknown';
  };

  // Function to get badge variant based on status name (customize as needed)
  const getStatusBadgeVariant = (statusId: string): "default" | "secondary" | "destructive" | "outline" | "info" | "success" | "warning" => {
      const statusName = getStatusName(statusId).toLowerCase();
      if (statusName === 'won') return 'success'; // Green for 'Won'
      if (statusName === 'lost') return 'destructive'; // Red for 'Lost'
      if (statusName === 'new') return 'secondary'; // Grey for 'New'
      if (statusName === 'contacted') return 'info'; // Blue for 'Contacted'
      if (statusName === 'qualified') return 'default'; // Primary (Orange) for 'Qualified'
      if (statusName === 'proposal sent') return 'info'; // Blue for 'Proposal Sent'
      if (statusName === 'negotiation') return 'warning'; // Yellow/Amber for 'Negotiation'
      return 'outline'; // Default outline for others
  };


  const fetchLeads = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const fetchedLeads = await getAllLeads(authToken);
      // Sort leads by dateadded descending (newest first) by default
      const sorted = fetchedLeads.sort((a, b) => {
          const dateA = a.dateadded ? new Date(a.dateadded).getTime() : 0;
          const dateB = b.dateadded ? new Date(b.dateadded).getTime() : 0;
          return dateB - dateA; // Descending order
      });
      setLeads(sorted);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      toast({
        variant: "destructive",
        title: "Error fetching leads",
        description: error instanceof Error ? error.message : "Could not load leads.",
      });
    } finally {
      setIsLoading(false);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, toast]); // Removed leads from dependencies


  const handleSearch = async (term: string) => {
    if (!authToken) return;
    setSearchTerm(term);
    setIsLoading(true);
    try {
       if (!term.trim()) {
            await fetchLeads();
        } else {
            const results = await searchLeads(authToken, term);
            // Sort search results as well
             const sorted = results.sort((a, b) => {
                const dateA = a.dateadded ? new Date(a.dateadded).getTime() : 0;
                const dateB = b.dateadded ? new Date(b.dateadded).getTime() : 0;
                return dateB - dateA; // Descending order
            });
            setLeads(sorted);
        }
    } catch (error) {
      console.error("Failed to search leads:", error);
       toast({
        variant: "destructive",
        title: "Error searching leads",
        description: error instanceof Error ? error.message : "Could not perform search.",
      });
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!authToken) return;
    setIsDeleting(id);
    try {
      await deleteLead(authToken, id);
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
      toast({
        title: "Lead Deleted",
        description: `Lead has been successfully deleted.`,
      });
    } catch (error) {
      console.error("Failed to delete lead:", error);
       toast({
        variant: "destructive",
        title: "Error Deleting Lead",
        description: error instanceof Error ? error.message : "Could not delete the lead.",
      });
    } finally {
        setIsDeleting(null);
    }
  };

  // Function to handle status update
   const handleStatusUpdate = async (leadId: string, newStatusId: string) => {
        if (!authToken) return;
        const leadToUpdate = leads.find(l => l.id === leadId);
        if (!leadToUpdate) return;

        setIsUpdatingStatus(leadId);

        // Prepare the minimal data needed for the update API call
        const updateData = {
            name: leadToUpdate.name, // Keep existing name
            source: leadToUpdate.source, // Keep existing source
            assigned: leadToUpdate.assigned, // Keep existing assignee
            status: newStatusId, // Set the new status
            // Include other fields from leadToUpdate if the API requires them,
            // even if they are not mandatory for *this* specific update action.
            phonenumber: leadToUpdate.phonenumber || undefined,
            company: leadToUpdate.company || undefined,
            // Add other fields as necessary based on the UpdateLeadData interface and API requirements
        };


        try {
            await updateLead(authToken, leadId, updateData);
            // Update the local state optimistically or refetch
             setLeads(prevLeads =>
                prevLeads.map(lead =>
                    lead.id === leadId ? { ...lead, status: newStatusId } : lead
                )
             );
            toast({
                title: "Status Updated",
                description: `Lead status changed to ${getStatusName(newStatusId)}.`,
            });
        } catch (error) {
            console.error("Failed to update lead status:", error);
            toast({
                variant: "destructive",
                title: "Error Updating Status",
                description: error instanceof Error ? error.message : "Could not update status.",
            });
        } finally {
            setIsUpdatingStatus(null);
        }
    };

  // --- Add Lead Handler (for the modal form) ---
  const handleAddLead = async (data: SimplifiedLeadData) => {
      if (!authToken) {
          toast({ variant: "destructive", title: "Authentication Error", description: "You are not logged in." });
          return;
      };
      setIsSubmittingAdd(true);

      const payload: CreateLeadData = {
          name: data.name,
          phonenumber: data.phonenumber || undefined,
          source: '5', // Default source: 'Other'
          status: '1', // Default status: 'New'
          assigned: '1', // Default assignee: 'Admin User'
      };

      try {
          await addLead(authToken, payload);
          toast({
              title: "Lead Created",
              description: `Lead "${data.name}" has been successfully added.`,
          });
          setIsAddModalOpen(false); // Close modal on success
          await fetchLeads(); // Refetch leads to show the new one
      } catch (error) {
          console.error("Failed to add lead:", error);
          toast({
              variant: "destructive",
              title: "Error Creating Lead",
              description: error instanceof Error ? error.message : "Could not add the lead.",
          });
          // Keep modal open on error
      } finally {
          setIsSubmittingAdd(false);
      }
  };
  // --- End of Add Lead Handler ---


  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]); // Use fetchLeads callback


  // Filter leads based on search term client-side after fetch/initial load or after search API call
   const filteredLeads = useMemo(() => {
       if (!searchTerm) return leads;
       return leads.filter(lead =>
           lead.name?.toLowerCase().includes(searchTerm.toLowerCase())
       );
   }, [leads, searchTerm]);


  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        // Only trigger search if searchTerm is not empty or fetch all if search term is cleared
        if (searchTerm.trim()) {
            handleSearch(searchTerm);
        } else if (!isLoading && !searchTerm) { // Fetch all only if not loading and search is cleared
            fetchLeads();
        }
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
     // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchTerm, authToken]); // Removed fetchLeads dependency to avoid loop when search term is empty


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
             { !isLoading && <p className="text-muted-foreground">Total Leads: {leads.length}</p> }
         </div>
        {/* --- Dialog for Adding New Lead --- */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
                 <Button size="lg" className="rounded-full h-12 px-6 text-base">
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Lead
                 </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>
                        Enter the lead's name and contact number below. Click save when done.
                    </DialogDescription>
                </DialogHeader>
                 {/* Embed the LeadForm here */}
                <LeadForm
                    onSubmit={handleAddLead}
                    isSubmitting={isSubmittingAdd}
                    mode="create"
                    onCancel={() => setIsAddModalOpen(false)} // Add cancel handler
                />
                 {/* Footer can be removed if button is inside LeadForm */}
                {/* <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                     {/* Submit button is now part of LeadForm */}
                {/* </DialogFooter> */}
            </DialogContent>
        </Dialog>
         {/* --- End Dialog --- */}
      </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leads by name..." // Simplified placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full border bg-background shadow-sm text-base" // Increased text size
          />
        </div>


      <Card className="rounded-lg shadow-md overflow-hidden">
         <CardContent className="p-0"> {/* Remove CardContent padding */}
            <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[40%] pl-6">Name</TableHead> {/* Added padding */}
                <TableHead className="w-[30%] hidden md:table-cell">Contact</TableHead>
                <TableHead className="w-[20%]">Status</TableHead>
                <TableHead className="w-[10%] text-right pr-6"> {/* Added padding */}
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading leads...</p>
                    </TableCell>
                </TableRow>
                ) : filteredLeads.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No leads found. {searchTerm ? 'Try adjusting your search.' : 'Add a new lead!'}
                    </TableCell>
                </TableRow>
                ) : (
                filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                    <TableCell className="font-medium py-4 text-base pl-6"> {/* Added padding */}
                        {lead.name || '-'}
                        {/* Show phone number on mobile under the name */}
                        {lead.phonenumber && (
                            <p className="text-sm text-muted-foreground mt-1 md:hidden">{lead.phonenumber}</p>
                        )}
                    </TableCell>
                     <TableCell className="py-4 text-muted-foreground hidden md:table-cell">
                         {lead.phonenumber || '-'}
                     </TableCell>
                    <TableCell className="py-4">
                        {/* Status Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={isUpdatingStatus === lead.id}>
                                <Button
                                    variant="outline" // Use outline variant for the button
                                    size="sm"
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1 h-auto text-sm rounded-md border justify-between w-full", // Full width on mobile, more padding
                                        "md:w-auto md:min-w-[120px] md:rounded-full", // Auto width on medium screens and up, full round, min-width
                                        isUpdatingStatus === lead.id ? "opacity-50 cursor-not-allowed" : "hover:bg-accent hover:text-accent-foreground",
                                         // Manually apply badge-like styles
                                        `bg-${getStatusBadgeVariant(lead.status)}/10 text-${getStatusBadgeVariant(lead.status)}-foreground border-${getStatusBadgeVariant(lead.status)}/40`
                                    )}
                                >
                                    {isUpdatingStatus === lead.id ? (
                                        <>
                                         <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                         Updating...
                                        </>
                                    ) : (
                                        <>
                                        {/* Don't use Badge component inside, apply styles to button */}
                                        <span>{getStatusName(lead.status)}</span>
                                        <ChevronDown className="h-4 w-4 opacity-60 ml-auto" /> {/* Push chevron right */}
                                        </>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={lead.status} onValueChange={(newStatus) => handleStatusUpdate(lead.id, newStatus)}>
                                    {leadStatuses.map((status) => (
                                    <DropdownMenuRadioItem key={status.id} value={status.id} className="text-base cursor-pointer">
                                        {status.name}
                                    </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6"> {/* Added padding */}
                        <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting === lead.id || isUpdatingStatus === lead.id} className="h-8 w-8 rounded-full data-[state=open]:bg-muted">
                                {isDeleting === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href={`/leads/edit/${lead.id}`} passHref legacyBehavior>
                                <DropdownMenuItem className="text-base cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                            </Link>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 text-base cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the lead
                                    "{lead.name}".
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(lead.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
            </div>
         </CardContent> {/* Close CardContent */}
      </Card>
    </div>
  );
}


// --- Add HSL variables for badge colors to globals.css ---
/*
:root {
  // ... other variables
  --default-hsl: var(--primary-hsl); // Assuming primary is orange (e.g., 35 100% 64%)
  --secondary-hsl: 240 4.8% 50%; // Muted Grey HSL
  --destructive-hsl: 4 90% 58%; // Red HSL
  --info-hsl: 210 90% 55%; // Blue HSL
  --success-hsl: 142 76% 36%; // Green HSL
  --warning-hsl: 40 90% 55%; // Amber/Yellow HSL
  --outline-hsl: var(--foreground-hsl); // Use foreground color HSL

  // Define foregrounds for each (can adjust lightness/darkness)
  --default-foreground: hsl(var(--primary-foreground-hsl, 35 100% 10%));
  --secondary-foreground: hsl(0 0% 98%); // Light for dark grey bg
  --destructive-foreground: hsl(0 0% 98%); // Light for red bg
  --info-foreground: hsl(0 0% 98%); // Light for blue bg
  --success-foreground: hsl(0 0% 98%); // Light for green bg
  --warning-foreground: hsl(40 100% 10%); // Dark for yellow bg
  --outline-foreground: hsl(var(--foreground-hsl));
}
.dark {
  // Adjust foregrounds for dark mode if needed
  --secondary-foreground: hsl(0 0% 98%);
  // ... other dark mode adjustments
}

// Then use utility classes in Tailwind (requires setup in tailwind.config.js):
// bg-default/10 text-default-foreground border-default/40
// bg-secondary/10 text-secondary-foreground border-secondary/40
// etc.
*/

// tailwind.config.js adjustments needed for custom status colors:
/*
module.exports = {
  // ... other config
  safelist: [ // Add this to ensure Tailwind generates the classes
    // Add all potential combinations you use
    'bg-default/10', 'text-default-foreground', 'border-default/40',
    'bg-secondary/10', 'text-secondary-foreground', 'border-secondary/40',
    'bg-destructive/10', 'text-destructive-foreground', 'border-destructive/40',
    'bg-info/10', 'text-info-foreground', 'border-info/40',
    'bg-success/10', 'text-success-foreground', 'border-success/40',
    'bg-warning/10', 'text-warning-foreground', 'border-warning/40',
    'bg-outline/10', 'text-outline-foreground', 'border-outline/40',
  ],
  theme: {
    extend: {
      colors: {
        // Define the base HSL colors if needed for Tailwind utilities
        'default-foreground': 'hsl(var(--default-foreground))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        'info-foreground': 'hsl(var(--info-foreground))',
        'success-foreground': 'hsl(var(--success-foreground))',
        'warning-foreground': 'hsl(var(--warning-foreground))',
        'outline-foreground': 'hsl(var(--outline-foreground))',
         // Define base status colors if you want direct utilities like `bg-info`
        info: 'hsl(var(--info-hsl))',
        success: 'hsl(var(--success-hsl))',
        warning: 'hsl(var(--warning-hsl))',
      }
    }
  }
}
*/

    