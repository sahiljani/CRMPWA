"use client";

import type { Lead, CreateLeadData, UpdateLeadData } from '@/services/borderiq-crm';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getAllLeads, searchLeads, deleteLead, updateLead, leadStatuses, addLead, defaultAssigneeId, defaultSourceId, defaultStatusId } from '@/services/borderiq-crm'; // Import leadStatuses, updateLead, addLead and defaults
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Search, Trash2, Edit, Loader2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
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

  // Function to get style variant based on status name
  const getStatusVariant = (statusId: string): string => {
      const statusName = getStatusName(statusId).toLowerCase();
      if (statusName === 'won') return 'bg-green-100 text-green-800 border-green-300';
      if (statusName === 'lost') return 'bg-red-100 text-red-800 border-red-300';
      if (statusName === 'new') return 'bg-gray-100 text-gray-800 border-gray-300';
      if (statusName === 'contacted') return 'bg-blue-100 text-blue-800 border-blue-300';
      if (statusName === 'qualified') return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Example yellow
      if (statusName === 'proposal sent') return 'bg-indigo-100 text-indigo-800 border-indigo-300'; // Example indigo
      if (statusName === 'negotiation') return 'bg-orange-100 text-orange-800 border-orange-300'; // Example orange
      return 'bg-white text-gray-600 border-gray-300'; // Default outline style
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
        if (!leadToUpdate) {
             toast({ variant: "destructive", title: "Error", description: "Lead not found." });
             return;
        };

        setIsUpdatingStatus(leadId);

        // Prepare the data needed for the update API call
        // Include all fields required by the API's PUT endpoint
        const updateData: UpdateLeadData = {
            name: leadToUpdate.name, // Keep existing name
            phonenumber: leadToUpdate.phonenumber || undefined, // Keep existing phone or undefined
            source: leadToUpdate.source || defaultSourceId, // Use existing source or default
            assigned: leadToUpdate.assigned || defaultAssigneeId, // Use existing assignee or default
            status: newStatusId, // Set the new status
            // Add other fields from leadToUpdate if the API requires them,
            // Ensure they are part of the UpdateLeadData interface.
            // Example:
            // company: leadToUpdate.company || undefined,
            // address: leadToUpdate.address || undefined,
            // ... etc.
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

      // Only pass name and phonenumber to the addLead function
      // Defaults for source, status, assigned are handled within addLead service function
      const payload: CreateLeadData = {
          name: data.name,
          phonenumber: data.phonenumber || undefined,
           // source, status, assigned will use defaults in the service
      };

      try {
          const result = await addLead(authToken, payload);
          if (result.status) { // Check for success from API response
              toast({
                  title: "Lead Created",
                  description: `Lead "${data.name}" has been successfully added.`,
              });
              setIsAddModalOpen(false); // Close modal on success
              await fetchLeads(); // Refetch leads to show the new one
          } else {
                // Handle API returning success=false
                 toast({
                    variant: "destructive",
                    title: "Error Creating Lead",
                    description: result.message || "Could not add the lead.",
                });
          }
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
       // Assuming the search API call already filtered,
       // but if doing client-side filtering after initial load:
       return leads.filter(lead =>
           lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lead.phonenumber?.includes(searchTerm) // Optional: search by phone too
       );
   }, [leads, searchTerm]);


  // Debounce search input - Trigger API search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        handleSearch(searchTerm); // Call API search directly
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
     // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchTerm, authToken]); // Removed fetchLeads


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
                        Enter the lead's name and contact number.
                    </DialogDescription>
                </DialogHeader>
                 {/* Embed the LeadForm here */}
                <LeadForm
                    onSubmit={handleAddLead}
                    isSubmitting={isSubmittingAdd}
                    mode="create"
                    onCancel={() => setIsAddModalOpen(false)} // Add cancel handler
                />
            </DialogContent>
        </Dialog>
         {/* --- End Dialog --- */}
      </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leads by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full border bg-background shadow-sm text-base"
          />
        </div>


      <Card className="rounded-lg shadow-md overflow-hidden">
         <CardContent className="p-0"> {/* Remove CardContent padding */}
            <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[40%] pl-6">Name</TableHead> {/* Increased width */}
                <TableHead className="w-[30%] hidden md:table-cell">Contact</TableHead>
                <TableHead className="w-[20%]">Status</TableHead>
                <TableHead className="w-[10%] text-right pr-6">
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
                    <TableCell className="font-medium py-4 text-base pl-6">
                        {lead.name || '-'}
                        {/* Show phone number on mobile under the name */}
                        {lead.phonenumber && (
                            <p className="text-sm text-muted-foreground mt-1 md:hidden">{lead.phonenumber}</p>
                        )}
                    </TableCell>
                     <TableCell className="py-4 text-muted-foreground hidden md:table-cell text-base">
                         {lead.phonenumber || '-'}
                     </TableCell>
                    <TableCell className="py-4">
                        {/* Status Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={isUpdatingStatus === lead.id}>
                                <Button
                                    variant="outline" // Use outline variant for the button
                                    size="sm"
                                    className={`flex items-center gap-2 px-3 py-1 h-auto text-sm rounded-md border justify-between w-full md:w-auto md:min-w-[120px] ${getStatusVariant(lead.status)} ${isUpdatingStatus === lead.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`} // Apply dynamic styles
                                >
                                    {isUpdatingStatus === lead.id ? (
                                        <>
                                         <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                         Updating...
                                        </>
                                    ) : (
                                        <>
                                        <span className="font-medium">{getStatusName(lead.status)}</span>
                                        <ChevronDown className="h-4 w-4 opacity-60 ml-auto" />
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
                    <TableCell className="py-4 text-right pr-6">
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
                            {/* Simplified: Removing Edit link as per request */}
                            {/* <Link href={`/leads/edit/${lead.id}`} passHref legacyBehavior>
                                <DropdownMenuItem className="text-base cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                            </Link> */}
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
