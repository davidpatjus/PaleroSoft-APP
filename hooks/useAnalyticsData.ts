"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient, Invoice, Project, Task, UserResponse, ClientProfile } from '@/lib/api';
import { User } from '@/types';

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

export interface AnalyticsData {
  // Métricas principales
  totalRevenue: MetricData;
  activeProjects: MetricData;
  completedTasks: MetricData;
  totalClients: MetricData;
  
  // Datos para gráficos
  revenueChart: RevenueData[];
  projectStatusChart: ProjectStatusData[];
  clientActivity: ClientActivityData[];
  taskProgress: TaskProgressData[];
  
  // Estado de carga y errores
  isLoading: boolean;
  error: string | null;
  errorDetails: ErrorDetails | null;
  lastUpdated: Date | null;
  retryCount: number;
  hasMaxErrors: boolean;
}

export interface ErrorDetails {
  message: string;
  stack?: string;
  timestamp: Date;
  context: string;
  retryAttempt: number;
  errorLog: ErrorLogEntry[];
}

export interface ErrorLogEntry {
  timestamp: Date;
  error: string;
  context: string;
  attempt: number;
}

// Hook principal para analytics
export function useAnalyticsData(startDate?: Date, endDate?: Date) {
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: { value: 0, change: 0, changeType: 'neutral' },
    activeProjects: { value: 0, change: 0, changeType: 'neutral' },
    completedTasks: { value: 0, change: 0, changeType: 'neutral' },
    totalClients: { value: 0, change: 0, changeType: 'neutral' },
    revenueChart: [],
    projectStatusChart: [],
    clientActivity: [],
    taskProgress: [],
    isLoading: true,
    error: null,
    errorDetails: null,
    lastUpdated: null,
    retryCount: 0,
    hasMaxErrors: false,
  });

  const MAX_RETRIES = 5;

  // Función para calcular el cambio porcentual
  const calculateChange = useCallback((current: number, previous: number): { change: number; changeType: 'increase' | 'decrease' | 'neutral' } => {
    if (previous === 0) return { change: 0, changeType: 'neutral' };
    
    const change = ((current - previous) / previous) * 100;
    const changeType = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';
    
    return { change: Math.abs(change), changeType };
  }, []);

  // Función para obtener el rango de fechas anterior para comparación
  const getPreviousPeriod = useCallback((start: Date, end: Date) => {
    const diffTime = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - diffTime);
    
    return { previousStart, previousEnd };
  }, []);

  // Función para filtrar datos por rango de fechas
  const filterByDateRange = useCallback(<T extends { createdAt?: string; updatedAt?: string; date?: string }>(
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
  }, []);



  // Efecto principal para cargar datos
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      // Verificar si ya hemos llegado al máximo de errores
      if (data.hasMaxErrors) {
        return;
      }

      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Cargar todos los datos en paralelo
        const [invoices, projects, tasks, clients] = await Promise.all([
          apiClient.getInvoices(),
          apiClient.getProjects(),
          apiClient.getTasks(),
          apiClient.getClients()
        ]);

        // Procesamiento de datos de facturación
        const processRevenueData = (invoices: Invoice[], start?: Date, end?: Date): { current: number; previous: number; chartData: RevenueData[] } => {
          const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
          
          // Filtrar por período actual
          const currentPeriodInvoices = filterByDateRange(paidInvoices, start, end);
          const currentRevenue = currentPeriodInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
          
          // Período anterior para comparación
          let previousRevenue = 0;
          if (start && end) {
            const { previousStart, previousEnd } = getPreviousPeriod(start, end);
            const previousPeriodInvoices = filterByDateRange(paidInvoices, previousStart, previousEnd);
            previousRevenue = previousPeriodInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
          }

          // Datos para el gráfico (últimos 6 meses)
          const chartData: RevenueData[] = [];
          for (let i = 5; i >= 0; i--) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - i);
            
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            
            const monthInvoices = filterByDateRange(paidInvoices, monthStart, monthEnd);
            const monthRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
            
            // Target simple (promedio de los últimos meses + 10%)
            const target = monthRevenue > 0 ? monthRevenue * 1.1 : 50000;
            
            chartData.push({
              month: monthDate.toLocaleString('es-ES', { month: 'short', year: '2-digit' }),
              revenue: monthRevenue,
              target: target
            });
          }

          return { current: currentRevenue, previous: previousRevenue, chartData };
        };

        // Procesamiento de datos de proyectos
        const processProjectData = (projects: Project[], start?: Date, end?: Date) => {
          const filteredProjects = filterByDateRange(projects, start, end);
          const activeProjects = filteredProjects.filter(p => p.status === 'IN_PROGRESS');
          
          // Período anterior
          let previousActiveCount = 0;
          if (start && end) {
            const { previousStart, previousEnd } = getPreviousPeriod(start, end);
            const previousProjects = filterByDateRange(projects, previousStart, previousEnd);
            previousActiveCount = previousProjects.filter(p => p.status === 'IN_PROGRESS').length;
          }

          // Distribución por estado
          const statusDistribution: Record<string, number> = {};
          filteredProjects.forEach(project => {
            statusDistribution[project.status] = (statusDistribution[project.status] || 0) + 1;
          });

          const statusChartData: ProjectStatusData[] = Object.entries(statusDistribution).map(([status, count]) => ({
            status: status.replace('_', ' '),
            count,
            percentage: filteredProjects.length > 0 ? (count / filteredProjects.length) * 100 : 0
          }));

          return {
            current: activeProjects.length,
            previous: previousActiveCount,
            chartData: statusChartData
          };
        };

        // Procesamiento de datos de tareas
        const processTaskData = (tasks: Task[], start?: Date, end?: Date) => {
          const filteredTasks = filterByDateRange(tasks, start, end, 'updatedAt');
          const completedTasks = filteredTasks.filter(t => t.status === 'DONE');
          
          // Período anterior
          let previousCompletedCount = 0;
          if (start && end) {
            const { previousStart, previousEnd } = getPreviousPeriod(start, end);
            const previousTasks = filterByDateRange(tasks, previousStart, previousEnd, 'updatedAt');
            previousCompletedCount = previousTasks.filter(t => t.status === 'DONE').length;
          }

          // Progreso diario (últimos 7 días)
          const progressData: TaskProgressData[] = [];
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
            
            progressData.push({
              date: dateStr,
              completed,
              pending,
              total: completed + pending
            });
          }

          return {
            current: completedTasks.length,
            previous: previousCompletedCount,
            progressData
          };
        };

        // Procesamiento de actividad de clientes
        const processClientActivity = (clients: ClientProfile[], projects: Project[], invoices: Invoice[]) => {
          return clients.map(client => {
            const clientProjects = projects.filter(p => p.clientId === client.id);
            const clientInvoices = invoices.filter(inv => 
              clientProjects.some(p => p.id === inv.projectId)
            );
            
            const totalRevenue = clientInvoices
              .filter(inv => inv.status === 'PAID')
              .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

            // Última actividad (proyecto más reciente)
            const lastProject = clientProjects
              .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];
            
            const lastActivity = lastProject 
              ? new Date(lastProject.updatedAt || lastProject.createdAt).toLocaleDateString('es-ES')
              : 'Sin actividad';

            return {
              clientName: client.companyName || client.contactPerson || 'Cliente sin nombre',
              projectsCount: clientProjects.length,
              totalRevenue,
              lastActivity
            };
          }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10); // Top 10 clientes
        };

        // Procesar datos
        const revenueData = processRevenueData(invoices, startDate, endDate);
        const projectData = processProjectData(projects, startDate, endDate);
        const taskData = processTaskData(tasks, startDate, endDate);
        const clientActivity = processClientActivity(clients, projects, invoices);

        // Calcular cambios
        const revenueChange = calculateChange(revenueData.current, revenueData.previous);
        const projectChange = calculateChange(projectData.current, projectData.previous);
        const taskChange = calculateChange(taskData.current, taskData.previous);
        
        // Total de clientes (sin filtro de fechas ya que es un total acumulativo)
        const totalClients = clients.length;
        const clientsChange = { change: 0, changeType: 'neutral' as const }; // Por simplicidad

        setData(prev => ({
          totalRevenue: {
            value: revenueData.current,
            change: revenueChange.change,
            changeType: revenueChange.changeType,
            previousValue: revenueData.previous
          },
          activeProjects: {
            value: projectData.current,
            change: projectChange.change,
            changeType: projectChange.changeType,
            previousValue: projectData.previous
          },
          completedTasks: {
            value: taskData.current,
            change: taskChange.change,
            changeType: taskChange.changeType,
            previousValue: taskData.previous
          },
          totalClients: {
            value: totalClients,
            change: clientsChange.change,
            changeType: clientsChange.changeType
          },
          revenueChart: revenueData.chartData,
          projectStatusChart: projectData.chartData,
          clientActivity,
          taskProgress: taskData.progressData,
          isLoading: false,
          error: null,
          errorDetails: null,
          lastUpdated: new Date(),
          retryCount: 0, // Reset retry count en éxito
          hasMaxErrors: false,
        }));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        console.error('Error fetching analytics data:', error);

        setData(prev => {
          const newRetryCount = prev.retryCount + 1;
          const hasMaxErrors = newRetryCount >= MAX_RETRIES;
          
          // Agregar error al log
          const newErrorLog: ErrorLogEntry = {
            timestamp: new Date(),
            error: errorMessage,
            context: 'fetchAnalyticsData',
            attempt: newRetryCount
          };

          const updatedErrorLog = prev.errorDetails?.errorLog 
            ? [...prev.errorDetails.errorLog, newErrorLog]
            : [newErrorLog];

          const errorDetails: ErrorDetails = {
            message: errorMessage,
            stack: errorStack,
            timestamp: new Date(),
            context: 'useAnalyticsData - fetchAnalyticsData',
            retryAttempt: newRetryCount,
            errorLog: updatedErrorLog
          };

          return {
            ...prev,
            isLoading: false,
            error: hasMaxErrors 
              ? `Error crítico después de ${MAX_RETRIES} intentos: ${errorMessage}`
              : `Error (intento ${newRetryCount}/${MAX_RETRIES}): ${errorMessage}`,
            errorDetails,
            retryCount: newRetryCount,
            hasMaxErrors
          };
        });

        // Si no hemos llegado al máximo, reintentamos después de un delay
        if (data.retryCount + 1 < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, data.retryCount), 10000); // Backoff exponential con máximo de 10s
          setTimeout(() => {
            fetchAnalyticsData();
          }, delay);
        }
      }
    };

    fetchAnalyticsData();
  }, [startDate, endDate, calculateChange, getPreviousPeriod, filterByDateRange, data.hasMaxErrors, data.retryCount]);

  // Función para resetear errores y reintentar
  const resetErrors = useCallback(() => {
    setData(prev => ({
      ...prev,
      error: null,
      errorDetails: null,
      retryCount: 0,
      hasMaxErrors: false,
      isLoading: true
    }));
  }, []);

  // Función para refrescar datos manualmente con useCallback
  const refreshData = useCallback(() => {
    const fetchAnalyticsData = async () => {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Cargar todos los datos en paralelo
        const [invoices, projects, tasks, clients] = await Promise.all([
          apiClient.getInvoices(),
          apiClient.getProjects(),
          apiClient.getTasks(),
          apiClient.getClients()
        ]);

        // Procesamiento de datos de facturación
        const processRevenueData = (invoices: Invoice[], start?: Date, end?: Date): { current: number; previous: number; chartData: RevenueData[] } => {
          const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
          
          // Filtrar por período actual
          const currentPeriodInvoices = filterByDateRange(paidInvoices, start, end);
          const currentRevenue = currentPeriodInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
          
          // Período anterior para comparación
          let previousRevenue = 0;
          if (start && end) {
            const { previousStart, previousEnd } = getPreviousPeriod(start, end);
            const previousPeriodInvoices = filterByDateRange(paidInvoices, previousStart, previousEnd);
            previousRevenue = previousPeriodInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
          }

          // Datos para el gráfico (últimos 6 meses)
          const chartData: RevenueData[] = [];
          for (let i = 5; i >= 0; i--) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - i);
            
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            
            const monthInvoices = filterByDateRange(paidInvoices, monthStart, monthEnd);
            const monthRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
            
            // Target simple (promedio de los últimos meses + 10%)
            const target = monthRevenue > 0 ? monthRevenue * 1.1 : 50000;
            
            chartData.push({
              month: monthDate.toLocaleString('es-ES', { month: 'short', year: '2-digit' }),
              revenue: monthRevenue,
              target: target
            });
          }

          return { current: currentRevenue, previous: previousRevenue, chartData };
        };

        // Procesamiento de datos de proyectos
        const processProjectData = (projects: Project[], start?: Date, end?: Date) => {
          const filteredProjects = filterByDateRange(projects, start, end);
          const activeProjects = filteredProjects.filter(p => p.status === 'IN_PROGRESS');
          
          // Período anterior
          let previousActiveCount = 0;
          if (start && end) {
            const { previousStart, previousEnd } = getPreviousPeriod(start, end);
            const previousProjects = filterByDateRange(projects, previousStart, previousEnd);
            previousActiveCount = previousProjects.filter(p => p.status === 'IN_PROGRESS').length;
          }

          // Distribución por estado
          const statusDistribution: Record<string, number> = {};
          filteredProjects.forEach(project => {
            statusDistribution[project.status] = (statusDistribution[project.status] || 0) + 1;
          });

          const statusChartData: ProjectStatusData[] = Object.entries(statusDistribution).map(([status, count]) => ({
            status: status.replace('_', ' '),
            count,
            percentage: filteredProjects.length > 0 ? (count / filteredProjects.length) * 100 : 0
          }));

          return {
            current: activeProjects.length,
            previous: previousActiveCount,
            chartData: statusChartData
          };
        };

        // Procesamiento de datos de tareas
        const processTaskData = (tasks: Task[], start?: Date, end?: Date) => {
          const filteredTasks = filterByDateRange(tasks, start, end, 'updatedAt');
          const completedTasks = filteredTasks.filter(t => t.status === 'DONE');
          
          // Período anterior
          let previousCompletedCount = 0;
          if (start && end) {
            const { previousStart, previousEnd } = getPreviousPeriod(start, end);
            const previousTasks = filterByDateRange(tasks, previousStart, previousEnd, 'updatedAt');
            previousCompletedCount = previousTasks.filter(t => t.status === 'DONE').length;
          }

          // Progreso diario (últimos 7 días)
          const progressData: TaskProgressData[] = [];
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
            
            progressData.push({
              date: dateStr,
              completed,
              pending,
              total: completed + pending
            });
          }

          return {
            current: completedTasks.length,
            previous: previousCompletedCount,
            progressData
          };
        };

        // Procesamiento de actividad de clientes
        const processClientActivity = (clients: ClientProfile[], projects: Project[], invoices: Invoice[]) => {
          return clients.map(client => {
            const clientProjects = projects.filter(p => p.clientId === client.id);
            const clientInvoices = invoices.filter(inv => 
              clientProjects.some(p => p.id === inv.projectId)
            );
            
            const totalRevenue = clientInvoices
              .filter(inv => inv.status === 'PAID')
              .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

            // Última actividad (proyecto más reciente)
            const lastProject = clientProjects
              .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];
            
            const lastActivity = lastProject 
              ? new Date(lastProject.updatedAt || lastProject.createdAt).toLocaleDateString('es-ES')
              : 'Sin actividad';

            return {
              clientName: client.companyName || client.contactPerson || 'Cliente sin nombre',
              projectsCount: clientProjects.length,
              totalRevenue,
              lastActivity
            };
          }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10); // Top 10 clientes
        };

        // Procesar datos
        const revenueData = processRevenueData(invoices, startDate, endDate);
        const projectData = processProjectData(projects, startDate, endDate);
        const taskData = processTaskData(tasks, startDate, endDate);
        const clientActivity = processClientActivity(clients, projects, invoices);

        // Calcular métricas
        const revenueChange = calculateChange(revenueData.current, revenueData.previous);
        const projectChange = calculateChange(projectData.current, projectData.previous);
        const taskChange = calculateChange(taskData.current, taskData.previous);
        const clientChange = calculateChange(clients.length, clients.length); // Sin cambio por ahora

        setData(prev => ({
          totalRevenue: {
            value: revenueData.current,
            change: revenueChange.change,
            changeType: revenueChange.changeType
          },
          activeProjects: {
            value: projectData.current,
            change: projectChange.change,
            changeType: projectChange.changeType
          },
          completedTasks: {
            value: taskData.current,
            change: taskChange.change,
            changeType: taskChange.changeType
          },
          totalClients: {
            value: clients.length,
            change: clientChange.change,
            changeType: clientChange.changeType
          },
          revenueChart: revenueData.chartData,
          projectStatusChart: projectData.chartData,
          clientActivity,
          taskProgress: taskData.progressData,
          isLoading: false,
          error: null,
          errorDetails: null,
          lastUpdated: new Date(),
          retryCount: 0,
          hasMaxErrors: false,
        }));
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Error al cargar los datos de analytics'
        }));
      }
    };

    fetchAnalyticsData();
  }, [startDate, endDate, calculateChange, getPreviousPeriod, filterByDateRange]);

  // Memoización de datos calculados
  const summaryMetrics = useMemo(() => ({
    totalRevenue: data.totalRevenue,
    activeProjects: data.activeProjects,
    completedTasks: data.completedTasks,
    totalClients: data.totalClients
  }), [data.totalRevenue, data.activeProjects, data.completedTasks, data.totalClients]);

  return {
    ...data,
    summaryMetrics,
    refreshData,
    resetErrors
  };
}

// Hook auxiliar para métricas rápidas (sin gráficos)
export function useQuickMetrics() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeProjects: 0,
    pendingTasks: 0,
    totalClients: 0,
    isLoading: true
  });

  useEffect(() => {
    const fetchQuickMetrics = async () => {
      try {
        const [invoices, projects, tasks, clients] = await Promise.all([
          apiClient.getInvoices(),
          apiClient.getProjects(),
          apiClient.getTasks(),
          apiClient.getClients()
        ]);

        setMetrics({
          totalRevenue: invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
          activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
          pendingTasks: tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
          totalClients: clients.length,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching quick metrics:', error);
        setMetrics(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchQuickMetrics();
  }, []);

  return metrics;
}
