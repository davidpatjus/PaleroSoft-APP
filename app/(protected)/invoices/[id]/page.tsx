'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, Invoice } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, FileText, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from '@/hooks/use-toast';

const InvoiceDetailsPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!user || !id) return;
      try {
        setLoading(true);
        const data = await apiClient.getInvoiceById(id);
        setInvoice(data);
      } catch (err) {
        setError('Failed to load invoice details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [user, id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await apiClient.deleteInvoice(id);
      toast({
        title: "Invoice Voided",
        description: "The invoice has been successfully voided.",
      });
      router.push('/invoices');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to void the invoice. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete invoice", error);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'PAID':
        return 'default'; // Usually green, but we use primary color
      case 'SENT':
        return 'secondary'; // Blue or gray
      case 'OVERDUE':
        return 'destructive'; // Red
      case 'VOID':
        return 'destructive'; // Red
      case 'DRAFT':
        return 'outline'; // Gray
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading invoice details...</div>
        </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-8">{error}</div>;
  }

  if (!invoice) {
    return <div className="text-center p-8">Invoice not found.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
            </Button>
            <div className="flex space-x-2">
                <Button onClick={() => router.push(`/invoices/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Void
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently void the invoice.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>

        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="bg-muted/50">
                <div className="flex flex-col md:flex-row justify-between items-start">
                    <div>
                        <CardTitle className="text-3xl font-bold">Invoice #{invoice.invoiceNumber}</CardTitle>
                        <CardDescription className="mt-1">Issued on {new Date(invoice.issueDate).toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                        <Badge variant={getStatusVariant(invoice.status)} className="text-base font-semibold px-3 py-1 rounded-full">{invoice.status}</Badge>
                        <p className="text-sm text-muted-foreground mt-2">Due on: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 grid gap-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h3 className="font-semibold text-lg">Billed To</h3>
                        <p className="text-muted-foreground">{invoice.client?.name}</p>
                        <p className="text-muted-foreground">{invoice.client?.email}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Project</h3>
                        <p className="text-muted-foreground">{invoice.project?.name || 'N/A'}</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-4">Items</h3>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {invoice.items.map((item) => (
                            <Card key={item.id} className="bg-muted/50">
                                <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                                    <div className="col-span-2 font-medium text-palero-navy1">{item.description}</div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Quantity</p>
                                        <p>{item.quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Unit Price</p>
                                        <p>${Number(item.unitPrice).toFixed(2)}</p>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <p className="text-xs text-muted-foreground">Total</p>
                                        <p className="font-semibold text-lg text-palero-navy1">${(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[55%]">Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {invoice.items.map((item) => (
                                <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-semibold">${(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex justify-end items-center mt-4">
                    <div className="text-right">
                        {(() => {
                            const subtotal = invoice.items.reduce((sum, item) => 
                                sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
                            const taxAmount = subtotal * Number(invoice.taxes || 0) / 100;
                            const total = subtotal + taxAmount;
                            
                            return (
                                <>
                                    <p className="text-muted-foreground">Subtotal: ${subtotal.toFixed(2)}</p>
                                    <p className="text-muted-foreground">Taxes ({Number(invoice.taxes || 0).toFixed(2)}%): ${taxAmount.toFixed(2)}</p>
                                    <p className="text-2xl font-bold mt-2">Total: ${total.toFixed(2)}</p>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {invoice.notes && (
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-lg">Notes</h3>
                        <p className="text-sm text-muted-foreground mt-1">{invoice.notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
};

export default InvoiceDetailsPage;
