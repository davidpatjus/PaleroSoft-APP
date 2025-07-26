"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Invoice } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, FileText, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const InvoicesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'due-soon' | 'overdue' | 'archived'>('all');

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      try {
        const data = await apiClient.getInvoices();
        setInvoices(data);
      } catch (err) {
        setError('Failed to fetch invoices.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      await apiClient.deleteInvoice(invoiceToDelete);
      // Optimistically update the UI, or refetch
      setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete));
      setInvoiceToDelete(null);
    } catch (err) {
      setError('Failed to delete the invoice.');
      console.error(err);
    }
  };

  const getStatusColors = (status: string, dueDate?: string) => {
    // Check if invoice is overdue based on due date
    if (dueDate && status !== 'PAID') {
      const today = new Date();
      const due = new Date(dueDate);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        // Overdue
        return 'bg-red-500 text-white animate-pulse';
      } else if (diffDays <= 7) {
        // Due soon
        return 'bg-yellow-500 text-white';
      }
    }

    switch (status) {
      case 'PAID':
        return 'bg-palero-green1 text-white';
      case 'SENT':
        return 'bg-palero-blue1 text-white';
      case 'DRAFT':
        return 'bg-palero-navy2/80 text-white';
      case 'OVERDUE':
        return 'bg-red-500 text-white animate-pulse';
      case 'VOID':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-palero-navy2 text-white';
    }
  };

  const getInvoiceRowStyle = (status: string, dueDate?: string) => {
    if (dueDate && status !== 'PAID') {
      const today = new Date();
      const due = new Date(dueDate);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        // Overdue - red background
        return 'bg-red-50 border-l-4 border-red-500';
      } else if (diffDays <= 7) {
        // Due soon - yellow background
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      }
    }
    return '';
  };

  const totalAmount = invoices.filter(inv => inv.status !== 'VOID').reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
  const totalPaid = invoices.filter(inv => inv.status === 'PAID').reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
  const totalPending = totalAmount - totalPaid;

  const getFilteredInvoices = () => {
    if (filter === 'archived') {
      return invoices.filter(invoice => invoice.status === 'VOID');
    }
    
    // For all other filters, exclude VOID invoices
    const activeInvoices = invoices.filter(invoice => invoice.status !== 'VOID');
    
    if (filter === 'all') return activeInvoices;
    
    return activeInvoices.filter(invoice => {
      if (invoice.status === 'PAID') return false;
      
      const today = new Date();
      const due = new Date(invoice.dueDate);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filter === 'overdue') {
        return diffDays < 0;
      } else if (filter === 'due-soon') {
        return diffDays >= 0 && diffDays <= 7;
      }
      
      return false;
    });
  };

  const filteredInvoices = getFilteredInvoices();
  const activeInvoices = invoices.filter(inv => inv.status !== 'VOID');
  const archivedCount = invoices.filter(inv => inv.status === 'VOID').length;
  
  const overdueCount = activeInvoices.filter(inv => {
    if (inv.status === 'PAID') return false;
    const today = new Date();
    const due = new Date(inv.dueDate);
    return due < today;
  }).length;
  
  const dueSoonCount = activeInvoices.filter(inv => {
    if (inv.status === 'PAID') return false;
    const today = new Date();
    const due = new Date(inv.dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading invoices...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 responsive-container">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">Invoices Management</h1>
              <p className="text-sm sm:text-base text-palero-navy2 mt-1">
                Track and manage all your client invoices.
              </p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Link href="/invoices/create">
            <Button className="bg-palero-green1 hover:bg-palero-green2 text-white w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-palero-blue1 hover:bg-palero-blue2' : ''}
        >
          All ({activeInvoices.length})
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('overdue')}
          className={filter === 'overdue' ? 'bg-red-500 hover:bg-red-600' : overdueCount > 0 ? 'border-red-500 text-red-600 hover:bg-red-50' : ''}
        >
          Overdue ({overdueCount})
        </Button>
        <Button
          variant={filter === 'due-soon' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('due-soon')}
          className={filter === 'due-soon' ? 'bg-yellow-500 hover:bg-yellow-600' : dueSoonCount > 0 ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50' : ''}
        >
          Due Soon ({dueSoonCount})
        </Button>
        <Button
          variant={filter === 'archived' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('archived')}
          className={filter === 'archived' ? 'bg-gray-500 hover:bg-gray-600' : archivedCount > 0 ? 'border-gray-500 text-gray-600 hover:bg-gray-50' : ''}
        >
          Archived ({archivedCount})
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="border-palero-blue1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Total Billed</CardTitle>
                <DollarSign className="h-4 w-4 text-palero-navy2" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-3xl font-bold text-palero-blue1 mb-1">${totalAmount.toFixed(2)}</div>
            </CardContent>
        </Card>
        <Card className="border-palero-green1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Total Paid</CardTitle>
                <CheckCircle className="h-4 w-4 text-palero-green2" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-3xl font-bold text-palero-green2 mb-1">${totalPaid.toFixed(2)}</div>
            </CardContent>
        </Card>
        <Card className="border-red-200 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Total Pending</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-3xl font-bold text-red-600 mb-1">${totalPending.toFixed(2)}</div>
            </CardContent>
        </Card>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {filter === 'all' ? 'Active Invoices' : 
               filter === 'overdue' ? 'Overdue Invoices' : 
               filter === 'due-soon' ? 'Invoices Due Soon' :
               'Archived Invoices'}
            </CardTitle>
            <CardDescription>
              {filter === 'all' ? 'A list of all active invoices in the system.' :
               filter === 'overdue' ? 'Invoices that have passed their due date.' :
               filter === 'due-soon' ? 'Invoices due within the next 7 days.' :
               'Cancelled or voided invoices for reference.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-palero-blue1/20 rounded-lg bg-gradient-to-r from-white to-palero-blue1/5 hover:shadow-md transition-all duration-200 ${getInvoiceRowStyle(invoice.status, invoice.dueDate)}`}>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-center text-sm">
                  <div className="font-medium">
                    <p className="text-xs text-palero-navy2 sm:hidden">Invoice #</p>
                    <p className="text-palero-navy1">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-palero-navy2 sm:hidden">Client</p>
                    <p className="truncate text-palero-navy1">{invoice.client?.name || invoice.clientId}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-palero-navy2 sm:hidden">Project</p>
                    <p className="truncate text-palero-navy1">{invoice.project?.name || 'N/A'}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-palero-navy2 sm:hidden">Amount</p>
                    <p className="font-semibold text-palero-navy1">${Number(invoice.totalAmount).toFixed(2)}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-palero-navy2 sm:hidden">Due</p>
                    <p className="text-palero-navy1">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 mt-4 sm:mt-0 sm:ml-4">
                  <Badge className={`${getStatusColors(invoice.status, invoice.dueDate)} text-xs`}>{invoice.status}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setInvoiceToDelete(invoice.id)} className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {filteredInvoices.length === 0 && activeInvoices.length > 0 && filter !== 'archived' && (
              <div className="text-center py-12 px-4">
                <FileText className="h-12 w-12 text-palero-blue1/50 mx-auto mb-4" />
                <p className="text-palero-navy2 font-medium">
                  {filter === 'overdue' ? 'No overdue invoices' :
                   filter === 'due-soon' ? 'No invoices due soon' :
                   'No invoices found'}
                </p>
                <p className="text-sm text-palero-navy2/70 mt-1">
                  {filter === 'overdue' ? 'All invoices are up to date' :
                   filter === 'due-soon' ? 'No invoices are due in the next 7 days' :
                   'Try changing the filter to see invoices'}
                </p>
              </div>
            )}
            {filteredInvoices.length === 0 && filter === 'archived' && (
              <div className="text-center py-12 px-4">
                <FileText className="h-12 w-12 text-gray-400/50 mx-auto mb-4" />
                <p className="text-palero-navy2 font-medium">No archived invoices</p>
                <p className="text-sm text-palero-navy2/70 mt-1">
                  Cancelled or voided invoices will appear here
                </p>
              </div>
            )}
            {activeInvoices.length === 0 && invoices.length === 0 && (
              <div className="text-center py-12 px-4">
                <FileText className="h-12 w-12 text-palero-blue1/50 mx-auto mb-4" />
                <p className="text-palero-navy2 font-medium">No invoices found</p>
                <p className="text-sm text-palero-navy2/70 mt-1">
                  Invoices will appear here when created
                </p>
              </div>
            )}
          </div>
          <AlertDialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the invoice.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesPage;
