"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Task, UserResponse, Project, Invoice, Subtask, ClientProfile, Notification } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2, Clock, 
         FileText, CreditCard, CheckSquare, Bell, Target, Users, Briefcase, ExternalLink } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'task' | 'subtask' | 'project' | 'invoice' | 'notification';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: string;
  entityId: string;
  userId?: string;
  projectId?: string;
  clientId?: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // All data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Drawer state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Quick Action Modal state
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [quickActionForm, setQuickActionForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    projectId: '',
    assignedToId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Base data for all roles
        const tasksData = await apiClient.getTasks();
        const projectsData = await apiClient.getProjects();
        
        setTasks(tasksData);
        setProjects(projectsData);
        
        // Role-specific data fetching
        if (user?.role === 'ADMIN') {
          const [usersData, clientsData, subtasksData, invoicesData, notificationsData] = await Promise.all([
            apiClient.getUsers(),
            apiClient.getClients(),
            apiClient.getSubtasks(),
            apiClient.getInvoices(),
            apiClient.getAllNotificationsForAdmin()
          ]);
          
          setUsers(usersData);
          setClients(clientsData);
          setSubtasks(subtasksData);
          setInvoices(invoicesData);
          setNotifications(notificationsData);
        } else if (user?.role === 'TEAM_MEMBER') {
          const [usersData, clientsData, subtasksData, invoicesData, notificationsData] = await Promise.all([
            apiClient.getUsers(),
            apiClient.getClients(),
            apiClient.getSubtasks(),
            apiClient.getInvoices(),
            apiClient.getNotifications()
          ]);
          
          setUsers(usersData);
          setClients(clientsData);
          setSubtasks(subtasksData);
          setInvoices(invoicesData);
          setNotifications(notificationsData);
        } else if (user?.role === 'CLIENT') {
          const [invoicesData, notificationsData] = await Promise.all([
            apiClient.getInvoices(),
            apiClient.getNotifications()
          ]);
          
          setInvoices(invoicesData);
          setNotifications(notificationsData);
        }

        setError('');
      } catch (error: any) {
        setError(error.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  // Filter data based on user role
  const getFilteredData = () => {
    const userTasks = getUserTasks();
    const userSubtasks = getUserSubtasks();
    const userProjects = getUserProjects();
    const userInvoices = getUserInvoices();
    const userNotifications = getUserNotifications();
    
    return {
      tasks: userTasks,
      subtasks: userSubtasks,
      projects: userProjects,
      invoices: userInvoices,
      notifications: userNotifications
    };
  };

  const getUserTasks = () => {
    if (user?.role === 'ADMIN') {
      return tasks;
    }
    if (user?.role === 'TEAM_MEMBER') {
      return tasks;
    }
    if (user?.role === 'CLIENT') {
      const userProjects = projects.filter(p => p.clientId === user.id);
      return tasks.filter(task => userProjects.some(p => p.id === task.projectId));
    }
    return tasks.filter(task => task.assignedToId === user?.id);
  };

  const getUserSubtasks = () => {
    if (user?.role === 'ADMIN') {
      return subtasks;
    }
    if (user?.role === 'TEAM_MEMBER') {
      return subtasks;
    }
    if (user?.role === 'CLIENT') {
      const userTasks = getUserTasks();
      return subtasks.filter(subtask => userTasks.some(t => t.id === subtask.taskId));
    }
    return subtasks.filter(subtask => subtask.assignedToId === user?.id);
  };

  const getUserProjects = () => {
    if (user?.role === 'ADMIN') {
      return projects;
    }
    if (user?.role === 'TEAM_MEMBER') {
      return projects;
    }
    if (user?.role === 'CLIENT') {
      return projects.filter(p => p.clientId === user.id);
    }
    return projects;
  };

  const getUserInvoices = () => {
    if (user?.role === 'ADMIN') {
      return invoices;
    }
    if (user?.role === 'TEAM_MEMBER') {
      return invoices;
    }
    if (user?.role === 'CLIENT') {
      return invoices.filter(invoice => invoice.clientId === user.id);
    }
    return [];
  };

  const getUserNotifications = () => {
    if (user?.role === 'ADMIN') {
      return notifications;
    }
    return notifications.filter(notif => notif.userId === user?.id);
  };

  // Convert all data to calendar events
  const getCalendarEvents = (): CalendarEvent[] => {
    const { tasks: userTasks, subtasks: userSubtasks, projects: userProjects, invoices: userInvoices, notifications: userNotifications } = getFilteredData();
    const events: CalendarEvent[] = [];

    // Add tasks with due dates
    userTasks.forEach(task => {
      if (task.dueDate) {
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          description: task.description,
          date: task.dueDate,
          type: 'task',
          priority: task.priority,
          status: task.status,
          entityId: task.id,
          userId: task.assignedToId,
          projectId: task.projectId
        });
      }
    });

    // Add subtasks with due dates
    userSubtasks.forEach(subtask => {
      if (subtask.dueDate) {
        events.push({
          id: `subtask-${subtask.id}`,
          title: `↳ ${subtask.title}`,
          description: subtask.description,
          date: subtask.dueDate,
          type: 'subtask',
          priority: subtask.priority,
          status: subtask.status,
          entityId: subtask.id,
          userId: subtask.assignedToId
        });
      }
    });

    // Add project milestones (start and end dates)
    userProjects.forEach(project => {
      // Project start date
      events.push({
        id: `project-start-${project.id}`,
        title: `📅 ${project.name} (Start)`,
        description: project.description,
        date: project.startDate,
        type: 'project',
        status: project.status,
        entityId: project.id,
        clientId: project.clientId
      });

      // Project end date
      events.push({
        id: `project-end-${project.id}`,
        title: `🏁 ${project.name} (Deadline)`,
        description: project.description,
        date: project.endDate,
        type: 'project',
        status: project.status,
        entityId: project.id,
        clientId: project.clientId
      });
    });

    // Add invoice due dates
    userInvoices.forEach(invoice => {
      events.push({
        id: `invoice-${invoice.id}`,
        title: `💰 Invoice #${invoice.invoiceNumber}`,
        description: `Due: $${invoice.totalAmount}`,
        date: invoice.dueDate,
        type: 'invoice',
        status: invoice.status,
        entityId: invoice.id,
        clientId: invoice.clientId
      });
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredData = getFilteredData();
  const calendarEvents = getCalendarEvents();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getTodaysEvents = () => {
    const today = new Date();
    return getEventsForDate(today.getDate());
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return calendarEvents
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate > today;
      })
      .slice(0, 10); // Show next 10 events
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task': return <Target className="h-3 w-3" />;
      case 'subtask': return <CheckSquare className="h-3 w-3" />;
      case 'project': return <Briefcase className="h-3 w-3" />;
      case 'invoice': return <CreditCard className="h-3 w-3" />;
      case 'notification': return <Bell className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.type === 'invoice') {
      if (event.status === 'OVERDUE') return 'bg-red-100 text-red-800 border-l-2 border-red-500';
      if (event.status === 'PAID') return 'bg-green-100 text-green-800 border-l-2 border-green-500';
      return 'bg-yellow-100 text-yellow-800 border-l-2 border-yellow-500';
    }
    
    if (event.type === 'project') {
      if (event.status === 'COMPLETED') return 'bg-green-100 text-green-800 border-l-2 border-green-500';
      if (event.status === 'IN_PROGRESS') return 'bg-blue-100 text-blue-800 border-l-2 border-blue-500';
      return 'bg-gray-100 text-gray-800 border-l-2 border-gray-500';
    }
    
    if (event.priority === 'HIGH') return 'bg-red-100 text-red-800 border-l-2 border-red-500';
    if (event.priority === 'MEDIUM') return 'bg-palero-yellow1/20 text-palero-navy1 border-l-2 border-palero-yellow1';
    return 'bg-palero-green1/20 text-palero-green2 border-l-2 border-palero-green1';
  };

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'No client';
    const client = clients.find(c => c.userId === clientId);
    return client?.companyName || client?.contactPerson || 'Unknown Client';
  };

  // Quick Action handlers
  const handleDateDoubleClick = (day: number) => {
    if (user?.role === 'ADMIN' || user?.role === 'TEAM_MEMBER') {
      const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(clickedDate);
      setIsQuickActionOpen(true);
      resetQuickActionForm();
    }
  };

  const resetQuickActionForm = () => {
    setQuickActionForm({
      title: '',
      description: '',
      priority: 'MEDIUM',
      projectId: '',
      assignedToId: '',
    });
  };

  const handleQuickTaskCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActionForm.title.trim() || !quickActionForm.projectId || !selectedDate) {
      return;
    }

    setIsCreatingTask(true);
    try {
      const dueDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      await apiClient.createTask({
        projectId: quickActionForm.projectId,
        title: quickActionForm.title.trim(),
        description: quickActionForm.description.trim() || undefined,
        priority: quickActionForm.priority,
        status: 'TODO',
        dueDate: dueDate,
        assignedToId: quickActionForm.assignedToId === 'unassigned' ? undefined : quickActionForm.assignedToId || undefined,
      });

      // Refresh data to show the new task
      window.location.reload(); // Simple refresh - could be optimized to just refetch data
      
      setIsQuickActionOpen(false);
      resetQuickActionForm();
      setSelectedDate(null);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      // Could add toast notification here
    } finally {
      setIsCreatingTask(false);
    }
  };

  const getAvailableUsers = () => {
    return users.filter(user => user.role === 'ADMIN' || user.role === 'TEAM_MEMBER');
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
            Calendar & Events
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-palero-navy2 mt-1 break-words">
            Manage your schedule, deadlines, and important dates
          </p>
        </div>
        {/* <div className="flex-shrink-0 flex gap-2">
          <Button 
            size="sm"
            className="bg-palero-green1 hover:bg-palero-green2 text-white text-sm shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            New Event
          </Button>
        </div> */}
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-palero-blue1/20 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-palero-navy2">Tasks</p>
                <p className="text-xl font-bold text-palero-navy1">{filteredData.tasks.length}</p>
              </div>
              <Target className="h-6 w-6 text-palero-blue1" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-palero-green1/20 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-palero-navy2">Projects</p>
                <p className="text-xl font-bold text-palero-navy1">{filteredData.projects.length}</p>
              </div>
              <Briefcase className="h-6 w-6 text-palero-green1" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-palero-yellow1/20 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-palero-navy2">Invoices</p>
                <p className="text-xl font-bold text-palero-navy1">{filteredData.invoices.length}</p>
              </div>
              <CreditCard className="h-6 w-6 text-palero-yellow1" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-palero-teal1/20 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-palero-navy2">Events</p>
                <p className="text-xl font-bold text-palero-navy1">{calendarEvents.length}</p>
              </div>
              <CalendarIcon className="h-6 w-6 text-palero-teal1" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                  const dayEvents = getEventsForDate(day);
                  
                  return (
                    <div
                      key={day}
                      className={`h-12 sm:h-16 lg:h-20 p-1 border transition-all duration-200 hover:bg-palero-blue1/5 cursor-pointer ${
                        isToday 
                          ? 'bg-gradient-to-br from-palero-blue1/20 to-palero-blue1/10 border-palero-blue1 shadow-sm' 
                          : 'border-palero-blue1/10 hover:border-palero-blue1/20'
                      }`}
                      onDoubleClick={() => handleDateDoubleClick(day)}
                      title={dayEvents.length === 0 && (user?.role === 'ADMIN' || user?.role === 'TEAM_MEMBER') ? 'Double click to create quick task' : ''}
                    >
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${
                        isToday ? 'text-palero-blue2 font-bold' : 'text-palero-navy1'
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5 relative">
                        {dayEvents.slice(0, isToday ? 3 : 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-0.5 sm:p-1 rounded truncate transition-colors ${getEventColor(event)} hover:brightness-110 cursor-pointer`}
                            title={`${event.title} - ${event.type} ${event.priority ? `(${event.priority})` : ''}`}
                            onClick={() => { setSelectedEvent(event); setIsDrawerOpen(true); }}
                            role="button"
                            aria-label={`Open details for ${event.title}`}
                          >
                            <div className="flex items-center gap-1">
                              {getEventIcon(event.type)}
                              <span className="hidden sm:inline truncate">{event.title}</span>
                              <span className="sm:hidden">•</span>
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > (isToday ? 3 : 2) && (
                          <div className="text-xs text-palero-blue1 font-medium">
                            +{dayEvents.length - (isToday ? 3 : 2)}
                          </div>
                        )}
                        {/* Quick Action Indicator for empty dates */}
                        {dayEvents.length === 0 && (user?.role === 'ADMIN' || user?.role === 'TEAM_MEMBER') && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-palero-green1/80 text-white rounded-full p-1 shadow-md">
                              <Plus className="h-3 w-3" />
                            </div>
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
          {/* Today's Events */}
          <Card className="border-palero-green1/20 border-2 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-palero-green1/10 p-3 sm:p-4">
              <CardTitle className="text-palero-navy1 flex items-center gap-2 text-sm sm:text-lg">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-palero-green1" />
                <span>Today&apos;s Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
                  <TabsTrigger value="projects" className="text-xs">Projects</TabsTrigger>
                  <TabsTrigger value="invoices" className="text-xs">Bills</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-3">
                  {getTodaysEvents().map(event => (
                    <div key={event.id} className={`p-3 rounded-lg border hover:shadow-md transition-all duration-200 ${getEventColor(event)} cursor-pointer`} onClick={() => { setSelectedEvent(event); setIsDrawerOpen(true); }}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <h4 className="font-medium text-xs sm:text-sm line-clamp-2 flex-1 hover:underline">{event.title}</h4>
                          </div>
                          {event.priority && (
                            <Badge className={`text-xs shrink-0 ${
                              event.priority === 'HIGH' 
                                ? 'bg-red-500 text-white' 
                                : event.priority === 'MEDIUM'
                                ? 'bg-palero-yellow1 text-palero-navy1'
                                : 'bg-palero-green1 text-white'
                            }`}>
                              {event.priority}
                            </Badge>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-palero-navy2 line-clamp-2">{event.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-palero-navy2">
                          <span className="font-medium">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</span>
                          {event.userId && <span className="truncate">{getUserName(event.userId)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {getTodaysEvents().length === 0 && (
                    <div className="text-center py-6 sm:py-8">
                      <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 text-palero-green1/50 mx-auto mb-3" />
                      <p className="text-xs sm:text-sm text-palero-navy2 font-medium">No events for today</p>
                      <p className="text-xs text-palero-navy2/70 mt-1">Enjoy your free time!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="space-y-3">
                  {getTodaysEvents().filter(e => e.type === 'task' || e.type === 'subtask').map(event => (
                    <div key={event.id} className={`p-3 rounded-lg border hover:shadow-md transition-all duration-200 ${getEventColor(event)} cursor-pointer`} onClick={() => { setSelectedEvent(event); setIsDrawerOpen(true); }}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <h4 className="font-medium text-xs sm:text-sm line-clamp-2 flex-1 hover:underline">{event.title}</h4>
                          </div>
                          {event.priority && (
                            <Badge className={`text-xs shrink-0 ${
                              event.priority === 'HIGH' 
                                ? 'bg-red-500 text-white' 
                                : event.priority === 'MEDIUM'
                                ? 'bg-palero-yellow1 text-palero-navy1'
                                : 'bg-palero-green1 text-white'
                            }`}>
                              {event.priority}
                            </Badge>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-palero-navy2 line-clamp-2">{event.description}</p>
                        )}
                        <div className="text-xs text-palero-navy2 flex items-center gap-1">
                          <span className="font-medium">Assigned:</span>
                          <span className="truncate">{getUserName(event.userId)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getTodaysEvents().filter(e => e.type === 'task' || e.type === 'subtask').length === 0 && (
                    <div className="text-center py-6 sm:py-8">
                      <Target className="h-8 w-8 sm:h-12 sm:w-12 text-palero-green1/50 mx-auto mb-3" />
                      <p className="text-xs sm:text-sm text-palero-navy2 font-medium">No tasks due today</p>
                      <p className="text-xs text-palero-navy2/70 mt-1">All caught up!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="projects" className="space-y-3">
                  {getTodaysEvents().filter(e => e.type === 'project').map(event => (
                    <div key={event.id} className={`p-3 rounded-lg border hover:shadow-md transition-all duration-200 ${getEventColor(event)} cursor-pointer`} onClick={() => { setSelectedEvent(event); setIsDrawerOpen(true); }}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <h4 className="font-medium text-xs sm:text-sm line-clamp-2 flex-1 hover:underline">{event.title}</h4>
                          </div>
                          <Badge className={`text-xs shrink-0 ${
                            event.status === 'COMPLETED' ? 'bg-green-500 text-white' :
                            event.status === 'IN_PROGRESS' ? 'bg-blue-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {event.status}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-xs text-palero-navy2 line-clamp-2">{event.description}</p>
                        )}
                        <div className="text-xs text-palero-navy2 flex items-center gap-1">
                          <span className="font-medium">Client:</span>
                          <span className="truncate">{getClientName(event.clientId)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getTodaysEvents().filter(e => e.type === 'project').length === 0 && (
                    <div className="text-center py-6 sm:py-8">
                      <Briefcase className="h-8 w-8 sm:h-12 sm:w-12 text-palero-green1/50 mx-auto mb-3" />
                      <p className="text-xs sm:text-sm text-palero-navy2 font-medium">No project milestones today</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="invoices" className="space-y-3">
                  {getTodaysEvents().filter(e => e.type === 'invoice').map(event => (
                    <div key={event.id} className={`p-3 rounded-lg border hover:shadow-md transition-all duration-200 ${getEventColor(event)} cursor-pointer`} onClick={() => { setSelectedEvent(event); setIsDrawerOpen(true); }}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <h4 className="font-medium text-xs sm:text-sm line-clamp-2 flex-1 hover:underline">{event.title}</h4>
                          </div>
                          <Badge className={`text-xs shrink-0 ${
                            event.status === 'PAID' ? 'bg-green-500 text-white' :
                            event.status === 'OVERDUE' ? 'bg-red-500 text-white' :
                            'bg-yellow-500 text-white'
                          }`}>
                            {event.status}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-xs text-palero-navy2 line-clamp-2">{event.description}</p>
                        )}
                        <div className="text-xs text-palero-navy2 flex items-center gap-1">
                          <span className="font-medium">Client:</span>
                          <span className="truncate">{getClientName(event.clientId)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getTodaysEvents().filter(e => e.type === 'invoice').length === 0 && (
                    <div className="text-center py-6 sm:py-8">
                      <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-palero-green1/50 mx-auto mb-3" />
                      <p className="text-xs sm:text-sm text-palero-navy2 font-medium">No invoices due today</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-palero-teal1/20 border-2 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-palero-teal1/10 p-3 sm:p-4">
              <CardTitle className="text-palero-navy1 text-sm sm:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-palero-teal1" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3">
                {getUpcomingEvents().map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-palero-teal1/5 to-palero-teal1/10 rounded-lg border border-palero-teal1/20 hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => { setSelectedEvent(event); setIsDrawerOpen(true); }}>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                        <p className="text-xs sm:text-sm font-medium text-palero-navy1 truncate hover:underline">{event.title}</p>
                      </div>
                      <p className="text-xs text-palero-navy2">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: new Date(event.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </p>
                    </div>
                    {event.priority && (
                      <Badge className={`text-xs shrink-0 ml-2 ${
                        event.priority === 'HIGH' 
                          ? 'bg-red-500 text-white' 
                          : event.priority === 'MEDIUM'
                          ? 'bg-palero-yellow1 text-palero-navy1'
                          : 'bg-palero-green1 text-white'
                      }`}>
                        {event.priority}
                      </Badge>
                    )}
                  </div>
                ))}
                {getUpcomingEvents().length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-palero-teal1/50 mx-auto mb-3" />
                    <p className="text-xs sm:text-sm text-palero-navy2 font-medium">No upcoming events</p>
                    <p className="text-xs text-palero-navy2/70 mt-1">All clear ahead!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

            {/* Quick Actions */}
            {(user?.role === 'ADMIN' || user?.role === 'TEAM_MEMBER') && (
            <Card className="border-palero-blue1/20 border-2 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="border-b border-palero-blue1/10 p-3 sm:p-4">
              <CardTitle className="text-palero-navy1 text-sm sm:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-2">
                <Link href="/tasks/create">
                <Button size="sm" className="w-full justify-start" variant="outline">
                  <Target className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
                </Link>
                <Link href="/projects/create">
                <Button size="sm" className="w-full justify-start" variant="outline">
                  <Briefcase className="mr-2 h-4 w-4" />
                  New Project
                </Button>
                </Link>
                {user?.role === 'ADMIN' && (
                <Link href="/invoices/create">
                  <Button size="sm" className="w-full justify-start" variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Generate Invoice
                  </Button>
                </Link>
                )}
              </div>
              </CardContent>
            </Card>
            )}
        </div>
      </div>
      {/* Quick Action Modal */}
      <Dialog open={isQuickActionOpen} onOpenChange={(open) => { if(!open){ setIsQuickActionOpen(false); setSelectedDate(null); resetQuickActionForm();} }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-palero-navy1 flex items-center gap-2">
              <Plus className="h-5 w-5 text-palero-green1" />
              Quick Task Creation
            </DialogTitle>
            <DialogDescription className="text-palero-navy2">
              {selectedDate && (
                <>Create a new task for <strong>{selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickTaskCreate} className="space-y-4">
            <div>
              <Label htmlFor="quick-title" className="text-sm font-medium text-palero-navy1">
                Task Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quick-title"
                placeholder="Enter task title..."
                value={quickActionForm.title}
                onChange={(e) => setQuickActionForm(prev => ({ ...prev, title: e.target.value }))}
                className="border-palero-blue1/30 focus:border-palero-blue1 mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="quick-description" className="text-sm font-medium text-palero-navy1">
                Description
              </Label>
              <Textarea
                id="quick-description"
                placeholder="Task description (optional)..."
                value={quickActionForm.description}
                onChange={(e) => setQuickActionForm(prev => ({ ...prev, description: e.target.value }))}
                className="border-palero-blue1/30 focus:border-palero-blue1 mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quick-priority" className="text-sm font-medium text-palero-navy1">
                  Priority
                </Label>
                <Select
                  value={quickActionForm.priority}
                  onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
                    setQuickActionForm(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="border-palero-blue1/30 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">🟢 Low</SelectItem>
                    <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                    <SelectItem value="HIGH">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quick-project" className="text-sm font-medium text-palero-navy1">
                  Project <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={quickActionForm.projectId}
                  onValueChange={(value) => setQuickActionForm(prev => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger className="border-palero-blue1/30 mt-1">
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredData.projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="quick-assign" className="text-sm font-medium text-palero-navy1">
                Assign To
              </Label>
              <Select
                value={quickActionForm.assignedToId}
                onValueChange={(value) => setQuickActionForm(prev => ({ ...prev, assignedToId: value }))}
              >
                <SelectTrigger className="border-palero-blue1/30 mt-1">
                  <SelectValue placeholder="Assign to someone (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {getAvailableUsers().map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setSelectedDate(null);
                  resetQuickActionForm();
                }}
                className="border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingTask || !quickActionForm.title.trim() || !quickActionForm.projectId}
                className="bg-palero-green1 hover:bg-palero-green2 text-white"
              >
                {isCreatingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Drawer de detalles del evento */}
      <Drawer open={isDrawerOpen} onOpenChange={(open) => { if(!open){ setIsDrawerOpen(false); setSelectedEvent(null);} }}>
        <DrawerContent className="max-h-[85vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              {selectedEvent && getEventIcon(selectedEvent.type)}
              {selectedEvent ? selectedEvent.title : 'Event detail'}
            </DrawerTitle>
            {selectedEvent && (
              <DrawerDescription>
                {new Date(selectedEvent.date).toLocaleString()} · {selectedEvent.type.toUpperCase()} {selectedEvent.priority ? `· Priority: ${selectedEvent.priority}` : ''}
              </DrawerDescription>
            )}
          </DrawerHeader>
          {selectedEvent && (
            <div className="px-6 pb-6 space-y-4">
              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-palero-navy2 whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="space-y-1">
                  <p className="font-medium text-palero-navy1">Date</p>
                  <p className="text-palero-navy2">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                </div>
                {selectedEvent.status && (
                  <div className="space-y-1">
                    <p className="font-medium text-palero-navy1">Status</p>
                    <p className="text-palero-navy2">{selectedEvent.status}</p>
                  </div>
                )}
                {selectedEvent.priority && (
                  <div className="space-y-1">
                    <p className="font-medium text-palero-navy1">Priority</p>
                    <p className="text-palero-navy2">{selectedEvent.priority}</p>
                  </div>
                )}
                {selectedEvent.userId && (
                  <div className="space-y-1 col-span-2">
                    <p className="font-medium text-palero-navy1">Assigned To</p>
                    <p className="text-palero-navy2">{getUserName(selectedEvent.userId)}</p>
                  </div>
                )}
                {selectedEvent.clientId && (
                  <div className="space-y-1 col-span-2">
                    <p className="font-medium text-palero-navy1">Client</p>
                    <p className="text-palero-navy2">{getClientName(selectedEvent.clientId)}</p>
                  </div>
                )}
              </div>
              <div className="pt-2">
                {(() => {
                  let href: string | null = null;
                  if (selectedEvent.type === 'task') href = `/tasks/${selectedEvent.entityId}`;
                  else if (selectedEvent.type === 'subtask') href = `/tasks/${selectedEvent.projectId || ''}`; // TODO: ajustar ruta real de subtask
                  else if (selectedEvent.type === 'project') href = `/projects/${selectedEvent.entityId}`;
                  else if (selectedEvent.type === 'invoice') href = `/invoices/${selectedEvent.entityId}`;
                  if (href) {
                    return (
                      <Link href={href} className="inline-flex items-center text-sm text-palero-blue1 hover:underline font-medium">
                        Open related page <ExternalLink className="h-4 w-4 ml-1" />
                      </Link>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
          <DrawerFooter>
            <Button variant="outline" onClick={() => { setIsDrawerOpen(false); setSelectedEvent(null); }}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}