"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Edit,
  Trash2,
  FolderOpen,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import useClientDetail from '@/hooks/clients/useClientDetail';

const getStatusBadge = (status: string) => {
  const statusConfig = {
    'PROSPECT': { label: 'Prospect', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
    'ACTIVE': { label: 'Active', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    'IN_PROJECT': { label: 'In Project', variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
    'COMPLETED': { label: 'Completed', variant: 'destructive' as const, color: 'bg-purple-100 text-purple-800' },
    'ARCHIVED': { label: 'Archived', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-600' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PROSPECT;
  return (
    <Badge variant={config.variant} className={config.color}>
      {config.label}
    </Badge>
  );
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clientId = params.id as string;
  
  const {
    client,
    clientProjects,
    isLoading,
    error,
    deleteClient
  } = useClientDetail(clientId);

  const canUpdate = hasPermission(user!.role, 'clients', 'update');
  const canDelete = hasPermission(user!.role, 'clients', 'delete');

  const handleDeleteClient = async () => {
    if (!client) return;
    
    const clientName = client.user?.name || client.companyName || 'this client';
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${clientName}? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      const result = await deleteClient();
      if (result.success) {
        router.push('/clients');
      } else {
        alert(result.error || 'Error deleting client');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading client details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="responsive-container">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
          <Link href="/clients">
            <Button variant="outline">Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="responsive-container">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
            <AlertDescription className="text-yellow-700">
              Client not found
            </AlertDescription>
          </Alert>
          <Link href="/clients">
            <Button variant="outline">Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-container">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Link href="/clients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-palero-green1/20">
                <AvatarFallback className="bg-gradient-to-br from-palero-green1 to-palero-teal1 text-white font-semibold text-lg">
                  {client.user?.name ? 
                    client.user.name.split(' ').map((n: string) => n[0]).join('') : 
                    client.companyName ? 
                    client.companyName.split(' ').map((n: string) => n[0]).join('') :
                    'CL'
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">
                  {client.user?.name || 'No name'}
                </h1>
                <p className="text-sm sm:text-base text-palero-navy2">
                  {client.companyName || 'No company'}
                </p>
              </div>
            </div>
          </div>
          
          {(canUpdate || canDelete) && (
            <div className="flex space-x-2">
              {canUpdate && (
                <Link href={`/clients/${clientId}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
              {canDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteClient}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
              <CardHeader>
                <CardTitle className="flex items-center text-palero-navy1">
                  <User className="mr-2 h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-palero-navy2">Name</p>
                    <p className="text-palero-navy1">{client.user?.name || 'No name'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-palero-navy2">Email</p>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-palero-navy2" />
                      <p className="text-palero-navy1">{client.user?.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-palero-navy2">Role</p>
                    <Badge variant="outline">{client.user?.role || 'No role'}</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-palero-navy2">Member since</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-palero-navy2" />
                      <p className="text-palero-navy1">
                        {client.user?.createdAt ? new Date(client.user.createdAt).toLocaleDateString('en-US') : 'No date'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
              <CardHeader>
                <CardTitle className="flex items-center text-palero-navy1">
                  <Building2 className="mr-2 h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-palero-navy2">Company</p>
                    <p className="text-palero-navy1">{client.companyName || 'No company'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-palero-navy2">Contact Person</p>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-palero-navy2" />
                      <p className="text-palero-navy1">{client.contactPerson || 'No contact'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-palero-navy2">Phone</p>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-palero-navy2" />
                      <p className="text-palero-navy1">{client.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-palero-navy2">Status</p>
                    {getStatusBadge(client.status)}
                  </div>
                </div>
                
                {client.address && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-palero-navy2">Address</p>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-palero-navy2 mt-0.5" />
                      <p className="text-palero-navy1">{client.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Projects */}
            <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
              <CardHeader>
                <CardTitle className="flex items-center text-palero-navy1">
                  <FolderOpen className="mr-2 h-5 w-5" />
                  Projects ({clientProjects.length})
                </CardTitle>
                <CardDescription>
                  Projects associated with this client
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientProjects.length > 0 ? (
                  <div className="space-y-3">
                    {clientProjects.map((project) => (
                      <div key={project.id} className="p-3 border border-palero-green1/20 rounded-lg hover:bg-palero-green1/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-palero-navy1">{project.name}</h4>
                            <p className="text-sm text-palero-navy2">{project.description || 'No description'}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{project.status}</Badge>
                            <p className="text-xs text-palero-navy2 mt-1">
                              {project.startDate ? new Date(project.startDate).toLocaleDateString('en-US') : 'No date'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-palero-green1/50 mx-auto mb-4" />
                    <p className="text-palero-navy2">No associated projects</p>
                    <p className="text-sm text-palero-navy2/70 mt-1">
                      Projects will appear here when assigned to this client
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with additional information */}
          <div className="space-y-6">
            {/* Quick Statistics */}
            <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
              <CardHeader>
                <CardTitle className="text-palero-navy1">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-palero-navy2">Projects</span>
                  <span className="font-semibold text-palero-navy1">{clientProjects.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-palero-navy2">Status</span>
                  {getStatusBadge(client.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-palero-navy2">Client since</span>
                  <span className="text-sm text-palero-navy1">
                    {new Date(client.createdAt).toLocaleDateString('en-US')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-palero-navy2">Last updated</span>
                  <span className="text-sm text-palero-navy1">
                    {new Date(client.updatedAt).toLocaleDateString('en-US')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
