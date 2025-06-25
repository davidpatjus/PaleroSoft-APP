"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, UserResponse, Project, Task } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Building2, CheckSquare, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [usersData, projectsData, tasksData] = await Promise.all([
        user?.role === 'ADMIN' ? apiClient.getUsers() : Promise.resolve([]),
        apiClient.getProjects(),
        apiClient.getTasks(),
      ]);

      setUsers(usersData);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserProjects = () => {
    if (user?.role === 'CLIENT') {
      return projects.filter(p => p.clientId === user.id);
    }
    return projects;
  };

  const getUserTasks = () => {
    if (user?.role === 'CLIENT') {
      const userProjects = getUserProjects();
      return tasks.filter(t => userProjects.some(p => p.id === t.projectId));
    }
    if (user?.role === 'TEAM_MEMBER') {
      return tasks.filter(t => t.assignedToId === user.id);
    }
    return tasks;
  };

  const userProjects = getUserProjects();
  const userTasks = getUserTasks();
  const completedTasks = userTasks.filter(t => t.status === 'DONE');

  const getRoleSpecificStats = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { title: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-500' },
          { title: 'Total Projects', value: projects.length, icon: Building2, color: 'bg-green-500' },
          { title: 'Total Tasks', value: tasks.length, icon: CheckSquare, color: 'bg-orange-500' },
          { title: 'Completed Tasks', value: completedTasks.length, icon: TrendingUp, color: 'bg-purple-500' }
        ];
      case 'TEAM_MEMBER':
        return [
          { title: 'My Tasks', value: userTasks.length, icon: CheckSquare, color: 'bg-orange-500' },
          { title: 'Completed', value: completedTasks.length, icon: TrendingUp, color: 'bg-green-500' },
          { title: 'In Progress', value: userTasks.filter(t => t.status === 'IN_PROGRESS').length, icon: Calendar, color: 'bg-blue-500' },
          { title: 'Pending', value: userTasks.filter(t => t.status === 'TODO').length, icon: CheckSquare, color: 'bg-yellow-500' }
        ];
      case 'CLIENT':
        return [
          { title: 'My Projects', value: userProjects.length, icon: Building2, color: 'bg-green-500' },
          { title: 'Active Projects', value: userProjects.filter(p => p.status === 'IN_PROGRESS').length, icon: TrendingUp, color: 'bg-blue-500' },
          { title: 'Project Tasks', value: userTasks.length, icon: CheckSquare, color: 'bg-orange-500' },
          { title: 'Completed Tasks', value: completedTasks.length, icon: TrendingUp, color: 'bg-purple-500' }
        ];
      default:
        return [];
    }
  };

  const stats = getRoleSpecificStats();
  const recentTasks = userTasks.slice(0, 5);
  const recentProjects = userProjects.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your {user?.role === 'ADMIN' ? 'system' : 'work'} today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-full ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>
              Your latest {user?.role === 'CLIENT' ? 'project' : 'assigned'} tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      task.priority === 'HIGH' ? 'destructive' : 
                      task.priority === 'MEDIUM' ? 'default' : 'secondary'
                    }>
                      {task.priority.toLowerCase()}
                    </Badge>
                    <Badge variant={
                      task.status === 'DONE' ? 'default' : 'outline'
                    }>
                      {task.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tasks found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              {user?.role === 'CLIENT' ? 'Your projects' : 'Latest projects'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {project.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        project.status === 'IN_PROGRESS' ? 'default' : 
                        project.status === 'COMPLETED' ? 'default' : 'secondary'
                      }>
                        {project.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {recentProjects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No projects found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* {userTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Progress</CardTitle>
            <CardDescription>
              Overall progress for your tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasks Completed</span>
                <span className="text-sm text-muted-foreground">{completedTasks.length}/{userTasks.length}</span>
              </div>
              <Progress value={(completedTasks.length / userTasks.length) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
}