"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Edit3, Calendar, Users, FileText, Settings, Save } from 'lucide-react';

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'Under Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function EditProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [project, users] = await Promise.all([
          apiClient.getProjectById(projectId),
          apiClient.getUsers(),
        ]);
        setName(project.name);
        setDescription(project.description || '');
        setStartDate(project.startDate);
        setEndDate(project.endDate);
        setStatus(project.status);
        setClientId(project.clientId);
        setClients(users.filter((u: any) => u.role === 'CLIENT'));
      } catch (e: any) {
        setError(e.message || 'Could not load project');
      } finally {
        setIsLoading(false);
      }
    }
    if (projectId) fetchData();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      await apiClient.updateProject(projectId, {
        name,
        description,
        startDate,
        endDate,
        status: status as Project['status'],
        clientId,
      });
      setSuccess('Project updated successfully!');
      setTimeout(() => {
        router.push('/projects');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error updating project.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palero-blue1/5 via-white to-palero-green1/5 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading project...</p>
      </div>
    );
  }

  // Only admins and team members can edit projects
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
            <Link href="/projects">
              <Button variant="outline" size="sm" className="mb-4 border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10 hover:text-palero-blue2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-green1 flex items-center justify-center shadow-lg">
                <Edit3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">Edit Project</h1>
                <p className="text-sm sm:text-base text-palero-navy2 mt-1">
                  Modify project details and update information
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Project Edit Form */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-palero-blue1/20 shadow-xl">
              <CardHeader className="space-y-1 pb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-green1 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-palero-navy1">Project Information</CardTitle>
                    <CardDescription className="text-palero-navy2">
                      Edit project details and update information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor="project-name" className="text-palero-navy1 font-medium">
                      Project Name
                    </Label>
                    <Input
                      id="project-name"
                      type="text"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      placeholder="Enter project name"
                      required
                      className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                    />
                  </div>

                  {/* Project Description */}
                  <div className="space-y-2">
                    <Label htmlFor="project-description" className="text-palero-navy1 font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="project-description"
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                      placeholder="Describe the project objectives and scope"
                      rows={4}
                      className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                    />
                  </div>

                  {/* Date Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-start" className="text-palero-navy1 font-medium flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-palero-teal1" />
                        Start Date
                      </Label>
                      <Input
                        id="project-start"
                        type="date"
                        value={startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                        required
                        className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-end" className="text-palero-navy1 font-medium flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-palero-teal1" />
                        End Date
                      </Label>
                      <Input
                        id="project-end"
                        type="date"
                        value={endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                        required
                        className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                      />
                    </div>
                  </div>

                  {/* Status and Client */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-status" className="text-palero-navy1 font-medium flex items-center">
                        <Settings className="mr-2 h-4 w-4 text-palero-blue1" />
                        Status
                      </Label>
                      <Select value={status} onValueChange={setStatus} required>
                        <SelectTrigger 
                          id="project-status"
                          className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="border-palero-blue1/20">
                          {statusOptions.map((opt) => (
                            <SelectItem 
                              key={opt.value} 
                              value={opt.value}
                              className="hover:bg-palero-blue1/10 focus:bg-palero-blue1/10"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-client" className="text-palero-navy1 font-medium flex items-center">
                        <Users className="mr-2 h-4 w-4 text-palero-green1" />
                        Client
                      </Label>
                      <Select value={clientId} onValueChange={setClientId} required>
                        <SelectTrigger 
                          id="project-client"
                          className="border-palero-blue1/30 focus:border-palero-green1 focus:ring-palero-green1 bg-white"
                        >
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent className="border-palero-blue1/20">
                          {clients.map((client: { id: string; name: string }) => (
                            <SelectItem 
                              key={client.id} 
                              value={client.id}
                              className="hover:bg-palero-green1/10 focus:bg-palero-green1/10"
                            >
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                      disabled={isSaving}
                      className="bg-palero-green1 hover:bg-palero-green2 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push('/projects')}
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
            <Card className="bg-white/90 backdrop-blur-sm border-palero-yellow1/20 shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-palero-navy1 flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-palero-yellow1" />
                  Edit Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-palero-blue1/10 border border-palero-blue1/20">
                    <h4 className="font-medium text-palero-navy1 text-sm mb-1">Status Updates</h4>
                    <p className="text-xs text-palero-navy2">Update project status to reflect current progress accurately</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-palero-green1/10 border border-palero-green1/20">
                    <h4 className="font-medium text-palero-navy1 text-sm mb-1">Timeline Changes</h4>
                    <p className="text-xs text-palero-navy2">Adjust dates if project scope or requirements have changed</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-palero-teal1/10 border border-palero-teal1/20">
                    <h4 className="font-medium text-palero-navy1 text-sm mb-1">Client Management</h4>
                    <p className="text-xs text-palero-navy2">Ensure client assignment is correct for proper access control</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-palero-yellow1/10 border border-palero-yellow1/20">
                    <h4 className="font-medium text-palero-navy1 text-sm mb-1">Data Integrity</h4>
                    <p className="text-xs text-palero-navy2">Double-check all changes before saving to maintain data accuracy</p>
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
