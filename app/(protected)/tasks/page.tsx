"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Task, UserResponse, Project } from '@/lib/api';
import { hasPermission } from '@/utils/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Calendar, CheckSquare, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreate = hasPermission(user!.role, 'tasks', 'create');
  const canUpdate = hasPermission(user!.role, 'tasks', 'update');
  const canDelete = hasPermission(user!.role, 'tasks', 'delete');

  useEffect(() => {
    fetchData();
  }, []);

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
    const taskUser = users.find(u => u.id === userId);
    return taskUser?.name || 'Unknown';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'border-red-500 bg-red-50';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50';
      case 'LOW': return 'border-green-500 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'LOW': return <CheckSquare className="h-4 w-4 text-green-500" />;
      default: return <CheckSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'border-gray-400 bg-gray-50';
      case 'IN_PROGRESS': return 'border-blue-500 bg-blue-50';
      case 'REVIEW': return 'border-yellow-500 bg-yellow-50';
      case 'DONE': return 'border-green-500 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'IN_PROGRESS': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'REVIEW': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'DONE': return <CheckSquare className="h-4 w-4 text-green-500" />;
      default: return <CheckSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && canUpdate) {
      try {
        await apiClient.updateTask(draggedTask, { 
          status: newStatus as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' 
        });
        setTasks(prev => prev.map(t => t.id === draggedTask ? { ...t, status: newStatus as Task['status'] } : t));
        // await fetchData(); // Opcional: mantener sincronización con backend
      } catch (error: any) {
        setError(error.message || 'Failed to update task');
      }
    }
    setDraggedTask(null);
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

  const KanbanColumn = ({ title, status, tasks }: { title: string; status: string; tasks: Task[] }) => (
    <div className="flex-1 min-w-80">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="secondary">{tasks.length}</Badge>
          </div>
        </CardHeader>
        <CardContent
          className="space-y-3 min-h-96"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              draggable={canUpdate}
              onDragStart={() => handleDragStart(task.id)}
              className={`p-4 border-l-4 rounded-lg cursor-move transition-all hover:shadow-md ${getStatusColor(task.status)}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                  {getStatusIcon(task.status)}
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {task.description}
                </p>

                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs">
                    {getProjectName(task.projectId)}
                  </Badge>
                  <Badge variant={
                    task.priority === 'HIGH' ? 'destructive' : 
                    task.priority === 'MEDIUM' ? 'default' : 'secondary'
                  } className="text-xs">
                    {task.priority.toLowerCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getUserName(task.assignedToId).split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {getUserName(task.assignedToId)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all your project tasks
          </p>
        </div>
        {canCreate && (
          <Link href="/tasks/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTasksByStatus('IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTasksByStatus('DONE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userTasks.filter(t => t.priority === 'HIGH').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="space-y-4">
          <div className="flex gap-6 overflow-x-auto pb-4">
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
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>Complete list of your tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{task.title}</h4>
                        {getPriorityIcon(task.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Assigned to: {getUserName(task.assignedToId)}</span>
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                        <span>Project: {getProjectName(task.projectId)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        task.priority === 'HIGH' ? 'destructive' : 
                        task.priority === 'MEDIUM' ? 'default' : 'secondary'
                      }>
                        {task.priority.toLowerCase()}
                      </Badge>
                      <Badge variant={task.status === 'DONE' ? 'default' : 'outline'}>
                        {task.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                      {canDelete && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteTask(task.id)}>
                          Eliminar
                        </Button>
                      )}
                      {canUpdate && (
                        <Link href={`/tasks/${task.id}/edit`}>
                          <Button variant="outline" size="sm">Editar</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {userTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No tasks found.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}