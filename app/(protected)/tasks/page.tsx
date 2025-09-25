"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Task, UserResponse, Project } from '@/lib/api';
import { hasPermission } from '@/utils/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Calendar, CheckSquare, Clock, AlertCircle, Loader2, Kanban, List, Target, BarChart3, GripVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dragAndDrop } from '@formkit/drag-and-drop';
import Link from 'next/link';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Refs for drag and drop columns
  const todoRef = useRef<HTMLDivElement>(null);
  const inProgressRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const canCreate = hasPermission(user!.role, 'tasks', 'create');
  const canUpdate = hasPermission(user!.role, 'tasks', 'update');
  const canDelete = hasPermission(user!.role, 'tasks', 'delete');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [tasksData, usersData, projectsData] = await Promise.all([
          apiClient.getTasks(),
          user?.role === 'ADMIN' || user?.role === 'TEAM_MEMBER' ? apiClient.getUsers() : Promise.resolve([]),
          apiClient.getProjects(),
        ]);

        setTasks(tasksData);
        setUsers(usersData);
        setProjects(projectsData);
        setError('');
      } catch (error: any) {
        setError(error.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  // Filter tasks based on user role
  const getUserTasks = () => {
    if (user?.role === 'ADMIN' || user?.role === 'TEAM_MEMBER') {
      return tasks;
    }
    if (user?.role === 'CLIENT') {
      // Get projects where user is the client
      const userProjects = projects.filter(p => p.clientId === user.id);
      return tasks.filter(task => userProjects.some(p => p.id === task.projectId));
    }
    return tasks.filter(task => task.assignedToId === user?.id);
  };

  const userTasks = getUserTasks();

  const getTasksByStatus = (status: string) => {
    return userTasks.filter(task => task.status === status);
  };

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unassigned';
    const taskUser = users.find((u: UserResponse) => u.id === userId);
    return taskUser?.name || 'Unknown User';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'border-red-500 bg-red-50/80 backdrop-blur-sm';
      case 'MEDIUM': return 'border-palero-yellow1 bg-palero-yellow1/10 backdrop-blur-sm';
      case 'LOW': return 'border-palero-green1 bg-palero-green1/10 backdrop-blur-sm';
      default: return 'border-palero-navy2/30 bg-palero-navy2/5 backdrop-blur-sm';
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
      case 'HIGH': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM': return <Clock className="h-4 w-4 text-palero-yellow2" />;
      case 'LOW': return <CheckSquare className="h-4 w-4 text-palero-green2" />;
      default: return <CheckSquare className="h-4 w-4 text-palero-navy2" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'border-palero-navy2 bg-palero-navy2/10 backdrop-blur-sm';
      case 'IN_PROGRESS': return 'border-palero-blue1 bg-palero-blue1/10 backdrop-blur-sm';
      case 'REVIEW': return 'border-palero-teal1 bg-palero-teal1/10 backdrop-blur-sm';
      case 'DONE': return 'border-palero-green1 bg-palero-green1/10 backdrop-blur-sm';
      default: return 'border-palero-navy2/30 bg-palero-navy2/5 backdrop-blur-sm';
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-palero-navy2 text-white';
      case 'IN_PROGRESS': return 'bg-palero-blue1 text-white';
      case 'REVIEW': return 'bg-palero-teal1 text-white';
      case 'DONE': return 'bg-palero-green1 text-white';
      default: return 'bg-palero-navy2 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Clock className="h-4 w-4 text-palero-navy2" />;
      case 'IN_PROGRESS': return <AlertCircle className="h-4 w-4 text-palero-blue1" />;
      case 'REVIEW': return <AlertCircle className="h-4 w-4 text-palero-teal1" />;
      case 'DONE': return <CheckSquare className="h-4 w-4 text-palero-green1" />;
      default: return <CheckSquare className="h-4 w-4 text-palero-navy2" />;
    }
  };

  // Enhanced drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    setTimeout(() => {
      dragElement.style.opacity = '0.5';
      dragElement.style.transform = 'rotate(3deg) scale(1.05)';
      dragElement.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = '1';
    dragElement.style.transform = 'rotate(0deg) scale(1)';
    dragElement.classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback to drop zone
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');
    
    if (taskId && canUpdate && newStatus) {
      setIsUpdating(taskId);
      try {
        await apiClient.updateTask(taskId, { 
          status: newStatus as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' 
        });
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t));
      } catch (error: any) {
        setError(error.message || 'Failed to update task');
      } finally {
        setIsUpdating(null);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta tarea?')) return;
    try {
      await apiClient.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error: any) {
      setError(error.message || 'Error al eliminar la tarea');
    }
  };

  // Enhanced Task Card Component
  const TaskCard = ({ 
    task, 
    onDragStart, 
    onDragEnd,
    canUpdate, 
    canDelete, 
    isUpdating,
    getUserName,
    getProjectName,
    getPriorityIcon,
    getPriorityColors,
    getStatusColor,
    onDelete,
    onSelect
  }: {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    canUpdate: boolean;
    canDelete: boolean;
    isUpdating: boolean;
    getUserName: (userId?: string) => string;
    getProjectName: (projectId: string) => string;
    getPriorityIcon: (priority: string) => React.ReactNode;
    getPriorityColors: (priority: string) => string;
    getStatusColor: (status: string) => string;
    onDelete: (taskId: string) => void;
    onSelect: (task: Task) => void;
  }) => (
    <div
      data-task-id={task.id}
      draggable={canUpdate && !isUpdating}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className={`
        group relative p-4 border-l-4 rounded-xl transition-all duration-200 
        ${getStatusColor(task.status)}
        ${canUpdate && !isUpdating ? 'cursor-move hover:shadow-xl hover:scale-[1.02]' : 'cursor-default'}
        ${isUpdating ? 'opacity-50 animate-pulse' : ''}
        backdrop-blur-sm border-r border-t border-b border-gray-200/20
      `}
    >
      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center z-10">
          <Loader2 className="h-5 w-5 animate-spin text-palero-blue1" />
        </div>
      )}

      {/* Drag handle */}
      {canUpdate && !isUpdating && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-palero-navy2/50" />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-sm leading-tight text-palero-navy1 line-clamp-2 flex-1 pr-8">
            {task.title}
          </h4>
          <div className="flex-shrink-0">
            {getPriorityIcon(task.priority)}
          </div>
        </div>
        
        <p className="text-xs text-palero-navy2 line-clamp-2 leading-relaxed">
          {task.description}
        </p>

        <div className="flex flex-wrap items-center gap-1">
          <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-palero-blue1/10 text-palero-blue2 border border-palero-blue1/20">
            {getProjectName(task.projectId)}
          </div>
          <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColors(task.priority)}`}>
            {task.priority}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6 border border-palero-blue1/20 ring-2 ring-white/50">
              <AvatarFallback className="bg-gradient-to-br from-palero-blue1 to-palero-teal1 text-white text-xs">
                {getUserName(task.assignedToId).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-palero-navy2 truncate font-medium">
              {getUserName(task.assignedToId)}
            </span>
          </div>
          
          <div className="flex items-center space-x-1 text-xs text-palero-navy2">
            <Calendar className="h-3 w-3" />
            <span className="truncate">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(task)}
            className="h-7 px-2 text-xs text-palero-blue1 hover:bg-palero-blue1/10"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          
          <div className="flex items-center space-x-1">
            {canUpdate && (
              <Link href={`/tasks/${task.id}/edit`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-palero-teal1 hover:bg-palero-teal1/10"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="h-7 px-2 text-xs text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const KanbanColumn = ({ title, status, tasks }: { title: string; status: string; tasks: Task[] }) => (
    <div className="w-full min-w-0 md:min-w-72 lg:min-w-80 md:flex-1">
      <Card className="bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status)}
              <CardTitle className="text-sm sm:text-base lg:text-lg text-palero-navy1">{title}</CardTitle>
            </div>
            <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs sm:text-sm font-semibold ${getStatusColors(status)}`}>
              {tasks.length}
            </div>
          </div>
        </CardHeader>
        <CardContent
          className="space-y-3 min-h-48 md:min-h-80 lg:min-h-96 px-3 sm:px-6 transition-all duration-200"
          data-status={status}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status)}
        >
          {tasks.map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              canUpdate={canUpdate}
              canDelete={canDelete}
              isUpdating={isUpdating === task.id}
              getUserName={getUserName}
              getProjectName={getProjectName}
              getPriorityIcon={getPriorityIcon}
              getPriorityColors={getPriorityColors}
              getStatusColor={getStatusColor}
              onDelete={handleDeleteTask}
              onSelect={setSelectedTask}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-palero-navy2/70">
              <div className="mb-2">{getStatusIcon(status)}</div>
              <p className="text-xs sm:text-sm">No tasks in {title.toLowerCase()}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="w-full">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center shadow-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">Tasks Management</h1>
                <p className="text-sm sm:text-base text-palero-navy2 mt-1">
                  Manage and track all your project tasks efficiently
                </p>
              </div>
            </div>
          </div>
          {canCreate && (
            <div className="flex-shrink-0">
              <Link href="/tasks/create">
                <Button className="bg-palero-green1 hover:bg-palero-green2 text-white w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="sm:hidden">New Task</span>
                  <span className="hidden sm:inline">New Task</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4 mt-4 mb-4">
          <Card className="border-palero-blue1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Total Tasks</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-blue2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <CheckSquare className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-blue2 mb-1">{userTasks.length}</div>
              <p className="text-xs text-palero-navy2">assigned tasks</p>
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
                {getTasksByStatus('IN_PROGRESS').length}
              </div>
              <p className="text-xs text-palero-navy2">currently active</p>
            </CardContent>
          </Card>

          <Card className="border-palero-green1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Completed</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-green1 to-palero-green2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <CheckSquare className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-green2 mb-1">
                {getTasksByStatus('DONE').length}
              </div>
              <p className="text-xs text-palero-navy2">tasks finished</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">High Priority</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <AlertCircle className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-red-600 mb-1">
                {userTasks.filter((t: Task) => t.priority === 'HIGH').length}
              </div>
              <p className="text-xs text-palero-navy2">urgent tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="kanban" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-palero-blue1/10">
                <TabsTrigger 
                  value="kanban" 
                  className="data-[state=active]:bg-palero-blue1 data-[state=active]:text-white"
                >
                  <Kanban className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Kanban Board</span>
                  <span className="sm:hidden">Board</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="list"
                  className="data-[state=active]:bg-palero-blue1 data-[state=active]:text-white"
                >
                  <List className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">List View</span>
                  <span className="sm:hidden">List</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="kanban" className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:overflow-x-auto pb-4">
                  <KanbanColumn
                    title="To Do"
                    status="TODO"
                    tasks={getTasksByStatus('TODO')}
                  />
                  <KanbanColumn
                    title="In Progress"
                    status="IN_PROGRESS"
                    tasks={getTasksByStatus('IN_PROGRESS')}
                  />
                  <KanbanColumn
                    title="Review"
                    status="REVIEW"
                    tasks={getTasksByStatus('REVIEW')}
                  />
                  <KanbanColumn
                    title="Done"
                    status="DONE"
                    tasks={getTasksByStatus('DONE')}
                  />
                </div>
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                <Card className="border-palero-blue1/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center">
                        <List className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-palero-navy1">All Tasks</CardTitle>
                        <CardDescription className="text-palero-navy2">Complete list of your tasks</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userTasks.map((task: Task) => (
                        <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-palero-blue1/20 rounded-lg bg-gradient-to-r from-white to-palero-blue1/5 hover:shadow-md transition-all duration-200">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-start space-x-2">
                              <h4 className="font-semibold text-palero-navy1 flex-1">{task.title}</h4>
                              {getPriorityIcon(task.priority)}
                            </div>
                            <p className="text-sm text-palero-navy2 line-clamp-2">{task.description}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-palero-navy2">
                              <div className="flex items-center space-x-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="bg-gradient-to-br from-palero-blue1 to-palero-teal1 text-white text-xs">
                                    {getUserName(task.assignedToId).split(' ').map((n: string) => n[0]).join('').slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{getUserName(task.assignedToId)}</span>
                              </div>
                              <span>•</span>
                              <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : 'No due date'}</span>
                              <span>•</span>
                              <span>Project: {getProjectName(task.projectId)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-3 sm:mt-0 sm:ml-4">
                            <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityColors(task.priority)}`}>
                              {task.priority}
                            </div>
                            <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColors(task.status)}`}>
                              {task.status.toLowerCase().replace('_', ' ')}
                            </div>
                            {canUpdate && (
                              <Link href={`/tasks/${task.id}/edit`}>
                                <Button variant="outline" size="sm" className="border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10">
                                  Edit
                                </Button>
                              </Link>
                            )}
                            {canDelete && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteTask(task.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {userTasks.length === 0 && (
                        <div className="text-center py-12 px-4">
                          <CheckSquare className="h-12 w-12 text-palero-blue1/50 mx-auto mb-4" />
                          <p className="text-palero-navy2 font-medium">No tasks found</p>
                          <p className="text-sm text-palero-navy2/70 mt-1">
                            Tasks will appear here when created
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}