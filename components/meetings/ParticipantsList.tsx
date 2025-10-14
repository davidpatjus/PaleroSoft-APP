"use client";

import React from 'react';
import { MeetingParticipant, UserResponse } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  User,
  Clock,
  MoreVertical 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ParticipantsListProps {
  participants: (MeetingParticipant & { user?: UserResponse })[];
  currentUserId: string;
  isHost: boolean;
  onAddParticipant: () => void;
  onChangeRole: (userId: string, role: 'HOST' | 'PARTICIPANT' | 'OBSERVER') => void;
  onRemoveParticipant: (userId: string) => void;
}

const getRoleIcon = (role: MeetingParticipant['role']) => {
  switch (role) {
    case 'HOST':
      return <Crown className="h-4 w-4 text-yellow-600" />;
    case 'PARTICIPANT':
      return <Shield className="h-4 w-4 text-blue-600" />;
    case 'OBSERVER':
      return <User className="h-4 w-4 text-gray-600" />;
  }
};

const getRoleName = (role: MeetingParticipant['role']) => {
  const roles = {
    HOST: 'Anfitrión',
    PARTICIPANT: 'Participante',
    OBSERVER: 'Observador',
  };
  return roles[role];
};

const getStatusBadge = (status: MeetingParticipant['status']) => {
  const statusConfig = {
    INVITED: { label: 'Invitado', color: 'bg-gray-100 text-gray-800' },
    JOINED: { label: 'Conectado', color: 'bg-green-100 text-green-800' },
    LEFT: { label: 'Salió', color: 'bg-orange-100 text-orange-800' },
    REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

export function ParticipantsList({
  participants,
  currentUserId,
  isHost,
  onAddParticipant,
  onChangeRole,
  onRemoveParticipant,
}: ParticipantsListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getConnectionTime = (participant: MeetingParticipant) => {
    if (!participant.joinedAt) return null;
    
    if (participant.leftAt) {
      const joined = new Date(participant.joinedAt);
      const left = new Date(participant.leftAt);
      const minutes = Math.floor((left.getTime() - joined.getTime()) / 60000);
      return `Estuvo ${minutes} min`;
    }

    return `Desde ${format(new Date(participant.joinedAt), 'HH:mm', { locale: es })}`;
  };

  // Agrupar participantes por estado
  const joined = participants.filter((p) => p.status === 'JOINED');
  const invited = participants.filter((p) => p.status === 'INVITED');
  const left = participants.filter((p) => p.status === 'LEFT');
  const rejected = participants.filter((p) => p.status === 'REJECTED');

  const ParticipantItem = ({ participant }: { participant: MeetingParticipant & { user?: UserResponse } }) => {
    const isCurrentUser = participant.userId === currentUserId;
    const connectionTime = getConnectionTime(participant);

    return (
      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-palero-blue1/5 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-palero-blue1 text-white">
              {participant.user ? getInitials(participant.user.name) : '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-palero-navy1 truncate">
                {participant.user?.name || 'Usuario desconocido'}
                {isCurrentUser && <span className="text-palero-navy2 ml-1">(Tú)</span>}
              </p>
              {getRoleIcon(participant.role)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-palero-navy2">{participant.user?.email}</p>
              {connectionTime && (
                <p className="text-xs text-palero-navy2 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {connectionTime}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusBadge(participant.status)}

          {isHost && !isCurrentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onChangeRole(participant.userId, 'HOST')}>
                  <Crown className="mr-2 h-4 w-4" />
                  Hacer anfitrión
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeRole(participant.userId, 'PARTICIPANT')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Hacer participante
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeRole(participant.userId, 'OBSERVER')}>
                  <User className="mr-2 h-4 w-4" />
                  Hacer observador
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemoveParticipant(participant.userId)}
                  className="text-red-600"
                >
                  Remover de la reunión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-palero-blue1" />
              Participantes ({participants.length})
            </CardTitle>
            <CardDescription className="mt-1">
              {joined.length} conectado(s) • {invited.length} invitado(s)
            </CardDescription>
          </div>
          {isHost && (
            <Button
              size="sm"
              onClick={onAddParticipant}
              className="bg-palero-green1 hover:bg-palero-green2"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Participantes conectados */}
        {joined.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-palero-navy1 mb-2 flex items-center">
              <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
              Conectados ({joined.length})
            </h4>
            <div className="space-y-1">
              {joined.map((participant) => (
                <ParticipantItem key={participant.id} participant={participant} />
              ))}
            </div>
          </div>
        )}

        {/* Participantes invitados */}
        {invited.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-palero-navy1 mb-2 flex items-center">
              <span className="h-2 w-2 bg-gray-400 rounded-full mr-2"></span>
              Invitados ({invited.length})
            </h4>
            <div className="space-y-1">
              {invited.map((participant) => (
                <ParticipantItem key={participant.id} participant={participant} />
              ))}
            </div>
          </div>
        )}

        {/* Participantes que salieron */}
        {left.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-palero-navy1 mb-2 flex items-center">
              <span className="h-2 w-2 bg-orange-400 rounded-full mr-2"></span>
              Salieron ({left.length})
            </h4>
            <div className="space-y-1">
              {left.map((participant) => (
                <ParticipantItem key={participant.id} participant={participant} />
              ))}
            </div>
          </div>
        )}

        {participants.length === 0 && (
          <div className="text-center py-8 text-palero-navy2">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay participantes aún</p>
            {isHost && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddParticipant}
                className="mt-4"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar participantes
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
