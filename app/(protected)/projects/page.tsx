"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Project, UserResponse } from '@/lib/api';
import { hasPermission } from '@/utils/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, MoreVertical, Calendar, FolderOpen, Loader2, Users, CheckCircle, Clock, FileText, BarChart3 } from 'lucide-react';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canCreate = hasPermission(user!.role, 'projects', 'create');
  const canUpdate = hasPermission(user!.role, 'projects', 'update');
  const canDelete = hasPermission(user!.role, 'projects', 'delete');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [projectsData, usersData] = await Promise.all([
        apiClient.getProjects(),
        user?.role === 'ADMIN' || user?.role === 'TEAM_MEMBER' ? apiClient.getUsers() : Promise.resolve([]),
      ]);

      setProjects(projectsData);
      setUsers(usersData);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await apiClient.deleteProject(projectId);
      setProjects(projects.filter((p: Project) => p.id !== projectId));
    } catch (error: any) {
      setError(error.message || 'Failed to delete project');
    }
  };

  // Filter projects based on user role
  const getUserProjects = () => {
    if (user?.role === 'CLIENT') {
      return projects.filter((p: Project) => p.clientId === user.id);
    }
    return projects;
  };

  const userProjects = getUserProjects();

  const filteredProjects = userProjects.filter((project: Project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'default';
      case 'COMPLETED': return 'default';
      case 'PENDING': return 'secondary';
      case 'REVIEW': return 'outline';
      case 'ARCHIVED': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-palero-blue1 text-white';
      case 'COMPLETED': return 'bg-palero-green1 text-white';
      case 'PENDING': return 'bg-palero-yellow1 text-palero-navy1';
      case 'REVIEW': return 'bg-palero-teal1 text-white';
      case 'ARCHIVED': return 'bg-palero-navy2 text-white';
      default: return 'bg-palero-navy2 text-white';
    }
  };

  const getClientName = (clientId: string) => {
    const client = users.find((u: UserResponse) => u.id === clientId);
    return client?.name || 'Unknown Client';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">Projects Management</h1>
          <p className="text-sm sm:text-base text-palero-navy2 mt-1">
            Manage your projects and track their progress across all stages
          </p>
        </div>
        {canCreate && (
          <div className="flex-shrink-0">
            <Link href="/projects/create">
              <Button className="bg-palero-green1 hover:bg-palero-green2 text-white w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:hidden">New Project</span>
                <span className="hidden sm:inline">New Project</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {success && (
        <Alert className="border-palero-green1/30 bg-palero-green1/10 text-palero-green2">
          <AlertDescription className="text-palero-green2">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="border-palero-blue1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Total Projects</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-blue2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <FolderOpen className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold text-palero-blue2 mb-1">{userProjects.length}</div>
            <p className="text-xs text-palero-navy2">active projects</p>
          </CardContent>
        </Card>

        <Card className="border-palero-yellow1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">In Progress</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-yellow1 to-palero-yellow2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Clock className="h-3 w-3 sm:h-5 sm:w-5 text-palero-navy1" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold text-palero-blue1 mb-1">
              {userProjects.filter((p: Project) => p.status === 'IN_PROGRESS').length}
            </div>
            <p className="text-xs text-palero-navy2">currently active</p>
          </CardContent>
        </Card>

        <Card className="border-palero-green1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Completed</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-green1 to-palero-green2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold text-palero-green2 mb-1">
              {userProjects.filter((p: Project) => p.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-palero-navy2">successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="border-palero-teal1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Pending</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-teal1 to-palero-teal2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <BarChart3 className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold text-palero-teal2 mb-1">
              {userProjects.filter((p: Project) => p.status === 'PENDING').length}
            </div>
            <p className="text-xs text-palero-navy2">awaiting start</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table/Cards */}
      <Card className="bg-white/80 backdrop-blur-sm border-palero-blue1/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="text-palero-navy1">Project Directory</CardTitle>
              <CardDescription className="text-palero-navy2">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-palero-navy2/70" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border-palero-blue1/30 focus:border-palero-teal1 focus:ring-palero-teal1"
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
                <TableRow className="border-palero-blue1/20">
                  <TableHead className="text-palero-navy1 font-semibold">Project</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">Status</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">Client</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">Start Date</TableHead>
                  <TableHead className="text-palero-navy1 font-semibold">End Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project: Project) => (
                  <TableRow 
                    key={project.id} 
                    onClick={() => handleRowClick(project.id)} 
                    className="group hover:bg-palero-blue1/5 border-palero-blue1/10 cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center">
                          <FolderOpen className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-palero-navy1 group-hover:text-palero-blue2 transition-colors">
                            {project.name}
                          </div>
                          <div className="text-sm text-palero-navy2 line-clamp-1">
                            {project.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColors(project.status)}`}>
                        {project.status.toLowerCase().replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6 border border-palero-blue1/20">
                          <AvatarFallback className="bg-gradient-to-br from-palero-green1 to-palero-teal1 text-white text-xs">
                            {getClientName(project.clientId).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-palero-navy2">{getClientName(project.clientId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-palero-navy2">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(project.startDate).toLocaleDateString('en-US')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-palero-navy2">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(project.endDate).toLocaleDateString('en-US')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(canUpdate || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-palero-blue1/10 hover:text-palero-blue2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-palero-blue1/20">
                            <DropdownMenuItem 
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              className="hover:bg-palero-blue1/10 hover:text-palero-blue2"
                            >
                              <Link href={`/projects/${project.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem 
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                className="hover:bg-palero-green1/10 hover:text-palero-green2"
                              >
                                <Link href={`/projects/${project.id}/edit`}>Edit Project</Link>
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project.id);
                                }}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                Delete Project
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
            {filteredProjects.map((project: Project) => (
              <Card 
                key={project.id} 
                onClick={() => handleRowClick(project.id)}
                className="group border-palero-blue1/20 hover:border-palero-blue1/40 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-palero-blue1/5 cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Project Header */}
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-palero-navy1 group-hover:text-palero-blue2 transition-colors truncate">
                          {project.name}
                        </div>
                        <div className="text-sm text-palero-navy2 line-clamp-2 mt-1">
                          {project.description}
                        </div>
                        <div className="flex items-center mt-2">
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColors(project.status)}`}>
                            {project.status.toLowerCase().replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      {(canUpdate || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="hover:bg-palero-blue1/10 hover:text-palero-blue2 flex-shrink-0"
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-palero-blue1/20">
                            <DropdownMenuItem 
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              className="hover:bg-palero-blue1/10 hover:text-palero-blue2"
                            >
                              <Link href={`/projects/${project.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem 
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                className="hover:bg-palero-green1/10 hover:text-palero-green2"
                              >
                                <Link href={`/projects/${project.id}/edit`}>Edit Project</Link>
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project.id);
                                }}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                Delete Project
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-palero-navy2" />
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6 border border-palero-blue1/20">
                          <AvatarFallback className="bg-gradient-to-br from-palero-green1 to-palero-teal1 text-white text-xs">
                            {getClientName(project.clientId).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-palero-navy2">{getClientName(project.clientId)}</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-palero-navy2 font-medium block mb-1">Start Date:</span>
                        <div className="flex items-center text-palero-navy2">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(project.startDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-palero-navy2 font-medium block mb-1">End Date:</span>
                        <div className="flex items-center text-palero-navy2">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(project.endDate).toLocaleDateString('en-US', { 
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

          {filteredProjects.length === 0 && (
            <div className="text-center py-12 px-4">
              <FolderOpen className="h-12 w-12 text-palero-blue1/50 mx-auto mb-4" />
              <p className="text-palero-navy2 font-medium">No projects found</p>
              <p className="text-sm text-palero-navy2/70 mt-1">
                {searchTerm ? 'Try adjusting your search criteria' : 'Projects will appear here when created'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}