import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCheck, Check, ChevronDown } from 'lucide-react';
import { Message } from '@/lib/api';
import { EmptyState } from './EmptyState';
import { formatTime, formatDateDivider, isSameDay, parseDate } from '@/utils/dateHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
      <div className="flex justify-center items-center h-full bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-palero-teal1" />
      </div>
    );
  }

  if (messages.length === 0) {
    return <EmptyState variant="no-messages" />;
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 md:px-6 bg-gray-50"
    >
      <div className="py-4 space-y-2 max-w-3xl mx-auto">
        {/* Botón de cargar más */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={loading}
              className="gap-2 text-palero-teal1 border-palero-teal1/30 hover:bg-palero-teal1/10"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Cargar más mensajes
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
                <div className="flex justify-center my-6">
                  <div className="bg-white px-4 py-1.5 rounded-full text-xs font-medium text-gray-600 shadow-sm border border-gray-200">
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
                    <AvatarFallback className="text-xs bg-palero-teal1 text-white font-semibold">
                      {getInitials(otherUserName)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col ${
                    isCurrentUserMessage ? 'items-end' : 'items-start'
                  } max-w-[80%] sm:max-w-[70%]`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl ${
                      isCurrentUserMessage
                        ? `bg-palero-teal1 text-white rounded-br-md ${
                            msg.isOptimistic ? 'opacity-60' : ''
                          }`
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
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
                  
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.sentAt)}
                    </span>
                    {isCurrentUserMessage && (
                      <span className="flex items-center">
                        {msg.isOptimistic ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                        ) : msg.readAt ? (
                          <CheckCheck className="h-4 w-4 text-palero-blue1" />
                        ) : msg.deliveredAt ? (
                          <CheckCheck className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Check className="h-4 w-4 text-gray-400" />
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
    </div>
  );
}
