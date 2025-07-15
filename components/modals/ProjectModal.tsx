import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from './ui/select';
import { apiClient, Project } from '@/lib/api';
import { Label } from './ui/label';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  users: { id: string; name: string }[];
  initialData?: Partial<Project>;
  mode?: 'create' | 'edit';
}

const statusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'REVIEW', label: 'En revisión' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'ARCHIVED', label: 'Archivado' },
];

export function ProjectModal({ open, onClose, onSuccess, users, initialData = {}, mode = 'create' }: ProjectModalProps) {
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [startDate, setStartDate] = useState(initialData.startDate || '');
  const [endDate, setEndDate] = useState(initialData.endDate || '');
  const [status, setStatus] = useState(initialData.status || 'PENDING');
  const [clientId, setClientId] = useState(initialData.clientId || (users[0]?.id ?? ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setStartDate(initialData.startDate || '');
      setEndDate(initialData.endDate || '');
      setStatus(initialData.status || 'PENDING');
      setClientId(initialData.clientId || (users[0]?.id ?? ''));
      setError('');
    }
  }, [open, initialData, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let project: Project;
      if (mode === 'edit' && initialData.id) {
        project = await apiClient.updateProject(initialData.id, {
          name,
          description,
          startDate,
          endDate,
          status,
          clientId,
        });
      } else {
        project = await apiClient.createProject({
          name,
          description,
          startDate,
          endDate,
          status,
          clientId,
        });
      }
      onSuccess(project);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar Proyecto' : 'Crear Proyecto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nombre del proyecto</Label>
            <Input
              id="project-name"
              placeholder="Nombre del proyecto"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Descripción</Label>
            <Textarea
              id="project-description"
              placeholder="Descripción"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="space-y-2 w-1/2">
              <Label htmlFor="project-start">Fecha de inicio</Label>
              <Input
                id="project-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 w-1/2">
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
            <Select value={status} onValueChange={value => setStatus(value as Project['status'])} required>
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
            <Select value={clientId} onValueChange={value => setClientId(value)} required>
              <SelectTrigger id="project-client">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : (mode === 'edit' ? 'Guardar Cambios' : 'Crear Proyecto')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
