"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, CheckSquare, Calendar, Users, FileText, Settings, Clock, AlertCircle, Target, CheckCircle, Plus } from 'lucide-react';

const statusOptions = [
  { value: 'TODO', label: 'To Do', icon: Clock },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: AlertCircle },
  { value: 'REVIEW', label: 'In Review', icon: Target },
  { value: 'DONE', label: 'Done', icon: CheckCircle },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low Priority', color: 'text-palero-green2' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'text-palero-blue2' },
  { value: 'HIGH', label: 'High Priority', color: 'text-red-600' },
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

  // Load projects and users on mount
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
        setError('Could not load projects and users');
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
      const task = await apiClient.createTask({
        title,
        description,
        status: status as Task['status'],
        priority: priority as Task['priority'],
        dueDate,
        projectId,
        assignedToId,
      });
      setSuccess('Task created successfully!');
      setTimeout(() => {
        router.push('/tasks');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error creating task.');
    } finally {
      setIsLoading(false);
    }
  };

  // Only admins and team members can create tasks
  if (user?.role !== 'ADMIN' && user?.role !== 'TEAM_MEMBER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palero-blue1/5 via-white to-palero-green1/5 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">You don&apos;t have permission to access this page.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-palero-blue1/5 via-white to-palero-green1/5 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="mb-4 border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10 hover:text-palero-blue2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tasks
              </Button>
            </Link>
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center shadow-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">Create New Task</h1>
                <p className="text-sm sm:text-base text-palero-navy2 mt-1">
                  Add a new task to the system with all required details
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Form */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-xl">
              <CardHeader className="space-y-1 pb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-palero-navy1">Task Information</CardTitle>
                    <CardDescription className="text-palero-navy2">
                      Complete the details for the new task
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Task Title */}
                  <div className="space-y-2">
                    <Label htmlFor="task-title" className="text-palero-navy1 font-medium">
                      Task Title
                    </Label>
                    <Input
                      id="task-title"
                      type="text"
                      value={title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                      placeholder="Enter task title"
                      required
                      className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                    />
                  </div>

                  {/* Task Description */}
                  <div className="space-y-2">
                    <Label htmlFor="task-description" className="text-palero-navy1 font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="task-description"
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                      placeholder="Describe the task objectives and details"
                      rows={4}
                      className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                    />
                  </div>

                  {/* Project and Assigned To */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-project" className="text-palero-navy1 font-medium flex items-center">
                        <Settings className="mr-2 h-4 w-4 text-palero-blue1" />
                        Project
                      </Label>
                      <Select value={projectId} onValueChange={setProjectId} required>
                        <SelectTrigger 
                          id="task-project"
                          className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                        >
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent className="border-palero-blue1/20">
                          {projects.map((project: Project) => (
                            <SelectItem 
                              key={project.id} 
                              value={project.id}
                              className="hover:bg-palero-blue1/10 focus:bg-palero-blue1/10"
                            >
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="task-assigned" className="text-palero-navy1 font-medium flex items-center">
                        <Users className="mr-2 h-4 w-4 text-palero-green1" />
                        Assigned To
                      </Label>
                      <Select value={assignedToId} onValueChange={setAssignedToId} required>
                        <SelectTrigger 
                          id="task-assigned"
                          className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                        >
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent className="border-palero-blue1/20">
                          {users.map((user: UserResponse) => (
                            <SelectItem 
                              key={user.id} 
                              value={user.id}
                              className="hover:bg-palero-green1/10 focus:bg-palero-green1/10"
                            >
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-status" className="text-palero-navy1 font-medium flex items-center">
                        <Target className="mr-2 h-4 w-4 text-palero-blue1" />
                        Status
                      </Label>
                      <Select value={status} onValueChange={setStatus} required>
                        <SelectTrigger 
                          id="task-status"
                          className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="border-palero-blue1/20">
                          {statusOptions.map((opt) => {
                            const IconComponent = opt.icon;
                            return (
                              <SelectItem 
                                key={opt.value} 
                                value={opt.value}
                                className="hover:bg-palero-blue1/10 focus:bg-palero-blue1/10"
                              >
                                <div className="flex items-center space-x-2">
                                  <IconComponent className="h-4 w-4" />
                                  <span>{opt.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="task-priority" className="text-palero-navy1 font-medium flex items-center">
                        <AlertCircle className="mr-2 h-4 w-4 text-palero-blue2" />
                        Priority
                      </Label>
                      <Select value={priority} onValueChange={setPriority} required>
                        <SelectTrigger 
                          id="task-priority"
                          className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                        >
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="border-palero-blue1/20">
                          {priorityOptions.map((opt) => (
                            <SelectItem 
                              key={opt.value} 
                              value={opt.value}
                              className="hover:bg-palero-blue1/10 focus:bg-palero-blue1/10"
                            >
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  opt.value === 'HIGH' ? 'bg-red-500' :
                                  opt.value === 'MEDIUM' ? 'bg-palero-blue1' : 'bg-palero-green1'
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
                    <Label htmlFor="task-due" className="text-palero-navy1 font-medium flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-palero-teal1" />
                      Due Date
                    </Label>
                    <Input
                      id="task-due"
                      type="date"
                      value={dueDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
                      className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                    />
                  </div>

                  {/* Alerts */}
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-palero-green1/30 bg-palero-green1/10">
                      <AlertDescription className="text-palero-green2">{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-palero-green1 hover:bg-palero-green2 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                          Creating Task...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Task
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push('/tasks')}
                      className="border-palero-navy2/30 text-palero-navy2 hover:bg-palero-navy2/10 hover:text-palero-navy1 flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 backdrop-blur-sm border-palero-green1/20 shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-palero-navy1 flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-palero-green1" />
                  Task Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-palero-blue1/10 border border-palero-blue1/20">
                    <h4 className="font-medium text-palero-navy1 text-sm mb-1">Task Title</h4>
                    <p className="text-xs text-palero-navy2">Use clear, descriptive titles that reflect the task objective</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-palero-green1/10 border border-palero-green1/20">
                    <h4 className="font-medium text-palero-navy1 text-sm mb-1">Assignment</h4>
                    <p className="text-xs text-palero-navy2">Assign tasks to team members based on their skills and availability</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-palero-teal1/10 border border-palero-teal1/20">
                    <h4 className="font-medium text-palero-navy1 text-sm mb-1">Priority</h4>
                    <p className="text-xs text-palero-navy2">Set appropriate priority levels to help team focus on urgent tasks</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-palero-blue2/10 border border-palero-blue2/20">
                    <h4 className="font-medium text-palero-navy1 text-sm mb-1">Due Dates</h4>
                    <p className="text-xs text-palero-navy2">Set realistic deadlines considering task complexity and dependencies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
