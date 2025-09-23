"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, User, Phone, MapPin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { apiClient } from '@/lib/api';
import useClients from '@/hooks/clients/useClients';
import Link from 'next/link';

export default function CreateClientPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createClient, updateClient, getClientByUserId, getAvailableUsersForClientProfile, users, isLoading: clientsLoading, fetchClients } = useClients();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'existing' | 'new_fast_client'>('existing');
  const [fastClientName, setFastClientName] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    address: '',
    status: 'PROSPECT' as const,
    socialMediaLinks: {}
  });

  // Auto-fill company name when fast client name changes
  useEffect(() => {
    if (userType === 'new_fast_client' && fastClientName.trim()) {
      setFormData(prev => ({
        ...prev,
        companyName: fastClientName.trim(),
        contactPerson: fastClientName.trim()
      }));
    }
  }, [fastClientName, userType]);

  const canCreate = hasPermission(user!.role, 'clients', 'create');
  const availableUsers = getAvailableUsersForClientProfile();

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <p className="text-palero-navy1 font-medium">You don&apos;t have permission to create clients</p>
        <Link href="/clients">
          <Button variant="outline">Back to Clients</Button>
        </Link>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear errors when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let userId = formData.userId;

      // If creating a new fast client, create the user first
      if (userType === 'new_fast_client') {
        if (!fastClientName.trim()) {
          throw new Error('Fast client name is required');
        }

        try {
          const newFastClient = await apiClient.createFastClient({
            name: fastClientName.trim()
          });
          userId = newFastClient.id;
          
          // Refresh the users list to include the new fast client
          await fetchClients();
        } catch (err: any) {
          throw new Error(`Failed to create fast client: ${err.message}`);
        }
      } else {
        // Validation for existing user
        if (!formData.userId) {
          throw new Error('You must select a user');
        }
      }

      if (!formData.companyName.trim()) {
        throw new Error('Company name is required');
      }

      if (!formData.contactPerson.trim()) {
        throw new Error('Contact person is required');
      }

      let result;
      
      // Check if the user already has a client profile (especially for new fast clients)
      if (userType === 'new_fast_client') {
        try {
          const existingProfileResult = await getClientByUserId(userId);
          if (existingProfileResult.success && existingProfileResult.data) {
            // Update existing profile
            result = await updateClient(existingProfileResult.data.id, {
              companyName: formData.companyName,
              contactPerson: formData.contactPerson,
              phone: formData.phone,
              address: formData.address,
              status: formData.status,
              socialMediaLinks: formData.socialMediaLinks
            });
          } else {
            // Create new profile
            result = await createClient({
              ...formData,
              userId
            });
          }
        } catch (err) {
          // If getClientByUserId fails, try to create (fallback)
          result = await createClient({
            ...formData,
            userId
          });
        }
      } else {
        // For existing users, always create new profile
        result = await createClient({
          ...formData,
          userId
        });
      }
      
      if (result.success) {
        router.push('/clients');
      } else {
        setError(result.error || 'Error creating client');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating client');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (clientsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="responsive-container">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">
              New Client
            </h1>
            <p className="text-sm sm:text-base text-palero-navy2 mt-1">
              Create a client profile for an existing user or create a new fast client
            </p>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
          <Card className="bg-white/80 backdrop-blur-sm border-palero-blue1/20">
            <CardHeader>
              <CardTitle className="flex items-center text-palero-navy1">
                <User className="mr-2 h-5 w-5" />
                User Type
              </CardTitle>
              <CardDescription>Choose how to create the client user account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    userType === 'existing' 
                      ? 'border-palero-green1 bg-palero-green1/10' 
                      : 'border-gray-200 hover:border-palero-green1/50'
                  }`}
                  onClick={() => {
                    setUserType('existing');
                    setFastClientName('');
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="userType"
                      value="existing"
                      checked={userType === 'existing'}
                      onChange={() => setUserType('existing')}
                      className="text-palero-green1 focus:ring-palero-green1"
                    />
                    <div>
                      <h3 className="font-medium text-palero-navy1">Existing User</h3>
                      <p className="text-sm text-palero-navy2">Select from users with CLIENT role</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    userType === 'new_fast_client' 
                      ? 'border-palero-yellow1 bg-palero-yellow1/10' 
                      : 'border-gray-200 hover:border-palero-yellow1/50'
                  }`}
                  onClick={() => {
                    setUserType('new_fast_client');
                    setFormData(prev => ({ ...prev, userId: '' }));
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="userType"
                      value="new_fast_client"
                      checked={userType === 'new_fast_client'}
                      onChange={() => setUserType('new_fast_client')}
                      className="text-palero-yellow1 focus:ring-palero-yellow1"
                    />
                    <div>
                      <h3 className="font-medium text-palero-navy1">New Fast Client</h3>
                      <p className="text-sm text-palero-navy2">Create internal client (no login access)</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Selection/Creation */}
          <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
            <CardHeader>
              <CardTitle className="flex items-center text-palero-navy1">
                <User className="mr-2 h-5 w-5" />
                {userType === 'existing' ? 'User Selection' : 'Fast Client Information'}
              </CardTitle>
              <CardDescription>
                {userType === 'existing' 
                  ? 'Select the user for whom to create the client profile' 
                  : 'Enter the name for the new fast client'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userType === 'existing' ? (
                <div className="space-y-2">
                  <Label htmlFor="userId">User *</Label>
                  <Select value={formData.userId} onValueChange={(value) => handleInputChange('userId', value)}>
                    <SelectTrigger className="border-palero-green1/30 focus:border-palero-teal1">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-palero-navy2" />
                            <span>{user.name} - {user.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableUsers.length === 0 && (
                    <p className="text-sm text-palero-navy2">
                      No users available. Only users with CLIENT role who don&apos;t have a profile can be selected.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fastClientName">Fast Client Name *</Label>
                  <Input
                    id="fastClientName"
                    value={fastClientName}
                    onChange={(e) => setFastClientName(e.target.value)}
                    className="border-palero-yellow1/30 focus:border-palero-yellow1"
                    placeholder="e.g. ABC Company Ltd."
                  />
                  <p className="text-xs text-palero-navy2">
                    This will be used as both the user name and default company name
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
            <CardHeader>
              <CardTitle className="flex items-center text-palero-navy1">
                <Building2 className="mr-2 h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Commercial and contact details of the client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="border-palero-green1/30 focus:border-palero-teal1"
                    placeholder="e.g. PaleroSoft Inc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="border-palero-green1/30 focus:border-palero-teal1"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="border-palero-green1/30 focus:border-palero-teal1"
                    placeholder="e.g. +1 234 567 8900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Client Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="border-palero-green1/30 focus:border-palero-teal1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROSPECT">Prospect</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="IN_PROJECT">In Project</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="border-palero-green1/30 focus:border-palero-teal1"
                  placeholder="Complete company address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || (userType === 'existing' && availableUsers.length === 0)}
              className="bg-palero-green1 hover:bg-palero-green2 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </Button>
            <Link href="/clients">
              <Button variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
