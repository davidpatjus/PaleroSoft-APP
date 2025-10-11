"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  getSupabaseClient, 
  setSupabaseAuth, 
  connectRealtime, 
  disconnectRealtime,
  isRealtimeConnected,
  removeAllChannels 
} from '@/lib/supabase';
import { 
  apiClient, 
  Conversation,
  ConversationWithParticipant, 
  Message, 
  PaginatedMessages,
  SupabaseTokenResponse 
} from '@/lib/api';
import { useAuth } from './AuthContext';

interface ChatContextType {
  // Estado de conexión
  isConnected: boolean;
  isInitializing: boolean;
  
  // Conversaciones
  conversations: ConversationWithParticipant[];
  loadingConversations: boolean;
  selectedConversationId: string | null;
  
  // Mensajes
  messagesByConversation: Record<string, Message[]>;
  loadingMessages: Record<string, boolean>;
  hasMoreMessages: Record<string, boolean>;
  cursors: Record<string, string | undefined>;
  
  // Acciones
  selectConversation: (conversationId: string | null) => void;
  loadConversations: () => Promise<void>;
  createConversation: (recipientId: string, initialMessage?: string) => Promise<Conversation | null>;
  loadMessages: (conversationId: string, cursor?: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markConversationRead: (conversationId: string, messageIds?: string[]) => Promise<void>;
  refreshConversations: () => Promise<void>;
  
  // Utilidades
  getUnreadCount: (conversationId: string) => number;
  searchConversations: (query: string) => ConversationWithParticipant[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Log cuando el usuario cambia
  useEffect(() => {
    if (user) {
      console.log('👤 ChatProvider - Usuario actualizado:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('👤 ChatProvider - No hay usuario');
    }
  }, [user]);
  
  // Estado de conexión
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [realtimeToken, setRealtimeToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<Date | null>(null);
  
  // Estado de conversaciones y mensajes
  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [hasMoreMessages, setHasMoreMessages] = useState<Record<string, boolean>>({});
  const [cursors, setCursors] = useState<Record<string, string | undefined>>({});
  
  // Referencias para canales y polling
  const channelRef = useRef<RealtimeChannel | null>(null);
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  /**
   * Obtiene y configura el token de Supabase Realtime
   */
  const initializeRealtimeAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔑 Obteniendo token de Supabase Realtime...');
      const tokenData: SupabaseTokenResponse = await apiClient.getSupabaseToken();
      
      await setSupabaseAuth(tokenData.accessToken);
      setRealtimeToken(tokenData.accessToken);
      setTokenExpiresAt(new Date(tokenData.expiresAt));
      
      console.log('✅ Token de Supabase configurado', {
        expiresAt: tokenData.expiresAt,
        userId: tokenData.userId,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error obteniendo token de Supabase:', error);
      return false;
    }
  }, []);

  /**
   * Conecta a Supabase Realtime
   */
  const initializeRealtime = useCallback(async () => {
    if (!user) return;
    
    setIsInitializing(true);
    
    try {
      // Obtener token y autenticar
      const success = await initializeRealtimeAuth();
      if (!success) {
        console.error('❌ No se pudo autenticar con Supabase');
        setIsInitializing(false);
        return;
      }
      
      // Conectar
      connectRealtime();
      
      // Esperar un momento para la conexión
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const connected = isRealtimeConnected();
      setIsConnected(connected);
      
      if (connected) {
        console.log('✅ Conectado a Supabase Realtime');
        reconnectAttemptsRef.current = 0;
      } else {
        console.warn('⚠️ No se pudo conectar a Supabase Realtime');
      }
    } catch (error) {
      console.error('❌ Error inicializando Realtime:', error);
      setIsConnected(false);
    } finally {
      setIsInitializing(false);
    }
  }, [user, initializeRealtimeAuth]);

  /**
   * Refresca el token antes de que expire
   */
  const scheduleTokenRefresh = useCallback(() => {
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
    }
    
    if (!tokenExpiresAt) return;
    
    const now = new Date();
    const expiresIn = tokenExpiresAt.getTime() - now.getTime();
    const refreshAt = expiresIn - 60000; // Refrescar 60s antes de expirar
    
    if (refreshAt > 0) {
      console.log(`⏰ Token se refrescará en ${Math.round(refreshAt / 1000)}s`);
      
      tokenRefreshIntervalRef.current = setTimeout(async () => {
        console.log('🔄 Refrescando token de Supabase...');
        await initializeRealtimeAuth();
      }, refreshAt);
    }
  }, [tokenExpiresAt, initializeRealtimeAuth]);

  /**
   * Intenta reconectar con backoff exponencial
   */
  const attemptReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectAttemptsRef.current += 1;
    const backoff = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    
    console.log(`🔄 Reintentando conexión en ${backoff / 1000}s (intento ${reconnectAttemptsRef.current})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      initializeRealtime();
    }, backoff);
  }, [initializeRealtime]);

  /**
   * Monitor de estado de conexión
   */
  useEffect(() => {
    if (!user || isInitializing) return;
    
    const intervalId = setInterval(() => {
      const connected = isRealtimeConnected();
      
      if (connected !== isConnected) {
        setIsConnected(connected);
        console.log(`📊 Estado de conexión cambió: ${connected ? 'Conectado' : 'Desconectado'}`);
        
        if (!connected && user) {
          attemptReconnect();
        }
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [user, isConnected, isInitializing, attemptReconnect]);

  /**
   * Inicialización al montar y cuando cambia el usuario
   */
  useEffect(() => {
    if (user) {
      initializeRealtime();
    } else {
      // Limpiar al desloguearse
      disconnectRealtime();
      removeAllChannels();
      setIsConnected(false);
      setConversations([]);
      setMessagesByConversation({});
      setSelectedConversationId(null);
    }
    
    return () => {
      if (tokenRefreshIntervalRef.current) {
        clearTimeout(tokenRefreshIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, initializeRealtime]);

  /**
   * Programar refresh de token
   */
  useEffect(() => {
    if (tokenExpiresAt && user) {
      scheduleTokenRefresh();
    }
  }, [tokenExpiresAt, user, scheduleTokenRefresh]);

  /**
   * Carga las conversaciones del usuario
   */
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    setLoadingConversations(true);
    try {
      const convs = await apiClient.listConversations({ limit: 50 });
      setConversations(convs);
      console.log('📋 Conversaciones cargadas:', convs.length);
    } catch (error) {
      console.error('❌ Error cargando conversaciones:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  /**
   * Refresca la lista de conversaciones (alias para consistencia)
   */
  const refreshConversations = loadConversations;

  /**
   * Carga inicial de conversaciones
   */
  useEffect(() => {
    if (user && !isInitializing) {
      loadConversations();
    }
  }, [user, isInitializing, loadConversations]);

  /**
   * Carga mensajes de una conversación
   */
  const loadMessages = useCallback(async (conversationId: string, cursor?: string) => {
    setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
    
    try {
      const data: PaginatedMessages = await apiClient.getMessages(conversationId, {
        limit: 30,
        cursor,
      });
      
      console.log(`📥 Mensajes cargados: ${data.messages.length}, hasMore: ${data.hasMore}`);
      
      // Ordenar mensajes por fecha (más antiguos primero)
      const sortedMessages = data.messages.sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
      
      setMessagesByConversation(prev => ({
        ...prev,
        [conversationId]: cursor 
          ? [...(prev[conversationId] || []), ...sortedMessages]
          : sortedMessages,
      }));
      
      setHasMoreMessages(prev => ({ ...prev, [conversationId]: data.hasMore }));
      
      if (data.messages.length > 0) {
        const lastMessage = data.messages[data.messages.length - 1];
        setCursors(prev => ({ ...prev, [conversationId]: lastMessage.sentAt }));
      }
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
      throw error;
    } finally {
      setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
    }
  }, []);

  /**
   * Crea una nueva conversación
   */
  const createConversation = useCallback(async (
    recipientId: string,
    initialMessage?: string
  ): Promise<Conversation | null> => {
    try {
      const conv = await apiClient.createConversation({ recipientId, initialMessage });
      console.log('✅ Conversación creada:', conv.id);
      
      // Recargar lista de conversaciones
      await loadConversations();
      
      return conv;
    } catch (error) {
      console.error('❌ Error creando conversación:', error);
      return null;
    }
  }, [loadConversations]);

  /**
   * Envía un mensaje con optimistic update
   */
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!content.trim() || !user) {
      console.log('⚠️ SendMessage cancelado:', { hasContent: !!content.trim(), hasUser: !!user });
      return;
    }
    
    // Crear mensaje optimista temporal
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // ID temporal único
      conversationId,
      senderId: user.id,
      content: content.trim(),
      sentAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
      isOptimistic: true // Flag para identificar mensajes temporales
    };

    console.log('📤 Agregando mensaje optimista:', {
      id: optimisticMessage.id,
      senderId: optimisticMessage.senderId,
      content: optimisticMessage.content.substring(0, 30)
    });

    // Agregar mensaje inmediatamente al estado (Optimistic UI)
    setMessagesByConversation(prev => {
      const existing = prev[conversationId] || [];
      const updatedMessages = [...existing, optimisticMessage].sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
      
      return {
        ...prev,
        [conversationId]: updatedMessages,
      };
    });
    
    try {
      const response = await apiClient.sendMessage({ 
        conversationId, 
        content: content.trim() 
      });
      
      console.log('✅ Mensaje enviado al servidor:', {
        tempId: optimisticMessage.id,
        realId: response.message.id,
        senderId: response.message.senderId
      });

      // Reemplazar mensaje temporal con el real (cuando llegue por Realtime)
      // Por ahora solo loggeamos, el reemplazo será manejado por Realtime
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }, [user]);

  /**
   * Marca mensajes como leídos
   */
  const markConversationRead = useCallback(async (
    conversationId: string,
    messageIds?: string[]
  ) => {
    try {
      const response = await apiClient.markMessagesRead({ conversationId, messageIds });
      console.log(`📖 Marcados como leídos: ${response.count} mensajes`);
      
      // Actualizar contador local
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - response.count) }
            : conv
        )
      );
    } catch (error) {
      console.error('❌ Error marcando como leídos:', error);
    }
  }, []);

  /**
   * Suscripción a una conversación específica
   */
  useEffect(() => {
    if (!selectedConversationId || !isConnected || !user) {
      // Limpiar canal anterior si existe
      if (channelRef.current) {
        console.log('🔌 Desuscribiendo canal anterior');
        const supabase = getSupabaseClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }
    
    console.log('🔌 Suscribiendo a conversación:', selectedConversationId);
    
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`conversation:${selectedConversationId}`, {
        config: {
          broadcast: { ack: true },
          presence: { key: user.id },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          // Mapear campos de snake_case a camelCase
          const rawMsg = payload.new;
          const msg: Message = {
            id: rawMsg.id,
            conversationId: rawMsg.conversation_id,
            senderId: rawMsg.sender_id, // ← MAPEO CORRECTO
            content: rawMsg.content,
            sentAt: rawMsg.sent_at,
            deliveredAt: rawMsg.delivered_at,
            readAt: rawMsg.read_at
          };
          
          console.log('📡 Nuevo mensaje recibido:', {
            id: msg.id.substring(0, 8),
            senderId: msg.senderId,
            currentUserId: user.id,
            content: msg.content.substring(0, 30)
          });



          // Si es nuestro mensaje, ignorarlo (ya lo tenemos optimísticamente)
          if (String(msg.senderId) === String(user.id)) {
            console.log('🚫 Ignorando nuestro propio mensaje (optimistic UI)');
            
            // Solo reemplazamos el mensaje temporal con el real
            setMessagesByConversation(prev => {
              const existing = prev[selectedConversationId] || [];
              const updatedMessages = existing.map(existingMsg => {
                if (existingMsg.isOptimistic && 
                    existingMsg.senderId === msg.senderId &&
                    existingMsg.content === msg.content) {
                  console.log('🔄 Reemplazando mensaje temporal con real');
                  return { ...msg, isOptimistic: false };
                }
                return existingMsg;
              });
              
              return {
                ...prev,
                [selectedConversationId]: updatedMessages,
              };
            });
            return;
          }

          setMessagesByConversation(prev => {
            const existing = prev[selectedConversationId] || [];
            
            // Evitar duplicados por ID
            if (existing.some(m => m.id === msg.id)) {
              console.log('⚠️ Mensaje duplicado detectado, ignorando');
              return prev;
            }

            console.log('✅ Agregando mensaje del otro usuario');
            
            // Agregar mensaje al final (más reciente)
            const updatedMessages = [...existing, msg].sort((a, b) => 
              new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            );
            
            return {
              ...prev,
              [selectedConversationId]: updatedMessages,
            };
          });
          
          // Actualizar preview de la conversación
          loadConversations();
          
          // Marcar mensaje del otro usuario como leído
          console.log('📖 Marcando mensaje como leído');
          markConversationRead(selectedConversationId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          console.log('📡 Mensaje actualizado');
          
          // Mapear campos de snake_case a camelCase
          const rawMsg = payload.new;
          const msg: Message = {
            id: rawMsg.id,
            conversationId: rawMsg.conversation_id,
            senderId: rawMsg.sender_id,
            content: rawMsg.content,
            sentAt: rawMsg.sent_at,
            deliveredAt: rawMsg.delivered_at,
            readAt: rawMsg.read_at
          };
          
          setMessagesByConversation(prev => ({
            ...prev,
            [selectedConversationId]: (prev[selectedConversationId] || []).map(m =>
              m.id === msg.id ? msg : m
            ),
          }));
        }
      )
      .subscribe((status) => {
        console.log('📶 Estado del canal:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción exitosa a conversación:', selectedConversationId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en el canal');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Timeout en suscripción');
        }
      });
    
    channelRef.current = channel;
    
    return () => {
      console.log('🔌 Limpiando suscripción de conversación:', selectedConversationId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedConversationId, isConnected, user, loadConversations, markConversationRead]);

  /**
   * Selecciona una conversación y carga sus mensajes
   */
  const selectConversation = useCallback(async (conversationId: string | null) => {
    setSelectedConversationId(conversationId);
    
    if (conversationId && !messagesByConversation[conversationId]) {
      await loadMessages(conversationId);
    }
    
    // Marcar como leídos al abrir
    if (conversationId) {
      await markConversationRead(conversationId);
    }
  }, [messagesByConversation, loadMessages, markConversationRead]);

  /**
   * Obtiene el contador de no leídos de una conversación
   */
  const getUnreadCount = useCallback((conversationId: string): number => {
    const conv = conversations.find(c => c.id === conversationId);
    return conv?.unreadCount || 0;
  }, [conversations]);

  /**
   * Busca conversaciones por nombre o email
   */
  const searchConversations = useCallback((query: string): ConversationWithParticipant[] => {
    if (!query.trim()) return conversations;
    
    const lowerQuery = query.toLowerCase();
    return conversations.filter(conv =>
      conv.otherUser.name.toLowerCase().includes(lowerQuery) ||
      conv.otherUser.email.toLowerCase().includes(lowerQuery)
    );
  }, [conversations]);

  return (
    <ChatContext.Provider
      value={{
        isConnected,
        isInitializing,
        conversations,
        loadingConversations,
        selectedConversationId,
        messagesByConversation,
        loadingMessages,
        hasMoreMessages,
        cursors,
        selectConversation,
        loadConversations,
        createConversation,
        loadMessages,
        sendMessage,
        markConversationRead,
        refreshConversations,
        getUnreadCount,
        searchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
