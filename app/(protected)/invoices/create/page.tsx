"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { apiClient, UserResponse, Project } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import FastClientWidget from '@/components/widgets/FastClientWidget';
import { PlusCircle, Trash2, ArrowLeft, Plus } from 'lucide-react';

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be positive"),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().min(1, "Project is required"),
  dueDate: z.string().min(1, "Due date is required"),
  taxes: z.coerce.number().min(0, "Taxes must be 0 or greater").max(100, "Taxes cannot exceed 100%"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const CreateInvoicePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [clientUsers, setClientUsers] = useState<Array<{id: string; name: string; email?: string}>>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFastClientWidget, setShowFastClientWidget] = useState(false);

  // Check permissions
  const canCreate = hasPermission(user?.role!, 'invoices', 'create');

  // Redirect if user doesn't have permission to create invoices
  useEffect(() => {
    if (user && !canCreate) {
      router.push('/invoices');
      return;
    }
  }, [user, canCreate, router]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: '',
      projectId: '',
      dueDate: '',
      taxes: 0,
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  // Set automatic due date (7 days from today)
  useEffect(() => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 7);
    
    form.setValue('dueDate', dueDate.toISOString().split('T')[0]);
  }, [form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [clientProfiles, projectData] = await Promise.all([
        apiClient.getClients(),
        apiClient.getProjects(),
      ]);
      
      // Mapear perfiles de clientes a formato compatible
      const clientUsersFormatted = clientProfiles.map((profile: any) => ({
        id: profile.userId || profile.id, // Use userId for invoice creation
        name: profile.companyName || profile.user?.name || 'Unnamed Client',
        email: profile.user?.email || ''
      }));
      
      setClientUsers(clientUsersFormatted);
      setProjects(projectData);
    } catch (err) {
      console.error("Failed to fetch clients or projects", err);
      setError("Failed to load initial data.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFastClientCreated = (client: { id: string; name: string }) => {
    // Refresh clients list to include the new fast client
    fetchData();
    form.setValue('clientId', client.id);
    setShowFastClientWidget(false);
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    if (!user) return;

    const formattedData = {
      ...data,
      items: data.items.map(item => ({
        ...item,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      })),
      taxes: Number(data.taxes),
      issueDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT' as const,
    };

    try {
      await apiClient.createInvoice(formattedData);
      router.push('/invoices');
    } catch (err) {
      setError('Failed to create invoice.');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading...</div>
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Create New Invoice</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Fill out the form to create a new invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <div className="space-y-3">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clientUsers.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name} {client.email && `(${client.email})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Fast Client Widget Toggle */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-palero-navy2">
                              Need to create a new client?
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowFastClientWidget(!showFastClientWidget)}
                              className="border-palero-teal1/30 text-palero-teal1 hover:bg-palero-teal1/10"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Quick Client
                            </Button>
                          </div>
                          
                          {/* Fast Client Widget */}
                          {showFastClientWidget && (
                            <FastClientWidget
                              onClientCreated={handleFastClientCreated}
                              onError={(error) => setError(error)}
                              className="mt-2"
                            />
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch('clientId')}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects
                              .filter(p => p.clientId === form.watch('clientId'))
                              .map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            max="100" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Invoice Items</h3>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end space-x-2 md:space-x-4 p-4 border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="flex-grow">
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Description of the service or product" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} placeholder="1" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit Price</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} placeholder="0.00" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>

                {/* Invoice Summary */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Invoice Summary</h3>
                    <div className="flex justify-end">
                        <div className="text-right space-y-2">
                            {(() => {
                                const items = form.watch('items') || [];
                                const subtotal = items.reduce((sum, item) => 
                                    sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
                                const taxRate = Number(form.watch('taxes') || 0);
                                const taxAmount = subtotal * taxRate / 100;
                                const total = subtotal + taxAmount;
                                
                                return (
                                    <>
                                        <p className="text-muted-foreground">Subtotal: ${subtotal.toFixed(2)}</p>
                                        <p className="text-muted-foreground">Taxes ({taxRate.toFixed(2)}%): ${taxAmount.toFixed(2)}</p>
                                        <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="submit">Create Invoice</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
    </div>
  );
};

export default CreateInvoicePage;
