"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Building2, 
  Users, 
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import useClients from '@/hooks/clients/useClients';
import ClientsTable from '@/components/clients/ClientsTable';
import ClientsCards from '@/components/clients/ClientsCards';

export default function ClientsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    clients,
    isLoading,
    error,
    deleteClient,
    refetch
  } = useClients();

  const canCreate = hasPermission(user!.role, 'clients', 'create');
  const canUpdate = hasPermission(user!.role, 'clients', 'update');
  const canDelete = hasPermission(user!.role, 'clients', 'delete');

  const handleDeleteClient = async (clientId: string) => {
    const result = await deleteClient(clientId);
    if (result.success) {
      refetch(); // Refrescar la lista
    } else {
      alert(result.error || 'Error al eliminar el cliente');
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (client.user?.name?.toLowerCase().includes(searchLower)) ||
      (client.user?.email?.toLowerCase().includes(searchLower)) ||
      (client.companyName?.toLowerCase().includes(searchLower)) ||
      (client.contactPerson?.toLowerCase().includes(searchLower)) ||
      (client.phone?.toLowerCase().includes(searchLower))
    );
  });

  // Cálculos para las estadísticas
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'ACTIVE').length;
  const newThisMonth = clients.filter(c => {
    const clientDate = new Date(c.createdAt);
    const now = new Date();
    return clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear();
  }).length;
  const recentActivity = clients.filter(c => {
    const clientDate = new Date(c.updatedAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return clientDate >= oneWeekAgo;
  }).length;

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="responsive-container">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-full overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1 break-words">
              Client Management
            </h1>
            <p className="text-sm sm:text-base text-palero-navy2 mt-1 break-words">
              Manage your client relationships and business accounts
            </p>
          </div>
          {canCreate && (
            <div className="flex-shrink-0 w-full sm:w-auto">
              <Link href="/clients/create" className="block w-full sm:w-auto">
                <Button className="bg-palero-green1 hover:bg-palero-green2 text-white w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New Client
                </Button>
              </Link>
            </div>
          )}
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="border-palero-green1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Total Clients</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-green1 to-palero-green2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Building2 className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-green2 mb-1">{totalClients}</div>
              <p className="text-xs text-palero-navy2">registered clients</p>
            </CardContent>
          </Card>

          <Card className="border-palero-blue1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Active Clients</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-blue2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Users className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-blue2 mb-1">{activeClients}</div>
              <p className="text-xs text-palero-navy2">actively engaged</p>
            </CardContent>
          </Card>

          <Card className="border-palero-teal1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">New This Month</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-teal1 to-palero-teal2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Calendar className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-teal2 mb-1">{newThisMonth}</div>
              <p className="text-xs text-palero-navy2">new acquisitions</p>
            </CardContent>
          </Card>

          <Card className="border-palero-navy1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Recent Activity</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-navy1 to-palero-navy2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Building2 className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-navy1 mb-1">{recentActivity}</div>
              <p className="text-xs text-palero-navy2">active this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table/Cards */}
        <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <CardTitle className="text-palero-navy1">Client Directory</CardTitle>
                <CardDescription className="text-palero-navy2">
                  {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <div className="flex items-center w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-palero-navy2/70" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border-palero-green1/30 focus:border-palero-teal1 focus:ring-palero-teal1 min-w-0"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <ClientsTable 
                clients={filteredClients}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onDelete={handleDeleteClient}
              />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              <ClientsCards 
                clients={filteredClients}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onDelete={handleDeleteClient}
              />
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-12 px-4">
                <Building2 className="h-12 w-12 text-palero-green1/50 mx-auto mb-4" />
                <p className="text-palero-navy2 font-medium">No clients found</p>
                <p className="text-sm text-palero-navy2/70 mt-2">
                  {searchTerm ? 'Try different search terms' : 'Start by creating your first client'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
