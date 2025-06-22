"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Task, UserResponse, Project } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      const userProjects = projects.filter(p => p.clientId === user.id);
      return tasks.filter(task => userProjects.some(p => p.id === task.projectId));
    }
    return tasks.filter(task => task.assignedToId === user?.id);
  };

  const userTasks = getUserTasks();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTasksForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return userTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unassigned';
    const taskUser = users.find(u => u.id === userId);
    return taskUser?.name || 'Unknown';
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your task schedule
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before the first day of the month */}
                {Array.from({ length: firstDay }, (_, index) => (
                  <div key={`empty-${index}`} className="h-24 p-1"></div>
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const isToday = isCurrentMonth && day === today.getDate();
                  const dayTasks = getTasksForDate(day);
                  
                  return (
                    <div
                      key={day}
                      className={`h-24 p-1 border rounded-lg ${
                        isToday ? 'bg-primary/10 border-primary' : 'border-border'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-primary' : 'text-foreground'
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map(task => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate ${
                              task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                              task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayTasks.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Today&apos;s Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTasksForDate(today.getDate()).map(task => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge variant={
                          task.priority === 'HIGH' ? 'destructive' : 
                          task.priority === 'MEDIUM' ? 'default' : 'secondary'
                        } className="text-xs">
                          {task.priority.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                      <div className="text-xs text-muted-foreground">
                        Assigned to: {getUserName(task.assignedToId)}
                      </div>
                    </div>
                  </div>
                ))}
                {getTasksForDate(today.getDate()).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tasks for today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userTasks
                  .filter(task => task.dueDate && new Date(task.dueDate) > today && task.status !== 'DONE')
                  .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                      <Badge variant={
                        task.priority === 'HIGH' ? 'destructive' : 
                        task.priority === 'MEDIUM' ? 'default' : 'secondary'
                      } className="text-xs">
                        {task.priority.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                {userTasks.filter(task => task.dueDate && new Date(task.dueDate) > today && task.status !== 'DONE').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming deadlines
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}