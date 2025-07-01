"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Project, Task, UserResponse } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CommentSection } from '@/components/CommentSection';
import { Loader2, Calendar, FolderOpen, User, ArrowLeft, Edit, CheckCircle2, Clock, AlertCircle, BarChart3, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [client, setClient] = useState<UserResponse | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;

    async function fetchData() {
      try {
        setIsLoading(true);
        const [projectData, tasksData, usersData] = await Promise.all([
          apiClient.getProjectById(projectId),
          apiClient.getTasks(),
          apiClient.getUsers(),
        ]);

        setProject(projectData);
        setTasks(tasksData.filter(t => t.projectId === projectId));
        setUsers(usersData);
        setClient(usersData.find(u => u.id === projectData.clientId) || null);

      } catch (e: any) {
        setError(e.message || 'Failed to load project details.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palero-blue1/5 via-white to-palero-green1/5 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palero-blue1/5 via-white to-palero-green1/5 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-700 font-medium">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palero-blue1/5 via-white to-palero-green1/5 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-palero-blue1/20">
            <CardContent className="p-6 text-center">
              <FolderOpen className="h-12 w-12 text-palero-blue1/50 mx-auto mb-4" />
              <p className="text-palero-navy2 font-medium">Project not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return 'Unassigned';
    const user = users.find((u: UserResponse) => u.id === userId);
    return user ? user.name : 'Unknown User';
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

  const getTaskStatusColors = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-palero-green1 text-white';
      case 'IN_PROGRESS': return 'bg-palero-blue1 text-white';
      case 'TODO': return 'bg-palero-yellow1 text-palero-navy1';
      case 'REVIEW': return 'bg-palero-teal1 text-white';
      default: return 'bg-palero-navy2 text-white';
    }
  };

  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500 text-white';
      case 'MEDIUM': return 'bg-palero-yellow1 text-palero-navy1';
      case 'LOW': return 'bg-palero-green1 text-white';
      default: return 'bg-palero-navy2 text-white';
    }
  };

  const tasksCompleted = tasks.filter((t: Task) => t.status === 'DONE').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-palero-blue1/5 via-white to-palero-green1/5 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              size="sm"
              className="mb-4 border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10 hover:text-palero-blue2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-start space-x-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-green1 flex items-center justify-center shadow-lg flex-shrink-0">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1 break-words">
                  {project.name}
                </h1>
                <p className="text-sm sm:text-base text-palero-navy2 mt-1 line-clamp-2">
                  {project.description}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link href={`/projects/${projectId}/edit`}>
              <Button className="bg-palero-green1 hover:bg-palero-green2 text-white w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Project Info Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Project Details Card */}
          <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-green1 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-palero-navy1">Project Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-palero-blue1/5 border border-palero-blue1/20">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="h-5 w-5 text-palero-blue1" />
                  <span className="text-palero-navy1 font-medium">Status:</span>
                </div>
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getStatusColors(project.status)}`}>
                  {project.status.toLowerCase().replace('_', ' ')}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-palero-teal1/5 border border-palero-teal1/20">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-palero-teal1" />
                  <span className="text-palero-navy1 font-medium">Timeline:</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-palero-navy1 font-medium">
                    {new Date(project.startDate).toLocaleDateString('en-US')}
                  </div>
                  <div className="text-xs text-palero-navy2">to</div>
                  <div className="text-sm text-palero-navy1 font-medium">
                    {new Date(project.endDate).toLocaleDateString('en-US')}
                  </div>
                </div>
              </div>
              
              {client && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-palero-green1/5 border border-palero-green1/20">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-palero-green1" />
                    <span className="text-palero-navy1 font-medium">Client:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8 border-2 border-palero-green1/20">
                      <AvatarFallback className="bg-gradient-to-br from-palero-green1 to-palero-teal1 text-white text-sm">
                        {client.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-palero-navy1 font-medium">{client.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Card */}
          {/* <Card className="bg-white/90 backdrop-blur-sm border-palero-green1/20 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-green1 to-palero-teal1 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-palero-navy1">Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-palero-navy1">Task Completion</span>
                  <span className="text-sm font-bold text-palero-green2">{Math.round(progress)}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-3 bg-palero-green1/10"
                />
                <p className="text-xs text-palero-navy2 text-center">
                  {tasksCompleted} of {totalTasks} tasks completed
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="text-center p-3 rounded-lg bg-palero-green1/10">
                  <div className="text-lg font-bold text-palero-green2">{tasksCompleted}</div>
                  <div className="text-xs text-palero-navy2">Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-palero-blue1/10">
                  <div className="text-lg font-bold text-palero-blue2">{totalTasks - tasksCompleted}</div>
                  <div className="text-xs text-palero-navy2">Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Tasks Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-palero-navy1">Project Tasks</CardTitle>
                <CardDescription className="text-palero-navy2">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''} in this project
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-palero-blue1/20">
                    <TableHead className="text-palero-navy1 font-semibold">Task</TableHead>
                    <TableHead className="text-palero-navy1 font-semibold">Status</TableHead>
                    <TableHead className="text-palero-navy1 font-semibold">Priority</TableHead>
                    <TableHead className="text-palero-navy1 font-semibold">Assigned To</TableHead>
                    <TableHead className="text-palero-navy1 font-semibold">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task: Task) => (
                    <TableRow key={task.id} className="group hover:bg-palero-blue1/5 border-palero-blue1/10">
                      <TableCell>
                        <Link href={`/tasks/${task.id}`} className="font-medium text-palero-navy1 hover:text-palero-blue2 transition-colors">
                          {task.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getTaskStatusColors(task.status)}`}>
                          {task.status}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityColors(task.priority)}`}>
                          {task.priority}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6 border border-palero-blue1/20">
                            <AvatarFallback className="bg-gradient-to-br from-palero-blue1 to-palero-teal1 text-white text-xs">
                              {getUserName(task.assignedToId).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-palero-navy2">{getUserName(task.assignedToId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-palero-navy2">
                          <Calendar className="mr-1 h-3 w-3" />
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : 'No due date'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {tasks.map((task: Task) => (
                <Card key={task.id} className="border-palero-blue1/20 hover:border-palero-blue1/40 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-palero-blue1/5">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <Link href={`/tasks/${task.id}`} className="font-medium text-palero-navy1 hover:text-palero-blue2 transition-colors flex-1 pr-2">
                          {task.title}
                        </Link>
                        <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getTaskStatusColors(task.status)} flex-shrink-0`}>
                          {task.status}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColors(task.priority)}`}>
                          {task.priority} Priority
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center text-xs text-palero-navy2">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-US')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6 border border-palero-blue1/20">
                          <AvatarFallback className="bg-gradient-to-br from-palero-blue1 to-palero-teal1 text-white text-xs">
                            {getUserName(task.assignedToId).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-palero-navy2">{getUserName(task.assignedToId)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {tasks.length === 0 && (
              <div className="text-center py-12 px-4">
                <CheckCircle2 className="h-12 w-12 text-palero-blue1/50 mx-auto mb-4" />
                <p className="text-palero-navy2 font-medium">No tasks found</p>
                <p className="text-sm text-palero-navy2/70 mt-1">
                  Tasks will appear here when added to this project
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-palero-green1/20 shadow-lg">
          <CardContent className="p-6">
            <CommentSection projectId={projectId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
