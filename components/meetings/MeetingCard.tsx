"use client";

import React from 'react';
import { Meeting } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Edit, 
  Trash2, 
  Eye,
  ExternalLink 
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';

interface MeetingCardProps {
  meeting: Meeting;
  onView: (meeting: Meeting) => void;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
  onJoin?: (meeting: Meeting) => void;
}

const getStatusBadge = (status: Meeting['status']) => {
  const statusConfig = {
    SCHEDULED: { label: 'Programada', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
    WAITING_ROOM: { label: 'En espera', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
    IN_PROGRESS: { label: 'En curso', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    COMPLETED: { label: 'Completada', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' },
    CANCELLED: { label: 'Cancelada', variant: 'destructive' as const, color: 'bg-orange-100 text-orange-800' },
    FAILED: { label: 'Fallida', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    DELETED: { label: 'Eliminada', variant: 'outline' as const, color: 'bg-gray-100 text-gray-500' },
  };

  const config = statusConfig[status] || statusConfig.SCHEDULED;
  return (
    <Badge variant={config.variant} className={config.color}>
      {config.label}
    </Badge>
  );
};

export function MeetingCard({ meeting, onView, onEdit, onDelete, onJoin }: MeetingCardProps) {
  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const isUpcoming = isFuture(startTime);
  const isActive = meeting.status === 'IN_PROGRESS';
  const canJoin = (isActive || meeting.status === 'SCHEDULED') && meeting.roomUrl;

  const getTimeDisplay = () => {
    if (isUpcoming) {
      return `En ${formatDistanceToNow(startTime, { locale: es })}`;
    }
    if (isActive) {
      return 'Ahora';
    }
    return `Hace ${formatDistanceToNow(startTime, { locale: es })}`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-palero-blue1/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Video className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-palero-blue1'}`} />
              <CardTitle className="text-lg truncate">{meeting.title}</CardTitle>
            </div>
            {meeting.description && (
              <CardDescription className="line-clamp-2">
                {meeting.description}
              </CardDescription>
            )}
          </div>
          <div className="ml-2 flex-shrink-0">
            {getStatusBadge(meeting.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información de tiempo */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-palero-navy2">
            <Calendar className="h-4 w-4 mr-2 text-palero-teal1" />
            <span>{format(startTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
          </div>
          <div className="flex items-center text-sm text-palero-navy2">
            <Clock className="h-4 w-4 mr-2 text-palero-yellow1" />
            <span>
              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
              <span className="ml-2 text-palero-navy2/70">({getTimeDisplay()})</span>
            </span>
          </div>
          {meeting.participants && meeting.participants.length > 0 && (
            <div className="flex items-center text-sm text-palero-navy2">
              <Users className="h-4 w-4 mr-2 text-palero-green1" />
              <span>{meeting.participants.length} participante(s)</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-palero-navy2/10">
          {canJoin && onJoin && (
            <Button
              size="sm"
              onClick={() => onJoin(meeting)}
              className="bg-palero-green1 hover:bg-palero-green2 text-white flex-1 sm:flex-none"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Unirse
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(meeting)}
            className="flex-1 sm:flex-none"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver detalles
          </Button>

          {meeting.status === 'SCHEDULED' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(meeting)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(meeting)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
