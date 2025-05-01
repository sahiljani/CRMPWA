
"use client";

import type { Lead } from '@/services/borderiq-crm';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getAllLeads, searchLeads, deleteLead } from '@/services/borderiq-crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Search, Trash2, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Keep Card for structure

// Remove SortKey and SortDirection types as we are only showing Name now
// type SortKey = keyof Lead | '';
// type SortDirection = 'asc' | 'desc';

export default function LeadsPage() {
  const { authToken } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Remove sorting state
  // const [sortKey, setSortKey] = useState<SortKey>('dateadded');
  // const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track deleting lead ID

  const fetchLeads = async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const fetchedLeads = await getAllLeads(authToken);
      setLeads(fetchedLeads);
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
  };

  const handleSearch = async (term: string) => {
    if (!authToken) return;
    setSearchTerm(term);
    setIsLoading(true);
    try {
       if (!term.trim()) {
            await fetchLeads();
        } else {
            const results = await searchLeads(authToken, term);
            setLeads(results);
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
        description: `Lead with ID ${id} has been successfully deleted.`,
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

  useEffect(() => {
    fetchLeads();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);


  // Filter leads based on search term client-side after fetch/initial load or after search API call
   const filteredLeads = useMemo(() => {
       if (!searchTerm) return leads;
       return leads.filter(lead =>
           lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
           // Add other fields to search if needed
       );
   }, [leads, searchTerm]);

  // Remove sorting logic
  // const sortedLeads = useMemo(() => { ... });
  // const handleSort = (key: SortKey) => { ... };

  // Debounce search input - Keep this
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // We might not need handleSearch API call if filtering client-side,
      // but let's keep it in case the API search is more performant for large datasets.
      // If client-side filtering is preferred, remove the handleSearch call here.
      // handleSearch(searchTerm); // Keep if API search is desired
    }, 500);

    return () => clearTimeout(delayDebounceFn);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, authToken]);


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
            className="pl-10 pr-4 py-2 rounded-full border bg-background shadow-sm"
          />
        </div>


      <Card className="rounded-lg shadow-md overflow-hidden">
         <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Simplified Header */}
              <TableHead>Name</TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                {/* Adjusted colSpan */}
                <TableCell colSpan={2} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="mt-2 text-muted-foreground">Loading leads...</p>
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? ( // Use filteredLeads
              <TableRow>
                 {/* Adjusted colSpan */}
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                  No leads found. {searchTerm ? 'Try adjusting your search.' : 'Add a new lead!'}
                </TableCell>
              </TableRow>
            ) : (
               // Use filteredLeads
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  {/* Simplified Row */}
                  <TableCell className="font-medium py-3">{lead.name || '-'}</TableCell>
                  <TableCell className="py-3">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting === lead.id} className="h-8 w-8">
                            {isDeleting === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                           <Link href={`/leads/edit/${lead.id}`} passHref legacyBehavior>
                             <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                             </DropdownMenuItem>
                           </Link>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
      </Card>
    </div>
  );
}
