"use client";

import { useState } from 'react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, DollarSign, Briefcase, CheckCircle, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  
  const {
    totalRevenue,
    activeProjects,
    completedTasks,
    totalClients,
    revenueChart,
    projectStatusChart,
    clientActivity,
    taskProgress,
    isLoading,
    error,
    lastUpdated,
    refreshData
  } = useAnalyticsData(dateRange.start, dateRange.end);

  // Colors for charts
  const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  // Render metric card
  const MetricCard = ({ 
    title, 
    metric, 
    icon: Icon, 
    color = 'blue' 
  }: { 
    title: string; 
    metric: any; 
    icon: any; 
    color?: string; 
  }) => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-20" />
            </CardTitle>
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 text-${color}-600`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {title.includes('Revenue') 
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metric.value)
              : metric.value.toLocaleString('en-US')
            }
          </div>
          {metric.change !== 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              {metric.changeType === 'increase' ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              ) : metric.changeType === 'decrease' ? (
                <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
              ) : null}
              <span className={
                metric.changeType === 'increase' ? 'text-green-600' :
                metric.changeType === 'decrease' ? 'text-red-600' :
                'text-gray-600'
              }>
                {metric.change.toFixed(1)}% vs previous period
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Error loading data</p>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Business metrics and statistics dashboard</p>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleString('en-US')}
            </p>
          )}
        </div>
        <Button onClick={refreshData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          metric={totalRevenue}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Active Projects"
          metric={activeProjects}
          icon={Briefcase}
          color="blue"
        />
        <MetricCard
          title="Completed Tasks"
          metric={completedTasks}
          icon={CheckCircle}
          color="purple"
        />
        <MetricCard
          title="Total Clients"
          metric={totalClients}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Gráficos y análisis detallados */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        {/* Tab de Ingresos */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Evolution</CardTitle>
              <CardDescription>Monthly revenue vs targets</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value)), '']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Proyectos */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Distribution by Status</CardTitle>
              <CardDescription>Current status of all projects</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={projectStatusChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {projectStatusChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Summary by Status</h4>
                    {projectStatusChart.map((status, index) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="capitalize">{status.status}</span>
                        </div>
                        <Badge variant="secondary">
                          {status.count} ({status.percentage.toFixed(1)}%)
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Tareas */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Progress (Last 7 days)</CardTitle>
              <CardDescription>Completed vs pending tasks by day</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="#82ca9d" name="Completed" />
                    <Bar dataKey="pending" stackId="a" fill="#8884d8" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Clientes */}
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Activity</CardTitle>
              <CardDescription>Top 10 clients by revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {clientActivity.map((client, index) => (
                    <div key={client.clientName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                        <div>
                          <h4 className="font-medium">{client.clientName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {client.projectsCount} project{client.projectsCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(client.totalRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last activity: {client.lastActivity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
