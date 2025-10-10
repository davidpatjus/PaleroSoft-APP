# Guía de Integración Frontend — Chat 1 a 1

Esta guía explica cómo integrar el módulo de Chat 1-a-1 desde el frontend: autenticación, endpoints REST, tokens para Supabase Realtime, manejo de paginación y lectura de mensajes, y buenas prácticas.

## Índice
- Autenticación y Tokens
- Endpoints REST (contratos exactos)
- Paginación y cursores
- Marcar mensajes como leídos (read receipts)
- Realtime con Supabase (suscripciones)
- Estados y errores comunes
- Snippets de uso (fetch/React)
- Recomendaciones

---

## Autenticación y Tokens

- Todos los endpoints están protegidos con JWT.
- Debes enviar `Authorization: Bearer <JWT>` en cada petición.
- Para Realtime (WebSocket) generamos un token específico de Supabase.

Obtener token Realtime y configuración:
```http
GET /api/chat/supabase-token
GET /api/chat/supabase-config
```
Respuesta de `supabase-token`:
```json
{
  "accessToken": "<jwt-supabase>",
  "expiresAt": "2025-10-09T...",
  "userId": "<uuid-usuario>"
}
```
Respuesta de `supabase-config` (resumen):
```json
{
  "url": "https://...supabase.co",
  "anonKey": "...",
  "realtime": { "token": "<jwt-supabase>", "expiresAt": "..." }
}
```

---

## Endpoints REST
Base path: `/api/chat`

1) Crear u obtener conversación 1-a-1
```http
POST /api/chat/conversations
Authorization: Bearer <JWT>
Content-Type: application/json
{
  "recipientId": "<uuid-destinatario>",
  "initialMessage": "(opcional)"
}
```
Respuesta:
```json
{
  "id": "<uuid>",
  "userOneId": "<uuid>",
  "userTwoId": "<uuid>",
  "lastMessageAt": "2025-10-09T...",
  "lastMessagePreview": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

2) Listar conversaciones del usuario (con paginación simple)
```http
GET /api/chat/conversations?limit=20&offset=0
Authorization: Bearer <JWT>
```
Respuesta (array): `ConversationWithParticipant[]`
```json
[
  {
    "id": "<uuid>",
    "otherUser": { "id": "<uuid>", "name": "...", "email": "...", "role": "CLIENT" },
    "lastMessageAt": "2025-10-09T...",
    "lastMessagePreview": "...",
    "unreadCount": 3,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

3) Obtener conversación por ID
```http
GET /api/chat/conversations/:id
Authorization: Bearer <JWT>
```

4) Enviar mensaje
```http
POST /api/chat/messages
Authorization: Bearer <JWT>
Content-Type: application/json
{
  "conversationId": "<uuid>",
  "content": "Texto del mensaje"
}
```
Respuesta:
```json
{
  "message": {
    "id": "<uuid>",
    "conversationId": "<uuid>",
    "senderId": "<uuid>",
    "content": "...",
    "sentAt": "2025-10-09T...",
    "deliveredAt": null,
    "readAt": null
  },
  "conversation": { "id": "<uuid>", "lastMessageAt": "...", "lastMessagePreview": "..." }
}
```

5) Obtener mensajes de una conversación (cursor-based)
```http
GET /api/chat/conversations/:id/messages?limit=20&cursor=<iso-date|uuid>
Authorization: Bearer <JWT>
```
Respuesta:
```json
{
  "messages": [
    {
      "id": "<uuid>",
      "conversationId": "<uuid>",
      "senderId": "<uuid>",
      "content": "...",
      "sentAt": "2025-10-09T...",
      "deliveredAt": null,
      "readAt": null,
      "sender": { "id": "<uuid>", "name": "...", "email": "..." },
      "isMine": true
    }
  ],
  "hasMore": true
}
```

6) Marcar mensajes como leídos
```http
PATCH /api/chat/messages/mark-read
Authorization: Bearer <JWT>
Content-Type: application/json
{
  "conversationId": "<uuid>",
  "messageIds": ["<uuid>", "<uuid>"] // opcional: si no se envía, marca todos los no leídos recibidos
}
```
Respuesta:
```json
{ "success": true, "count": 2 }
```

7) Health check
```http
GET /api/chat/health
```

---

## Paginación y cursores
- Conversaciones: soporta `limit` y `offset` simples.
- Mensajes: cursor-based con `cursor` y `limit` (se ordena por `sentAt` desc y se trae `limit+1` para saber si hay más).
- Recomendación: al hacer scroll up, usar el `cursor` del último mensaje recibido para cargar más.

---

## Marcar mensajes como leídos (read receipts)
- Solo se marcan como leídos los mensajes que:
  - Son de la conversación indicada
  - NO fueron enviados por el usuario actual
  - Tienen `readAt = NULL`
- Si envías `messageIds`, sólo se marcarán esos IDs (si cumplen las condiciones).
- Si no envías `messageIds`, se marcarán todos los no leídos recibidos en esa conversación.

Flujo recomendado:
1. Al abrir una conversación, llamar a `PATCH /messages/mark-read` sin `messageIds`.
2. Si quieres granularidad (por ejemplo, batch tras viewport), enviar `messageIds` específicos.

Edge cases:
- Si marcas 0 mensajes puede ser porque:
  - El mensaje fue enviado por ti mismo
  - Ya estaba marcado como leído
  - El `messageId` no pertenece a esa conversación

---

## Realtime con Supabase
1. Obtener config y token con `/supabase-config` y `/supabase-token`.
2. Inicializar cliente Supabase en frontend con `url` y `anonKey`.
3. Conectar a canales Realtime (sugerencia de canal por conversación):
   - Canal: `realtime:conversations:<conversationId>`
   - Escuchar eventos `INSERT` en `messages` para nuevos mensajes
   - Escuchar `UPDATE` en `messages` para `readAt` y `deliveredAt`

Ejemplo conceptual (pseudo-código):
```ts
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${supabaseToken}` } }
});

const channel = supabase.channel(`realtime:conversations:${conversationId}`);
channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
  // push a la lista de mensajes
});

channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
  // actualizar readAt/deliveredAt
});

channel.subscribe();
```

---

## Snippets (fetch/React)

### Fetch (crear conversación y enviar mensaje)
```ts
async function createConversation(recipientId: string, initialMessage?: string) {
  const res = await fetch('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ recipientId, initialMessage })
  });
  if (!res.ok) throw new Error('Error creando conversación');
  return res.json();
}

async function sendMessage(conversationId: string, content: string) {
  const res = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ conversationId, content })
  });
  if (!res.ok) throw new Error('Error enviando mensaje');
  return res.json();
}
```

### React (lista con paginación por cursor)
```tsx
function useMessages(conversationId: string) {
  const [items, setItems] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (cursor) qs.set('cursor', cursor);
    qs.set('limit', '20');
    const res = await fetch(`/api/chat/conversations/${conversationId}/messages?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    const data = await res.json();
    setHasMore(data.hasMore);
    setItems((prev) => [...prev, ...data.messages.reverse()]);
    const last = data.messages[data.messages.length - 1];
    if (last) setCursor(last.sentAt);
    setLoading(false);
  };

  return { items, hasMore, load, loading };
}
```

---

## Recomendaciones
- Mantén un único canal Realtime por conversación abierta para reducir consumo.
- Cierra (unsubscribe) canales al cambiar de conversación o desmontar la vista.
- Marca leídos al ver el hilo; evita marcar indiscriminadamente todo al abrir la app.
- Usa `cursor` para paginar hacia atrás de manera eficiente.
- Maneja reconexiones y reintentos en Realtime (expones un `health` en `/api/chat/health`).
- Almacena en cache (RTK Query/React Query) para mejorar UX y reducir llamadas.

---

¿Necesitas ejemplos con una librería específica (React Query, RTK Query, Vue, Angular)? Puedo adaptar los snippets.
