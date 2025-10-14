"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Meeting, MeetingParticipant, UserResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ParticipantsList, AddParticipantsModal } from '@/components/meetings';
import {
  Video,
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';

interface MeetingDetailPageProps {
  params: {
    id: string;
  };
}

export default function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<(MeetingParticipant & { user?: UserResponse })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addParticipantsModalOpen, setAddParticipantsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    loadMeetingData();
    
    // Polling para reuniones activas
    const interval = setInterval(() => {
      if (meeting?.status === 'IN_PROGRESS' || meeting?.status === 'WAITING_ROOM') {
        loadMeetingData();
      }
    }, 15000); // Cada 15 segundos

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadMeetingData = async () => {
    try {
      const [meetingData, participantsData, allUsers] = await Promise.all([
        apiClient.getMeetingById(params.id),
        apiClient.getMeetingParticipants(params.id),
        apiClient.getUsers(), // Cargar todos los usuarios de una vez
      ]);

      // Crear un mapa de usuarios por ID para búsqueda rápida
      const usersMap = new Map(allUsers.map(user => [user.id, user]));

      // Enriquecer participantes con información de usuario
      const participantsWithUsers = participantsData.map(participant => {
        // Si ya tiene user y está completo, usarlo
        if (participant.user && participant.user.name) {
          return participant;
        }
        
        // Si no, buscar en el mapa de usuarios
        const user = usersMap.get(participant.userId);
        return { ...participant, user };
      });

      setMeeting(meetingData);
      setParticipants(participantsWithUsers);
    } catch (error: any) {
      console.error('Error loading meeting:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la reunión',
        variant: 'destructive',
      });
      router.push('/meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!meeting?.roomUrl) return;

    try {
      await navigator.clipboard.writeText(meeting.roomUrl);
      setCopiedUrl(true);
      toast({
        title: 'Enlace copiado',
        description: 'El enlace de la reunión se ha copiado al portapapeles',
      });
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar el enlace',
        variant: 'destructive',
      });
    }
  };

  const handleJoinMeeting = () => {
    if (meeting?.roomUrl) {
      window.open(meeting.roomUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteMeeting = async () => {
    if (!meeting) return;

    try {
      await apiClient.deleteMeeting(meeting.id);
      toast({
        title: 'Reunión eliminada',
        description: 'La reunión se ha eliminado exitosamente',
      });
      router.push('/meetings');
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la reunión',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialog(false);
    }
  };

  const handleChangeParticipantRole = async (
    userId: string,
    role: 'HOST' | 'PARTICIPANT' | 'OBSERVER'
  ) => {
    if (!meeting) return;

    try {
      await apiClient.updateMeetingParticipant(meeting.id, userId, { role });
      toast({
        title: 'Rol actualizado',
        description: 'El rol del participante se ha actualizado',
      });
      loadMeetingData();
    } catch (error: any) {
      console.error('Error updating participant role:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el rol',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!meeting) return;

    try {
      await apiClient.removeMeetingParticipant(meeting.id, userId);
      toast({
        title: 'Participante removido',
        description: 'El participante ha sido removido de la reunión',
      });
      loadMeetingData();
    } catch (error: any) {
      console.error('Error removing participant:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo remover el participante',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-palero-blue1" />
      </div>
    );
  }

  if (!meeting) {
    return null;
  }

  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const isUpcoming = isFuture(startTime);
  const isActive = meeting.status === 'IN_PROGRESS';
  const canJoin = (isActive || meeting.status === 'SCHEDULED') && meeting.roomUrl;
  const isHost = user?.id === meeting.createdById;

  const getStatusBadge = () => {
    const statusConfig = {
      SCHEDULED: { label: 'Programada', icon: Calendar, color: 'bg-blue-100 text-blue-800' },
      WAITING_ROOM: { label: 'En espera', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: { label: 'En curso', icon: Video, color: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Completada', icon: CheckCircle2, color: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Cancelada', icon: XCircle, color: 'bg-orange-100 text-orange-800' },
      FAILED: { label: 'Fallida', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
      DELETED: { label: 'Eliminada', icon: Trash2, color: 'bg-gray-100 text-gray-500' },
    };

    const config = statusConfig[meeting.status] || statusConfig.SCHEDULED;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/meetings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Video className={`h-6 w-6 ${isActive ? 'text-green-600' : 'text-palero-blue1'}`} />
                <CardTitle className="text-2xl">{meeting.title}</CardTitle>
                {getStatusBadge()}
              </div>
              {meeting.description && (
                <CardDescription className="text-base mt-2">
                  {meeting.description}
                </CardDescription>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {canJoin && (
                <Button
                  onClick={handleJoinMeeting}
                  className="bg-palero-green1 hover:bg-palero-green2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Unirse a la reunión
                </Button>
              )}

              {meeting.status === 'SCHEDULED' && isHost && (
                <>
                  <Button variant="outline" disabled>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialog(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Time Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-palero-blue1/5 rounded-lg">
              <Calendar className="h-5 w-5 text-palero-blue1 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-palero-navy1">Fecha</p>
                <p className="text-sm text-palero-navy2">
                  {format(startTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-palero-teal1/5 rounded-lg">
              <Clock className="h-5 w-5 text-palero-teal1 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-palero-navy1">Horario</p>
                <p className="text-sm text-palero-navy2">
                  {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                  {isUpcoming && (
                    <span className="block text-xs mt-1">
                      Empieza en {formatDistanceToNow(startTime, { locale: es })}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Room URL */}
          {meeting.roomUrl && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-palero-navy1 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-palero-yellow1" />
                  Enlace de la sala
                </h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-palero-navy1/5 rounded text-sm text-palero-navy1 overflow-x-auto">
                    {meeting.roomUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUrl}
                  >
                    {copiedUrl ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <ParticipantsList
        participants={participants}
        currentUserId={user?.id || ''}
        isHost={isHost}
        onAddParticipant={() => setAddParticipantsModalOpen(true)}
        onChangeRole={handleChangeParticipantRole}
        onRemoveParticipant={handleRemoveParticipant}
      />

      {/* Add Participants Modal */}
      <AddParticipantsModal
        open={addParticipantsModalOpen}
        onOpenChange={setAddParticipantsModalOpen}
        meetingId={meeting.id}
        existingParticipantIds={participants.map((p) => p.userId)}
        onSuccess={loadMeetingData}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reunión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La reunión será eliminada y los participantes no podrán unirse.
              {meeting.roomUrl && (
                <span className="block mt-2 text-orange-600">
                  La sala de Daily.co también será eliminada.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeeting}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
