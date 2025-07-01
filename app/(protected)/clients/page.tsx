"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, UserResponse } from '@/lib/api';
import { hasPermission } from '@/utils/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, MoreVertical, Phone, Mail, Building2, Users, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';
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

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<UserResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreate = hasPermission(user!.role, 'clients', 'create');
  const canUpdate = hasPermission(user!.role, 'clients', 'update');
  const canDelete = hasPermission(user!.role, 'clients', 'delete');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const usersData = await apiClient.getUsers();
      // Filter only clients
      const clientsData = usersData.filter(u => u.role === 'CLIENT');
      setClients(clientsData);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      await apiClient.deleteUser(clientId);
      setClients(clients.filter(c => c.id !== clientId));
    } catch (error: any) {
      setError(error.message || 'Failed to delete client');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">Clients Management</h1>
          <p className="text-sm sm:text-base text-palero-navy2 mt-1">
            Manage your client relationships and business accounts
          </p>
        </div>
        {canCreate && (
          <div className="flex-shrink-0">
            <Link href="/users/create">
              <Button className="bg-palero-green1 hover:bg-palero-green2 text-white w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:hidden">Add Client</span>
                <span className="hidden sm:inline">Add Client</span>
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
            <div className="text-xl sm:text-3xl font-bold text-palero-green2 mb-1">{clients.length}</div>
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
            <div className="text-xl sm:text-3xl font-bold text-palero-blue2 mb-1">{clients.length}</div>
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
            <div className="text-xl sm:text-3xl font-bold text-palero-teal2 mb-1">
              {clients.filter((c: UserResponse) => {
                const createdDate = new Date(c.createdAt);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && 
                       createdDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
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
            <div className="text-xl sm:text-3xl font-bold text-palero-navy1 mb-1">
              {clients.filter((c: UserResponse) => {
                const updatedDate = new Date(c.updatedAt);
                const now = new Date();
                const daysDiff = (now.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24);
                return daysDiff <= 7;
              }).length}
            </div>
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
            <div className="flex items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-palero-navy2/70" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border-palero-green1/30 focus:border-palero-teal1 focus:ring-palero-teal1"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-palero-green1/20">
                  <TableHead className="text-palero-navy1 font-semibold">Client</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">Contact</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">Created</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">Last Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client: UserResponse) => (
                  <TableRow key={client.id} className="group hover:bg-palero-green1/5 border-palero-green1/10">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border-2 border-palero-green1/20">
                          <AvatarFallback className="bg-gradient-to-br from-palero-green1 to-palero-teal1 text-white font-semibold">
                            {client.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-palero-navy1 group-hover:text-palero-green2 transition-colors">
                            {client.name}
                          </div>
                          <div className="text-sm text-palero-navy2 flex items-center">
                            <Building2 className="mr-1 h-3 w-3" />
                            Client Account
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-palero-navy2">
                        <Mail className="mr-1 h-3 w-3" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-palero-navy2">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(client.createdAt).toLocaleDateString('en-US')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-palero-navy2">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(client.updatedAt).toLocaleDateString('en-US')}
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
                            {canUpdate && (
                              <>
                                <DropdownMenuItem className="hover:bg-palero-green1/10 hover:text-palero-green2">
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-palero-green1/10 hover:text-palero-green2">
                                  Edit Client
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-palero-teal1/10 hover:text-palero-teal2">
                                  View Projects
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-palero-blue1/10 hover:text-palero-blue2">
                                  Add Note
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete && (
                              <DropdownMenuItem 
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDeleteClient(client.id)}
                              >
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4">
            {filteredClients.map((client: UserResponse) => (
              <Card key={client.id} className="group border-palero-green1/20 hover:border-palero-green1/40 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-palero-green1/5">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Client Info */}
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-12 w-12 border-2 border-palero-green1/20 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-palero-green1 to-palero-teal1 text-white font-semibold">
                          {client.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-palero-navy1 group-hover:text-palero-green2 transition-colors truncate">
                          {client.name}
                        </div>
                        <div className="text-sm text-palero-navy2 flex items-center mt-1">
                          <Building2 className="mr-1 h-3 w-3 flex-shrink-0" />
                          <span>Client Account</span>
                        </div>
                        <div className="text-sm text-palero-navy2 flex items-center mt-1">
                          <Mail className="mr-1 h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      </div>
                      {(canUpdate || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-palero-green1/10 hover:text-palero-green2 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-palero-green1/20">
                            {canUpdate && (
                              <>
                                <DropdownMenuItem className="hover:bg-palero-green1/10 hover:text-palero-green2">
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-palero-green1/10 hover:text-palero-green2">
                                  Edit Client
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-palero-teal1/10 hover:text-palero-teal2">
                                  View Projects
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-palero-blue1/10 hover:text-palero-blue2">
                                  Add Note
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete && (
                              <DropdownMenuItem 
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                Delete Client
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-palero-navy2 font-medium block mb-1">Created:</span>
                        <div className="flex items-center text-palero-navy2">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(client.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-palero-navy2 font-medium block mb-1">Updated:</span>
                        <div className="flex items-center text-palero-navy2">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(client.updatedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12 px-4">
              <Building2 className="h-12 w-12 text-palero-green1/50 mx-auto mb-4" />
              <p className="text-palero-navy2 font-medium">No clients found</p>
              <p className="text-sm text-palero-navy2/70 mt-1">
                {searchTerm ? 'Try adjusting your search criteria' : 'Clients will appear here when added'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}