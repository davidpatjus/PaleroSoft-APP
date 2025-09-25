"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Task, Project, UserResponse } from '@/lib/api';
import { hasPermission } from '@/utils/permissions';
import { CommentSection } from '@/components/CommentSection';
import { SubtasksSection } from '@/components/SubtasksSection';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  User,
  FolderOpen,
  FileText,
  Edit,
  Clock,
  AlertTriangle,
  Flag,
  Target,
  BarChart3,
  AlertCircle
} from 'lucide-react';

export default function TaskDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assignedUser, setAssignedUser] = useState<UserResponse | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const canUpdate = hasPermission(user!.role, 'tasks', 'update');
  const canDelete = hasPermission(user!.role, 'tasks', 'delete');

  useEffect(() => {
    if (!taskId) return;

    async function fetchData() {
      try {
        setIsLoading(true);
        const [tasksData, projectsData, usersData] = await Promise.all([
          apiClient.getTasks(),
          apiClient.getProjects(),
          apiClient.getUsers(),
        ]);

        const currentTask = tasksData.find(t => t.id === taskId);
        if (!currentTask) {
          setError('Task not found');
          return;
        }

        const taskProject = projectsData.find(p => p.id === currentTask.projectId);
        const taskUser = usersData.find(u => u.id === currentTask.assignedToId);

        setTask(currentTask);
        setProject(taskProject || null);
        setAssignedUser(taskUser || null);
        setUsers(usersData);
        setProjects(projectsData);

      } catch (e: any) {
        setError(e.message || 'Failed to load task details.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [taskId]);

  const getStatusColors = (status: string) => {
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Flag className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-4 w-4 text-palero-yellow2" />;
      case 'LOW':
        return <Target className="h-4 w-4 text-palero-green2" />;
      default:
        return <Flag className="h-4 w-4 text-palero-navy2" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-palero-green1" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-palero-blue1" />;
      case 'TODO':
        return <AlertCircle className="h-4 w-4 text-palero-yellow2" />;
      case 'REVIEW':
        return <BarChart3 className="h-4 w-4 text-palero-teal1" />;
      default:
        return <AlertCircle className="h-4 w-4 text-palero-navy2" />;
    }
  };

  // Calcular progreso basado en el status
  const getProgressValue = (status: string) => {
    switch (status) {
      case 'TODO': return 0;
      case 'IN_PROGRESS': return 50;
      case 'REVIEW': return 85;
      case 'DONE': return 100;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palero-blue1/5 via-white to-palero-green1/5 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading task details...</p>
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

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palero-blue1/5 via-white to-palero-green1/5 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-palero-blue1/20">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-palero-blue1/50 mx-auto mb-4" />
              <p className="text-palero-navy2 font-medium">Task not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressValue = getProgressValue(task.status);

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
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center shadow-lg flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1 break-words">
                  {task.title}
                </h1>
                <p className="text-sm sm:text-base text-palero-navy2 mt-1 line-clamp-3">
                  {task.description}
                </p>
              </div>
            </div>
          </div>
          {canUpdate && (
            <div className="flex-shrink-0">
              <Link href={`/tasks/${taskId}/edit`}>
                <Button className="bg-palero-green1 hover:bg-palero-green2 text-white w-full sm:w-auto">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Task
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Task Info Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Task Details Card */}
          <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-palero-navy1">Task Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-palero-blue1/5 border border-palero-blue1/20">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(task.status)}
                  <span className="text-palero-navy1 font-medium">Status:</span>
                </div>
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getStatusColors(task.status)}`}>
                  {task.status.toLowerCase().replace('_', ' ')}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center space-x-3">
                  {getPriorityIcon(task.priority)}
                  <span className="text-palero-navy1 font-medium">Priority:</span>
                </div>
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getPriorityColors(task.priority)}`}>
                  {task.priority.toLowerCase()}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-palero-teal1/5 border border-palero-teal1/20">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-palero-teal1" />
                  <span className="text-palero-navy1 font-medium">Due Date:</span>
                </div>
                <div className="text-sm text-palero-navy1 font-medium">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'No due date'}
                </div>
              </div>
              
              {assignedUser && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-palero-green1/5 border border-palero-green1/20">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-palero-green1" />
                    <span className="text-palero-navy1 font-medium">Assigned to:</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-palero-navy1 font-medium">{assignedUser.name}</span>
                    <Avatar className="h-8 w-8 border border-palero-green1/20">
                      <AvatarFallback className="bg-gradient-to-br from-palero-green1 to-palero-teal1 text-white text-xs">
                        {assignedUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              )}

              {project && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-palero-yellow1/10 border border-palero-yellow1/20">
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="h-5 w-5 text-palero-yellow2" />
                    <span className="text-palero-navy1 font-medium">Project:</span>
                  </div>
                  <Link 
                    href={`/projects/${project.id}`}
                    className="text-sm text-palero-blue1 font-medium hover:text-palero-blue2 hover:underline"
                  >
                    {project.name}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-palero-green1/20 shadow-lg">
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
                  <span className="text-sm font-medium text-palero-navy1">Task Status</span>
                  <span className="text-sm font-bold text-palero-green2">{progressValue}%</span>
                </div>
                <div className="w-full bg-palero-green1/10 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-palero-green1 to-palero-teal1 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressValue}%` }}
                  ></div>
                </div>
                <p className="text-xs text-palero-navy2 text-center">
                  {task.status === 'DONE' ? 'Task completed' : `Task is ${task.status.toLowerCase().replace('_', ' ')}`}
                </p>
              </div>
              
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-palero-blue1/10">
                  <div className="text-center">
                    <div className="text-sm font-bold text-palero-blue2">
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </div>
                    <div className="text-xs text-palero-navy2">Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-palero-teal2">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </div>
                    <div className="text-xs text-palero-navy2">Due Date</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subtasks Section */}
        <SubtasksSection taskId={taskId} />

        {/* Comments Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-palero-green1/20 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-green1 to-palero-teal1 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-palero-navy1">Task Comments</CardTitle>
                <CardDescription className="text-palero-navy2">
                  Discussion and updates for this task
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <CommentSection taskId={taskId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}