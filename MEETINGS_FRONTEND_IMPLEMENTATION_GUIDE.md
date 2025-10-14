# 🎥 Guía de Implementación Frontend - Módulo de Reuniones

> **Documentación completa para desarrolladores frontend**  
> Módulo de Videollamadas con Daily.co - PaleroSoft CRM

---

## 📑 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Autenticación y Seguridad](#autenticación-y-seguridad)
4. [API Reference - Endpoints](#api-reference---endpoints)
5. [Flujos de Trabajo Principales](#flujos-de-trabajo-principales)
6. [Estados y Transiciones](#estados-y-transiciones)
7. [Gestión de Participantes](#gestión-de-participantes)
8. [Integración con Daily.co](#integración-con-dailyco)
9. [Manejo de Errores](#manejo-de-errores)
10. [Mejores Prácticas](#mejores-prácticas)
11. [Casos de Uso Comunes](#casos-de-uso-comunes)

---

## 📖 Introducción

### Descripción General

El módulo de reuniones proporciona una solución completa para gestionar videollamadas en el CRM PaleroSoft. Utiliza Daily.co como proveedor de videollamadas y ofrece:

- **Gestión completa de reuniones**: CRUD de reuniones con estados avanzados
- **Control de participantes**: Roles, permisos y seguimiento de asistencia
- **Integración automática**: Creación de salas de videollamada al crear reuniones
- **Actualizaciones en tiempo real**: Webhooks que actualizan estados automáticamente
- **Validaciones robustas**: Prevención de conflictos horarios y validación de datos

### Tecnologías Backend

- **Framework**: NestJS + TypeScript
- **Base de Datos**: PostgreSQL con Drizzle ORM
- **Video API**: Daily.co
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: class-validator

### URL Base del API

```
Desarrollo: http://localhost:3002/api
Producción: https://api.palerosoft.com/api
```

---

## 🏗️ Arquitectura General

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│  (React/Vue/Angular - Gestión de UI y Estado)               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP Requests (JWT Auth)
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    Backend API (NestJS)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Meetings   │  │ Participants │  │   Webhooks   │      │
│  │  Controller  │  │   Service    │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────┬───────┴──────────────────┘              │
│                    │                                         │
│         ┌──────────▼────────────┐                           │
│         │   Meetings Service    │                           │
│         │   (Business Logic)    │                           │
│         └──────────┬────────────┘                           │
└────────────────────┼────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼────────────┐
│  PostgreSQL  │ │ Daily.co│ │  Webhooks     │
│   Database   │ │   API   │ │  (Callbacks)  │
└──────────────┘ └─────────┘ └───────────────┘
```

### Flujo de Datos

1. **Frontend → Backend**: Peticiones HTTP con JWT en header Authorization
2. **Backend → Daily.co**: Creación/eliminación de salas de videollamada
3. **Daily.co → Backend**: Webhooks cuando ocurren eventos (join, leave, etc.)
4. **Backend → Database**: Persistencia y actualización de datos
5. **Frontend ← Backend**: Respuestas JSON con datos actualizados

---

## 🔐 Autenticación y Seguridad

### Headers Requeridos

Todos los endpoints de reuniones y participantes requieren autenticación JWT:

```
Authorization: Bearer {tu_token_jwt}
Content-Type: application/json
```

### Obtención del Token

Primero debes autenticarte en el endpoint de login:

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "tu_password"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario"
  }
}
```

### Información del Usuario Autenticado

El token JWT contiene:
- `sub`: ID del usuario
- `email`: Email del usuario
- `iat`: Timestamp de creación
- `exp`: Timestamp de expiración

El backend automáticamente extrae el ID del usuario del token para:
- Asignar como `createdById` al crear reuniones
- Validar permisos de actualización/eliminación
- Registrar acciones en logs

### Excepciones de Autenticación

**Solo el endpoint de webhooks NO requiere JWT**:
- `POST /api/meetings/webhook` - Usado por Daily.co para callbacks

---

## 📡 API Reference - Endpoints

### 1. Reuniones (Meetings)

#### 1.1 Crear Reunión

**Endpoint**: `POST /api/meetings`  
**Autenticación**: Requerida (JWT)  
**Descripción**: Crea una nueva reunión y automáticamente genera una sala en Daily.co

**Request Body**:
```json
{
  "title": "string (requerido, max 255 caracteres)",
  "description": "string (opcional)",
  "startTime": "ISO 8601 timestamp (requerido)",
  "endTime": "ISO 8601 timestamp (requerido, debe ser > startTime)",
  "projectId": "UUID (opcional)"
}
```

**Validaciones Automáticas**:
- ✅ `endTime` debe ser posterior a `startTime`
- ✅ No debe solaparse con otras reuniones del usuario
- ✅ `createdById` se asigna automáticamente del JWT
- ✅ Se crea sala en Daily.co automáticamente

**Response Success (201)**:
```json
{
  "id": "uuid-de-la-reunion",
  "title": "Sprint Planning",
  "description": "Planificación del sprint",
  "startTime": "2025-10-15T10:00:00Z",
  "endTime": "2025-10-15T11:30:00Z",
  "status": "SCHEDULED",
  "roomUrl": "https://palerosoftware.daily.co/reunion-abc123",
  "dailyRoomName": "reunion-abc123",
  "projectId": "uuid-del-proyecto",
  "createdById": "uuid-del-usuario",
  "createdAt": "2025-10-14T08:00:00Z",
  "updatedAt": "2025-10-14T08:00:00Z"
}
```

**Errores Posibles**:
- `400 Bad Request`: Datos inválidos (fechas, formato)
- `409 Conflict`: Reunión se solapa con otra existente
- `401 Unauthorized`: Token inválido o expirado
- `500 Internal Server Error`: Error al crear sala en Daily.co

**Notas de Implementación**:
- Mostrar un datepicker/timepicker para `startTime` y `endTime`
- Validar en frontend que `endTime > startTime` antes de enviar
- Mostrar mensaje claro si hay solapamiento de horarios
- Guardar el `roomUrl` para redireccionar al usuario a la videollamada

---

#### 1.2 Listar Todas las Reuniones

**Endpoint**: `GET /api/meetings`  
**Autenticación**: Requerida (JWT)  
**Descripción**: Obtiene todas las reuniones del sistema

**Query Parameters**: Ninguno (por ahora)

**Response Success (200)**:
```json
[
  {
    "id": "uuid-1",
    "title": "Sprint Planning",
    "description": "Planificación del sprint",
    "startTime": "2025-10-15T10:00:00Z",
    "endTime": "2025-10-15T11:30:00Z",
    "status": "SCHEDULED",
    "roomUrl": "https://palerosoftware.daily.co/reunion-abc123",
    "dailyRoomName": "reunion-abc123",
    "projectId": "uuid-proyecto",
    "createdById": "uuid-usuario",
    "createdAt": "2025-10-14T08:00:00Z",
    "updatedAt": "2025-10-14T08:00:00Z"
  },
  {
    "id": "uuid-2",
    "title": "Daily Standup",
    "status": "IN_PROGRESS",
    ...
  }
]
```

**Notas de Implementación**:
- Implementar filtros en frontend (por estado, fecha, proyecto)
- Ordenar por `startTime` (próximas primero)
- Agrupar por estado: Próximas, En Progreso, Completadas
- Mostrar indicador visual para reuniones activas (IN_PROGRESS)
- Calcular y mostrar tiempo hasta la reunión

---

#### 1.3 Obtener Reunión Específica

**Endpoint**: `GET /api/meetings/{id}`  
**Autenticación**: Requerida (JWT)  
**Descripción**: Obtiene los detalles de una reunión específica

**Path Parameters**:
- `id`: UUID de la reunión

**Response Success (200)**:
```json
{
  "id": "uuid-de-la-reunion",
  "title": "Sprint Planning",
  "description": "Planificación del sprint",
  "startTime": "2025-10-15T10:00:00Z",
  "endTime": "2025-10-15T11:30:00Z",
  "status": "SCHEDULED",
  "roomUrl": "https://palerosoftware.daily.co/reunion-abc123",
  "dailyRoomName": "reunion-abc123",
  "projectId": "uuid-del-proyecto",
  "createdById": "uuid-del-usuario",
  "createdAt": "2025-10-14T08:00:00Z",
  "updatedAt": "2025-10-14T08:00:00Z"
}
```

**Errores Posibles**:
- `404 Not Found`: Reunión no existe
- `401 Unauthorized`: Token inválido

**Notas de Implementación**:
- Usar este endpoint al abrir el detalle de una reunión
- Combinar con `GET /api/meetings/{id}/participants` para vista completa
- Actualizar cada 30-60 segundos si la reunión está `IN_PROGRESS`

---

#### 1.4 Actualizar Reunión

**Endpoint**: `PATCH /api/meetings/{id}`  
**Autenticación**: Requerida (JWT)  
**Descripción**: Actualiza los datos de una reunión existente

**Path Parameters**:
- `id`: UUID de la reunión

**Request Body** (todos los campos opcionales):
```json
{
  "title": "string (opcional)",
  "description": "string (opcional)",
  "startTime": "ISO 8601 timestamp (opcional)",
  "endTime": "ISO 8601 timestamp (opcional)",
  "status": "enum (opcional)"
}
```

**Estados Válidos**:
- `SCHEDULED`: Programada
- `WAITING_ROOM`: En sala de espera
- `IN_PROGRESS`: En progreso
- `COMPLETED`: Completada
- `CANCELLED`: Cancelada
- `FAILED`: Fallida
- `DELETED`: Eliminada (soft delete)

**Response Success (200)**:
```json
{
  "id": "uuid-de-la-reunion",
  "title": "Sprint Planning - ACTUALIZADO",
  "status": "IN_PROGRESS",
  ...resto de campos actualizados
}
```

**Validaciones**:
- Si se actualiza `startTime` o `endTime`, se valida solapamiento
- `endTime` debe ser mayor que `startTime`

**Notas de Implementación**:
- Mostrar modal de confirmación para cambios de estado importantes
- Deshabilitar edición de fechas si la reunión ya empezó
- Mostrar warning al cancelar reunión (preguntar si eliminar sala de Daily.co)

---

#### 1.5 Eliminar Reunión

**Endpoint**: `DELETE /api/meetings/{id}`  
**Autenticación**: Requerida (JWT)  
**Descripción**: Elimina una reunión (soft delete) y la sala de Daily.co

**Path Parameters**:
- `id`: UUID de la reunión

**Response Success (200)**:
```json
{
  "message": "Meeting deleted successfully"
}
```

**Comportamiento**:
- Marca la reunión como `status: DELETED`
- Intenta eliminar la sala en Daily.co
- Los participantes ya no pueden unirse

**Errores Posibles**:
- `404 Not Found`: Reunión no existe
- `403 Forbidden`: Usuario no es creador de la reunión

**Notas de Implementación**:
- Mostrar modal de confirmación con advertencia clara
- Informar que los participantes recibirán notificación (si implementado)
- Ofrecer opción de "Cancelar" en lugar de "Eliminar" si solo se quiere desactivar

---

### 2. Participantes (Participants)

#### 2.1 Agregar Participantes

**Endpoint**: `POST /api/meetings/{id}/participants`  
**Autenticación**: Requerida (JWT)  
**Descripción**: Agrega uno o más participantes a una reunión

**Path Parameters**:
- `id`: UUID de la reunión

**Request Body**:
```json
{
  "userIds": ["uuid-1", "uuid-2", "uuid-3"],
  "role": "attendee | moderator | host"
}
```

**Roles Disponibles**:
- `host`: Anfitrión (control total de la reunión)
- `moderator`: Moderador (puede silenciar, expulsar participantes)
- `attendee`: Asistente (participación estándar)

**Response Success (201)**:
```json
[
  {
    "id": "uuid-participante-1",
    "meetingId": "uuid-reunion",
    "userId": "uuid-usuario-1",
    "role": "attendee",
    "status": "invited",
    "joinedAt": null,
    "leftAt": null,
    "createdAt": "2025-10-14T08:00:00Z"
  },
  {
    "id": "uuid-participante-2",
    "meetingId": "uuid-reunion",
    "userId": "uuid-usuario-2",
    "role": "attendee",
    "status": "invited",
    ...
  }
]
```

**Validaciones**:
- Todos los `userIds` deben existir en la base de datos
- No se pueden agregar usuarios duplicados
- La reunión debe existir

**Errores Posibles**:
- `404 Not Found`: Reunión o algún usuario no existe
- `409 Conflict`: Usuario ya es participante

**Notas de Implementación**:
- Implementar selector múltiple de usuarios (dropdown con búsqueda)
- Mostrar avatares de usuarios seleccionados
- Permitir agregar participantes incluso después de iniciada la reunión
- Considerar enviar notificaciones (email/push) a usuarios agregados

---

#### 2.2 Listar Participantes

**Endpoint**: `GET /api/meetings/{id}/participants`  
**Autenticación**: Requerida (JWT)  
**Descripción**: Obtiene todos los participantes de una reunión

**Path Parameters**:
- `id`: UUID de la reunión

**Response Success (200)**:
```json
[
  {
    "id": "uuid-participante",
    "meetingId": "uuid-reunion",
    "userId": "uuid-usuario",
    "role": "host",
    "status": "joined",
    "joinedAt": "2025-10-15T10:02:00Z",
    "leftAt": null,
    "createdAt": "2025-10-14T08:00:00Z"
  },
  {
    "id": "uuid-participante-2",
    "userId": "uuid-usuario-2",
    "role": "attendee",
    "status": "invited",
    "joinedAt": null,
    "leftAt": null,
    ...
  }
]
```

**Estados de Participante**:
- `invited`: Invitado (no se ha unido aún)
- `joined`: Conectado a la reunión
- `left`: Salió de la reunión
- `removed`: Removido por moderador

**Notas de Implementación**:
- Mostrar lista de participantes en la UI de la reunión
- Indicador visual de estado: 🟢 joined, ⚪ invited, 🔴 left
- Mostrar tiempo en reunión: `joinedAt` - `leftAt` o tiempo actual
- Actualizar en tiempo real durante la reunión (polling cada 10-15 segundos)
- Agrupar por estado: Conectados / Invitados / Salieron

---

#### 2.3 Actualizar Participante

**Endpoint**: `PATCH /api/meetings/{id}/participants/{userId}`  
**Autenticación**: Requerida (JWT)  
**Descripción**: Actualiza el rol o estado de un participante

**Path Parameters**:
- `id`: UUID de la reunión
- `userId`: UUID del usuario participante

**Request Body** (al menos uno requerido):
```json
{
  "role": "host | moderator | attendee",
  "status": "invited | joined | left | removed"
}
```

**Response Success (200)**:
```json
{
  "id": "uuid-participante",
  "meetingId": "uuid-reunion",
  "userId": "uuid-usuario",
  "role": "moderator",
  "status": "joined",
  "joinedAt": "2025-10-15T10:02:00Z",
  "leftAt": null,
  "createdAt": "2025-10-14T08:00:00Z"
}
```

**Casos de Uso**:
- Promover asistente a moderador
- Cambiar host de la reunión
- Marcar participante como removido (expulsado)

**Notas de Implementación**:
- Mostrar opciones de rol en menú contextual (click derecho en participante)
- Solo el host debe poder cambiar roles
- Confirmar antes de expulsar (status = removed)
- No permitir cambiar el estado `joined`/`left` manualmente (se actualiza vía webhooks)

---

#### 2.4 Remover Participante

**Endpoint**: `DELETE /api/meetings/{id}/participants/{userId}`  
**Autenticación**: Requerida (JWT)  
**Descripción**: Remueve un participante de la reunión

**Path Parameters**:
- `id`: UUID de la reunión
- `userId`: UUID del usuario participante

**Response Success (200)**:
```json
{
  "message": "Participant removed successfully"
}
```

**Comportamiento**:
- Elimina el registro del participante
- Si está conectado, debe ser expulsado manualmente de Daily.co
- No puede volver a unirse (a menos que se agregue nuevamente)

**Notas de Implementación**:
- Mostrar confirmación antes de remover
- Considerar usar `PATCH` con `status: removed` en lugar de eliminar
- Enviar notificación al usuario removido

---

### 3. Webhooks (Solo Información)

**Endpoint**: `POST /api/meetings/webhook`  
**Autenticación**: NO requerida (llamado por Daily.co)  
**Descripción**: Recibe eventos automáticos de Daily.co

**Este endpoint NO debe ser llamado por el frontend**. Es utilizado por Daily.co para:

1. **meeting.started**: Actualiza reunión a `IN_PROGRESS`
2. **meeting.ended**: Actualiza reunión a `COMPLETED`
3. **participant.joined**: Actualiza participante a `joined` con timestamp
4. **participant.left**: Actualiza participante a `left` con timestamp

**Implicaciones para Frontend**:
- No necesitas llamar manualmente para actualizar estados durante la reunión
- Implementa polling o WebSockets para obtener cambios en tiempo real
- Confía en que los estados se actualizarán automáticamente
- Refresca la lista de participantes periódicamente para ver cambios

---

## 🔄 Flujos de Trabajo Principales

### Flujo 1: Crear y Programar una Reunión

**Pasos**:

1. **Usuario abre formulario** "Nueva Reunión"
   - Campos: título, descripción, fecha inicio, fecha fin, proyecto (opcional)

2. **Frontend valida datos**
   - `endTime > startTime`
   - Fecha no en el pasado
   - Título no vacío

3. **Frontend envía** `POST /api/meetings`
   - Incluye JWT en header
   - Muestra loading/spinner

4. **Backend procesa**
   - Valida JWT y extrae usuario
   - Valida solapamiento de horarios
   - Crea sala en Daily.co
   - Guarda en base de datos

5. **Backend responde**
   - Success: Retorna reunión con `roomUrl`
   - Error: Mensaje de error específico

6. **Frontend muestra resultado**
   - Success: Redirige a vista de detalle, muestra mensaje de éxito
   - Error: Muestra mensaje de error (ej: "Se solapa con otra reunión")

7. **Usuario agrega participantes** (opcional)
   - Selecciona usuarios del sistema
   - Asigna roles (host, moderator, attendee)
   - Envía `POST /api/meetings/{id}/participants`

8. **Sistema envía notificaciones** (si implementado)
   - Email con enlace a la reunión
   - Notificación push
   - Agregar a calendario

**Consideraciones UI/UX**:
- Mostrar calendario con reuniones existentes para evitar solapamientos
- Sugerir horarios disponibles
- Pre-rellenar campo "proyecto" si viene desde vista de proyecto
- Botón "Copiar enlace de reunión" para compartir `roomUrl`

---

### Flujo 2: Unirse a una Reunión

**Pasos**:

1. **Usuario ve lista de reuniones**
   - `GET /api/meetings` para obtener reuniones
   - Filtrar por estado `SCHEDULED` o `IN_PROGRESS`
   - Mostrar próximas primero

2. **Usuario hace clic en "Unirse"**
   - Verificar que es participante: `GET /api/meetings/{id}/participants`
   - Verificar que reunión está en estado `SCHEDULED` o `IN_PROGRESS`

3. **Frontend obtiene `roomUrl`**
   - Desde el objeto de reunión: `meeting.roomUrl`
   - Ejemplo: `https://palerosoftware.daily.co/reunion-abc123`

4. **Frontend integra Daily.co**
   - Opción A: Iframe embebido en la aplicación
   - Opción B: Abrir en nueva ventana/pestaña
   - Opción C: Usar Daily.co React/Vue components

5. **Usuario se conecta a videollamada**
   - Daily.co maneja toda la lógica de video/audio
   - Usuario puede ver/escuchar otros participantes

6. **Daily.co envía webhook** al backend
   - `participant.joined` → Backend actualiza estado a `joined`
   - Frontend puede polling `GET /api/meetings/{id}/participants` para ver quién está conectado

7. **Usuario sale de la reunión**
   - Cierra ventana o hace clic en "Salir"
   - Daily.co envía webhook `participant.left`
   - Backend actualiza estado y timestamp

**Consideraciones UI/UX**:
- Botón "Unirse" solo visible si usuario es participante
- Deshabilitar si reunión no ha empezado (mostrar countdown)
- Mostrar mensaje si reunión ya terminó
- Pre-flight check: verificar permisos de cámara/micrófono
- Mostrar participantes conectados en tiempo real

---

### Flujo 3: Gestionar Participantes Durante Reunión

**Pasos**:

1. **Host abre panel de participantes**
   - Durante la reunión activa
   - `GET /api/meetings/{id}/participants`

2. **Sistema muestra lista actualizada**
   - Participantes conectados (🟢 joined)
   - Participantes invitados no conectados (⚪ invited)
   - Participantes que salieron (🔴 left)

3. **Host puede agregar más participantes**
   - Botón "Agregar participante"
   - Selector de usuarios
   - `POST /api/meetings/{id}/participants`

4. **Host puede cambiar roles**
   - Click en participante → Menú contextual
   - Opciones: "Hacer moderador", "Hacer host", "Degradar a asistente"
   - `PATCH /api/meetings/{id}/participants/{userId}`

5. **Host puede expulsar participante**
   - Click en participante → "Expulsar"
   - Confirmación: "¿Estás seguro?"
   - `DELETE /api/meetings/{id}/participants/{userId}` o `PATCH` con `status: removed`

6. **Sistema actualiza en tiempo real**
   - Polling cada 10-15 segundos para obtener cambios
   - Mostrar notificación cuando alguien se une/sale
   - Actualizar contadores (ej: "3 de 5 participantes conectados")

**Consideraciones UI/UX**:
- Solo host puede agregar/remover/cambiar roles
- Moderators pueden solo silenciar/ver lista
- Mostrar tiempo de conexión de cada participante
- Indicador de quien está hablando (si Daily.co lo provee)
- Avatar/foto de perfil de cada participante

---

### Flujo 4: Actualización Automática de Estados

**Proceso Automático** (Sin intervención de frontend):

1. **Reunión programada**
   - Estado inicial: `SCHEDULED`
   - Sala de Daily.co creada

2. **Primer participante se une**
   - Daily.co envía webhook: `meeting.started`
   - Backend actualiza: `status: IN_PROGRESS`

3. **Participantes entran y salen**
   - Cada join: webhook `participant.joined` → actualiza `status: joined`, `joinedAt: timestamp`
   - Cada leave: webhook `participant.left` → actualiza `status: left`, `leftAt: timestamp`

4. **Último participante sale**
   - Daily.co envía webhook: `meeting.ended`
   - Backend actualiza: `status: COMPLETED`

5. **Frontend se mantiene sincronizado**
   - Implementar polling: `GET /api/meetings/{id}` cada 30-60 segundos
   - Actualizar UI según estado actual
   - Mostrar notificación cuando cambie a `IN_PROGRESS` o `COMPLETED`

**Consideraciones**:
- No enviar manualmente cambios a `IN_PROGRESS` o `COMPLETED`
- Confiar en los webhooks de Daily.co
- Implementar fallback: si después de 5 min del `startTime` sigue `SCHEDULED`, mostrar warning

---

### Flujo 5: Cancelar o Eliminar Reunión

**Pasos**:

1. **Usuario abre detalle de reunión**
   - Solo creador puede ver opciones de cancelar/eliminar

2. **Usuario selecciona acción**
   - Opción A: "Cancelar reunión" → Cambiar estado a `CANCELLED`
   - Opción B: "Eliminar reunión" → Soft delete a `DELETED`

3. **Sistema muestra confirmación**
   - Advertencia: "Los participantes no podrán unirse"
   - Pregunta: "¿Notificar a participantes?" (si aplica)

4. **Usuario confirma**
   - Para cancelar: `PATCH /api/meetings/{id}` con `{ "status": "CANCELLED" }`
   - Para eliminar: `DELETE /api/meetings/{id}`

5. **Backend procesa**
   - Actualiza estado en base de datos
   - Intenta eliminar sala de Daily.co
   - Retorna confirmación

6. **Frontend actualiza UI**
   - Muestra mensaje: "Reunión cancelada/eliminada"
   - Redirige a lista de reuniones
   - Actualiza cache/estado global

7. **Sistema notifica participantes** (si implementado)
   - Email: "La reunión fue cancelada"
   - Notificación en app
   - Eliminar de calendario

**Consideraciones UI/UX**:
- Deshabilitar eliminación si reunión está `IN_PROGRESS`
- Mostrar diferentes mensajes para cancelar vs eliminar
- Permitir agregar motivo de cancelación (comentario)
- Mantener historial (soft delete, no hard delete)

---

## 📊 Estados y Transiciones

### Estados de Reunión

| Estado | Descripción | Color Sugerido | Transiciones Permitidas |
|--------|-------------|----------------|------------------------|
| `SCHEDULED` | Programada, no ha iniciado | 🔵 Azul | → IN_PROGRESS (webhook)<br>→ CANCELLED (manual)<br>→ DELETED (manual) |
| `WAITING_ROOM` | En sala de espera | 🟡 Amarillo | → IN_PROGRESS (webhook) |
| `IN_PROGRESS` | En curso actualmente | 🟢 Verde | → COMPLETED (webhook)<br>→ FAILED (manual) |
| `COMPLETED` | Finalizada exitosamente | ⚪ Gris | → (estado final) |
| `CANCELLED` | Cancelada antes de iniciar | 🟠 Naranja | → DELETED (manual) |
| `FAILED` | Falló por error técnico | 🔴 Rojo | → (estado final) |
| `DELETED` | Eliminada (soft delete) | ⚫ Negro | → (estado final) |

### Diagrama de Transiciones

```
                    [SCHEDULED]
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
    [CANCELLED]   [WAITING_ROOM]   [DELETED]
                        │
                        ▼
                  [IN_PROGRESS]
                        │
                   ┌────┴────┐
                   ▼         ▼
              [COMPLETED] [FAILED]
```

### Estados de Participante

| Estado | Descripción | Cuándo Ocurre | Acción Frontend |
|--------|-------------|---------------|----------------|
| `invited` | Invitado, no conectado | Al agregar participante | Mostrar como "Pendiente" |
| `joined` | Conectado a la reunión | Webhook de Daily.co | Mostrar 🟢 indicador verde |
| `left` | Salió de la reunión | Webhook de Daily.co | Mostrar tiempo total en reunión |
| `removed` | Expulsado por moderador | Acción manual | Mostrar como "Removido" en rojo |

### Roles de Participante

| Rol | Permisos | Uso Típico |
|-----|----------|-----------|
| `host` | Control total: agregar/remover participantes, cambiar roles, terminar reunión | Organizador de la reunión |
| `moderator` | Silenciar participantes, controlar cámara, expulsar | Co-organizador, facilitador |
| `attendee` | Ver, escuchar, compartir cámara/pantalla | Participante regular |

**Implementación de Permisos en Frontend**:
- Deshabilitar botones según rol del usuario actual
- Mostrar iconos diferentes para cada rol (👑 host, 🛡️ moderator, 👤 attendee)
- Solo host ve opciones de gestión de participantes

---

## 👥 Gestión de Participantes

### Mejores Prácticas

#### 1. Agregar Participantes

**Cuándo agregar**:
- Al crear la reunión (recomendado)
- Antes de que inicie
- Durante la reunión (si es necesario)

**Cómo implementar selector de usuarios**:
- Autocompletado con búsqueda
- Mostrar nombre, email y foto
- Permitir selección múltiple
- Validar que usuario existe antes de enviar
- Mostrar usuarios ya agregados como deshabilitados

**Roles al agregar**:
- Por defecto: `attendee`
- Preguntar si alguno debe ser `moderator`
- Solo el creador es `host` inicialmente

#### 2. Visualización de Lista de Participantes

**Información a mostrar**:
- Avatar/foto de perfil
- Nombre completo
- Email (opcional)
- Rol (icono)
- Estado de conexión
- Tiempo en reunión
- Última acción

**Orden sugerido**:
1. Host (primero)
2. Moderators
3. Attendees conectados (joined)
4. Attendees invitados (invited)
5. Participantes que salieron (left)

**Actualización en tiempo real**:
- Polling cada 10-15 segundos si reunión está activa
- Mostrar notificación cuando alguien se une/sale
- Animación de entrada/salida
- Sonido opcional (configuración del usuario)

#### 3. Cambio de Roles

**Restricciones**:
- Solo host puede cambiar roles
- No se puede auto-promover
- Debe haber al menos un host

**UI sugerida**:
- Menú contextual (click derecho)
- Modal de confirmación para cambios importantes
- Mostrar mensaje: "Usuario X ahora es moderador"

#### 4. Expulsión de Participantes

**Flujo recomendado**:
1. Host hace clic en "Expulsar"
2. Modal: "¿Expulsar a [Nombre]?"
3. Opción: "Permitir que vuelva a unirse" (checkbox)
4. Si NO permite: `DELETE /api/meetings/{id}/participants/{userId}`
5. Si SÍ permite: `PATCH` con `status: left`

**Consideraciones**:
- Expulsión debe ser inmediata en Daily.co
- Backend solo registra la acción
- Usuario expulsado ve mensaje: "Fuiste removido de la reunión"

---

## 🎥 Integración con Daily.co

### ¿Qué es Daily.co?

Daily.co es un servicio de videollamadas que proporciona:
- Salas de videollamada con URLs únicas
- Video y audio de alta calidad
- Compartir pantalla
- Grabación (en planes premium)
- APIs y SDKs para integración

### Opciones de Integración en Frontend

#### Opción 1: Iframe Simple

**Ventajas**:
- Fácil de implementar
- Sin dependencias adicionales
- Daily.co maneja toda la UI

**Desventajas**:
- Menos control sobre la UI
- Limitado en personalización

**Implementación**:
- Crear un iframe con `src={meeting.roomUrl}`
- Configurar `allow="camera; microphone; fullscreen"`
- Establecer dimensiones (fullscreen recomendado)

---

#### Opción 2: Daily.co SDK

**Ventajas**:
- Control total sobre la UI
- Personalización completa
- Eventos y callbacks

**Desventajas**:
- Más complejo de implementar
- Requiere aprender el SDK

**Bibliotecas disponibles**:
- `@daily-co/daily-js` (vanilla JavaScript)
- `@daily-co/daily-react` (React components)

**Características del SDK**:
- Control de cámara/micrófono programático
- Eventos: participante se une, habla, comparte pantalla
- Layouts personalizables
- Overlays y controles custom

---

#### Opción 3: Ventana Emergente/Nueva Pestaña

**Ventajas**:
- Separa la videollamada de la app
- Usuario puede usar ambas simultáneamente
- Más simple que iframe

**Desventajas**:
- Menos integrado con la UI
- Puede ser bloqueado por pop-up blockers

**Implementación**:
- Botón "Unirse a reunión" → `window.open(meeting.roomUrl, '_blank')`
- Configurar dimensiones y features

---

### Parámetros de URL de Daily.co

Puedes agregar parámetros a la URL para configurar la reunión:

**Ejemplos**:
```
https://palerosoftware.daily.co/room-123?t={token}&userName={nombre}
```

**Parámetros útiles**:
- `t`: Token de autenticación (opcional)
- `userName`: Nombre a mostrar del participante
- `videoOff`: Iniciar con cámara apagada
- `audioOff`: Iniciar con micrófono apagado

**Consultar documentación de Daily.co** para lista completa.

---

### Consideraciones de Seguridad

**Salas Públicas vs Privadas**:
- Por defecto las salas son públicas (cualquiera con URL puede unirse)
- Para salas privadas: generar tokens de acceso con Daily.co API
- Validar que usuario es participante antes de mostrar `roomUrl`

**Verificación de Participante**:
```
1. Usuario hace clic en "Unirse"
2. Frontend verifica: GET /api/meetings/{id}/participants
3. Busca su userId en la lista
4. Si no está: mostrar error "No eres participante"
5. Si está: mostrar roomUrl y permitir unirse
```

---

## ⚠️ Manejo de Errores

### Errores Comunes y Cómo Manejarlos

#### 1. Error 401 - Unauthorized

**Causa**: Token JWT inválido, expirado o ausente

**Manejo Frontend**:
- Interceptar respuesta 401
- Limpiar token almacenado
- Redirigir a pantalla de login
- Mostrar mensaje: "Sesión expirada, por favor inicia sesión"

**Prevención**:
- Verificar expiración del token antes de cada request
- Implementar refresh token
- Mostrar warning cuando token está por expirar

---

#### 2. Error 404 - Not Found

**Causa**: Reunión, participante o usuario no existe

**Manejo Frontend**:
- Mostrar mensaje específico: "La reunión no existe"
- Ofrecer acción: "Volver a lista de reuniones"
- No mostrar stack trace al usuario

**Prevención**:
- Validar IDs antes de enviar requests
- Verificar que recurso existe antes de operaciones críticas

---

#### 3. Error 409 - Conflict

**Causa**: Conflicto de horarios (reuniones solapadas)

**Respuesta Backend**:
```json
{
  "statusCode": 409,
  "message": "Las fechas de la reunión se solapan con otra reunión existente",
  "error": "Conflict"
}
```

**Manejo Frontend**:
- Mostrar mensaje claro y específico
- Sugerir horarios alternativos
- Mostrar calendario con reuniones existentes
- Permitir ajustar fechas sin cerrar modal

---

#### 4. Error 400 - Bad Request

**Causa**: Datos inválidos (fechas, formato, validaciones)

**Ejemplos de mensajes**:
- "endTime must be after startTime"
- "title should not be empty"
- "startTime must be a valid ISO 8601 date string"

**Manejo Frontend**:
- Validar en frontend ANTES de enviar
- Mostrar errores en campos específicos (inline validation)
- Usar datepickers para evitar formatos incorrectos
- Deshabilitar submit si hay errores

---

#### 5. Error 500 - Internal Server Error

**Causa**: Error no controlado en backend (raro)

**Escenarios posibles**:
- Daily.co API no responde
- Error de conexión a base de datos
- Error en lógica de negocio

**Manejo Frontend**:
- Mostrar mensaje genérico: "Error del servidor, intenta nuevamente"
- Ofrecer botón "Reintentar"
- Reportar error (logging/analytics)
- No exponer detalles técnicos al usuario

---

### Estrategias de Reintentos

**Para requests GET (idempotentes)**:
- Reintentar automáticamente 2-3 veces
- Esperar 1s, 2s, 4s (exponential backoff)
- Mostrar loading durante reintentos

**Para requests POST/PATCH/DELETE (no idempotentes)**:
- NO reintentar automáticamente
- Pedir confirmación al usuario
- Verificar si la operación se completó antes de reintentar

---

### Validaciones en Frontend

**Antes de enviar cualquier request**:

✅ **Fechas**:
- `startTime` en el futuro
- `endTime > startTime`
- Formato ISO 8601 correcto

✅ **Campos requeridos**:
- `title` no vacío
- IDs en formato UUID válido

✅ **Lógica de negocio**:
- Usuario es participante (antes de mostrar roomUrl)
- Usuario tiene permisos (antes de mostrar botones de acción)

---

## 💡 Mejores Prácticas

### 1. Gestión de Estado

**Estado Global Recomendado**:
- Lista de reuniones (cache)
- Reunión actual (detalle)
- Lista de participantes (cache)
- Usuario autenticado

**Actualización de Cache**:
- Invalidar después de crear/actualizar/eliminar
- Refrescar periódicamente (cada 1-2 min para lista)
- Polling más frecuente para reunión activa (cada 15-30 seg)

**Librerías sugeridas**:
- React: Redux, Zustand, React Query
- Vue: Vuex, Pinia
- Angular: NgRx, Akita

---

### 2. Optimización de Rendimiento

**Lazy Loading**:
- Cargar participantes solo al abrir modal/panel
- Diferir carga de detalles de reunión hasta que se necesiten

**Paginación**:
- Implementar en frontend si hay muchas reuniones
- Mostrar 10-20 reuniones por página
- Filtros para reducir carga

**Caché de Imágenes**:
- Cachear avatares de usuarios
- Pre-cargar avatares de participantes

---

### 3. Experiencia de Usuario

**Feedback Visual**:
- Loading spinners durante requests
- Toasts/snackbars para confirmaciones
- Progress bars para operaciones largas
- Skeleton loaders para contenido que carga

**Validación en Tiempo Real**:
- Validar campos mientras usuario escribe
- Mostrar errores inline (debajo de campos)
- Deshabilitar submit si hay errores
- Indicadores de campo válido (✓)

**Accesibilidad**:
- Labels claros en formularios
- Keyboard navigation
- ARIA labels para lectores de pantalla
- Contraste adecuado de colores

---

### 4. Seguridad

**Protección de Datos**:
- Nunca almacenar JWT en localStorage (usar httpOnly cookies si es posible)
- Si usas localStorage, limpia al cerrar sesión
- No exponer tokens en URLs o logs

**Validación de Permisos**:
- Verificar rol del usuario antes de mostrar opciones
- Deshabilitar botones si no tiene permisos
- Backend siempre valida (nunca confiar solo en frontend)

**Sanitización**:
- Escapar contenido HTML en títulos/descripciones
- Validar inputs contra XSS
- No ejecutar código recibido del backend

---


## 📋 Casos de Uso Comunes

### Caso 1: Sprint Planning

**Escenario**:
- Reunión semanal del equipo de desarrollo
- 10 participantes fijos
- 2 horas de duración
- Mismo día/hora cada semana

**Implementación**:
1. Botón "Crear reunión recurrente"
2. Guardar template de participantes
3. Crear serie de reuniones (próximas 4 semanas)
4. Enviar invitaciones a calendario

---

### Caso 2: Llamada con Cliente

**Escenario**:
- Reunión con cliente externo
- Cliente no está en el sistema
- Requiere sala privada
- Grabar la reunión

**Implementación**:
1. Crear reunión sin agregar participantes de BD
2. Generar enlace con token temporal
3. Compartir enlace vía email
4. Habilitar grabación (si Daily.co lo permite)

---

### Caso 3: Daily Standup

**Escenario**:
- Reunión diaria de 15 minutos
- Todos los miembros del equipo
- Sin agenda formal
- Quick check-in

**Implementación**:
1. Sala permanente (no eliminar después)
2. Botón "Unirse al Standup" siempre visible
3. Recordatorio automático cada día a las 9 AM
4. Timer de 15 minutos visible en pantalla

---

### Caso 4: Webinar/Presentación

**Escenario**:
- Presentador y múltiples asistentes
- Asistentes con micrófono silenciado
- Q&A al final
- Grabación requerida

**Implementación**:
1. Presentador como `host`
2. Todos los demás como `attendee` con mic muted
3. Opción "Levantar mano" para preguntas
4. Chat habilitado para Q&A
5. Moderadores (`moderator`) para gestionar preguntas

---

## 📊 Resumen de Endpoints

### Quick Reference Table

| Método | Endpoint | Descripción | Auth | Body |
|--------|----------|-------------|------|------|
| POST | `/api/meetings` | Crear reunión | ✅ | CreateMeetingDto |
| GET | `/api/meetings` | Listar reuniones | ✅ | - |
| GET | `/api/meetings/{id}` | Obtener reunión | ✅ | - |
| PATCH | `/api/meetings/{id}` | Actualizar reunión | ✅ | UpdateMeetingDto |
| DELETE | `/api/meetings/{id}` | Eliminar reunión | ✅ | - |
| POST | `/api/meetings/{id}/participants` | Agregar participantes | ✅ | AddParticipantDto |
| GET | `/api/meetings/{id}/participants` | Listar participantes | ✅ | - |
| PATCH | `/api/meetings/{id}/participants/{userId}` | Actualizar participante | ✅ | UpdateParticipantDto |
| DELETE | `/api/meetings/{id}/participants/{userId}` | Remover participante | ✅ | - |
| POST | `/api/meetings/webhook` | Webhook Daily.co | ❌ | DailyWebhookDto |

---

## 🚀 Próximos Pasos

### Para Comenzar la Implementación

1. **Setup Inicial**:
   - Configurar cliente HTTP (axios/fetch)
   - Crear servicio de API con métodos para cada endpoint
   - Implementar interceptor para agregar JWT automáticamente

2. **Autenticación**:
   - Implementar login y obtener token
   - Almacenar token de forma segura
   - Implementar refresh de token

3. **Vista de Lista de Reuniones**:
   - Componente ListaMeetings
   - Obtener y mostrar reuniones
   - Implementar filtros y búsqueda

4. **Formulario de Crear Reunión**:
   - Componente FormularioMeeting
   - Validaciones en tiempo real
   - Integración con datepicker

5. **Vista de Detalle**:
   - Componente DetalleMeeting
   - Mostrar información completa
   - Lista de participantes

6. **Integración Daily.co**:
   - Elegir método (iframe/SDK/nueva ventana)
   - Implementar join a reunión
   - Configurar permisos de cámara/micrófono

7. **Gestión de Participantes**:
   - Modal de agregar participantes
   - Lista con estados en tiempo real
   - Cambio de roles (si usuario es host)

8. **Polling/WebSockets**:
   - Implementar actualización en tiempo real
   - Refrescar estado durante reunión activa
   - Notificaciones de cambios

---

## 📚 Recursos Adicionales

### Documentación Relacionada

- **Backend README**: `MEETINGS_MODULE_README.md`
- **Guía de Webhooks**: `WEBHOOKS_SETUP_GUIDE.md`
- **Completado Fase 3**: `FASE_3_COMPLETADA.md`

### Enlaces Externos

- **Daily.co Documentation**: https://docs.daily.co/
- **Daily.co React Components**: https://docs.daily.co/reference/daily-react
- **Daily.co API Reference**: https://docs.daily.co/reference/rest-api
- **JWT.io**: https://jwt.io/ (para debug de tokens)

---

## 🎯 Checklist de Implementación

**Antes de Comenzar**:
- [ ] Leer esta documentación completa
- [ ] Entender flujos principales
- [ ] Configurar ambiente de desarrollo

**Autenticación**:
- [ ] Implementar login
- [ ] Almacenar y gestionar JWT
- [ ] Interceptor para agregar token a requests

**CRUD de Reuniones**:
- [ ] Listar reuniones
- [ ] Crear reunión con validaciones
- [ ] Ver detalle de reunión
- [ ] Actualizar reunión
- [ ] Eliminar/cancelar reunión

**Gestión de Participantes**:
- [ ] Agregar participantes
- [ ] Listar participantes con estados
- [ ] Actualizar roles
- [ ] Remover participantes

**Integración Video**:
- [ ] Integrar Daily.co (método elegido)
- [ ] Botón "Unirse" funcional
- [ ] Verificar permisos antes de unirse

**Tiempo Real**:
- [ ] Implementar polling para reuniones activas
- [ ] Actualizar lista de participantes
- [ ] Mostrar notificaciones de cambios

**Testing**:
- [ ] Tests unitarios de componentes
- [ ] Tests de integración de flujos
- [ ] Test E2E de flujo completo

---

## ✨ Conclusión

Esta documentación proporciona toda la información necesaria para implementar el módulo de reuniones en el frontend. El backend está completamente funcional y listo para recibir peticiones.

**Recuerda**:
- ✅ Siempre validar en frontend antes de enviar
- ✅ Manejar errores de forma user-friendly
- ✅ Confiar en webhooks para actualizaciones automáticas
- ✅ Implementar feedback visual en todas las acciones
- ✅ Probar con usuarios reales antes de producción

**Soporte**:
Si tienes preguntas sobre la implementación o encuentras algún error en el backend, consulta los archivos de documentación técnica o revisa los ejemplos en `test/*.http`.

---

**Versión**: 1.0  
**Última Actualización**: Octubre 2025  
**Autor**: Equipo PaleroSoft  
**Módulo**: Meetings (Videollamadas con Daily.co)
