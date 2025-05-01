"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Lead, CreateLeadData, UpdateLeadData } from '@/services/borderiq-crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Define Zod schema for validation - Simplified
const leadFormSchema = z.object({
  name: z.string().min(2, { message: "Lead name must be at least 2 characters." }),
  phonenumber: z.string().optional(), // Optional phone number
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

// Define combined type for onSubmit prop to accept simplified data structure
type LeadSubmitData = Pick<CreateLeadData & UpdateLeadData, 'name' | 'phonenumber'>;


interface LeadFormProps {
  initialData?: Lead | null; // For editing existing lead
  onSubmit: (data: LeadSubmitData) => Promise<void>; // Adjusted type
  isSubmitting: boolean;
  mode: 'create' | 'edit';
}

export default function LeadForm({ initialData, onSubmit, isSubmitting, mode }: LeadFormProps) {

  // Map initialData (Lead type) to form default values (LeadFormValues type)
  const defaultValues: Partial<LeadFormValues> = initialData ? {
    name: initialData.name || '',
    phonenumber: initialData.phonenumber || '',
  } : {
    name: '',
    phonenumber: '',
  };


  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues,
     mode: "onChange", // Validate on change
  });

   const handleSubmit = (values: LeadFormValues) => {
        // Pass only name and phonenumber to the onSubmit handler
        onSubmit(values);
    };


  return (
    <Card className="rounded-lg shadow-md max-w-lg mx-auto"> {/* Constrain width */}
       <CardHeader>
           <CardTitle>{mode === 'create' ? 'Add New Lead' : 'Edit Lead'}</CardTitle>
           <CardDescription>
               {mode === 'create' ? 'Enter the lead\'s name and phone number.' : `Editing lead: ${initialData?.name || ''}`}
           </CardDescription>
        </CardHeader>
        <CardContent>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6"> {/* Use space-y for simpler layout */}

             {/* Name Field */}
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

                {/* Phone Number Field */}
              <FormField
                    control={form.control}
                    name="phonenumber"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                        <Input placeholder="Enter phone number" {...field} className="rounded-md" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting || !form.formState.isValid} className="rounded-full px-6 py-2 text-base">
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
