"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, ClientProfile, Project } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Trash2 } from 'lucide-react';

const invoiceItemSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1"),
  unitPrice: z.coerce.number().min(0.01, "El precio unitario debe ser positivo"),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "El cliente es requerido"),
  projectId: z.string().min(1, "El proyecto es requerido"),
  dueDate: z.string().min(1, "La fecha de vencimiento es requerida"),
  items: z.array(invoiceItemSchema).min(1, "Se requiere al menos un ítem"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const CreateInvoicePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: '',
      projectId: '',
      dueDate: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const [clientData, projectData] = await Promise.all([
          apiClient.getClients(),
          apiClient.getProjects(),
        ]);
        setClients(clientData);
        setProjects(projectData);
      } catch (err) {
        console.error("Failed to fetch clients or projects", err);
        setError("Failed to load initial data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const onSubmit = async (data: InvoiceFormValues) => {
    if (!user) return;

    const formattedData = {
      ...data,
      items: data.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
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
            <div className="text-lg">Cargando...</div>
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Crear Nueva Factura</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Factura</CardTitle>
            <CardDescription>Completa el formulario para crear una nueva factura.</CardDescription>
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
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.userId}>
                                {client.userId}
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
                        <FormLabel>Proyecto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch('clientId')}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un proyecto" />
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
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <h3 className="text-lg font-medium mb-4">Ítems de la Factura</h3>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end space-x-2 md:space-x-4 p-4 border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="flex-grow">
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Descripción del servicio o producto" />
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
                                <FormLabel>Cantidad</FormLabel>
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
                                <FormLabel>Precio Unitario</FormLabel>
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
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ítem
                  </Button>
                </div>

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit">Crear Factura</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
    </div>
  );
};

export default CreateInvoicePage;
