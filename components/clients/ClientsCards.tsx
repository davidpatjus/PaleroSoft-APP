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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ClientProfile } from '@/lib/api';

interface ClientsCardsProps {
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

export function ClientsCards({ clients, canUpdate, canDelete, onDelete }: ClientsCardsProps) {
  const handleDeleteClick = async (clientId: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"?`)) {
      await onDelete(clientId);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {clients.map((client) => (
        <Card key={client.id} className="group border-palero-green1/20 hover:border-palero-green1/40 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-palero-green1/5">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Client Info */}
              <div className="flex items-start space-x-3">
                <Avatar className="h-12 w-12 border-2 border-palero-green1/20 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-palero-green1 to-palero-teal1 text-white font-semibold">
                    {client.user?.name ? 
                      client.user.name.split(' ').map((n: string) => n[0]).join('') : 
                      client.companyName ? 
                      client.companyName.split(' ').map((n: string) => n[0]).join('') :
                      'CL'
                    }
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-palero-navy1 group-hover:text-palero-green2 transition-colors truncate">
                    {client.user?.name || 'No name'}
                  </div>
                  
                  <div className="text-sm text-palero-navy2 flex items-center mt-1">
                    <Building2 className="mr-1 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{client.companyName || 'No company'}</span>
                  </div>
                  
                  {client.user?.email && (
                    <div className="text-sm text-palero-navy2 flex items-center mt-1">
                      <Mail className="mr-1 h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{client.user.email}</span>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="text-sm text-palero-navy2 flex items-center mt-1">
                      <Phone className="mr-1 h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  )}
                  
                  {client.contactPerson && (
                    <div className="text-sm text-palero-navy2 flex items-center mt-1">
                      <Users className="mr-1 h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{client.contactPerson}</span>
                    </div>
                  )}
                </div>
                
                {(canUpdate || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-palero-green1/10 hover:text-palero-green2 flex-shrink-0">
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
              </div>

              {/* Status and Dates */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-palero-green1/10">
                <div className="flex items-center">
                  {getStatusBadge(client.status)}
                </div>
                
                <div className="flex items-center text-xs text-palero-navy2">
                  <Calendar className="mr-1 h-3 w-3" />
                  Creado: {new Date(client.createdAt).toLocaleDateString('es-ES')}
                </div>
                
                <div className="flex items-center text-xs text-palero-navy2">
                  <Calendar className="mr-1 h-3 w-3" />
                  Actualizado: {new Date(client.updatedAt).toLocaleDateString('es-ES')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ClientsCards;
