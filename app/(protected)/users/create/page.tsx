"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'TEAM_MEMBER' | 'CLIENT'>('CLIENT');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await apiClient.createUser({
        fullName,
        email,
        password,
        role,
      });

      setSuccess('User created successfully!');
      
      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('CLIENT');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/users');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Only admins can access this page
  if (user?.role !== 'ADMIN') {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertDescription className="text-red-700">
            You don&apos;t have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <Link href="/users" className="self-start">
          <Button variant="outline" size="sm" className="border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>
      
      {/* Header Section */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">Create New User</h1>
        <p className="text-sm sm:text-base text-palero-navy2 mt-1">
          Add a new user to the system with specific role permissions
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-palero-green1/10 to-palero-teal1/10">
            <CardTitle className="text-palero-navy1">User Information</CardTitle>
            <CardDescription className="text-palero-navy2">
              Fill in the details for the new user account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-palero-navy1 font-semibold">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="border-palero-blue1/30 focus:border-palero-teal1 focus:ring-palero-teal1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-palero-navy1 font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="border-palero-blue1/30 focus:border-palero-teal1 focus:ring-palero-teal1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-palero-navy1 font-semibold">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="border-palero-blue1/30 focus:border-palero-teal1 focus:ring-palero-teal1 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-palero-teal1/10 text-palero-navy2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-palero-navy2/70">Minimum 6 characters required</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-palero-navy1 font-semibold">Role</Label>
                  <Select value={role} onValueChange={(value: 'ADMIN' | 'TEAM_MEMBER' | 'CLIENT') => setRole(value)}>
                    <SelectTrigger className="border-palero-blue1/30 focus:border-palero-teal1 focus:ring-palero-teal1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="border-palero-blue1/20">
                      <SelectItem value="CLIENT" className="hover:bg-palero-green1/10">Client</SelectItem>
                      <SelectItem value="TEAM_MEMBER" className="hover:bg-palero-blue1/10">Team Member</SelectItem>
                      <SelectItem value="ADMIN" className="hover:bg-red-50">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-palero-navy1">Role Permissions</Label>
                <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  role === 'CLIENT' ? 'bg-palero-green1/10 border-palero-green1/20' :
                  role === 'TEAM_MEMBER' ? 'bg-palero-blue1/10 border-palero-blue1/20' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="text-sm space-y-2">
                    {role === 'CLIENT' && (
                      <div className="text-palero-green2">
                        <p className="font-medium mb-1">Client Permissions:</p>
                        <div className="space-y-1">
                          <p>• Can view assigned projects and tasks</p>
                          <p>• Can create comments and track progress</p>
                          <p>• Limited to own project data</p>
                        </div>
                      </div>
                    )}
                    {role === 'TEAM_MEMBER' && (
                      <div className="text-palero-blue2">
                        <p className="font-medium mb-1">Team Member Permissions:</p>
                        <div className="space-y-1">
                          <p>• Can manage projects, tasks, and clients</p>
                          <p>• Can view reports and analytics</p>
                          <p>• Cannot manage other users</p>
                        </div>
                      </div>
                    )}
                    {role === 'ADMIN' && (
                      <div className="text-red-700">
                        <p className="font-medium mb-1">Admin Permissions:</p>
                        <div className="space-y-1">
                          <p>• Full system access including user management</p>
                          <p>• Can configure system settings</p>
                          <p>• Access to all data and reports</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-palero-green1/20 bg-palero-green1/10">
                  <AlertDescription className="text-palero-green2">{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-palero-green1 hover:bg-palero-green2 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isLoading ? 'Creating User...' : 'Create User'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/users')}
                  className="border-palero-navy1/30 text-palero-navy1 hover:bg-palero-navy1/10 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}