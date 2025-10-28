import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConversationWithParticipant } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConversationListItemProps {
  conversation: ConversationWithParticipant;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  conversation,
  isSelected,
  onClick
}: ConversationListItemProps) {
  const { otherUser, lastMessageAt, lastMessagePreview, unreadCount } = conversation;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return '';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 text-left transition-colors hover:bg-gray-50',
        'focus:outline-none focus:bg-gray-50',
        isSelected && 'bg-palero-teal1/10 border-r-4 border-palero-teal1'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarFallback className="bg-palero-teal1 text-white font-semibold">
            {getInitials(otherUser.name)}
          </AvatarFallback>
        </Avatar>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Primera línea: Nombre y tiempo */}
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn(
              'font-medium text-sm truncate text-gray-900',
              unreadCount > 0 && 'font-semibold'
            )}>
              {otherUser.name}
            </h4>
            {lastMessageAt && (
              <span className="text-xs text-gray-500 shrink-0 ml-2">
                {formatLastMessageTime(lastMessageAt)}
              </span>
            )}
          </div>

          {/* Segunda línea: Preview y contador */}
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              'text-sm text-gray-600 truncate flex-1',
              unreadCount > 0 && 'font-medium text-gray-900'
            )}>
              {lastMessagePreview || 'No hay mensajes aún'}
            </p>
            {unreadCount > 0 && (
              <Badge 
                className="bg-palero-teal1 hover:bg-palero-teal2 text-white h-5 min-w-[1.25rem] text-xs px-2 shrink-0"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>

          {/* Tercera línea: Email (solo si no hay mensaje) */}
          {!lastMessagePreview && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {otherUser.email}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
