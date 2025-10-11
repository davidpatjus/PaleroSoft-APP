"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatLayout, ConversationList, NewChatModal, EmptyState } from '@/components/chat';

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    conversations,
    loadingConversations,
    isConnected,
    isInitializing,
    createConversation,
  } = useChat();
  
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  // Bloquear acceso para usuarios FAST_CLIENT
  if (user?.role === 'FAST_CLIENT') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-6 p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Acceso No Disponible</h2>
            <p className="text-muted-foreground">
              Los clientes rápidos no tienen acceso al sistema de chat. 
              Para obtener soporte, contacta directamente con el equipo.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const handleNewChat = async (recipientId: string, recipientName: string) => {
    setCreatingChat(true);
    try {
      const conv = await createConversation(recipientId);
      if (conv) {
        router.push(`/chat/${conv.id}`);
      }
    } catch (error) {
      console.error('Error creando conversación:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Inicializando chat...</p>
        </div>
      </div>
    );
  }

  const sidebar = (
    <ConversationList
      conversations={conversations}
      loading={loadingConversations}
      onSelectConversation={handleSelectConversation}
      onNewChat={() => setShowNewChatModal(true)}
    />
  );

  const main = (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {/* Header con estado */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user ? getInitials(user.name) : '??'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <h2 className="font-semibold">{user?.name}</h2>
            <div className="flex items-center gap-2 text-sm">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
              {totalUnread > 0 && (
                <Badge variant="default" className="ml-2">
                  {totalUnread} sin leer
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estado vacío */}
      <EmptyState variant="no-conversations" />
      
      <Button
        onClick={() => setShowNewChatModal(true)}
        disabled={creatingChat}
        className="mt-6 gap-2"
      >
        {creatingChat ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Nueva conversación
      </Button>
    </div>
  );

  return (
    <>
      <ChatLayout sidebar={sidebar} main={main} />
      
      <NewChatModal
        open={showNewChatModal}
        onOpenChange={setShowNewChatModal}
        onSelectRecipient={handleNewChat}
      />
    </>
  );
}
