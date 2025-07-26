"use client";

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Copy, RefreshCw, X } from 'lucide-react';
import { ErrorDetails } from '@/hooks/useAnalyticsData';

interface ErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorDetails: ErrorDetails | null;
  onRetry: () => void;
}

export const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({
  isOpen,
  onClose,
  errorDetails,
  onRetry
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Aquí podrías agregar una notificación de que se copió
      console.log('Error details copied to clipboard');
    });
  };

  if (!errorDetails) return null;

  const formatErrorLog = () => {
    return errorDetails.errorLog.map(entry => 
      `[${entry.timestamp.toISOString()}] Attempt ${entry.attempt}: ${entry.error} (Context: ${entry.context})`
    ).join('\n');
  };

  const fullErrorDetails = `
Error Details:
=============
Message: ${errorDetails.message}
Context: ${errorDetails.context}
Timestamp: ${errorDetails.timestamp.toISOString()}
Retry Attempt: ${errorDetails.retryAttempt}

Stack Trace:
${errorDetails.stack || 'No stack trace available'}

Error Log:
${formatErrorLog()}

Browser Info:
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
  `.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Detalles del Error Crítico
          </DialogTitle>
          <DialogDescription>
            Se ha producido un error crítico después de múltiples intentos. Revisa los detalles técnicos a continuación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Summary */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-red-800">Error Principal</h3>
              <Badge variant="destructive">
                Intento {errorDetails.retryAttempt}
              </Badge>
            </div>
            <p className="text-red-700 text-sm">{errorDetails.message}</p>
            <p className="text-red-600 text-xs mt-1">
              <strong>Contexto:</strong> {errorDetails.context}
            </p>
            <p className="text-red-600 text-xs">
              <strong>Timestamp:</strong> {errorDetails.timestamp.toLocaleString('es-ES')}
            </p>
          </div>

          {/* Error Log */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">Historial de Intentos</h3>
            <ScrollArea className="h-32 w-full border rounded-lg p-3 bg-gray-50">
              {errorDetails.errorLog.map((entry, index) => (
                <div key={index} className="mb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{entry.attempt}
                    </Badge>
                    <span className="text-gray-600 text-xs">
                      {entry.timestamp.toLocaleTimeString('es-ES')}
                    </span>
                  </div>
                  <p className="text-gray-800 ml-2 mt-1">{entry.error}</p>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Stack Trace */}
          {errorDetails.stack && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Stack Trace</h3>
              <ScrollArea className="h-40 w-full border rounded-lg p-3 bg-gray-900 text-green-400 font-mono text-xs">
                <pre className="whitespace-pre-wrap">{errorDetails.stack}</pre>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => copyToClipboard(fullErrorDetails)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar Detalles
            </Button>
            
            <Button
              onClick={onRetry}
              variant="default"
              className="flex items-center gap-2 bg-palero-blue1 hover:bg-palero-blue1/90"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="flex items-center gap-2 ml-auto"
            >
              <X className="h-4 w-4" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
