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
import { Plus, Search, MoreVertical, Mail, Calendar, Loader2 } from 'lucide-react';
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

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreate = hasPermission(user!.role, 'users', 'create');
  const canUpdate = hasPermission(user!.role, 'users', 'update');
  const canDelete = hasPermission(user!.role, 'users', 'delete');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await apiClient.getUsers();
      setUsers(usersData);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await apiClient.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error: any) {
      setError(error.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': 
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TEAM_MEMBER': 
        return 'bg-palero-blue1/10 text-palero-blue2 border-palero-blue1/20';
      case 'CLIENT': 
        return 'bg-palero-green1/10 text-palero-green2 border-palero-green1/20';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'TEAM_MEMBER': return 'Team Member';
      case 'CLIENT': return 'Client';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="responsive-container">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-full overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight text-palero-navy1 break-words">
            Users Management
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-palero-navy2 mt-1 break-words">
            Manage your team members and their permissions across the system
          </p>
        </div>
        {canCreate && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Link href="/users/create" className="block w-full sm:w-auto">
              <Button className="bg-palero-green1 hover:bg-palero-green2 text-white w-full sm:w-auto text-sm">
                <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Add User
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
        <Card className="border-palero-blue1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Total Users</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-blue2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Mail className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold text-palero-blue2 mb-1">{users.length}</div>
            <p className="text-xs text-palero-navy2">registered users</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Admins</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Plus className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold text-red-600 mb-1">
              {users.filter((u: UserResponse) => u.role === 'ADMIN').length}
            </div>
            <p className="text-xs text-palero-navy2">system administrators</p>
          </CardContent>
        </Card>

        <Card className="border-palero-teal1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Team Members</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-teal1 to-palero-teal2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Calendar className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold text-palero-teal2 mb-1">
              {users.filter((u: UserResponse) => u.role === 'TEAM_MEMBER').length}
            </div>
            <p className="text-xs text-palero-navy2">active team members</p>
          </CardContent>
        </Card>

        <Card className="border-palero-green1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Clients</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-green1 to-palero-green2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Plus className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold text-palero-green2 mb-1">
              {users.filter((u: UserResponse) => u.role === 'CLIENT').length}
            </div>
            <p className="text-xs text-palero-navy2">external clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-palero-blue1/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="text-palero-navy1">Team Members</CardTitle>
              <CardDescription className="text-palero-navy2">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex items-center w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-palero-navy2/70" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border-palero-blue1/30 focus:border-palero-teal1 focus:ring-palero-teal1 min-w-0"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto max-w-full">
              <Table>
              <TableHeader>
                <TableRow className="border-palero-blue1/20">
                  <TableHead className="text-palero-navy1 font-semibold">User</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">Role</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">Created</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((userItem: UserResponse) => (
                  <TableRow key={userItem.id} className="group hover:bg-palero-blue1/5 border-palero-blue1/10">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border-2 border-palero-blue1/20">
                          <AvatarFallback className="bg-gradient-to-br from-palero-teal1 to-palero-blue1 text-white font-semibold">
                            {userItem.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-palero-navy1 group-hover:text-palero-teal2 transition-colors">
                            {userItem.name}
                          </div>
                          <div className="text-sm text-palero-navy2 flex items-center">
                            <Mail className="mr-1 h-3 w-3" />
                            {userItem.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeStyle(userItem.role)}`}>
                        {getRoleDisplayName(userItem.role)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-palero-navy2">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(userItem.createdAt).toLocaleDateString('en-US')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-palero-navy2">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(userItem.updatedAt).toLocaleDateString('en-US')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(canUpdate || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-palero-teal1/10 hover:text-palero-teal2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-palero-blue1/20">
                            {canUpdate && (
                              <Link href={`/users/${userItem.id}/edit`}>
                                <DropdownMenuItem className="hover:bg-palero-teal1/10 hover:text-palero-teal2">
                                  Edit User
                                </DropdownMenuItem>
                              </Link>
                            )}
                            {canDelete && userItem.id !== user?.id && (
                              <DropdownMenuItem 
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDeleteUser(userItem.id)}
                              >
                                Delete User
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <div className="space-y-4 p-4 max-w-full overflow-hidden">
            {filteredUsers.map((userItem: UserResponse) => (
              <Card key={userItem.id} className="group border-palero-blue1/20 hover:border-palero-teal1/30 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-palero-blue1/5">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-12 w-12 border-2 border-palero-blue1/20 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-palero-teal1 to-palero-blue1 text-white font-semibold">
                          {userItem.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-palero-navy1 group-hover:text-palero-teal2 transition-colors truncate">
                          {userItem.name}
                        </div>
                        <div className="text-sm text-palero-navy2 flex items-center mt-1">
                          <Mail className="mr-1 h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{userItem.email}</span>
                        </div>
                      </div>
                      {(canUpdate || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-palero-teal1/10 hover:text-palero-teal2 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-palero-blue1/20">
                            {canUpdate && (
                              <Link href={`/users/${userItem.id}/edit`}>
                                <DropdownMenuItem className="hover:bg-palero-teal1/10 hover:text-palero-teal2">
                                  Edit User
                                </DropdownMenuItem>
                              </Link>
                            )}
                            {canDelete && userItem.id !== user?.id && (
                              <DropdownMenuItem 
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDeleteUser(userItem.id)}
                              >
                                Delete User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Role and Dates */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-palero-navy2">Role:</span>
                        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeStyle(userItem.role)}`}>
                          {getRoleDisplayName(userItem.role)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-palero-navy2 font-medium block mb-1">Created:</span>
                          <div className="flex items-center text-palero-navy2">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(userItem.createdAt).toLocaleDateString('en-US', { 
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
                            {new Date(userItem.updatedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 px-4">
              <Mail className="h-12 w-12 text-palero-blue1/50 mx-auto mb-4" />
              <p className="text-palero-navy2 font-medium">No users found</p>
              <p className="text-sm text-palero-navy2/70 mt-1">
                {searchTerm ? 'Try adjusting your search criteria' : 'Users will appear here when added'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}