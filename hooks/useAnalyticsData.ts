"use client";

import { useState, useEffect, useMemo } from 'react';
import { apiClient, Invoice, Project, Task, ClientProfile } from '@/lib/api';

// Interfaces para los datos de analytics
export interface MetricData {
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  previousValue?: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  target: number;
}

export interface ProjectStatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface ClientActivityData {
  clientName: string;
  projectsCount: number;
  totalRevenue: number;
  lastActivity: string;
}

export interface TaskProgressData {
  date: string;
  completed: number;
  pending: number;
  total: number;
}

// Hook principal para analytics
export function useAnalyticsData(startDate?: Date, endDate?: Date) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch data on mount and when dates change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const [invoicesData, projectsData, tasksData, clientsData] = await Promise.all([
          apiClient.getInvoices(),
          apiClient.getProjects(),
          apiClient.getTasks(),
          apiClient.getClients(),
        ]);

        setInvoices(invoicesData);
        setProjects(projectsData);
        setTasks(tasksData);
        setClients(clientsData);
        setLastUpdated(new Date());
      } catch (error: any) {
        console.error('Error fetching analytics data:', error);
        setError(error.message || 'Error loading analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  // Helper functions for data processing
  const filterByDateRange = <T extends { createdAt?: string; updatedAt?: string }>(
    items: T[],
    start?: Date,
    end?: Date,
    dateField: keyof T = 'createdAt'
  ): T[] => {
    if (!start || !end) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField] as string);
      return itemDate >= start && itemDate <= end;
    });
  };

  const getPreviousPeriod = (start: Date, end: Date) => {
    const diffTime = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - diffTime);
    return { previousStart, previousEnd };
  };

  const calculateChange = (current: number, previous: number): { change: number; changeType: 'increase' | 'decrease' | 'neutral' } => {
    if (previous === 0) return { change: 0, changeType: 'neutral' };
    
    const change = ((current - previous) / previous) * 100;
    const changeType = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';
    
    return { change: Math.abs(change), changeType };
  };

  // Memoized computed data
  const analyticsData = useMemo(() => {
    if (isLoading || invoices.length === 0) {
      return {
        totalRevenue: { value: 0, change: 0, changeType: 'neutral' as const },
        activeProjects: { value: 0, change: 0, changeType: 'neutral' as const },
        completedTasks: { value: 0, change: 0, changeType: 'neutral' as const },
        totalClients: { value: 0, change: 0, changeType: 'neutral' as const },
        revenueChart: [] as RevenueData[],
        projectStatusChart: [] as ProjectStatusData[],
        clientActivity: [] as ClientActivityData[],
        taskProgress: [] as TaskProgressData[],
      };
    }

    // Process revenue data
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
    const currentPeriodInvoices = filterByDateRange(paidInvoices, startDate, endDate);
    const currentRevenue = currentPeriodInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    
    let previousRevenue = 0;
    if (startDate && endDate) {
      const { previousStart, previousEnd } = getPreviousPeriod(startDate, endDate);
      const previousPeriodInvoices = filterByDateRange(paidInvoices, previousStart, previousEnd);
      previousRevenue = previousPeriodInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    }

    // Process project data
    const filteredProjects = filterByDateRange(projects, startDate, endDate);
    const activeProjectsCount = filteredProjects.filter(p => p.status === 'IN_PROGRESS').length;
    
    let previousActiveProjects = 0;
    if (startDate && endDate) {
      const { previousStart, previousEnd } = getPreviousPeriod(startDate, endDate);
      const previousProjects = filterByDateRange(projects, previousStart, previousEnd);
      previousActiveProjects = previousProjects.filter(p => p.status === 'IN_PROGRESS').length;
    }

    // Process task data
    const filteredTasks = filterByDateRange(tasks, startDate, endDate, 'updatedAt');
    const completedTasksCount = filteredTasks.filter(t => t.status === 'DONE').length;
    
    let previousCompletedTasks = 0;
    if (startDate && endDate) {
      const { previousStart, previousEnd } = getPreviousPeriod(startDate, endDate);
      const previousTasks = filterByDateRange(tasks, previousStart, previousEnd, 'updatedAt');
      previousCompletedTasks = previousTasks.filter(t => t.status === 'DONE').length;
    }

    // Calculate changes
    const revenueChange = calculateChange(currentRevenue, previousRevenue);
    const projectChange = calculateChange(activeProjectsCount, previousActiveProjects);
    const taskChange = calculateChange(completedTasksCount, previousCompletedTasks);

    // Project status distribution
    const statusDistribution: Record<string, number> = {};
    filteredProjects.forEach(project => {
      statusDistribution[project.status] = (statusDistribution[project.status] || 0) + 1;
    });

    const projectStatusChart: ProjectStatusData[] = Object.entries(statusDistribution).map(([status, count]) => ({
      status: status.replace('_', ' '),
      count,
      percentage: filteredProjects.length > 0 ? (count / filteredProjects.length) * 100 : 0
    }));

    // Revenue chart data (last 6 months)
    const revenueChart: RevenueData[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthInvoices = filterByDateRange(paidInvoices, monthStart, monthEnd);
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      
      revenueChart.push({
        month: monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        revenue: monthRevenue,
        target: monthRevenue > 0 ? monthRevenue * 1.1 : 50000
      });
    }

    // Client activity
    const clientActivity: ClientActivityData[] = clients.map(client => {
      const clientProjects = projects.filter(p => p.clientId === client.id);
      const clientInvoices = invoices.filter(inv => 
        clientProjects.some(p => p.id === inv.projectId)
      );
      
      const totalRevenue = clientInvoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

      const lastProject = clientProjects
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];
      
      const lastActivity = lastProject 
        ? new Date(lastProject.updatedAt || lastProject.createdAt).toLocaleDateString('en-US')
        : 'No activity';

      return {
        clientName: client.companyName || client.contactPerson || 'Unnamed client',
        projectsCount: clientProjects.length,
        totalRevenue,
        lastActivity
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

    // Task progress (last 7 days)
    const taskProgress: TaskProgressData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.updatedAt || task.createdAt);
        return taskDate >= dayStart && taskDate <= dayEnd;
      });
      
      const completed = dayTasks.filter(t => t.status === 'DONE').length;
      const pending = dayTasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
      
      taskProgress.push({
        date: dateStr,
        completed,
        pending,
        total: completed + pending
      });
    }

    return {
      totalRevenue: {
        value: currentRevenue,
        change: revenueChange.change,
        changeType: revenueChange.changeType,
        previousValue: previousRevenue
      },
      activeProjects: {
        value: activeProjectsCount,
        change: projectChange.change,
        changeType: projectChange.changeType,
        previousValue: previousActiveProjects
      },
      completedTasks: {
        value: completedTasksCount,
        change: taskChange.change,
        changeType: taskChange.changeType,
        previousValue: previousCompletedTasks
      },
      totalClients: {
        value: clients.length,
        change: 0,
        changeType: 'neutral' as const
      },
      revenueChart,
      projectStatusChart,
      clientActivity,
      taskProgress
    };
  }, [invoices, projects, tasks, clients, startDate, endDate, isLoading]);

  // Refresh function
  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [invoicesData, projectsData, tasksData, clientsData] = await Promise.all([
        apiClient.getInvoices(),
        apiClient.getProjects(),
        apiClient.getTasks(),
        apiClient.getClients(),
      ]);

      setInvoices(invoicesData);
      setProjects(projectsData);
      setTasks(tasksData);
      setClients(clientsData);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error refreshing analytics data:', error);
      setError(error.message || 'Error updating data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...analyticsData,
    isLoading,
    error,
    lastUpdated,
    refreshData
  };
}
