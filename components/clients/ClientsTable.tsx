"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Mail, 
  Calendar, 
  MoreVertical, 
  Eye,
  Edit,
  Trash2,
  Users,
  Phone
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ClientProfile } from '@/lib/api';

interface ClientsTableProps {
  clients: ClientProfile[];
  canUpdate: boolean;
  canDelete: boolean;
  onDelete: (clientId: string) => Promise<void>;
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    'PROSPECT': { label: 'Prospect', variant: 'secondary' as const },
    'ACTIVE': { label: 'Active', variant: 'default' as const },
    'IN_PROJECT': { label: 'In Project', variant: 'outline' as const },
    'COMPLETED': { label: 'Completed', variant: 'destructive' as const },
    'ARCHIVED': { label: 'Archived', variant: 'secondary' as const },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PROSPECT;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function ClientsTable({ clients, canUpdate, canDelete, onDelete }: ClientsTableProps) {
  const handleDeleteClick = async (clientId: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"?`)) {
      await onDelete(clientId);
    }
  };

  return (
    <div className="overflow-x-auto max-w-full">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="border-palero-green1/20">
            <TableHead className="text-palero-navy1 font-semibold">Client</TableHead>
            <TableHead className="text-palero-navy1 font-semibold">Contact</TableHead>
            <TableHead className="text-palero-navy1 font-semibold">Status</TableHead>
            <TableHead className="text-palero-navy1 font-semibold">Created</TableHead>
            <TableHead className="text-palero-navy1 font-semibold">Updated</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="group hover:bg-palero-green1/5 border-palero-green1/10">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border-2 border-palero-green1/20">
                    <AvatarFallback className="bg-gradient-to-br from-palero-green1 to-palero-teal1 text-white font-semibold">
                      {client.user?.name ? 
                        client.user.name.split(' ').map((n: string) => n[0]).join('') : 
                        client.companyName ? 
                        client.companyName.split(' ').map((n: string) => n[0]).join('') :
                        'CL'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-palero-navy1 group-hover:text-palero-green2 transition-colors">
                      {client.user?.name || 'No name'}
                    </div>
                    <div className="text-sm text-palero-navy2 flex items-center">
                      <Building2 className="mr-1 h-3 w-3" />
                      {client.companyName || 'No company'}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  {client.user?.email && (
                    <div className="flex items-center text-sm text-palero-navy2">
                      <Mail className="mr-1 h-3 w-3" />
                      {client.user.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-sm text-palero-navy2">
                      <Phone className="mr-1 h-3 w-3" />
                      {client.phone}
                    </div>
                  )}
                  {client.contactPerson && (
                    <div className="flex items-center text-sm text-palero-navy2">
                      <Users className="mr-1 h-3 w-3" />
                      {client.contactPerson}
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                {getStatusBadge(client.status)}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center text-sm text-palero-navy2">
                  <Calendar className="mr-1 h-3 w-3" />
                  {new Date(client.createdAt).toLocaleDateString('es-ES')}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center text-sm text-palero-navy2">
                  <Calendar className="mr-1 h-3 w-3" />
                  {new Date(client.updatedAt).toLocaleDateString('es-ES')}
                </div>
              </TableCell>
              
              <TableCell>
                {(canUpdate || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-palero-green1/10 hover:text-palero-green2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-palero-green1/20">
                      <DropdownMenuItem asChild>
                        <Link 
                          href={`/clients/${client.id}`}
                          className="flex items-center hover:bg-palero-green1/10 hover:text-palero-green2"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      
                      {canUpdate && (
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/clients/${client.id}/edit`}
                            className="flex items-center hover:bg-palero-green1/10 hover:text-palero-green2"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Client
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      {canDelete && (
                        <DropdownMenuItem 
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteClick(client.id, client.user?.name || client.companyName || 'Client')}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Client
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ClientsTable;
