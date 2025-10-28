import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { ConversationWithParticipant } from '@/lib/api';

interface ConversationHeaderProps {
  conversation: ConversationWithParticipant;
  onBack: () => void;
  showBackButton?: boolean;
}

export function ConversationHeader({ 
  conversation, 
  onBack, 
  showBackButton = true 
}: ConversationHeaderProps) {
  const otherUser = conversation.otherUser;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
      {/* Botón volver (móvil) */}
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden h-10 w-10 text-gray-600 hover:text-palero-teal1 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Avatar del usuario */}
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-palero-teal1 text-white font-semibold text-sm">
          {getInitials(otherUser.name)}
        </AvatarFallback>
      </Avatar>

      {/* Info del usuario */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-gray-900 truncate">
          {otherUser.name}
        </h3>
        <p className="text-xs text-gray-500 truncate">
          {otherUser.email}
        </p>
      </div>
    </div>
  );
}