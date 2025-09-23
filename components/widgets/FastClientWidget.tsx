"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface FastClientData {
  id: string;
  name: string;
  email?: string;
}

interface FastClientWidgetProps {
  onClientCreated?: (client: FastClientData) => void;
  onError?: (error: string) => void;
  className?: string;
  isCompact?: boolean;
  disabled?: boolean;
}

type WidgetState = 'idle' | 'creating' | 'success' | 'error';

export const FastClientWidget: React.FC<FastClientWidgetProps> = ({
  onClientCreated,
  onError,
  className = '',
  isCompact = false,
  disabled = false
}) => {
  const [clientName, setClientName] = useState('');
  const [state, setState] = useState<WidgetState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateFastClient = async () => {
    if (!clientName.trim()) {
      setErrorMessage('Client name is required');
      setState('error');
      return;
    }

    setState('creating');
    setErrorMessage('');

    try {
      const newClient = await apiClient.createFastClient({
        name: clientName.trim()
      });

      setState('success');
      setClientName('');
      
      // Callback with client data
      onClientCreated?.({
        id: newClient.id,
        name: newClient.name,
        email: newClient.email
      });

      // Reset to idle after success message
      setTimeout(() => setState('idle'), 2000);
    } catch (error: any) {
      const message = error.message || 'Failed to create fast client';
      setErrorMessage(message);
      setState('error');
      onError?.(message);
    }
  };

  const handleReset = () => {
    setState('idle');
    setErrorMessage('');
    setClientName('');
  };

  const getStateIcon = () => {
    switch (state) {
      case 'creating':
        return <Loader2 className="h-4 w-4 animate-spin text-palero-blue1" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-palero-green1" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <UserPlus className="h-4 w-4 text-palero-teal1" />;
    }
  };

  const getStateText = () => {
    switch (state) {
      case 'creating':
        return 'Creating...';
      case 'success':
        return 'Client created!';
      case 'error':
        return 'Try again';
      default:
        return 'Create Fast Client';
    }
  };

  if (isCompact) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <Input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="New client name"
          className="w-48 border-palero-blue1/30 focus:border-palero-teal1"
          disabled={disabled || state === 'creating'}
          onKeyPress={(e) => e.key === 'Enter' && handleCreateFastClient()}
        />
        <Button
          onClick={handleCreateFastClient}
          disabled={disabled || state === 'creating' || !clientName.trim()}
          size="sm"
          className="bg-palero-teal1 hover:bg-palero-teal1/90 text-white"
        >
          {getStateIcon()}
        </Button>
        {state === 'error' && errorMessage && (
          <span className="text-xs text-red-600">{errorMessage}</span>
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-palero-teal1/5 to-palero-blue1/5 border-palero-teal1/20 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          {getStateIcon()}
          <div>
            <CardTitle className="text-sm font-medium text-palero-navy1">
              Quick Client Creation
            </CardTitle>
            <CardDescription className="text-xs text-palero-navy2">
              Create an internal client instantly
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {state === 'success' ? (
          <div className="text-center py-2">
            <CheckCircle className="h-8 w-8 text-palero-green1 mx-auto mb-2" />
            <p className="text-sm font-medium text-palero-green2">
              Client created successfully!
            </p>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="mt-2 border-palero-green1/30 text-palero-green1 hover:bg-palero-green1/10"
            >
              Create Another
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="fast-client-name" className="text-xs font-medium text-palero-navy1">
                Client Name
              </Label>
              <Input
                id="fast-client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. ABC Company Ltd."
                className="border-palero-teal1/30 focus:border-palero-teal1 text-sm"
                disabled={disabled || state === 'creating'}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFastClient()}
              />
              <p className="text-xs text-palero-navy2">
                Creates an internal client without login access
              </p>
            </div>

            {state === 'error' && errorMessage && (
              <Alert className="border-red-200 bg-red-50/50">
                <XCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-xs text-red-700">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleCreateFastClient}
              disabled={disabled || state === 'creating' || !clientName.trim()}
              size="sm"
              className="w-full bg-palero-teal1 hover:bg-palero-teal1/90 text-white disabled:opacity-50"
            >
              {getStateIcon()}
              <span className="ml-2 text-xs">{getStateText()}</span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FastClientWidget;