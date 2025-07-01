"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, UserResponse, Project, Task } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Users, Building2, CheckSquare, TrendingUp, Calendar, Loader2, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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

  const  getRoleSpecificStats = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { 
            title: 'Total Users', 
            value: users.length, 
            icon: Users, 
            bgColor: 'bg-gradient-to-br from-palero-blue1 to-palero-blue2',
            borderColor: 'border-palero-blue1/20',
            textColor: 'text-palero-blue2'
          },
          { 
            title: 'Total Projects', 
            value: projects.length, 
            icon: Building2, 
            bgColor: 'bg-gradient-to-br from-palero-green1 to-palero-green2',
            borderColor: 'border-palero-green1/20',
            textColor: 'text-palero-green2'
          },
          { 
            title: 'Total Tasks', 
            value: tasks.length, 
            icon: CheckSquare, 
            bgColor: 'bg-gradient-to-br from-palero-teal1 to-palero-teal2',
            borderColor: 'border-palero-teal1/20',
            textColor: 'text-palero-teal2'
          },
          { 
            title: 'Completed Tasks', 
            value: completedTasks.length, 
            icon: TrendingUp, 
            bgColor: 'bg-gradient-to-br from-palero-navy1 to-palero-navy2',
            borderColor: 'border-palero-navy1/20',
            textColor: 'text-palero-navy1'
          }
        ];
      case 'TEAM_MEMBER':
        return [
          { 
            title: 'My Tasks', 
            value: userTasks.length, 
            icon: CheckSquare, 
            bgColor: 'bg-gradient-to-br from-palero-teal1 to-palero-teal2',
            borderColor: 'border-palero-teal1/20',
            textColor: 'text-palero-teal2'
          },
          { 
            title: 'Completed', 
            value: completedTasks.length, 
            icon: TrendingUp, 
            bgColor: 'bg-gradient-to-br from-palero-green1 to-palero-green2',
            borderColor: 'border-palero-green1/20',
            textColor: 'text-palero-green2'
          },
          { 
            title: 'In Progress', 
            value: userTasks.filter(t => t.status === 'IN_PROGRESS').length, 
            icon: Calendar, 
            bgColor: 'bg-gradient-to-br from-palero-blue1 to-palero-blue2',
            borderColor: 'border-palero-blue1/20',
            textColor: 'text-palero-blue2'
          },
          { 
            title: 'Pending', 
            value: userTasks.filter(t => t.status === 'TODO').length, 
            icon: CheckSquare, 
            bgColor: 'bg-gradient-to-br from-palero-navy1 to-palero-navy2',
            borderColor: 'border-palero-navy1/20',
            textColor: 'text-palero-navy1'
          }
        ];
      case 'CLIENT':
        return [
          { 
            title: 'My Projects', 
            value: userProjects.length, 
            icon: Building2, 
            bgColor: 'bg-gradient-to-br from-palero-green1 to-palero-green2',
            borderColor: 'border-palero-green1/20',
            textColor: 'text-palero-green2'
          },
          { 
            title: 'Active Projects', 
            value: userProjects.filter(p => p.status === 'IN_PROGRESS').length, 
            icon: TrendingUp, 
            bgColor: 'bg-gradient-to-br from-palero-blue1 to-palero-blue2',
            borderColor: 'border-palero-blue1/20',
            textColor: 'text-palero-blue2'
          },
          { 
            title: 'Project Tasks', 
            value: userTasks.length, 
            icon: CheckSquare, 
            bgColor: 'bg-gradient-to-br from-palero-teal1 to-palero-teal2',
            borderColor: 'border-palero-teal1/20',
            textColor: 'text-palero-teal2'
          },
          { 
            title: 'Completed Tasks', 
            value: completedTasks.length, 
            icon: TrendingUp, 
            bgColor: 'bg-gradient-to-br from-palero-navy1 to-palero-navy2',
            borderColor: 'border-palero-navy1/20',
            textColor: 'text-palero-navy1'
          }
        ];
      default:
        return [];
    }
  };

  const stats = getRoleSpecificStats();
  const recentTasks = userTasks.slice(0, 5);
  const recentProjects = userProjects.slice(0, 3);

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-palero-teal1/10 text-palero-teal2 border-palero-teal1/20';
      case 'LOW':
        return 'bg-palero-green1/10 text-palero-green2 border-palero-green1/20';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-palero-green1/10 text-palero-green2 border-palero-green1/20';
      case 'IN_PROGRESS':
        return 'bg-palero-blue1/10 text-palero-blue2 border-palero-blue1/20';
      case 'TODO':
        return 'bg-palero-navy1/10 text-palero-navy2 border-palero-navy1/20';
      case 'REVIEW':
        return 'bg-palero-teal1/10 text-palero-teal2 border-palero-teal1/20';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-palero-navy1">
            {getGreeting()}, {user?.name}!
          </h1>
          <p className="text-palero-navy2 mt-1">
            Here&apos;s an overview of your {user?.role === 'ADMIN' ? 'system' : 'work'} today.
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {user?.role !== 'CLIENT' && (
            <>
              <Link href="/projects/create">
                <Button className="bg-palero-green1 hover:bg-palero-green2 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Project</span>
                  <span className="sm:hidden">Project</span>
                </Button>
              </Link>
              <Link href="/tasks/create">
                <Button variant="outline" className="border-palero-teal1 text-palero-teal1 hover:bg-palero-teal1 hover:text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Task</span>
                  <span className="sm:hidden">Task</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className={`${stat.borderColor} border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-palero-navy1">{stat.title}</CardTitle>
              <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>{stat.value}</div>
              <p className="text-xs text-palero-navy2">
                {index === 0 && user?.role === 'ADMIN' && 'registered users'}
                {index === 0 && user?.role !== 'ADMIN' && 'total assigned'}
                {index === 1 && 'this month'}
                {index === 2 && 'active now'}
                {index === 3 && 'completed'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Recent Tasks - Takes 2 columns on large screens */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-palero-blue1/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-palero-navy1">Recent Tasks</CardTitle>
                <CardDescription className="text-palero-navy2">
                  Your latest {user?.role === 'CLIENT' ? 'project' : 'assigned'} tasks
                </CardDescription>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-palero-teal1 hover:text-palero-teal2 hover:bg-palero-teal1/10">
                  View all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="group p-4 border border-palero-blue1/10 rounded-xl hover:border-palero-teal1/30 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-palero-blue1/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold text-palero-navy1 group-hover:text-palero-teal2 transition-colors">
                          {task.title}
                        </h4>
                      </div>
                      <p className="text-sm text-palero-navy2 line-clamp-2">{task.description}</p>
                      <p className="text-xs text-palero-navy2/70 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : 'No due date'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <Badge className={`text-xs ${getPriorityBadgeStyle(task.priority)}`}>
                        {task.priority === 'HIGH' ? 'High' : task.priority === 'MEDIUM' ? 'Medium' : 'Low'}
                      </Badge>
                      <Badge className={`text-xs ${getStatusBadgeStyle(task.status)}`}>
                        {task.status === 'DONE' ? 'Completed' : 
                         task.status === 'IN_PROGRESS' ? 'In Progress' : 
                         task.status === 'TODO' ? 'Pending' : 'In Review'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-palero-blue1/50 mx-auto mb-4" />
                  <p className="text-palero-navy2 font-medium">No recent tasks</p>
                  <p className="text-sm text-palero-navy2/70 mt-1">New tasks will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects - Takes 1 column on large screens */}
        <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-palero-navy1">Recent Projects</CardTitle>
                <CardDescription className="text-palero-navy2">
                  {user?.role === 'CLIENT' ? 'Your projects' : 'Latest projects'}
                </CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="text-palero-green1 hover:text-palero-green2 hover:bg-palero-green1/10">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="group p-4 border border-palero-green1/10 rounded-xl hover:border-palero-green1/30 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-palero-green1/5 cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-palero-green1 to-palero-teal1 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <span className="text-sm font-bold text-white">
                          {project.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <h4 className="text-sm font-semibold text-palero-navy1 group-hover:text-palero-green2 transition-colors truncate">
                          {project.name}
                        </h4>
                        <p className="text-xs text-palero-navy2 line-clamp-2">{project.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={`text-xs ${getStatusBadgeStyle(project.status)}`}>
                            {project.status === 'IN_PROGRESS' ? 'In Progress' : 
                             project.status === 'COMPLETED' ? 'Completed' : 
                             project.status === 'PENDING' ? 'Pending' : 'Archived'}
                          </Badge>
                          <span className="text-xs text-palero-navy2/70">
                            {new Date(project.startDate).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {recentProjects.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-palero-green1/50 mx-auto mb-4" />
                  <p className="text-palero-navy2 font-medium">No recent projects</p>
                  <p className="text-sm text-palero-navy2/70 mt-1">New projects will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      {/* {userTasks.length > 0 && (
        <Card className="bg-gradient-to-r from-palero-teal1/10 to-palero-blue1/10 border-palero-teal1/20">
          <CardHeader>
            <CardTitle className="text-palero-navy1 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-palero-teal1" />
              Task Progress
            </CardTitle>
            <CardDescription className="text-palero-navy2">
              Overall progress of your tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-palero-navy1">Completed Tasks</span>
                <span className="text-sm font-bold text-palero-teal2">{completedTasks.length}/{userTasks.length}</span>
              </div>
              <div className="space-y-2">
                <Progress 
                  value={(completedTasks.length / userTasks.length) * 100} 
                  className="h-3 bg-palero-blue1/20"
                />
                <div className="flex justify-between text-xs text-palero-navy2">
                  <span>0%</span>
                  <span className="font-medium text-palero-teal2">
                    {Math.round((completedTasks.length / userTasks.length) * 100)}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
}