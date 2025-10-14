"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient, CreateMeetingDto, Project } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface CreateMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (meeting?: any) => void;
  initialType?: 'instant' | 'scheduled'; // Nuevo: tipo inicial
}

type MeetingType = 'instant' | 'scheduled';

export function CreateMeetingModal({ open, onOpenChange, onSuccess, initialType = 'scheduled' }: CreateMeetingModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetingType, setMeetingType] = useState<MeetingType>(initialType);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateMeetingDto & { projectId?: string }>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    projectId: undefined,
  });

  useEffect(() => {
    if (open) {
      loadProjects();
      setMeetingType(initialType); // Usar el tipo inicial pasado como prop
      
      // Reset de estados de error y éxito
      setValidationErrors({});
      setGeneralError(null);
      setSuccessMessage(null);
      
      // Establecer fecha/hora por defecto
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
      const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hora más
      
      setFormData({
        title: '',
        description: '',
        startTime: format(start, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(end, "yyyy-MM-dd'T'HH:mm"),
        projectId: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialType]); // Agregar initialType como dependencia

  const loadProjects = async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar título
    if (!formData.title.trim()) {
      errors.title = 'El título es requerido';
    } else if (formData.title.length < 3) {
      errors.title = 'El título debe tener al menos 3 caracteres';
    } else if (formData.title.length > 100) {
      errors.title = 'El título no puede exceder 100 caracteres';
    }

    // Para reuniones instantáneas, las fechas se calculan automáticamente
    if (meetingType === 'instant') {
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }

    // Validaciones para reuniones programadas
    if (!formData.startTime) {
      errors.startTime = 'La fecha de inicio es requerida';
    }
    if (!formData.endTime) {
      errors.endTime = 'La fecha de fin es requerida';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const now = new Date();

      if (start < now) {
        errors.startTime = 'La fecha de inicio no puede estar en el pasado';
      }
      
      if (end <= start) {
        errors.endTime = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }

      // Validar duración mínima (15 minutos)
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        errors.endTime = 'La reunión debe durar al menos 15 minutos';
      }

      // Validar duración máxima (8 horas)
      if (durationMinutes > 480) {
        errors.endTime = 'La reunión no puede durar más de 8 horas';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar errores previos
    setGeneralError(null);
    setSuccessMessage(null);

    // Validar formulario
    if (!validateForm()) {
      setGeneralError('Por favor corrige los errores antes de continuar');
      return;
    }

    setLoading(true);
    try {
      let startTime: string;
      let endTime: string;

      if (meetingType === 'instant') {
        // Reunión instantánea: empieza ahora, dura 1 hora por defecto
        const now = new Date();
        const end = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
        startTime = now.toISOString();
        endTime = end.toISOString();
      } else {
        // Reunión programada: usar fechas del formulario
        startTime = new Date(formData.startTime).toISOString();
        endTime = new Date(formData.endTime).toISOString();
      }

      const meetingData: CreateMeetingDto = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        startTime,
        endTime,
        projectId: formData.projectId || undefined,
      };

      const createdMeeting = await apiClient.createMeeting(meetingData);
      
      // Mostrar mensaje de éxito
      setSuccessMessage(
        meetingType === 'instant' 
          ? '¡Reunión creada! Puedes unirte ahora mismo.' 
          : '¡Reunión programada exitosamente!'
      );

      toast({
        title: meetingType === 'instant' ? 'Reunión instantánea creada' : 'Reunión programada',
        description: meetingType === 'instant' 
          ? 'La reunión está lista. Puedes unirte ahora mismo.'
          : 'La reunión se ha programado exitosamente',
      });

      // Esperar un poco para mostrar el mensaje de éxito
      setTimeout(() => {
        onSuccess(createdMeeting);
        onOpenChange(false);
      }, 800);

    } catch (error: any) {
      console.error('Error creating meeting:', error);
      
      // Parsear diferentes tipos de errores del backend
      let errorMessage = 'No se pudo crear la reunión. Intenta nuevamente.';
      
      if (error.message) {
        // Errores específicos del backend
        if (error.message.includes('Daily.co')) {
          errorMessage = 'Error al crear la sala de videollamada. Por favor, contacta al administrador.';
        } else if (error.message.includes('overlap') || error.message.includes('conflicto')) {
          errorMessage = 'Ya existe una reunión programada en este horario.';
        } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
          errorMessage = 'No tienes permisos para crear reuniones.';
        } else if (error.message.includes('project')) {
          errorMessage = 'El proyecto seleccionado no es válido.';
        } else {
          errorMessage = error.message;
        }
      }

      setGeneralError(errorMessage);
      
      toast({
        title: 'Error al crear reunión',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Nueva Reunión</DialogTitle>
            <DialogDescription>
              Inicia una reunión instantánea o programa una para después.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Error general */}
            {generalError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Mensaje de éxito */}
            {successMessage && (
              <Alert className="border-green-500 text-green-700 bg-green-50">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* Tipo de reunión */}
            <div className="grid gap-3">
              <Label>Tipo de reunión</Label>
              <RadioGroup
                value={meetingType}
                onValueChange={(value: MeetingType) => setMeetingType(value)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="instant"
                    id="instant"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="instant"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-palero-green1 [&:has([data-state=checked])]:border-palero-green1 cursor-pointer"
                  >
                    <Zap className="mb-3 h-6 w-6 text-palero-green1" />
                    <div className="text-center">
                      <div className="font-semibold">Instantánea</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Empieza ahora
                      </div>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="scheduled"
                    id="scheduled"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="scheduled"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-palero-blue1 [&:has([data-state=checked])]:border-palero-blue1 cursor-pointer"
                  >
                    <Calendar className="mb-3 h-6 w-6 text-palero-blue1" />
                    <div className="text-center">
                      <div className="font-semibold">Programada</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Elige fecha y hora
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Título */}
            <div className="grid gap-2">
              <Label htmlFor="title" className={validationErrors.title ? 'text-red-600' : ''}>
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  // Limpiar error al escribir
                  if (validationErrors.title) {
                    setValidationErrors({ ...validationErrors, title: '' });
                  }
                }}
                placeholder={meetingType === 'instant' ? "Ej: Reunión rápida del equipo" : "Ej: Sprint Planning"}
                className={validationErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
                required
              />
              {validationErrors.title && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.title}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional de la reunión"
                rows={3}
              />
            </div>

            {/* Fecha y hora (solo para programadas) */}
            {meetingType === 'scheduled' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="startTime" className={validationErrors.startTime ? 'text-red-600' : ''}>
                    Fecha y hora de inicio <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => {
                      setFormData({ ...formData, startTime: e.target.value });
                      // Limpiar error al cambiar
                      if (validationErrors.startTime) {
                        setValidationErrors({ ...validationErrors, startTime: '' });
                      }
                    }}
                    className={validationErrors.startTime ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {validationErrors.startTime && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.startTime}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endTime" className={validationErrors.endTime ? 'text-red-600' : ''}>
                    Fecha y hora de fin <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => {
                      setFormData({ ...formData, endTime: e.target.value });
                      // Limpiar error al cambiar
                      if (validationErrors.endTime) {
                        setValidationErrors({ ...validationErrors, endTime: '' });
                      }
                    }}
                    className={validationErrors.endTime ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {validationErrors.endTime && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.endTime}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Información para reuniones instantáneas */}
            {meetingType === 'instant' && (
              <div className="bg-palero-green1/10 border border-palero-green1/20 rounded-lg p-3">
                <p className="text-sm text-palero-navy1">
                  <strong>ℹ️ Reunión instantánea:</strong> La reunión empezará inmediatamente y tendrá una duración de 1 hora por defecto.
                </p>
              </div>
            )}

            {/* Proyecto (opcional) */}
            <div className="grid gap-2">
              <Label htmlFor="project">Proyecto (opcional)</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={meetingType === 'instant' ? 'bg-palero-green1 hover:bg-palero-green2' : 'bg-palero-blue1 hover:bg-palero-blue2'}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  {meetingType === 'instant' ? (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Crear e Iniciar Ahora
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Programar Reunión
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
