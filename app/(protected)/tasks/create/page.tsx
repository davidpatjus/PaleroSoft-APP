"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Project, UserResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const statusOptions = [
  { value: 'TODO', label: 'Por hacer' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'REVIEW', label: 'En revisión' },
  { value: 'DONE', label: 'Hecha' },
];
const priorityOptions = [
  { value: 'LOW', label: 'Baja' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
];

export default function CreateTaskPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsData, usersData] = await Promise.all([
          apiClient.getProjects(),
          apiClient.getUsers(),
        ]);
        setProjects(projectsData);
        setUsers(usersData);
      } catch (e) {
        setError('No se pudieron cargar los datos');
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await apiClient.createTask({
        projectId,
        title,
        description,
        status: status as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
        priority: priority as 'LOW' | 'MEDIUM' | 'HIGH',
        dueDate,
        assignedToId,
      });
      setSuccess('¡Tarea creada exitosamente!');
      setTimeout(() => {
        router.push('/tasks');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al crear la tarea.');
    } finally {
      setIsLoading(false);
    }
  };

  // Solo admins y team members pueden crear tareas
  if (user?.role !== 'ADMIN' && user?.role !== 'TEAM_MEMBER') {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>No tienes permiso para acceder a esta página.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/tasks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Tareas
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Tarea</h1>
          <p className="text-muted-foreground">Agrega una nueva tarea a un proyecto</p>
        </div>
      </div>
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Tarea</CardTitle>
            <CardDescription>Completa los detalles para la nueva tarea</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Título</Label>
                <Input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Título de la tarea"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Descripción</Label>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descripción"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-project">Proyecto</Label>
                  <Select value={projectId} onValueChange={setProjectId} required>
                    <SelectTrigger id="task-project">
                      <SelectValue placeholder="Selecciona un proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-assigned">Asignado a</Label>
                  <Select value={assignedToId} onValueChange={setAssignedToId} required>
                    <SelectTrigger id="task-assigned">
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-status">Estado</Label>
                  <Select value={status} onValueChange={setStatus} required>
                    <SelectTrigger id="task-status">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Prioridad</Label>
                  <Select value={priority} onValueChange={setPriority} required>
                    <SelectTrigger id="task-priority">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Fecha límite</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="flex space-x-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creando Tarea...' : 'Crear Tarea'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/tasks')}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
