"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import {
  ChatLayout,
  ConversationHeader,
  ConversationList,
  MessageList,
  MessageComposer,
} from '@/components/chat';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const conversationId = params.conversationId as string;
  
  const {
    conversations,
    messagesByConversation,
    loadingMessages,
    hasMoreMessages,
    cursors,
    selectConversation,
    loadMessages,
    sendMessage,
    isConnected,
  } = useChat();

  const [error, setError] = useState<string>('');
  const [initialLoading, setInitialLoading] = useState(true);

  const conversation = conversations.find(c => c.id === conversationId);
  const messages = messagesByConversation[conversationId] || [];
  const loading = loadingMessages[conversationId] || false;
  const hasMore = hasMoreMessages[conversationId] || false;
  const cursor = cursors[conversationId];

  // Bloquear acceso para usuarios FAST_CLIENT
  const isFastClient = user?.role === 'FAST_CLIENT';

  useEffect(() => {
    const initConversation = async () => {
      if (!conversationId) return;
      
      // Solo mostrar loader si no hay datos previos
      const existingConversation = conversations.find(c => c.id === conversationId);
      if (!existingConversation) {
        setInitialLoading(true);
      }
      
      setError('');
      
      try {
        await selectConversation(conversationId);
      } catch (err) {
        console.error('Error cargando conversación:', err);
        setError('No se pudo cargar la conversación');
      } finally {
        setInitialLoading(false);
      }
    };

    initConversation();

    // Cleanup al desmontar
    return () => {
      selectConversation(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, selectConversation]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(conversationId, content);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      setError('No se pudo enviar el mensaje. Por favor intenta de nuevo.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleLoadMore = async () => {
    if (cursor) {
      await loadMessages(conversationId, cursor);
    }
  };

  const handleBack = () => {
    router.push('/chat');
  };

  if (initialLoading && !conversation) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] p-8">
        <div className="text-center max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudo encontrar la conversación. Es posible que haya sido eliminada.
            </AlertDescription>
          </Alert>
          <Button onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a conversaciones
          </Button>
        </div>
      </div>
    );
  }

  const sidebar = (
    <ConversationList
      conversations={conversations}
      loading={loading}
      selectedId={conversationId}
      onSelectConversation={(id) => router.push(`/chat/${id}`)}
      onNewChat={() => router.push('/chat')}
    />
  );

  const main = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ConversationHeader
        conversation={conversation}
        onBack={handleBack}
        showBackButton={true}
      />

      {/* Alertas */}
      <div className="flex-shrink-0">
        {error && (
          <div className="mx-4 mt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {!isConnected && (
          <div className="mx-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Desconectado. Los mensajes nuevos no se recibirán en tiempo real.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Mensajes */}
      <MessageList
        messages={messages}
        loading={loading && messages.length === 0}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        otherUserName={conversation.otherUser.name}
      />

      {/* Compositor */}
      <MessageComposer
        onSend={handleSendMessage}
        disabled={!isConnected}
      />
    </div>
  );

  // Mostrar mensaje de acceso denegado para FAST_CLIENT
  if (isFastClient) {
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

  return (
    <ChatLayout 
      sidebar={sidebar} 
      main={main}
      showSidebar={true}
    />
  );
}
