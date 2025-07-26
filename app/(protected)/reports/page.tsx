"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, FolderOpen, CheckSquare, AlertTriangle, Calendar, RefreshCw, Bug, Info } from 'lucide-react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { ErrorDetailsModal } from '@/components/ErrorDetailsModal';
import { cn } from '@/lib/utils';

const ReportsPage = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<string>('30d');
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Calcular rango de fechas basado en la selección
  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return { startDate: start, endDate: end };
  };

  const { startDate, endDate } = getDateRange(dateRange);
  const { 
    totalRevenue, 
    activeProjects, 
    completedTasks, 
    totalClients,
    isLoading, 
    error,
    errorDetails,
    hasMaxErrors,
    retryCount,
    refreshData,
    resetErrors,
    lastUpdated
  } = useAnalyticsData(startDate, endDate);

  // Función para formatear números
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Componente MetricCard para mostrar métricas
  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    isLoading = false,
    formatter = formatNumber 
  }: { 
    title: string; 
    value: number; 
    change: number; 
    changeType: 'increase' | 'decrease' | 'neutral'; 
    icon: any; 
    isLoading?: boolean;
    formatter?: (value: number) => string;
  }) => {
    const changeIcon = changeType === 'increase' ? TrendingUp : changeType === 'decrease' ? TrendingDown : null;
    const changeColor = changeType === 'increase' ? 'text-green-600' : changeType === 'decrease' ? 'text-red-600' : 'text-gray-600';
    
    return (
      <Card className="border-palero-blue1/10 hover:border-palero-blue1/30 transition-all duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-palero-navy2">{title}</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center">
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-palero-navy1">
                  {formatter(value)}
                </div>
                {change > 0 && changeIcon && (
                  <div className={cn("flex items-center text-xs", changeColor)}>
                    {React.createElement(changeIcon, { className: "mr-1 h-3 w-3" })}
                    {change.toFixed(1)}% desde el período anterior
                  </div>
                )}
                {change === 0 && (
                  <div className="text-xs text-gray-500">
                    Sin cambios desde el período anterior
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Only admins and team members can access reports
  if (user?.role !== 'ADMIN' && user?.role !== 'TEAM_MEMBER') {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 responsive-container">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            No tienes permisos para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Mostrar error si hay problemas cargando datos
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 responsive-container">
        {/* Error crítico después de múltiples intentos */}
        {hasMaxErrors && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="space-y-2">
                <p className="font-semibold">Error crítico en el sistema de reportes</p>
                <p className="text-sm">
                  Se han agotado todos los intentos de conexión. El sistema ha intentado reconectarse {retryCount} veces.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    onClick={() => setShowErrorDetails(true)}
                    variant="outline" 
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <Bug className="mr-2 h-4 w-4" />
                    Ver Detalles Técnicos
                  </Button>
                  <Button 
                    onClick={resetErrors}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reiniciar Sistema
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error temporal con reintentos */}
        {!hasMaxErrors && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              <div className="space-y-2">
                <p className="font-semibold">Problemas de conectividad</p>
                <p className="text-sm">
                  Error al cargar los datos (Intento {retryCount}/5): {error}
                </p>
                <p className="text-xs text-yellow-600">
                  El sistema está reintentando automáticamente la conexión...
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    onClick={refreshData}
                    variant="outline" 
                    size="sm"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                    Reintentar Ahora
                  </Button>
                  {errorDetails && (
                    <Button 
                      onClick={() => setShowErrorDetails(true)}
                      variant="ghost" 
                      size="sm"
                      className="text-yellow-700"
                    >
                      <Bug className="mr-2 h-4 w-4" />
                      Detalles
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Modal de detalles del error */}
        <ErrorDetailsModal
          isOpen={showErrorDetails}
          onClose={() => setShowErrorDetails(false)}
          errorDetails={errorDetails}
          onRetry={() => {
            setShowErrorDetails(false);
            resetErrors();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 responsive-container">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">
                Reports & Analytics
              </h1>
              <p className="text-sm sm:text-base text-palero-navy2 mt-1">
                Análisis completo y métricas de rendimiento para tu negocio.
              </p>
            </div>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-palero-navy2" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="1y">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={isLoading}
              className="border-palero-blue1/20 hover:bg-palero-blue1/5"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Actualizar
            </Button>
            
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Última actualización: {lastUpdated.toLocaleTimeString('es-ES')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ingresos Totales"
          value={totalRevenue.value}
          change={totalRevenue.change}
          changeType={totalRevenue.changeType}
          icon={DollarSign}
          isLoading={isLoading}
          formatter={formatCurrency}
        />
        
        <MetricCard
          title="Proyectos Activos"
          value={activeProjects.value}
          change={activeProjects.change}
          changeType={activeProjects.changeType}
          icon={FolderOpen}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Tareas Completadas"
          value={completedTasks.value}
          change={completedTasks.change}
          changeType={completedTasks.changeType}
          icon={CheckSquare}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Total Clientes"
          value={totalClients.value}
          change={totalClients.change}
          changeType={totalClients.changeType}
          icon={Users}
          isLoading={isLoading}
        />
      </div>

      {/* Gráficos y análisis detallados - Placeholder para futuras fases */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Financial Overview */}
        <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-palero-green2" />
              Vista Financiera
            </CardTitle>
            <CardDescription>
              Tendencias de ingresos y métricas de rendimiento financiero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-palero-navy2">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Los gráficos de ingresos se implementarán en la Fase 3</p>
                <Badge variant="outline" className="mt-2">
                  Próximamente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card className="bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-palero-blue1" />
              Estado de Proyectos
            </CardTitle>
            <CardDescription>
              Distribución del estado de los proyectos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-palero-navy2">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Gráfico de distribución en Fase 3</p>
                <Badge variant="outline" className="mt-2">
                  Próximamente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actividad de clientes - Placeholder */}
      <Card className="bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-palero-teal1" />
            Actividad de Clientes
          </CardTitle>
          <CardDescription>
            Top clientes por ingresos y actividad reciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-palero-navy2">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Tabla de actividad de clientes se implementará en la Fase 3</p>
              <Badge variant="outline" className="mt-2">
                Próximamente
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;