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
    <div className="flex items-center gap-3 p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Botón volver (móvil) */}
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Avatar del usuario */}
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
          {getInitials(otherUser.name)}
        </AvatarFallback>
      </Avatar>

      {/* Info del usuario */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">
          {otherUser.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {otherUser.email}
        </p>
      </div>

      {/* Acciones */}
      {/* <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="hidden sm:flex">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="hidden sm:flex">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div> */}
    </div>
  );
}