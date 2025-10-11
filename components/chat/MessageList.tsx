import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCheck, Check, ChevronDown } from 'lucide-react';
import { Message } from '@/lib/api';
import { EmptyState } from './EmptyState';
import { formatTime, formatDateDivider, isSameDay, parseDate } from '@/utils/dateHelpers';
import { useAuth } from '@/contexts/AuthContext';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore?: () => void;
  otherUserName: string;
}

export function MessageList({ 
  messages, 
  loading, 
  hasMore,
  onLoadMore,
  otherUserName 
}: MessageListProps) {
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Log del usuario actual al inicio
  React.useEffect(() => {
    console.log('👤 MessageList - Usuario actual:', {
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      userRole: user?.role,
      otherUserName,
      messagesCount: messages.length,
      userExists: !!user,
      userIdExists: !!user?.id
    });
  }, [user, otherUserName, messages.length]);

  // Función para verificar si el mensaje es del usuario actual
  const isMyMessage = (msg: Message): boolean => {
    if (!user?.id || !msg.senderId) return false;
    
    const userId = String(user.id);
    const senderId = String(msg.senderId);
    return userId === senderId;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const shouldShowDateDivider = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    try {
      const currentDate = parseDate(currentMsg.sentAt);
      const prevDate = parseDate(prevMsg.sentAt);
      if (!currentDate || !prevDate) return false;
      return !isSameDay(currentDate, prevDate);
    } catch (error) {
      console.error('Error checking date divider:', error);
      return false;
    }
  };

  const shouldShowAvatar = (currentMsg: Message, nextMsg?: Message, currentUserId?: string) => {
    // Determinar si el mensaje es del usuario actual
    const isCurrentUserMessage = currentMsg.senderId === currentUserId;
    
    if (isCurrentUserMessage) return false;
    if (!nextMsg) return true;
    return nextMsg.senderId !== currentMsg.senderId;
  };

  // Auto-scroll al final cuando llegan mensajes nuevos
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Scroll inicial al cargar conversación
  useEffect(() => {
    if (messages.length > 0 && prevMessagesLengthRef.current === 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [messages.length]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return <EmptyState variant="no-messages" />;
  }

  return (
    <ScrollArea className="flex-1 px-4 md:px-6" ref={scrollAreaRef}>
      <div className="py-4 space-y-1">
        {/* Botón de cargar más - ahora arriba */}
        {hasMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Cargar mensajes anteriores
            </Button>
          </div>
        )}

        {/* Mensajes */}
        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : undefined;
          const nextMsg = index < messages.length - 1 ? messages[index + 1] : undefined;
          const showDateDivider = shouldShowDateDivider(msg, prevMsg);
          
          // Determinar si el mensaje es del usuario actual
          const isCurrentUserMessage = isMyMessage(msg);
          
          const showAvatar = shouldShowAvatar(msg, nextMsg, user?.id);
          const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

          return (
            <React.Fragment key={msg.id}>
              {/* Divisor de fecha */}
              {showDateDivider && (
                <div className="flex justify-center my-4">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {formatDateDivider(msg.sentAt)}
                  </div>
                </div>
              )}

              {/* Mensaje */}
              <div
                className={`flex gap-2 ${
                  isCurrentUserMessage ? 'justify-end' : 'justify-start'
                } ${!showAvatar && !isCurrentUserMessage ? 'ml-10' : ''}`}
              >
                {!isCurrentUserMessage && showAvatar && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/60 to-primary/40 text-primary-foreground">
                      {getInitials(otherUserName)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col ${
                    isCurrentUserMessage ? 'items-end' : 'items-start'
                  } max-w-[70%]`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl transition-opacity ${
                      isCurrentUserMessage
                        ? `bg-primary text-primary-foreground rounded-br-sm ${
                            msg.isOptimistic ? 'opacity-70' : ''
                          }`
                        : 'bg-muted text-foreground rounded-bl-sm'
                    } ${
                      !isLastInGroup
                        ? isCurrentUserMessage
                          ? 'rounded-br-2xl'
                          : 'rounded-bl-2xl'
                        : ''
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(msg.sentAt)}
                    </span>
                    {isCurrentUserMessage && (
                      <span className="text-muted-foreground">
                        {msg.isOptimistic ? (
                          <div className="h-3.5 w-3.5 border border-current rounded-full animate-pulse" />
                        ) : msg.readAt ? (
                          <CheckCheck className="h-3.5 w-3.5 text-primary" />
                        ) : msg.deliveredAt ? (
                          <CheckCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        
        {/* Referencia para auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
