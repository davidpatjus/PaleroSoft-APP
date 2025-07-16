"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, Invoice } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, DollarSign, Eye } from 'lucide-react';
import Link from 'next/link';

interface InvoiceDueAlertsProps {
  className?: string;
}

export const InvoiceDueAlerts: React.FC<InvoiceDueAlertsProps> = ({ className }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getInvoices();
      
      // Filter invoices based on user role
      let filteredInvoices = data;
      if (user?.role === 'CLIENT') {
        filteredInvoices = data.filter(invoice => invoice.clientId === user.id);
      }
      
      setInvoices(filteredInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.id]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const getInvoiceStatus = (dueDate: string, status: Invoice['status']) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (status === 'PAID') return { type: 'paid', label: 'Paid', days: 0 };
    if (diffDays < 0) return { type: 'overdue', label: 'Overdue', days: Math.abs(diffDays) };
    if (diffDays <= 7) return { type: 'due-soon', label: 'Due Soon', days: diffDays };
    
    return { type: 'normal', label: 'Normal', days: diffDays };
  };

  const getRelevantInvoices = () => {
    return invoices
      .filter(invoice => {
        const statusInfo = getInvoiceStatus(invoice.dueDate, invoice.status);
        return statusInfo.type === 'overdue' || statusInfo.type === 'due-soon';
      })
      .sort((a, b) => {
        const statusA = getInvoiceStatus(a.dueDate, a.status);
        const statusB = getInvoiceStatus(b.dueDate, b.status);
        
        // Overdue invoices first, then due soon
        if (statusA.type === 'overdue' && statusB.type !== 'overdue') return -1;
        if (statusB.type === 'overdue' && statusA.type !== 'overdue') return 1;
        
        // Within same category, sort by days
        return statusA.days - statusB.days;
      });
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'due-soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconStyle = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'text-red-600';
      case 'due-soon':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const relevantInvoices = getRelevantInvoices();

  if (relevantInvoices.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No invoices due soon</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Invoices
          <Badge variant="secondary" className="ml-auto">
            {relevantInvoices.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {relevantInvoices.slice(0, 5).map((invoice) => {
          const statusInfo = getInvoiceStatus(invoice.dueDate, invoice.status);
          return (
            <div
              key={invoice.id}
              className={`p-3 rounded-lg border ${
                statusInfo.type === 'overdue' 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {statusInfo.type === 'overdue' ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="font-medium text-sm">
                      {invoice.invoiceNumber}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={getBadgeStyle(statusInfo.type)}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    {user?.role !== 'CLIENT' && invoice.client && (
                      <div>Client: {invoice.client.name}</div>
                    )}
                    <div>Due: {formatDate(invoice.dueDate)}</div>
                    {statusInfo.type === 'overdue' && (
                      <div className="text-red-600 font-medium">
                        Overdue by {statusInfo.days} days
                      </div>
                    )}
                    {statusInfo.type === 'due-soon' && (
                      <div className="text-yellow-600 font-medium">
                        Due in {statusInfo.days} days
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(invoice.totalAmount)}
                    </div>
                  </div>
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        
        {relevantInvoices.length > 5 && (
          <div className="pt-2 border-t">
            <Link href="/invoices">
              <Button variant="outline" size="sm" className="w-full">
                View all invoices ({relevantInvoices.length})
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
