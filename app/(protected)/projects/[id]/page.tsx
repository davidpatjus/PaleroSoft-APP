"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Project, Task, UserResponse } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CommentSection } from '@/components/CommentSection';
import { Loader2, Calendar, FolderOpen, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [client, setClient] = useState<UserResponse | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;

    async function fetchData() {
      try {
        setIsLoading(true);
        const [projectData, tasksData, usersData] = await Promise.all([
          apiClient.getProjectById(projectId),
          apiClient.getTasks(),
          apiClient.getUsers(),
        ]);

        setProject(projectData);
        setTasks(tasksData.filter(t => t.projectId === projectId));
        setUsers(usersData);
        setClient(usersData.find(u => u.id === projectData.clientId) || null);

      } catch (e: any) {
        setError(e.message || 'Failed to load project details.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  if (!project) {
    return <div className="text-center py-10">Project not found.</div>;
  }
  
  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return 'Sin asignar';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuario desconocido';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'default';
      case 'COMPLETED': return 'default';
      case 'PENDING': return 'secondary';
      case 'REVIEW': return 'outline';
      case 'ARCHIVED': return 'outline';
      default: return 'secondary';
    }
  };

  const tasksCompleted = tasks.filter(t => t.status === 'DONE').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      <Button onClick={() => router.back()} variant="outline">Volver</Button>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Link href={`/projects/${projectId}/edit`}>
          <Button>Editar Proyecto</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <FolderOpen className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Estado: <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge></span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
            </div>
            {client && (
              <div className="flex items-center">
                <User className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>Cliente: {client.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">{tasksCompleted} de {totalTasks} tareas completadas.</p>
            </div>
          </CardContent>
        </Card> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Fecha Límite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant={task.status === 'DONE' ? 'default' : 'secondary'}>{task.status}</Badge></TableCell>
                  <TableCell>{task.priority}</TableCell>
                  <TableCell>{getUserName(task.assignedToId)}</TableCell>
                  <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CommentSection projectId={projectId} />

    </div>
  );
}
