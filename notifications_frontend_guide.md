# Guía de Integración del Módulo de Notificaciones para Frontend

**Versión:** 2.0 - ✨ Ahora con Previsualización de Comentarios

## 1. Introducción

Este documento proporciona una guía completa para el equipo de frontend sobre cómo integrar y utilizar el módulo de notificaciones del CRM de PaleroSoft. El objetivo de este módulo es mantener a los usuarios informados sobre eventos importantes que ocurren en el sistema, mejorando la comunicación y la eficiencia del equipo.

**🆕 Novedad v2.0**: Las notificaciones de comentarios ahora incluyen una **previsualización del contenido** para mejorar la experiencia del usuario.

Las notificaciones se generan automáticamente en el backend cuando ocurren acciones específicas, como la asignación de una nueva tarea, un cambio de estado en un proyecto o la recepción de un pago.

---

## 2. Conceptos Clave

- **Generación Automática**: Las notificaciones son generadas por el servidor. El frontend no necesita crearlas, solo consumirlas y mostrarlas.
- **Receptores Específicos**: Cada notificación está dirigida a un `userId` específico. Los usuarios solo pueden ver sus propias notificaciones.
- **Rol de Administrador**: Los usuarios con el rol `ADMIN` tienen acceso a un endpoint especial para ver **todas** las notificaciones del sistema, lo que es útil para la supervisión y el soporte.
- **Entidades Relacionadas**: La mayoría de las notificaciones están vinculadas a una entidad específica del sistema (una tarea, un proyecto, una factura, etc.). Esto permite que las notificaciones sean interactivas y redirijan al usuario al elemento correspondiente.

---

## 3. API Endpoints

A continuación se detallan los endpoints disponibles para gestionar las notificaciones.

### 3.1. Obtener Notificaciones del Usuario

Obtiene todas las notificaciones (leídas y no leídas) para el usuario autenticado, ordenadas por fecha de creación descendente.

- **Endpoint**: `GET /api/notifications`
- **Autenticación**: Requerida (Token de usuario)
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-de-la-notificacion",
        "userId": "uuid-del-usuario",
        "type": "COMMENT_CREATED",
        "message": "New comment added to task: Diseño de la Home Page",
        "content": "He revisado el código y creo que podríamos mejorar la validación de los formularios. ¿Qué opinas?",
        "entityType": "TASK",
        "entityId": "uuid-de-la-tarea",
        "isRead": false,
        "createdAt": "2025-09-25T18:30:00.000Z"
      }
    ],
    "message": "Notifications retrieved successfully"
  }
  ```

### 3.2. Marcar Notificación como Leída

Marca una notificación específica como leída.

- **Endpoint**: `PATCH /api/notifications/:id/read`
- **Autenticación**: Requerida (Token de usuario)
- **Parámetros**:
  - `id`: El UUID de la notificación a marcar como leída.
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-de-la-notificacion",
      "isRead": true,
      // ...otros campos de la notificación
    },
    "message": "Notification marked as read"
  }
  ```
- **Consideraciones**: El sistema valida que la notificación pertenezca al usuario que realiza la solicitud.

### 3.3. Obtener Todas las Notificaciones (Solo Admin)

Obtiene **todas** las notificaciones de **todos** los usuarios en el sistema. Exclusivo para usuarios con rol `ADMIN`.

- **Endpoint**: `GET /api/notifications/admin/all`
- **Autenticación**: Requerida (Token de administrador)
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      // ...array de todas las notificaciones del sistema
    ],
    "message": "All notifications retrieved successfully"
  }
  ```
- **Respuesta de Error (403 Forbidden)**: Si un usuario no administrador intenta acceder.

---

## 4. Estructura y Tipos de Notificación

### 4.1. Esquema del Objeto `Notification`

Cada objeto de notificación devuelto por la API tendrá la siguiente estructura:

| Campo        | Tipo    | Descripción                                                                 | Ejemplo                               |
|--------------|---------|-----------------------------------------------------------------------------|---------------------------------------|
| `id`         | `string`  | Identificador único de la notificación (UUID).                              | `"a1b2c3d4-..."`                      |
| `userId`     | `string`  | ID del usuario que recibe la notificación.                                  | `"e5f6g7h8-..."`                      |
| `type`       | `string`  | El tipo de evento que generó la notificación. Ver sección 4.2.              | `"COMMENT_CREATED"`                   |
| `message`    | `string`  | El mensaje descriptivo para mostrar al usuario.                             | `"New comment added to task..."`      |
| **`content`**| `string?` | **🆕 NUEVO**: Contenido de previsualización (ej. texto del comentario).     | `"He revisado el código y..."`        |
| `entityType` | `string`  | El tipo de entidad relacionada (`TASK`, `PROJECT`, `INVOICE`, etc.).        | `"TASK"`                              |
| `entityId`   | `string`  | El ID de la entidad relacionada. Usar para la navegación.                   | `"i9j0k1l2-..."`                      |
| `isRead`     | `boolean` | `true` si el usuario ya ha leído la notificación, `false` en caso contrario. | `false`                               |
| `createdAt`  | `Date`    | La fecha y hora en que se creó la notificación.                             | `"2025-09-25T18:30:00.000Z"`          |

### 4.2. Tipos de Notificación (`NotificationType`)

A continuación se detallan todos los tipos de notificación implementados y los eventos que los disparan.

| Tipo de Notificación         | Módulo    | Evento Disparador                                       | Receptor                               | Mensaje de Ejemplo                                                              | Entidad Relacionada (`entityType`/`entityId`) |
|------------------------------|-----------|---------------------------------------------------------|----------------------------------------|---------------------------------------------------------------------------------|-----------------------------------------------|
| `NEW_TASK_ASSIGNED`          | Tasks     | Se asigna una tarea a un usuario.                       | Usuario asignado a la tarea.           | `You have been assigned a new task: '{task.title}'`                             | `TASK` / ID de la tarea                       |
| `TASK_STATUS_UPDATED`        | Tasks     | El estado de una tarea asignada a un usuario cambia.    | Usuario asignado a la tarea.           | `Your task '{task.title}' status changed to: {newStatus}`                       | `TASK` / ID de la tarea                       |
| `PROJECT_CREATED`            | Projects  | Se crea un nuevo proyecto para un cliente.              | Cliente (`clientId`) del proyecto.     | `A new project has been created for you: '{project.name}'`                      | `PROJECT` / ID del proyecto                   |
| `PROJECT_STATUS_UPDATED`     | Projects  | El estado de un proyecto cambia.                        | Cliente (`clientId`) del proyecto.     | `Your project '{project.name}' status changed to: {newStatus}`                  | `PROJECT` / ID del proyecto                   |
| `COMMENT_CREATED`            | Comments  | Se añade un comentario a una tarea o proyecto.          | Usuario asignado (tarea) o cliente (proyecto). | `New comment added to task: '{task.title}'` o `... to project: '{project.name}'` **+ contenido del comentario en campo `content`** | `TASK` o `PROJECT` / ID correspondiente       |
| `INVOICE_GENERATED`          | Invoices  | 1. Se crea una nueva factura.<br>2. El estado cambia a `SENT`, `PAID` o `VOID`. | Cliente (`clientId`) de la factura.    | Varía según el evento: `New invoice...`, `Invoice ... has been sent.`, `Payment received...` | `INVOICE` / ID de la factura                  |
| `PAYMENT_REMINDER`           | Invoices  | 1. Una factura cambia a estado `OVERDUE`.<br>2. Se ejecuta el recordatorio para facturas vencidas. | Cliente (`clientId`) de la factura.    | `Payment reminder: Invoice #{invoiceNumber} is overdue.`                         | `INVOICE` / ID de la factura                  |

---

## 5. 🆕 Previsualización de Comentarios

### 5.1. Campo `content` en Notificaciones

A partir de la versión 2.0, las notificaciones de tipo `COMMENT_CREATED` incluyen el campo `content` que contiene el texto completo del comentario. Esto permite mostrar una previsualización sin necesidad de navegación adicional.

### 5.2. Ejemplo de Implementación

```typescript
// Componente de notificación con previsualización
const NotificationItem = ({ notification }) => {
  const hasPreview = notification.type === 'COMMENT_CREATED' && notification.content;
  
  return (
    <div className="notification-item">
      <div className="notification-message">{notification.message}</div>
      
      {hasPreview && (
        <div className="comment-preview">
          <strong>💬 Comentario:</strong>
          <p>"{truncateText(notification.content, 150)}..."</p>
        </div>
      )}
    </div>
  );
};
```

### 5.3. Mejores Prácticas

- **Truncado**: Limitar la previsualización a 100-150 caracteres
- **Diferenciación visual**: Usar estilos distintos para distinguir el mensaje de la previsualización  
- **Navegación opcional**: El usuario puede ver el contenido sin navegar, pero aún puede hacer clic para ver el contexto completo

---

## 6. Guía de Implementación para Frontend

### 6.1. Obtención de Notificaciones

- **Polling**: Dado que la implementación actual no utiliza WebSockets, el frontend deberá realizar "polling" (solicitudes periódicas) al endpoint `GET /api/notifications` para buscar nuevas notificaciones. Se recomienda un intervalo razonable (e.g., cada 30-60 segundos) para no sobrecargar el servidor.
- **Carga Inicial**: Realizar una llamada a este endpoint cuando la aplicación se carga por primera vez o cuando el usuario inicia sesión.

### 6.2. Visualización de Notificaciones

- **Contador de No Leídas**: Se puede implementar un contador (badge) en un icono de campana. Este contador se calcula filtrando las notificaciones donde `isRead` es `false`.
- **Lista Desplegable**: Al hacer clic en el icono, se debe mostrar una lista de las notificaciones más recientes.
- **Navegación**: Utilice los campos `entityType` y `entityId` para hacer que cada notificación sea un enlace. Por ejemplo, si `entityType` es `PROJECT` y `entityId` es `xyz`, el enlace debería redirigir a la página de detalles del proyecto `xyz`.

### 6.3. Marcar como Leídas

- **Acción del Usuario**: Se debe llamar al endpoint `PATCH /api/notifications/:id/read` cuando el usuario interactúa con una notificación.
- **Estrategias**:
  1. **Clic Individual**: Marcar como leída solo la notificación en la que el usuario hace clic.
  2. **Marcar Todas al Abrir**: Marcar todas las notificaciones visibles como leídas cuando el usuario abre el desplegable de notificaciones (esto requeriría múltiples llamadas a la API, una por cada notificación no leída). Se recomienda la estrategia individual para empezar.

### 6.4. Vista de Administrador

- Para los usuarios `ADMIN`, se debe crear una vista especial (e.g., en un panel de administración) que consuma el endpoint `GET /api/notifications/admin/all`.
- Esta vista debe mostrar una tabla o lista con todas las notificaciones, idealmente con información adicional como a qué usuario pertenece cada una.

---

## 7. Referencias para Pruebas

El equipo de backend ha creado archivos `.http` que documentan y permiten probar cada uno de los escenarios de notificación. Estos archivos se encuentran en el directorio `/test` del repositorio y pueden ser ejecutados con la extensión de VS Code "REST Client".

- `tasks-notifications.http`
- `projects-notifications.http`
- `comments-notifications.http`
- `invoices-notifications.http`

Estos archivos son una excelente referencia para entender el comportamiento esperado de la API en cada caso.
