"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Project } from '@/lib/api';
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
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'REVIEW', label: 'En revisión' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'ARCHIVED', label: 'Archivado' },
];

export default function CreateProjectPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  // Cargar clientes al montar
  useEffect(() => {
    async function fetchClients() {
      try {
        const users = await apiClient.getUsers();
        setClients(users.filter(u => u.role === 'CLIENT'));
      } catch (e) {
        setError('No se pudieron cargar los clientes');
      }
    }
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const project = await apiClient.createProject({
        name,
        description,
        startDate,
        endDate,
        status: status as Project['status'],
        clientId,
      });
      setSuccess('¡Proyecto creado exitosamente!');
      setTimeout(() => {
        router.push('/projects');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al crear el proyecto.');
    } finally {
      setIsLoading(false);
    }
  };

  // Solo admins y team members pueden crear proyectos
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
        <Link href="/projects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Proyectos
          </Button>
        </Link>
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Proyecto</h1>
          <p className="text-muted-foreground">Agrega un nuevo proyecto al sistema</p>
        </div>
      </div>
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
            <CardDescription>Completa los detalles para el nuevo proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nombre del proyecto</Label>
                <Input
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nombre del proyecto"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Descripción</Label>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descripción"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-start">Fecha de inicio</Label>
                  <Input
                    id="project-start"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-end">Fecha de fin</Label>
                  <Input
                    id="project-end"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Estado</Label>
                <Select value={status} onValueChange={setStatus} required>
                  <SelectTrigger id="project-status">
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
                <Label htmlFor="project-client">Cliente</Label>
                <Select value={clientId} onValueChange={setClientId} required>
                  <SelectTrigger id="project-client">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {isLoading ? 'Creando Proyecto...' : 'Crear Proyecto'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/projects')}>
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
