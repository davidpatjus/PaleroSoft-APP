"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Task, UserResponse, Project } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2, Clock } from 'lucide-react';

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-palero-blue-600"></div>
          <p className="text-sm font-medium text-palero-blue-700">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight text-palero-navy1 break-words">
            Calendar
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-palero-navy2 mt-1 break-words">
            View and manage your task schedule
          </p>
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Button 
            size="sm"
            className="bg-palero-green1 hover:bg-palero-green2 text-white w-full sm:w-auto text-sm shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            New Event
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-4">
        {/* Calendar Main View */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <Card className="border-palero-blue1/20 border-2 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-palero-blue1/10 p-3 sm:p-6">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base sm:text-lg lg:text-xl text-palero-navy1">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center justify-center sm:justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigateMonth('prev')}
                    className="border-palero-blue1/20 text-palero-navy1 hover:bg-palero-blue1/10 flex-1 sm:flex-none"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="ml-1 sm:hidden">Prev</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentDate(new Date())}
                    className="border-palero-blue1/20 text-palero-navy1 hover:bg-palero-blue1/10 flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigateMonth('next')}
                    className="border-palero-blue1/20 text-palero-navy1 hover:bg-palero-blue1/10 flex-1 sm:flex-none"
                  >
                    <span className="mr-1 sm:hidden">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2 sm:mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-palero-navy1">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 1)}</span>
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before the first day of the month */}
                {Array.from({ length: firstDay }, (_, index) => (
                  <div key={`empty-${index}`} className="h-12 sm:h-16 lg:h-20 p-1"></div>
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const isToday = isCurrentMonth && day === today.getDate();
                  const dayTasks = getTasksForDate(day);
                  
                  return (
                    <div
                      key={day}
                      className={`h-12 sm:h-16 lg:h-20 p-1 border transition-all duration-200 hover:bg-palero-blue1/5 cursor-pointer ${
                        isToday 
                          ? 'bg-gradient-to-br from-palero-blue1/20 to-palero-blue1/10 border-palero-blue1 shadow-sm' 
                          : 'border-palero-blue1/10 hover:border-palero-blue1/20'
                      }`}
                    >
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${
                        isToday ? 'text-palero-blue2 font-bold' : 'text-palero-navy1'
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, isToday ? 3 : 2).map(task => (
                          <div
                            key={task.id}
                            className={`text-xs p-0.5 sm:p-1 rounded truncate transition-colors ${
                              task.priority === 'HIGH' 
                                ? 'bg-red-100 text-red-800 border-l-2 border-red-500' 
                                : task.priority === 'MEDIUM'
                                ? 'bg-palero-yellow1/20 text-palero-navy1 border-l-2 border-palero-yellow1'
                                : 'bg-palero-green1/20 text-palero-green2 border-l-2 border-palero-green1'
                            }`}
                            title={`${task.title} - ${task.priority} priority`}
                          >
                            <span className="hidden sm:inline">{task.title}</span>
                            <span className="sm:hidden">•</span>
                          </div>
                        ))}
                        {dayTasks.length > (isToday ? 3 : 2) && (
                          <div className="text-xs text-palero-blue1 font-medium">
                            +{dayTasks.length - (isToday ? 3 : 2)}
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

        {/* Sidebar */}
        <div className="space-y-4 lg:space-y-6 order-1 lg:order-2">
          <Card className="border-palero-green1/20 border-2 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-palero-green1/10 p-3 sm:p-4">
              <CardTitle className="text-palero-navy1 flex items-center gap-2 text-sm sm:text-lg">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-palero-green1" />
                <span>Today&apos;s Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3">
                {getTasksForDate(today.getDate()).map(task => (
                  <div key={task.id} className="p-3 bg-gradient-to-r from-palero-green1/5 to-palero-green1/10 rounded-lg border border-palero-green1/20 hover:shadow-md transition-all duration-200">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-xs sm:text-sm text-palero-navy1 line-clamp-2 flex-1 pr-2">{task.title}</h4>
                        <Badge 
                          className={`text-xs shrink-0 ${
                            task.priority === 'HIGH' 
                              ? 'bg-red-500 text-white' 
                              : task.priority === 'MEDIUM'
                              ? 'bg-palero-yellow1 text-palero-navy1'
                              : 'bg-palero-green1 text-white'
                          }`}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-palero-navy2 line-clamp-2">{task.description}</p>
                      <div className="text-xs text-palero-navy2 flex items-center gap-1">
                        <span className="font-medium">Assigned:</span>
                        <span className="truncate">{getUserName(task.assignedToId)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {getTasksForDate(today.getDate()).length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 text-palero-green1/50 mx-auto mb-3" />
                    <p className="text-xs sm:text-sm text-palero-navy2 font-medium">No tasks for today</p>
                    <p className="text-xs text-palero-navy2/70 mt-1">Enjoy your free time!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-palero-teal1/20 border-2 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-palero-teal1/10 p-3 sm:p-4">
              <CardTitle className="text-palero-navy1 text-sm sm:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-palero-teal1" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3">
                {userTasks
                  .filter(task => task.dueDate && new Date(task.dueDate) > today && task.status !== 'DONE')
                  .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-palero-teal1/5 to-palero-teal1/10 rounded-lg border border-palero-teal1/20 hover:shadow-md transition-all duration-200">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-palero-navy1 truncate">{task.title}</p>
                        <p className="text-xs text-palero-navy2">
                          Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          }) : 'No date'}
                        </p>
                      </div>
                      <Badge className={`text-xs shrink-0 ml-2 ${
                        task.priority === 'HIGH' 
                          ? 'bg-red-500 text-white' 
                          : task.priority === 'MEDIUM'
                          ? 'bg-palero-yellow1 text-palero-navy1'
                          : 'bg-palero-green1 text-white'
                      }`}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                {userTasks.filter(task => task.dueDate && new Date(task.dueDate) > today && task.status !== 'DONE').length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-palero-teal1/50 mx-auto mb-3" />
                    <p className="text-xs sm:text-sm text-palero-navy2 font-medium">No upcoming deadlines</p>
                    <p className="text-xs text-palero-navy2/70 mt-1">All caught up!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}