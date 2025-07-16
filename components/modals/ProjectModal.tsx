import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';
import { apiClient, Project } from '@/lib/api';
import { Label } from '@/components/ui/label';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  users: { id: string; name: string }[];
  initialData?: Partial<Project>;
  mode?: 'create' | 'edit';
}

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
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
      setError(err.message || 'Error saving project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Project' : 'Create Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              placeholder="Project name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="space-y-2 w-1/2">
              <Label htmlFor="project-start">Start date</Label>
              <Input
                id="project-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 w-1/2">
              <Label htmlFor="project-end">End date</Label>
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
            <Label htmlFor="project-status">Status</Label>
            <Select value={status} onValueChange={value => setStatus(value as Project['status'])} required>
              <SelectTrigger id="project-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-client">Client</Label>
            <Select value={clientId} onValueChange={value => setClientId(value)} required>
              <SelectTrigger id="project-client">
                <SelectValue placeholder="Client" />
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
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Create Project')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
