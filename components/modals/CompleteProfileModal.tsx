"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompleteProfileForm } from '@/components/forms/CompleteProfileForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const CompleteProfileModal: React.FC = () => {
  const { isProfileIncomplete, skipProfileCompletion } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSkip = () => {
    skipProfileCompletion();
    toast({
      title: "Profile Skipped",
      description: "You can complete your profile later from the settings menu.",
    });
  };

  const handleSuccess = () => {
    toast({
      title: "Profile Completed",
      description: "Your profile has been completed successfully. Welcome to PaleroSoft CRM!",
    });
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  return (
    <Dialog open={isProfileIncomplete}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        // Ahora permitimos cerrar el modal
        onPointerDownOutside={handleSkip}
        onEscapeKeyDown={handleSkip}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">
            Welcome to PaleroSoft CRM! 🎉
          </DialogTitle>
          <DialogDescription className="text-base">
            To provide you with the best experience, we&apos;d love to know more about your company. 
            You can complete this now or skip and do it later from your profile settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <CompleteProfileForm 
            onSuccess={handleSuccess}
            onError={handleError}
            onSkip={handleSkip}
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompleteProfileModal;
