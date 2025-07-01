"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Project, UserResponse, Task } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Circle, User, Calendar, Tag, AlertTriangle } from 'lucide-react';

const statusOptions = [
  { value: 'TODO', label: 'To Do', icon: Circle },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: Clock },
  { value: 'REVIEW', label: 'In Review', icon: AlertCircle },
  { value: 'DONE', label: 'Done', icon: CheckCircle },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'text-emerald-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-amber-600' },
  { value: 'HIGH', label: 'High', color: 'text-red-600' },
];

export default function EditTaskPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params?.id as string;

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [task, projectsData, usersData] = await Promise.all([
          apiClient.getTaskById(taskId),
          apiClient.getProjects(),
          apiClient.getUsers(),
        ]);
        setTitle(task.title);
        setDescription(task.description || '');
        setStatus(task.status);
        setPriority(task.priority);
        setDueDate(task.dueDate || '');
        setProjectId(task.projectId);
        setAssignedToId(task.assignedToId || '');
        setProjects(projectsData);
        setUsers(usersData);
      } catch (e: any) {
        setError(e.message || 'Unable to load task');
      } finally {
        setIsLoading(false);
      }
    }
    if (taskId) fetchData();
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      await apiClient.updateTask(taskId, {
        title,
        description,
        status: status as Task['status'],
        priority: priority as Task['priority'],
        dueDate,
        projectId,
        assignedToId,
      });
      setSuccess('Task updated successfully!');
      setTimeout(() => {
        router.push('/tasks');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error updating task.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palero-blue-50 via-white to-palero-sage-50">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palero-blue-600"></div>
            <p className="text-lg font-medium text-palero-blue-700">Loading task...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only admins and team members can edit tasks
  if (user?.role !== 'ADMIN' && user?.role !== 'TEAM_MEMBER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palero-blue-50 via-white to-palero-sage-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">You don&apos;t have permission to access this page.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-palero-blue-50 via-white to-palero-sage-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="/tasks">
            <Button 
              variant="outline" 
              size="sm"
              className="border-palero-blue-200 text-palero-blue-700 hover:bg-palero-blue-50 hover:border-palero-blue-300 transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-palero-blue-700 to-palero-sage-700 bg-clip-text text-transparent">
              Edit Task
            </h1>
            <p className="text-sm sm:text-base text-palero-blue-600 mt-1">Update task details and assignment</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card */}
          <div className="lg:col-span-2">
            <Card className="border-palero-blue-200 shadow-lg shadow-palero-blue-100/50 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-palero-blue-100">
                <CardTitle className="text-palero-blue-800 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Task Information
                </CardTitle>
                <CardDescription className="text-palero-blue-600">
                  Edit the task details and assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="task-title" className="text-sm font-medium text-palero-blue-800">
                      Title *
                    </Label>
                    <Input
                      id="task-title"
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Enter task title"
                      required
                      className="border-palero-blue-200 focus:border-palero-blue-400 focus:ring-palero-blue-400/20"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="task-description" className="text-sm font-medium text-palero-blue-800">
                      Description
                    </Label>
                    <Textarea
                      id="task-description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Enter task description"
                      rows={4}
                      className="border-palero-blue-200 focus:border-palero-blue-400 focus:ring-palero-blue-400/20 resize-none"
                    />
                  </div>

                  {/* Project and Assigned To */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-project" className="text-sm font-medium text-palero-blue-800">
                        Project *
                      </Label>
                      <Select value={projectId} onValueChange={setProjectId} required>
                        <SelectTrigger 
                          id="task-project"
                          className="border-palero-blue-200 focus:border-palero-blue-400 focus:ring-palero-blue-400/20"
                        >
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id} className="focus:bg-palero-blue-50">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-assigned" className="text-sm font-medium text-palero-blue-800">
                        Assigned To *
                      </Label>
                      <Select value={assignedToId} onValueChange={setAssignedToId} required>
                        <SelectTrigger 
                          id="task-assigned"
                          className="border-palero-blue-200 focus:border-palero-blue-400 focus:ring-palero-blue-400/20"
                        >
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id} className="focus:bg-palero-blue-50">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {u.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-status" className="text-sm font-medium text-palero-blue-800">
                        Status *
                      </Label>
                      <Select value={status} onValueChange={setStatus} required>
                        <SelectTrigger 
                          id="task-status"
                          className="border-palero-blue-200 focus:border-palero-blue-400 focus:ring-palero-blue-400/20"
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(opt => {
                            const IconComponent = opt.icon;
                            return (
                              <SelectItem key={opt.value} value={opt.value} className="focus:bg-palero-blue-50">
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-priority" className="text-sm font-medium text-palero-blue-800">
                        Priority *
                      </Label>
                      <Select value={priority} onValueChange={setPriority} required>
                        <SelectTrigger 
                          id="task-priority"
                          className="border-palero-blue-200 focus:border-palero-blue-400 focus:ring-palero-blue-400/20"
                        >
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="focus:bg-palero-blue-50">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  opt.value === 'HIGH' ? 'bg-red-500' :
                                  opt.value === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}></div>
                                <span className={opt.color}>{opt.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="task-due" className="text-sm font-medium text-palero-blue-800">
                      Due Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-palero-blue-500" />
                      <Input
                        id="task-due"
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="pl-10 border-palero-blue-200 focus:border-palero-blue-400 focus:ring-palero-blue-400/20"
                      />
                    </div>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-emerald-200 bg-emerald-50">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-emerald-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Form Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-gradient-to-r from-palero-blue-600 to-palero-blue-700 hover:from-palero-blue-700 hover:to-palero-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none"
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push('/tasks')}
                      className="border-palero-blue-200 text-palero-blue-700 hover:bg-palero-blue-50 hover:border-palero-blue-300 flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <Card className="border-palero-sage-200 shadow-lg shadow-palero-sage-100/50 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-palero-sage-100">
                <CardTitle className="text-palero-sage-800 text-lg">Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3 text-sm text-palero-sage-700">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-palero-sage-500 mt-2 flex-shrink-0"></div>
                    <p>Provide a clear and descriptive task title</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-palero-sage-500 mt-2 flex-shrink-0"></div>
                    <p>Include detailed description to avoid confusion</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-palero-sage-500 mt-2 flex-shrink-0"></div>
                    <p>Assign to appropriate team member based on skills</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-palero-sage-500 mt-2 flex-shrink-0"></div>
                    <p>Set realistic due dates considering workload</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-palero-sage-500 mt-2 flex-shrink-0"></div>
                    <p>Use priority levels to help team focus</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Guide */}
            <Card className="border-palero-blue-200 shadow-lg shadow-palero-blue-100/50 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-palero-blue-100">
                <CardTitle className="text-palero-blue-800 text-lg">Status Guide</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {statusOptions.map((status) => {
                  const IconComponent = status.icon;
                  return (
                    <div key={status.value} className="flex items-center gap-3 text-sm">
                      <IconComponent className="h-4 w-4 text-palero-blue-600" />
                      <span className="font-medium text-palero-blue-800">{status.label}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
