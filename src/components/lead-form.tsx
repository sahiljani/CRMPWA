"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Lead, CreateLeadData, UpdateLeadData } from '@/services/borderiq-crm';
import { leadSources, leadStatuses, assignees, countries } from '@/services/borderiq-crm'; // Import helper data
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Define Zod schema for validation
const leadFormSchema = z.object({
  name: z.string().min(2, { message: "Lead name must be at least 2 characters." }),
  source: z.string().min(1, { message: "Please select a lead source." }),
  status: z.string().min(1, { message: "Please select a lead status." }),
  assigned: z.string().min(1, { message: "Please assign this lead." }),
  company: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal('')), // Allow empty string
  phonenumber: z.string().optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')), // Allow empty string
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(), // Assuming tags are comma-separated string
  // Add other optional fields as needed based on CreateLeadData/UpdateLeadData
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  initialData?: Lead | null; // For editing existing lead
  onSubmit: (data: CreateLeadData | UpdateLeadData) => Promise<void>;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
}

export default function LeadForm({ initialData, onSubmit, isSubmitting, mode }: LeadFormProps) {

  // Map initialData (Lead type) to form default values (LeadFormValues type)
  const defaultValues: Partial<LeadFormValues> = initialData ? {
    name: initialData.name || '',
    source: initialData.source || '',
    status: initialData.status || '',
    assigned: initialData.assigned || '',
    company: initialData.company || '',
    title: initialData.title || '',
    email: initialData.email || '',
    phonenumber: initialData.phonenumber || '',
    website: initialData.website || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zip: initialData.zip || '',
    country: initialData.country || '',
    description: initialData.description || '',
    tags: initialData.tags || '', // Adjust if tags format is different
  } : {};


  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues,
     mode: "onChange", // Validate on change
  });

   const handleSubmit = (values: LeadFormValues) => {
        // The data structure for create/update is the same based on the schema mapping
        // Let the calling component handle the final structure if needed (e.g., removing undefined fields)
        onSubmit(values as CreateLeadData | UpdateLeadData);
    };


  return (
    <Card className="rounded-lg shadow-md">
       <CardHeader>
           <CardTitle>{mode === 'create' ? 'Add New Lead' : 'Edit Lead'}</CardTitle>
           <CardDescription>
               {mode === 'create' ? 'Fill in the details for the new lead.' : `Editing lead: ${initialData?.name || ''}`}
           </CardDescription>
        </CardHeader>
        <CardContent>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6 md:grid-cols-2">

             {/* Required Fields Group */}
              <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Lead Name *</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter lead name" {...field} className="rounded-md" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} className="rounded-md" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Source *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="rounded-md">
                                <SelectValue placeholder="Select lead source" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {leadSources.map(source => (
                                <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="rounded-md">
                                <SelectValue placeholder="Select lead status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {leadStatuses.map(status => (
                                <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="assigned"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Assigned To *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="rounded-md">
                                    <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {assignees.map(assignee => (
                                    <SelectItem key={assignee.id} value={assignee.id}>{assignee.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
              </div>


              {/* Contact Info Group */}
               <div className="md:col-span-2 border-t pt-6 mt-4">
                 <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                 <div className="grid gap-4 md:grid-cols-3">
                   <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title / Position</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., CEO, Manager" {...field} className="rounded-md" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} className="rounded-md" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="phonenumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter phone number" {...field} className="rounded-md" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                        <FormItem className="md:col-span-1">
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                            <Input type="url" placeholder="https://example.com" {...field} className="rounded-md" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                </div>

              {/* Address Info Group */}
              <div className="md:col-span-2 border-t pt-6 mt-4">
                  <h3 className="text-lg font-medium mb-4">Address Details</h3>
                   <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter street address" {...field} className="rounded-md" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter city" {...field} className="rounded-md" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter state or province" {...field} className="rounded-md" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Zip / Postal Code</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter zip/postal code" {...field} className="rounded-md" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Country</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="rounded-md">
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {countries.map(country => (
                                    <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                   </div>
                </div>


                {/* Other Details Group */}
                <div className="md:col-span-2 border-t pt-6 mt-4">
                   <h3 className="text-lg font-medium mb-4">Other Details</h3>
                    <div className="grid gap-4">
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="Add any relevant notes or description about the lead."
                                    className="resize-none rounded-md"
                                    {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Brief summary or details about this lead.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                          <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tags</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., interested, follow-up, high-priority" {...field} className="rounded-md" />
                                </FormControl>
                                 <FormDescription>
                                    Comma-separated tags for categorization.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                    </div>
                </div>


              <div className="md:col-span-2 flex justify-end pt-6 border-t mt-4">
                  <Button type="submit" disabled={isSubmitting || !form.formState.isValid} className="rounded-full">
                  {isSubmitting ? (
                      <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === 'create' ? 'Adding...' : 'Saving...'}
                      </>
                  ) : (
                      mode === 'create' ? 'Add Lead' : 'Save Changes'
                  )}
                  </Button>
              </div>
            </form>
          </Form>
        </CardContent>
    </Card>
  );
}
