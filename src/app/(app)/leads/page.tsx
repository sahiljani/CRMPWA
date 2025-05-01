"use client";

import type { Lead } from '@/services/borderiq-crm';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getAllLeads, searchLeads, deleteLead, updateLead, leadStatuses } from '@/services/borderiq-crm'; // Import leadStatuses and updateLead
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Search, Trash2, Edit, Loader2, ChevronDown } from 'lucide-react'; // Added Check icon
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card"; // Keep Card for structure
import { Badge } from "@/components/ui/badge"; // Import Badge for status display
import { cn } from '@/lib/utils'; // Import cn for conditional classes


export default function LeadsPage() {
  const { authToken } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track deleting lead ID
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null); // Track updating lead ID

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
        <Link href="/leads/new" passHref>
          {/* Increased button size */}
          <Button size="lg" className="rounded-full h-12 px-6 text-base">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Lead
          </Button>
        </Link>
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
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead className="w-[30%] hidden md:table-cell">Contact</TableHead>
                <TableHead className="w-[20%]">Status</TableHead>
                <TableHead className="w-[10%] text-right">
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
                    <TableCell className="font-medium py-4 text-base"> {/* Increased text size & padding */}
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
                                        "md:w-auto md:rounded-full", // Auto width on medium screens and up, full round
                                        isUpdatingStatus === lead.id ? "opacity-50 cursor-not-allowed" : "hover:bg-accent hover:text-accent-foreground",
                                        // Use Badge variant colors for background/text
                                        `bg-${getStatusBadgeVariant(lead.status)}/10 text-${getStatusBadgeVariant(lead.status)}-foreground border-${getStatusBadgeVariant(lead.status)}/40`
                                    )}
                                    // Example direct style application (less ideal than Tailwind variants)
                                    // style={{
                                    //     borderColor: `hsl(var(--${getStatusBadgeVariant(lead.status)}-border, var(--border)))`,
                                    //     backgroundColor: `hsla(var(--${getStatusBadgeVariant(lead.status)}-hsl, 0 0% 0%) / 0.1)`, // Use HSL with alpha
                                    //     color: `hsl(var(--${getStatusBadgeVariant(lead.status)}-foreground, var(--foreground)))`,
                                    // }}
                                >
                                    {isUpdatingStatus === lead.id ? (
                                        <>
                                         <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                         Updating...
                                        </>
                                    ) : (
                                        <>
                                        <Badge variant={getStatusBadgeVariant(lead.status)} className="pointer-events-none mr-1 !p-0 !bg-transparent !border-none !text-current"> {/* Hide badge styles, use button style */}
                                            {getStatusName(lead.status)}
                                        </Badge>
                                        <ChevronDown className="h-4 w-4 opacity-60" />
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
                    <TableCell className="py-4 text-right">
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
