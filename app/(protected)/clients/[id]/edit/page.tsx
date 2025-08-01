"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, User, Phone, MapPin, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import useClientDetail from '@/hooks/clients/useClientDetail';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clientId = params.id as string;
  
  const {
    client,
    isLoading,
    error,
    updateClient
  } = useClientDetail(clientId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    address: '',
    status: 'PROSPECT' as 'PROSPECT' | 'ACTIVE' | 'IN_PROJECT' | 'COMPLETED' | 'ARCHIVED',
    socialMediaLinks: {}
  });

  const canUpdate = hasPermission(user!.role, 'clients', 'update');

  // Load client data when available
  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.companyName || '',
        contactPerson: client.contactPerson || '',
        phone: client.phone || '',
        address: client.address || '',
        status: client.status,
        socialMediaLinks: client.socialMediaLinks || {}
      });
    }
  }, [client]);

  if (!canUpdate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <p className="text-palero-navy1 font-medium">You don&apos;t have permission to edit clients</p>
        <Link href={`/clients/${clientId}`}>
          <Button variant="outline">Back to Client</Button>
        </Link>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSubmitError(''); // Clear errors when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Validations
      if (!formData.companyName.trim()) {
        throw new Error('Company name is required');
      }

      if (!formData.contactPerson.trim()) {
        throw new Error('Contact person is required');
      }

      const result = await updateClient(formData);
      
      if (result.success) {
        router.push(`/clients/${clientId}`);
      } else {
        setSubmitError(result.error || 'Error updating client');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error updating client');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
        <p className="text-palero-navy1 font-medium">Loading client data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="responsive-container">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
          <Link href="/clients">
            <Button variant="outline">Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="responsive-container">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
            <AlertDescription className="text-yellow-700">
              Client not found
            </AlertDescription>
          </Alert>
          <Link href="/clients">
            <Button variant="outline">Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-container">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href={`/clients/${clientId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-palero-navy1">
              Edit Client
            </h1>
            <p className="text-sm sm:text-base text-palero-navy2 mt-1">
              {client.user?.name || client.companyName} - Update information
            </p>
          </div>
        </div>

        {submitError && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertDescription className="text-red-700">{submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information (Read-only) */}
          <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
            <CardHeader>
              <CardTitle className="flex items-center text-palero-navy1">
                <User className="mr-2 h-5 w-5" />
                User Information
              </CardTitle>
              <CardDescription>This information cannot be modified from here</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={client.user?.name || 'No name'} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    value={client.user?.email || 'No email'} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information (Editable) */}
          <Card className="bg-white/80 backdrop-blur-sm border-palero-green1/20">
            <CardHeader>
              <CardTitle className="flex items-center text-palero-navy1">
                <Building2 className="mr-2 h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Update commercial and contact data</CardDescription>
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
                    placeholder="e.g.: PaleroSoft Inc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="border-palero-green1/30 focus:border-palero-teal1"
                    placeholder="e.g.: John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="border-palero-green1/30 focus:border-palero-teal1"
                    placeholder="e.g.: +1 234 567 8900"
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
              disabled={isSubmitting}
              className="bg-palero-green1 hover:bg-palero-green2 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href={`/clients/${clientId}`}>
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
