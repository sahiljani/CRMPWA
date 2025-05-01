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
import { PlusCircle, MoreHorizontal, Search, Trash2, Edit, Loader2, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card"; // Import Card component

type SortKey = keyof Lead | '';
type SortDirection = 'asc' | 'desc';

export default function LeadsPage() {
  const { authToken } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('dateadded'); // Default sort
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default direction
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
       // If search term is empty, fetch all leads again
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
      // Optionally revert to all leads or show an empty state
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!authToken) return;
    setIsDeleting(id); // Indicate which lead is being deleted
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
        setIsDeleting(null); // Reset deleting state
    }
  };

  useEffect(() => {
    fetchLeads();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]); // Re-fetch if auth token changes


  const sortedLeads = useMemo(() => {
    if (!sortKey) return leads;

    return [...leads].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      // Handle potential null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      // Basic comparison for strings and numbers
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [leads, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
     if (!key) return;
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, authToken]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <Link href="/leads/new" passHref>
          <Button className="rounded-full">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Lead
          </Button>
        </Link>
      </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leads by name, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Update search term directly
            className="pl-10 pr-4 py-2 rounded-full border bg-background shadow-sm"
          />
        </div>


      <Card className="rounded-lg shadow-md overflow-hidden">
         <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                    Name {sortKey === 'name' && <ArrowUpDown className="h-3 w-3" />}
                </div>
                </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('company')}>
                 <div className="flex items-center gap-1">
                    Company {sortKey === 'company' && <ArrowUpDown className="h-3 w-3" />}
                 </div>
                </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                 <div className="flex items-center gap-1">
                     Status {sortKey === 'status' && <ArrowUpDown className="h-3 w-3" />}
                 </div>
                </TableHead>
              <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/50" onClick={() => handleSort('source')}>
                 <div className="flex items-center gap-1">
                     Source {sortKey === 'source' && <ArrowUpDown className="h-3 w-3" />}
                 </div>
                </TableHead>
              <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted/50" onClick={() => handleSort('dateadded')}>
                 <div className="flex items-center gap-1">
                     Date Added {sortKey === 'dateadded' && <ArrowUpDown className="h-3 w-3" />}
                 </div>
                </TableHead>
               <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/50" onClick={() => handleSort('assigned')}>
                   <div className="flex items-center gap-1">
                       Assigned To {sortKey === 'assigned' && <ArrowUpDown className="h-3 w-3" />}
                   </div>
                </TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="mt-2 text-muted-foreground">Loading leads...</p>
                </TableCell>
              </TableRow>
            ) : sortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No leads found. {searchTerm ? 'Try adjusting your search.' : ''}
                </TableCell>
              </TableRow>
            ) : (
              sortedLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                  <TableCell>{lead.company || '-'}</TableCell>
                  <TableCell>{lead.status || '-'}</TableCell> {/* TODO: Map status ID to name */}
                  <TableCell className="hidden md:table-cell">{lead.source || '-'}</TableCell> {/* TODO: Map source ID to name */}
                  <TableCell className="hidden lg:table-cell">
                    {lead.dateadded ? new Date(lead.dateadded).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{lead.assigned || '-'}</TableCell> {/* TODO: Map assignee ID to name */}
                  <TableCell>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting === lead.id}>
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
