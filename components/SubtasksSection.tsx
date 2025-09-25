"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Subtask, UserResponse } from '@/lib/api';
import { hasPermission } from '@/utils/permissions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  CheckCircle2,
  Plus,
  Calendar,
  User,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  AlertCircle,
  Flag,
  Target,
  AlertTriangle,
  Clock,
  CheckSquare,
  Square
} from 'lucide-react';

interface SubtasksSectionProps {
  taskId: string;
  projectId: string;
  clientId: string;
}

export function SubtasksSection({ taskId, projectId, clientId }: SubtasksSectionProps) {
  // NOTE: Comments are not supported for subtasks in the current backend implementation.
  // The comments table only has relationships with tasks and projects, not subtasks.
  // This component focuses on subtask management without comment functionality.
  // Future enhancement: If the backend adds subtask comments support, 
  // a CommentSection could be added similar to the task details page.
  
  const { user } = useAuth();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'DONE',
    dueDate: '',
    assignedToId: 'unassigned',
  });

  const canCreate = hasPermission(user!.role, 'tasks', 'create');
  const canUpdate = hasPermission(user!.role, 'tasks', 'update');
  const canDelete = hasPermission(user!.role, 'tasks', 'delete');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [allSubtasks, usersData] = await Promise.all([
        apiClient.getSubtasks(),
        apiClient.getUsers(),
      ]);

      // Filter subtasks for current task
      const taskSubtasks = allSubtasks.filter(subtask => subtask.taskId === taskId);
      setSubtasks(taskSubtasks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      
      // Filter users to show only project-relevant users:
      // - ADMIN: Can be assigned to any task in any project
      // - TEAM_MEMBER: Internal team members who can work on any project
      // - CLIENT: Only the specific client of this project (not other clients)
      // - FAST_CLIENT: Excluded as they typically don't get assigned to subtasks
      const projectRelevantUsers = usersData.filter(user => {
        if (user.role === 'ADMIN' || user.role === 'TEAM_MEMBER') {
          return true;
        }
        if (user.role === 'CLIENT' && user.id === clientId) {
          return true;
        }
        return false;
      });
      
      setUsers(projectRelevantUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load subtasks.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [taskId, projectId, clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '',
      assignedToId: 'unassigned',
    });
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Subtask title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await apiClient.createSubtask({
        taskId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || undefined,
        assignedToId: formData.assignedToId === 'unassigned' ? undefined : formData.assignedToId || undefined,
      });

      await fetchData();
      resetForm();
      setShowCreateDialog(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create subtask.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubtask || !formData.title.trim()) {
      setError('Subtask title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await apiClient.updateSubtask(editingSubtask.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || undefined,
        assignedToId: formData.assignedToId === 'unassigned' ? undefined : formData.assignedToId || undefined,
        isCompleted: formData.status === 'DONE',
      });

      await fetchData();
      resetForm();
      setEditingSubtask(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update subtask.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm('¿Are you sure you want to delete this subtask? This action cannot be undone.')) return;

    try {
      await apiClient.deleteSubtask(subtaskId);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete subtask.');
    }
  };

  const toggleSubtaskComplete = async (subtask: Subtask) => {
    try {
      const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
      await apiClient.updateSubtask(subtask.id, {
        status: newStatus,
        isCompleted: newStatus === 'DONE',
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update subtask status.');
    }
  };

  const startEdit = (subtask: Subtask) => {
    setEditingSubtask(subtask);
    setFormData({
      title: subtask.title,
      description: subtask.description || '',
      priority: subtask.priority || 'MEDIUM',
      status: subtask.status,
      dueDate: subtask.dueDate || '',
      assignedToId: subtask.assignedToId || 'unassigned',
    });
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-palero-green1 text-white';
      case 'IN_PROGRESS': return 'bg-palero-blue1 text-white';
      case 'TODO': return 'bg-palero-yellow1 text-palero-navy1';
      default: return 'bg-palero-navy2 text-white';
    }
  };

  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500 text-white';
      case 'MEDIUM': return 'bg-palero-yellow1 text-palero-navy1';
      case 'LOW': return 'bg-palero-green1 text-white';
      default: return 'bg-palero-navy2 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <Flag className="h-3 w-3 text-red-500" />;
      case 'MEDIUM': return <AlertTriangle className="h-3 w-3 text-palero-yellow2" />;
      case 'LOW': return <Target className="h-3 w-3 text-palero-green2" />;
      default: return <Flag className="h-3 w-3 text-palero-navy2" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 className="h-4 w-4 text-palero-green1" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-palero-blue1" />;
      case 'TODO': return <AlertCircle className="h-4 w-4 text-palero-yellow2" />;
      default: return <AlertCircle className="h-4 w-4 text-palero-navy2" />;
    }
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-palero-blue1 mr-2" />
            <span className="text-palero-navy2">Loading subtasks...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-palero-green1/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-green1 to-palero-teal1 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-palero-navy1">Subtasks</CardTitle>
              <CardDescription className="text-palero-navy2">
                Break down this task into smaller, manageable pieces
              </CardDescription>
            </div>
          </div>
          {canCreate && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-palero-green1 hover:bg-palero-green2 text-white"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subtask
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-palero-navy1">Create New Subtask</DialogTitle>
                  <DialogDescription className="text-palero-navy2">
                    Add a new subtask to break down this task further.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubtask} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Subtask title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="border-palero-blue1/30 focus:border-palero-blue1"
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="border-palero-blue1/30 focus:border-palero-blue1"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
                          setFormData(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger className="border-palero-blue1/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low Priority</SelectItem>
                          <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                          <SelectItem value="HIGH">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'TODO' | 'IN_PROGRESS' | 'DONE') => 
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger className="border-palero-blue1/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="border-palero-blue1/30 focus:border-palero-blue1"
                      />
                    </div>
                    <div>
                      <Select
                        value={formData.assignedToId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}
                      >
                        <SelectTrigger className="border-palero-blue1/30">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        resetForm();
                        setError('');
                      }}
                      className="border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-palero-green1 hover:bg-palero-green2 text-white"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Subtask
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {error && !showCreateDialog && !editingSubtask && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}
        
        {subtasks.length === 0 ? (
          <div className="text-center py-8 text-palero-navy2">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 text-palero-navy2/50" />
            <p className="font-medium mb-1">No subtasks yet</p>
            <p className="text-sm">Break this task down into smaller pieces to track progress better.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subtasks.map((subtask) => {
              const assignedUser = getUserById(subtask.assignedToId || '');
              
              return (
                <div
                  key={subtask.id}
                  className={`p-4 rounded-lg border transition-all ${
                    subtask.status === 'DONE' 
                      ? 'border-palero-green1/30 bg-palero-green1/5' 
                      : 'border-palero-blue1/20 bg-white hover:bg-palero-blue1/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        onClick={() => toggleSubtaskComplete(subtask)}
                        className={`mt-1 transition-colors ${
                          subtask.status === 'DONE' 
                            ? 'text-palero-green1 hover:text-palero-green2' 
                            : 'text-palero-navy2 hover:text-palero-blue1'
                        }`}
                      >
                        {subtask.status === 'DONE' ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium ${
                            subtask.status === 'DONE' 
                              ? 'text-palero-navy2 line-through' 
                              : 'text-palero-navy1'
                          }`}>
                            {subtask.title}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {getPriorityIcon(subtask.priority || 'MEDIUM')}
                            <Badge className={`text-xs ${getStatusColors(subtask.status)}`}>
                              {subtask.status.toLowerCase().replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        
                        {subtask.description && (
                          <p className={`text-sm mb-2 ${
                            subtask.status === 'DONE' 
                              ? 'text-palero-navy2/70 line-through' 
                              : 'text-palero-navy2'
                          }`}>
                            {subtask.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-palero-navy2">
                          {subtask.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Due: {new Date(subtask.dueDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                          )}
                          
                          {assignedUser && (
                            <div className="flex items-center space-x-2">
                              <User className="h-3 w-3" />
                              <span>Assigned to: {assignedUser.name}</span>
                            </div>
                          )}
                          
                          <span>
                            Created: {new Date(subtask.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {(canUpdate || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-palero-navy2 hover:text-palero-blue1">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => startEdit(subtask)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSubtask(subtask.id)}
                              className="text-red-500 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        {editingSubtask && (
          <Dialog open={!!editingSubtask} onOpenChange={() => setEditingSubtask(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-palero-navy1">Edit Subtask</DialogTitle>
                <DialogDescription className="text-palero-navy2">
                  Update the details of this subtask.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateSubtask} className="space-y-4">
                <div>
                  <Input
                    placeholder="Subtask title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="border-palero-blue1/30 focus:border-palero-blue1"
                    required
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="border-palero-blue1/30 focus:border-palero-blue1"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
                        setFormData(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger className="border-palero-blue1/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low Priority</SelectItem>
                        <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                        <SelectItem value="HIGH">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'TODO' | 'IN_PROGRESS' | 'DONE') => 
                        setFormData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="border-palero-blue1/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="border-palero-blue1/30 focus:border-palero-blue1"
                    />
                  </div>
                  <div>
                    <Select
                      value={formData.assignedToId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}
                    >
                      <SelectTrigger className="border-palero-blue1/30">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingSubtask(null);
                      resetForm();
                      setError('');
                    }}
                    className="border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-palero-green1 hover:bg-palero-green2 text-white"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Subtask
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}