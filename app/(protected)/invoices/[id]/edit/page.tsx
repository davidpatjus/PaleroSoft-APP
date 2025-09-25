"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { apiClient, Invoice, UserResponse, Project } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(1, "Quantity must be at least 1")),
  unitPrice: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0.01, "Unit price must be positive")),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().min(1, "Project is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'VOID']),
  taxes: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0, "Taxes must be 0 or greater").max(100, "Taxes cannot exceed 100%")),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const EditInvoicePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clientUsers, setClientUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check permissions
  const canUpdate = hasPermission(user?.role!, 'invoices', 'update');

  // Redirect if user doesn't have permission to update invoices
  useEffect(() => {
    if (user && !canUpdate) {
      router.push('/invoices');
      return;
    }
  }, [user, canUpdate, router]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: '',
      projectId: '',
      dueDate: '',
      status: 'DRAFT',
      taxes: 0,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;
      try {
        setIsLoading(true);
        const [invoiceData, usersData, projectData] = await Promise.all([
          apiClient.getInvoiceById(id),
          apiClient.getUsers(),
          apiClient.getProjects(),
        ]);

        // Check if user has access to this invoice
        if ((user.role === 'CLIENT' || user.role === 'FAST_CLIENT') && invoiceData.clientId !== user.id) {
          setError('You do not have permission to edit this invoice.');
          return;
        }
        
        setInvoice(invoiceData);
        
        // Filtrar solo usuarios con rol CLIENT
        const clientUsersFiltered = usersData.filter(u => u.role === 'CLIENT');
        setClientUsers(clientUsersFiltered);
        setProjects(projectData);

        if (invoiceData.client && invoiceData.project) {
            form.reset({
            clientId: invoiceData.client.id,
            projectId: invoiceData.project.id,
            dueDate: new Date(invoiceData.dueDate).toISOString().split('T')[0],
            status: invoiceData.status === "OVERDUE" ? "DRAFT" : invoiceData.status,
            taxes: Number(invoiceData.taxes || 0),
            items: invoiceData.items.map(item => ({
              id: item.id,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice)
            })),
          });
        }

      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Failed to load invoice data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, id, form]);

  const onSubmit = async (data: InvoiceFormValues) => {
    if (!user || !id) return;

    const formattedData = {
      ...data,
      items: data.items.map(item => ({
        ...item,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      })),
      taxes: Number(data.taxes),
    };

    try {
      await apiClient.updateInvoice(id, formattedData);
      toast({
        title: "Invoice Updated",
        description: "The invoice has been updated successfully.",
      });
      router.push('/invoices');
    } catch (err) {
      setError('Failed to update invoice.');
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading invoice data...</div>
        </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-8">{error}</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Edit Invoice #{invoice?.invoiceNumber}</h2>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Update the details of the invoice and its items.</CardDescription>
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
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {clientUsers.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                    {client.name} ({client.email})
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                        <SelectItem value="SENT">Sent</SelectItem>
                                        <SelectItem value="PAID">Paid</SelectItem>
                                        <SelectItem value="VOID">Void</SelectItem>
                                    </SelectContent>
                                </Select>
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

                    <div className="flex justify-end space-x-4 mt-8">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="submit">Update Invoice</Button>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
};

export default EditInvoicePage;
