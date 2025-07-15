"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, User, Phone, MapPin } from 'lucide-react';

const completeProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

interface CompleteProfileFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onSkip: () => void;
}

export const CompleteProfileForm: React.FC<CompleteProfileFormProps> = ({ onSuccess, onError, onSkip }) => {
  const { completeClientProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      companyName: '',
      contactPerson: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: CompleteProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      const success = await completeClientProfile(data);
      if (success) {
        onSuccess();
      } else {
        onError('Failed to complete profile. Please try again.');
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      onError('Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Complete Your Profile
        </CardTitle>
        <CardDescription>
          Welcome! Please complete your company information to continue using the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Name *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your company name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Person *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter contact person name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter phone number (optional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter company address (optional)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onSkip}
                className="order-2 sm:order-1"
              >
                Skip for now
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="min-w-32 order-1 sm:order-2"
              >
                {isSubmitting ? "Saving..." : "Complete Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CompleteProfileForm;
