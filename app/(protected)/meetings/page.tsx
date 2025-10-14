"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Meeting } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { MeetingCard, CreateMeetingModal } from '@/components/meetings';
import { Video, Plus, Search, Loader2, Calendar, Clock, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MeetingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [meetingTypeToCreate, setMeetingTypeToCreate] = useState<'instant' | 'scheduled'>('scheduled');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; meeting: Meeting | null }>({
    open: false,
    meeting: null,
  });
  const [instantMeetingDialog, setInstantMeetingDialog] = useState<{ open: boolean; meeting: Meeting | null }>({
    open: false,
    meeting: null,
  });

  useEffect(() => {
    loadMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando meetings...');
      const data = await apiClient.getMeetings();
      console.log('✅ Meetings recibidas del backend:', data);
      console.log('📊 Tipo de dato:', typeof data);
      console.log('📏 Es array?:', Array.isArray(data));
      
      // Si el backend devuelve { data: [...] }, extraer el array
      const meetingsArray = Array.isArray(data) ? data : (data as any)?.data || [];
      console.log('📦 Meetings array procesado:', meetingsArray);
      console.log('🔢 Total de meetings:', meetingsArray.length);
      
      setMeetings(meetingsArray);
    } catch (error: any) {
      console.error('❌ Error loading meetings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las reuniones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewMeeting = (meeting: Meeting) => {
    router.push(`/meetings/${meeting.id}`);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    // TODO: Implementar modal de edición
    toast({
      title: 'Funcionalidad en desarrollo',
      description: 'La edición de reuniones estará disponible pronto',
    });
  };

  const handleDeleteMeeting = async () => {
    if (!deleteDialog.meeting) return;

    try {
      await apiClient.deleteMeeting(deleteDialog.meeting.id);
      toast({
        title: 'Reunión eliminada',
        description: 'La reunión se ha eliminado exitosamente',
      });
      loadMeetings();
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la reunión',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialog({ open: false, meeting: null });
    }
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    if (meeting.roomUrl) {
      window.open(meeting.roomUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: 'Error',
        description: 'La sala de reunión no está disponible',
        variant: 'destructive',
      });
    }
  };

  const handleMeetingCreated = (meeting?: Meeting) => {
    loadMeetings();
    
    // Si es una reunión instantánea, mostrar diálogo para unirse
    if (meeting && meeting.status === 'SCHEDULED') {
      const now = new Date();
      const startTime = new Date(meeting.startTime);
      const diffMinutes = Math.abs(startTime.getTime() - now.getTime()) / 60000;
      
      // Si empieza en menos de 5 minutos, considerarlo instantáneo
      if (diffMinutes < 5) {
        setInstantMeetingDialog({ open: true, meeting });
      }
    }
  };

  const handleJoinInstantMeeting = () => {
    if (instantMeetingDialog.meeting) {
      handleJoinMeeting(instantMeetingDialog.meeting);
      setInstantMeetingDialog({ open: false, meeting: null });
    }
  };

  const handleViewInstantMeeting = () => {
    if (instantMeetingDialog.meeting) {
      router.push(`/meetings/${instantMeetingDialog.meeting.id}`);
      setInstantMeetingDialog({ open: false, meeting: null });
    }
  };

  // Filtrar reuniones según búsqueda
  const filteredMeetings = meetings.filter((meeting) =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorizar reuniones
  const now = new Date();
  
  // Próximas: SCHEDULED y empieza en el futuro, O WAITING_ROOM
  const upcoming = filteredMeetings.filter((m) => {
    if (m.status === 'WAITING_ROOM') return true;
    return m.status === 'SCHEDULED' && new Date(m.startTime) > now;
  });
  
  // En Curso: IN_PROGRESS o SCHEDULED que ya empezó pero no terminó
  const inProgress = filteredMeetings.filter((m) => {
    if (m.status === 'IN_PROGRESS') return true;
    if (m.status === 'SCHEDULED') {
      const startTime = new Date(m.startTime);
      const endTime = new Date(m.endTime);
      return startTime <= now && endTime > now;
    }
    return false;
  });
  
  // Completadas: COMPLETED o SCHEDULED/WAITING_ROOM que ya pasó su endTime
  const completed = filteredMeetings.filter((m) => {
    if (m.status === 'COMPLETED') return true;
    if (m.status === 'SCHEDULED' || m.status === 'WAITING_ROOM') {
      const endTime = new Date(m.endTime);
      return endTime <= now;
    }
    return false;
  });
  
  // Canceladas/Fallidas
  const cancelled = filteredMeetings.filter(
    (m) => m.status === 'CANCELLED' || m.status === 'DELETED' || m.status === 'FAILED'
  );

  const MeetingsGrid = ({ meetings }: { meetings: Meeting[] }) => {
    if (meetings.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-palero-navy2 opacity-50 mb-4" />
            <p className="text-palero-navy2 text-sm">No hay reuniones en esta categoría</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            onView={handleViewMeeting}
            onEdit={handleEditMeeting}
            onDelete={(m) => setDeleteDialog({ open: true, meeting: m })}
            onJoin={handleJoinMeeting}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-palero-navy1 flex items-center gap-2">
            <Video className="h-8 w-8 text-palero-blue1" />
            Reuniones
          </h1>
          <p className="text-sm text-palero-navy2 mt-1">
            Gestiona tus videollamadas y reuniones virtuales
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setMeetingTypeToCreate('scheduled');
              setCreateModalOpen(true);
            }}
            variant="outline"
            className="border-palero-blue1 text-palero-blue1 hover:bg-palero-blue1 hover:text-white"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Programar
          </Button>
          <Button
            onClick={() => {
              setMeetingTypeToCreate('instant');
              setCreateModalOpen(true);
            }}
            className="bg-palero-green1 hover:bg-palero-green2"
          >
            <Zap className="mr-2 h-4 w-4" />
            Reunión Rápida
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Próximas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{upcoming.length}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">En Curso</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{inProgress.length}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{completed.length}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{cancelled.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-palero-navy2" />
            <Input
              placeholder="Buscar reuniones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Meetings Tabs */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-palero-blue1" />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">
              Próximas ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              En Curso ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completadas ({completed.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Canceladas ({cancelled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <MeetingsGrid meetings={upcoming} />
          </TabsContent>

          <TabsContent value="in-progress">
            <MeetingsGrid meetings={inProgress} />
          </TabsContent>

          <TabsContent value="completed">
            <MeetingsGrid meetings={completed} />
          </TabsContent>

          <TabsContent value="cancelled">
            <MeetingsGrid meetings={cancelled} />
          </TabsContent>
        </Tabs>
      )}

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleMeetingCreated}
        initialType={meetingTypeToCreate}
      />

      {/* Instant Meeting Dialog */}
      <AlertDialog open={instantMeetingDialog.open} onOpenChange={(open) => setInstantMeetingDialog({ ...instantMeetingDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-palero-green1" />
              ¡Reunión lista para comenzar!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tu reunión <strong>&quot;{instantMeetingDialog.meeting?.title}&quot;</strong> ha sido creada exitosamente. 
              <br />
              <br />
              ¿Qué te gustaría hacer ahora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleViewInstantMeeting}
              className="w-full sm:w-auto"
            >
              Ver Detalles
            </Button>
            <Button
              onClick={handleJoinInstantMeeting}
              className="bg-palero-green1 hover:bg-palero-green2 w-full sm:w-auto"
            >
              <Video className="mr-2 h-4 w-4" />
              Unirse Ahora
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reunión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La reunión será eliminada y los participantes no podrán unirse.
              {deleteDialog.meeting?.roomUrl && (
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
