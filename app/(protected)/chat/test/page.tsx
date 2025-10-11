/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  Plus,
  CheckCheck,
  Check,
  Clock,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002/api";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
  };
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
}

export default function ChatTestPage() {
  // Estados de autenticación
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Estados de Supabase
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Estados de conversaciones y mensajes
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Estados de UI
  const [recipientId, setRecipientId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [initLoading, setInitLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Refs para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Función para hacer scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll cuando llegan nuevos mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1️⃣ Cargar token y obtener usuario actual
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("accessToken");
      if (!savedToken) {
        setError("No hay token de autenticación. Por favor inicia sesión.");
        setInitLoading(false);
        return;
      }

      setToken(savedToken);

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (!response.ok) throw new Error("Error obteniendo usuario");

        const user = await response.json();
        setUserId(user.id);
        setUserName(user.name || user.email);
        console.log("✅ Usuario autenticado:", user);
      } catch (err) {
        console.error("❌ Error obteniendo usuario:", err);
        setError("Error obteniendo usuario actual");
      } finally {
        setInitLoading(false);
      }
    };

    initAuth();
  }, []);

  // 2️⃣ Inicializar conexión Supabase Realtime
  useEffect(() => {
    if (!token || !userId) return;

    const connectSupabase = async () => {
      try {
        console.log("🔑 Solicitando token de Supabase Realtime...");

        const response = await fetch(`${API_BASE_URL}/chat/supabase-token`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Error obteniendo token de Supabase");

        const data = await response.json();
        const realtimeToken = data.accessToken;

        console.log("✅ Token de Supabase obtenido");

        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: { persistSession: false },
            realtime: { params: { eventsPerSecond: 10 } },
          }
        );

        await client.realtime.setAuth(realtimeToken);
        client.realtime.connect();

        // client.realtime.onClose(() => console.log('❌ Realtime cerrado'));
        // client.realtime.onError((e) => console.error('⚠️ Error Realtime:', e));

        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log(client.realtime.channels);
        const connected = client.realtime.isConnected();
        setIsConnected(connected);

        if (connected) {
          console.log("✅ Conectado a Supabase Realtime");
        } else {
          console.error("❌ No se pudo conectar a Supabase Realtime");
          setError("Error conectando a Realtime");
        }

        setSupabase(client);
      } catch (err) {
        console.error("❌ Error inicializando Supabase:", err);
        setError("Error inicializando Realtime");
      }
    };

    connectSupabase();

    return () => {
      supabase?.removeAllChannels();
    };
  }, [token, userId]);

  // 🔄 Monitor del estado del WebSocket cada 5 segundos
  useEffect(() => {
    if (!supabase) return;

    console.log("🔄 Iniciando monitor de estado WebSocket...");
    console.log("📌 Estado inicial:", {
      supabaseExists: !!supabase,
      selectedConversation: selectedConversationId || "ninguna",
      isConnectedState: isConnected,
    });

    const intervalId = setInterval(() => {
      const connected = supabase.realtime.isConnected();
      const channels = supabase.realtime.channels;
      const channelCount = channels.length;

      console.log("📊 Estado WebSocket:", {
        connected,
        channelCount,
        selectedConversation: selectedConversationId || "ninguna",
        channels: channels.map((ch) => ({
          topic: ch.topic,
          state: ch.state,
          joinRef: ch.presence,
        })),
        timestamp: new Date().toLocaleTimeString(),
      });

      // Actualizar estado de conexión en la UI
      setIsConnected(connected);

      // Si no está conectado, intentar reconectar
      if (!connected) {
        console.warn("⚠️ WebSocket desconectado. Intentando reconectar...");
        supabase.realtime.connect();
      }
    }, 5000); // Cada 5 segundos

    return () => {
      console.log("🛑 Deteniendo monitor de estado WebSocket");
      clearInterval(intervalId);
    };
  }, [supabase, selectedConversationId, isConnected]);

  // 3️⃣ Cargar conversaciones
  const loadConversations = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations?limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Error cargando conversaciones");

      const convs = await response.json();
      setConversations(convs);
      console.log("📋 Conversaciones cargadas:", convs.length);
    } catch (err) {
      console.error("❌ Error cargando conversaciones:", err);
    }
  };

  useEffect(() => {
    if (token && userId) {
      loadConversations();
    }
  }, [token, userId]);

  // 4️⃣ Cargar mensajes de una conversación
  const loadMessages = async (conversationId: string) => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/messages?limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error("Error cargando mensajes");

      const data = await response.json();
      setMessages(data.messages.reverse());
      console.log("💬 Mensajes cargados:", data.messages.length);

      // Marcar como leídos
      await fetch(`${API_BASE_URL}/chat/messages/mark-read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId }),
      });
    } catch (err) {
      console.error("❌ Error cargando mensajes:", err);
    } finally {
      setLoading(false);
    }
  };

  // 5️⃣ Suscribirse a eventos de una conversación
  useEffect(() => {
    console.log("🔍 Verificando condiciones para suscripción:", {
      hasSupabase: !!supabase,
      hasConversationId: !!selectedConversationId,
      isConnectedToWS: isConnected,
      conversationId: selectedConversationId,
    });

    if (!supabase || !selectedConversationId || !isConnected) {
      console.log("⏸️ Suscripción no iniciada - falta alguna condición");
      return;
    }

    console.log(
      "🔌 INICIANDO suscripción a conversación:",
      selectedConversationId
    );

    const channel = supabase
      .channel(`conversation:${selectedConversationId}`, {
        config: { broadcast: { ack: true }, presence: { key: userId } },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          console.log("📡 Evento INSERT recibido:", {
            messageId: payload.new.id,
            senderId: payload.new.sender_id,
            content: payload.new.content?.slice(0, 50),
          });

          const msg = payload.new as Message;

          // Evitar duplicados si ya existe
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === msg.id);
            if (exists) {
              console.log("⚠️ Mensaje duplicado ignorado:", msg.id);
              return prev;
            }
            console.log("✅ Mensaje agregado a la UI:", msg.id);
            return [...prev, msg];
          });

          // Refrescar lista de conversaciones
          loadConversations();

          // Marcar como leído si el mensaje no es mío
          if (msg.sender_id !== userId && token) {
            console.log("📖 Marcando mensaje como leído");
            fetch(`${API_BASE_URL}/chat/messages/mark-read`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ conversationId: selectedConversationId }),
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          console.log("📡 Evento UPDATE recibido:", {
            messageId: payload.new.id,
            readAt: payload.new.read_at,
          });

          const msg = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
        }
      )
      .subscribe((status) => {
        console.log("📶 Estado del canal:", status);
        if (status === "SUBSCRIBED") {
          console.log(
            "✅ ¡SUSCRIPCIÓN EXITOSA! Canal:",
            `conversation:${selectedConversationId}`
          );
          console.log(
            "📊 Canales activos después de suscripción:",
            supabase.realtime.channels.length
          );
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Error en el canal");
        } else if (status === "TIMED_OUT") {
          console.warn("⚠️ Tiempo de espera agotado. Reintentando...");
        } else if (status === "CLOSED") {
          console.warn("🔴 Canal cerrado");
        }
      });

    console.log("✅ Canal configurado, esperando estado SUBSCRIBED...");

    return () => {
      console.log(
        "🔌 Desuscribiéndose de conversación:",
        selectedConversationId
      );
      console.log(
        "📊 Canales antes de remover:",
        supabase.realtime.channels.length
      );
      supabase.removeChannel(channel);
      console.log(
        "📊 Canales después de remover:",
        supabase.realtime.channels.length
      );
    };
  }, [supabase, selectedConversationId, isConnected, userId, token]);

  // 6️⃣ Crear nueva conversación
  const createConversation = async () => {
    if (!recipientId.trim() || !token) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: recipientId.trim() }),
      });

      if (!response.ok) throw new Error("Error creando conversación");

      const newConv = await response.json();
      console.log("✅ Conversación creada:", newConv.id);
      setSelectedConversationId(newConv.id);
      await loadConversations();
      await loadMessages(newConv.id);
      setRecipientId("");
    } catch (err) {
      console.error("❌ Error creando conversación:", err);
      setError("Error creando conversación");
    } finally {
      setLoading(false);
    }
  };

  // 7️⃣ Enviar mensaje
  const sendMessage = async () => {
    if (!newMessage.trim() || !token || !selectedConversationId) return;

    setLoading(true);
    setIsTyping(false);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error("Error enviando mensaje");

      const data = await response.json();
      console.log("✅ Mensaje enviado:", data.message.id);
      setNewMessage("");

      // Hacer foco en el input después de enviar
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
      setError("Error enviando mensaje");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Función para formatear fecha
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  // Función para formatear hora del mensaje
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Conversaciones filtradas
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.otherUser.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Obtener conversación seleccionada
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  if (initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Inicializando chat...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-background via-background to-muted/20">
      {/* Panel izquierdo: Lista de conversaciones */}
      <div className="w-96 border-r border-border bg-background flex flex-col">
        {/* Header del panel de conversaciones */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-sm">{userName}</h2>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isConnected ? "En línea" : "Desconectado"}
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={() => setRecipientId("")}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Modal para nueva conversación */}
        {recipientId === "" && (
          <div className="p-4 bg-muted/50 border-b border-border">
            <div className="flex gap-2">
              <Input
                placeholder="ID del destinatario"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="h-10"
                autoFocus
              />
              <Button
                onClick={createConversation}
                disabled={loading || !recipientId.trim()}
                size="sm"
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Crear"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de conversaciones */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {searchQuery
                  ? "No se encontraron conversaciones"
                  : "No hay conversaciones"}
              </p>
              <p className="text-xs text-muted-foreground">
                Crea una nueva conversación para comenzar
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                    selectedConversationId === conv.id ? "bg-muted" : ""
                  }`}
                  onClick={() => {
                    setSelectedConversationId(conv.id);
                    loadMessages(conv.id);
                  }}
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                      {getInitials(conv.otherUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {conv.otherUser.name}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatMessageTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {conv.lastMessagePreview}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-5 min-w-[20px] px-1.5 text-xs rounded-full bg-primary">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Panel derecho: Chat activo */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedConversationId ? (
          /* Estado vacío: No hay conversación seleccionada */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Chat en Tiempo Real</h2>
              <p className="text-muted-foreground mb-6">
                Selecciona una conversación para comenzar a chatear o crea una
                nueva
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                <span>
                  {isConnected
                    ? "Conectado a Supabase Realtime"
                    : "Desconectado"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header del chat */}
            <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                    {selectedConversation
                      ? getInitials(selectedConversation.otherUser.name)
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">
                    {selectedConversation?.otherUser.name || "Cargando..."}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation?.otherUser.email || ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-9 w-9">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9">
                  <Video className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mensajes de error */}
            {error && (
              <div className="mx-6 mt-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Área de mensajes */}
            <ScrollArea className="flex-1 px-6 py-4">
              {loading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No hay mensajes aún. ¡Inicia la conversación!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {messages.map((msg, index) => {
                    const isMine = msg.sender_id === userId;
                    const showAvatar =
                      !isMine &&
                      (index === 0 ||
                        messages[index - 1].sender_id !== msg.sender_id);
                    const isLastInGroup =
                      index === messages.length - 1 ||
                      messages[index + 1].sender_id !== msg.sender_id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${
                          isMine ? "justify-end" : "justify-start"
                        } ${!showAvatar && !isMine ? "ml-10" : ""}`}
                      >
                        {!isMine && showAvatar && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/60 to-primary/40 text-primary-foreground">
                              {selectedConversation
                                ? getInitials(
                                    selectedConversation.otherUser.name
                                  )
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`flex flex-col ${
                            isMine ? "items-end" : "items-start"
                          } max-w-[70%]`}
                        >
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            } ${
                              !isLastInGroup
                                ? isMine
                                  ? "rounded-br-2xl"
                                  : "rounded-bl-2xl"
                                : ""
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1 mt-1 px-2 ${
                              isMine ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            <span className="text-xs text-muted-foreground">
                              {formatTime(msg.sent_at)}
                            </span>
                            {isMine && (
                              <span className="text-muted-foreground">
                                {msg.read_at ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-primary" />
                                ) : msg.delivered_at ? (
                                  <CheckCheck className="h-3.5 w-3.5" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input de mensaje */}
            <div className="border-t border-border bg-card p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      setIsTyping(e.target.value.length > 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={loading}
                    className="pr-12 h-11 resize-none bg-muted/50 border-0 focus-visible:ring-1"
                  />
                  {isTyping && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
                    </div>
                  )}
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-full"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 px-1">
                Presiona Enter para enviar • Shift + Enter para nueva línea
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
