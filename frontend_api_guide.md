# Guía de Endpoints API para Frontend - CRM PaleroSoft

**Versión:** 2.0
**Última Actualización:** 2025-07-05

Este documento detalla los endpoints de la API backend que el equipo de frontend necesitará para desarrollar las funcionalidades del CRM PaleroSoft. Está alineado con los tickets de `tickets_frontend_crm.md`, el `schema.ts` de la base de datos y la implementación actual de los servicios de NestJS.

---

## Fase 0: Core y Autenticación (FRONT-001, FRONT-002, FRONT-003)

### Autenticación (`/auth`)

#### 1. Registro de Usuario
- **Endpoint:** `POST /auth/register`
- **Descripción:** Registra un nuevo usuario. Por defecto, los usuarios registrados a través de este endpoint se asignan al rol `CLIENT` y se les crea un perfil de cliente (`client_profiles`) asociado con un estado inicial de `PROSPECT`.
- **Cuerpo de la Solicitud (`RegisterAuthDto`):
  ```json
  {
    "fullName": "Nombre Completo Apellido",
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Respuesta Exitosa (201 CREATED - `AuthResponse`):
  ```json
  {
    "user": {
      "id": "uuid-del-usuario",
      "fullName": "Nombre Completo Apellido",
      "email": "user@example.com",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    },
    "accessToken": "jwt.token.aqui"
  }
  ```
- **Notas Técnicas:** El `AuthService` mapea el campo `fullName` del DTO al campo `name` en la entidad `usersTable`. El token JWT debe ser almacenado por el cliente y enviado en las cabeceras de las solicitudes subsecuentes.

#### 2. Inicio de Sesión
- **Endpoint:** `POST /auth/login`
- **Descripción:** Autentica un usuario existente y devuelve un token JWT.
- **Cuerpo de la Solicitud (`LoginAuthDto`):
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Respuesta Exitosa (200 OK - `AuthResponse`):
  ```json
  {
    "user": {
      "id": "uuid-del-usuario",
      "fullName": "Nombre Completo Apellido",
      "email": "user@example.com",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    },
    "accessToken": "jwt.token.aqui"
  }
  ```

#### 3. Obtener Usuario Actual (Perfil)
- **Endpoint:** `GET /auth/me`
- **Descripción:** Devuelve los datos del usuario autenticado actualmente (obtenidos a través de `UsersService.findById`).
- **Autenticación:** Requerida (Bearer Token JWT).
- **Respuesta Exitosa (200 OK - `UserResponse` de `UsersService`):
  ```json
  {
    "id": "uuid-del-usuario",
    "email": "user@example.com",
    "name": "Nombre Completo Apellido",
    "role": "CLIENT",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```
- **Notas Técnicas:** Este endpoint es crucial para obtener el estado de autenticación del usuario, incluyendo su rol, que determinará los permisos y vistas en el frontend. La respuesta es generada por `UsersService` y no incluye campos sensibles como la contraseña.

---

## Módulo 1: Gestión de Proyectos y Tareas (FRONT-004, FRONT-005, FRONT-006, FRONT-007)

### Proyectos (`/projects`)

#### 1. Crear Proyecto
- **Endpoint:** `POST /projects`
- **Descripción:** Crea un nuevo proyecto.
- **Autenticación:** Requerida.
- **Cuerpo de la Solicitud (`CreateProjectDto`):
  ```json
  {
    "name": "Nuevo Proyecto Alpha",
    "description": "Descripción detallada del proyecto Alpha.",
    "startDate": "2025-07-01", // Formato YYYY-MM-DD
    "endDate": "2025-12-31",   // Formato YYYY-MM-DD
    "status": "PENDING", // Valores de projectStatusEnum: 'PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ARCHIVED'
    "clientId": "uuid-del-cliente" // UUID del usuario cliente
  }
  ```
- **Respuesta Exitosa (201 CREATED - `Project`):
  ```json
  {
    "id": "uuid-del-proyecto",
    "name": "Nuevo Proyecto Alpha",
    "description": "Descripción detallada del proyecto Alpha.",
    "startDate": "2025-07-01",
    "endDate": "2025-12-31",
    "status": "PENDING",
    "clientId": "uuid-del-cliente",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

#### 2. Listar Proyectos
- **Endpoint:** `GET /projects`
- **Descripción:** Obtiene una lista de todos los proyectos.
- **Autenticación:** Requerida.
- **Respuesta Exitosa (200 OK - `Project[]`):
  ```json
  [
    {
      "id": "uuid-proyecto-1",
      "name": "Proyecto Alpha",
      // ...otros campos
    },
    {
      "id": "uuid-proyecto-2",
      "name": "Proyecto Beta",
      // ...otros campos
    }
  ]
  ```
- **Notas Técnicas:** Actualmente, el endpoint base `GET /projects` devuelve todos los proyectos. El filtrado específico (por estado, cliente, búsqueda) deberá implementarse en el frontend si es necesario sobre la data completa, o solicitarse como mejora al backend.

#### 3. Obtener Detalles de un Proyecto
- **Endpoint:** `GET /projects/:id`
- **Descripción:** Obtiene los detalles de un proyecto específico por su ID.
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID del proyecto.
- **Respuesta Exitosa (200 OK - `Project`):
  ```json
  {
    "id": "uuid-del-proyecto",
    "name": "Proyecto Alpha",
    "description": "Descripción detallada...",
    // ...tareas, archivos, comentarios asociados (si se incluyen en la respuesta o se obtienen por separado)
  }
  ```

#### 4. Actualizar Proyecto
- **Endpoint:** `PATCH /projects/:id`
- **Descripción:** Actualiza los datos de un proyecto existente.
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID del proyecto.
- **Cuerpo de la Solicitud (`UpdateProjectDto`):** (Campos opcionales a actualizar)
  ```json
  {
    "name": "Proyecto Alpha Actualizado",
    "status": "IN_PROGRESS", // Valores de projectStatusEnum
    "description": "Nueva descripción.",
    "startDate": "2025-07-02",
    "endDate": "2026-01-15",
    "clientId": "uuid-nuevo-cliente"
  }
  ```
- **Respuesta Exitosa (200 OK - `Project`):** (Refleja los campos actualizados)
  ```json
  {
    "id": "uuid-del-proyecto",
    "name": "Proyecto Alpha Actualizado",
    "status": "IN_PROGRESS",
    // ...otros campos actualizados
  }
  ```

#### 5. Eliminar Proyecto
- **Endpoint:** `DELETE /projects/:id`
- **Descripción:** Elimina un proyecto de forma permanente (hard delete).
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID del proyecto.
- **Respuesta Exitosa (204 No Content):** No devuelve cuerpo.
- **Notas Técnicas:** La eliminación de un proyecto puede tener efectos en cascada sobre entidades relacionadas, como tareas (`onDelete: 'CASCADE'`).

### Tareas (`/tasks`)

#### 1. Crear Tarea
- **Endpoint:** `POST /tasks`
- **Descripción:** Crea una nueva tarea, asociada a un proyecto.
- **Autenticación:** Requerida.
- **Cuerpo de la Solicitud (`CreateTaskDto`):
  ```json
  {
    "projectId": "uuid-del-proyecto-asociado", // Requerido
    "title": "Diseñar UI del Dashboard",         // Requerido
    "description": "Crear mockups y prototipo interactivo.", // Opcional
    "status": "TODO", // Valores de taskStatusEnum: 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'
    "priority": "HIGH",    // Valores de taskPriorityEnum: 'LOW', 'MEDIUM', 'HIGH' (Opcional)
    "dueDate": "2025-07-15", // Formato YYYY-MM-DD (Opcional)
    "assignedToId": "uuid-del-usuario-asignado" // Opcional, UUID del usuario
  }
  ```
- **Respuesta Exitosa (201 CREATED - `Task`):** (Campos similares al DTO, más `id`, `createdAt`, `updatedAt`)
  ```json
  {
    "id": "uuid-de-la-tarea",
    "title": "Diseñar UI del Dashboard",
    "description": "Crear mockups y prototipo interactivo.",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2025-07-15",
    "projectId": "uuid-del-proyecto-asociado",
    "assignedToId": "uuid-del-usuario-asignado",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

#### 2. Listar Tareas
- **Endpoint:** `GET /tasks`
- **Descripción:** Obtiene una lista de todas las tareas.
- **Autenticación:** Requerida.
- **Respuesta Exitosa (200 OK - `Task[]`):
  ```json
  [
    {
      "id": "uuid-tarea-1",
      "title": "Tarea 1",
      // ...otros campos
    }
  ]
  ```
- **Notas Técnicas:** Actualmente, `GET /tasks` devuelve todas las tareas. El filtrado (por proyecto, estado, asignado) deberá realizarse en el frontend con los datos obtenidos o solicitarse como mejora al backend para implementarlo vía query params.

#### 3. Obtener Detalles de una Tarea
- **Endpoint:** `GET /tasks/:id`
- **Descripción:** Obtiene los detalles de una tarea específica.
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID de la tarea.
- **Respuesta Exitosa (200 OK - `Task`):
  ```json
  {
    "id": "uuid-de-la-tarea",
    "title": "Diseñar UI del Dashboard",
    // ...subtareas, comentarios, adjuntos (si se incluyen o se obtienen por separado)
  }
  ```

#### 4. Actualizar Tarea
- **Endpoint:** `PATCH /tasks/:id`
- **Descripción:** Actualiza una tarea existente (ej: cambiar estado, asignado, etc.).
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID de la tarea.
- **Cuerpo de la Solicitud (`UpdateTaskDto`):** (Campos opcionales)
  ```json
  {
    "title": "Título de tarea actualizado",
    "description": "Descripción actualizada.",
    "status": "IN_PROGRESS", // Valores de taskStatusEnum
    "priority": "MEDIUM",    // Valores de taskPriorityEnum
    "dueDate": "2025-07-20",
    "assignedToId": "uuid-nuevo-asignado",
    "projectId": "uuid-otro-proyecto" // Si se permite cambiar de proyecto
  }
  ```
- **Respuesta Exitosa (200 OK - `Task`):** (Refleja los campos actualizados)
  ```json
  {
    "id": "uuid-de-la-tarea",
    "title": "Título de tarea actualizado",
    "description": "Descripción actualizada.",
    "status": "IN_PROGRESS",
    "priority": "MEDIUM",
    "dueDate": "2025-07-20",
    "assignedToId": "uuid-nuevo-asignado",
    "projectId": "uuid-otro-proyecto",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

#### 5. Eliminar Tarea
- **Endpoint:** `DELETE /tasks/:id`
- **Descripción:** Elimina una tarea de forma permanente.
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID de la tarea.
- **Respuesta Exitosa (204 No Content):** No devuelve cuerpo.

### Subtareas (`/subtasks`)

#### 1. Crear Subtarea
- **Endpoint:** `POST /subtasks`
- **Autenticación:** Requerida.
- **Cuerpo (`CreateSubtaskDto`):
  ```json
  {
    "taskId": "uuid-de-la-tarea-padre", // Requerido
    "title": "Definir paleta de colores",    // Requerido
    "description": "Investigar tendencias de color.", // Opcional
    "status": "TODO", // Valores de subtaskStatusEnum: 'TODO', 'IN_PROGRESS', 'DONE'. Default 'TODO' en schema.
    "priority": "MEDIUM",   // Valores de subtaskPriorityEnum: 'LOW', 'MEDIUM', 'HIGH' (Opcional)
    "dueDate": "2025-07-10", // Formato YYYY-MM-DD (Opcional)
    "assignedToId": "uuid-usuario-asignado" // Opcional
    // "isCompleted" se inicializa a false en el servicio/schema y no se espera en el DTO de creación.
  }
  ```
- **Respuesta:** `Subtask` (con `id`, `isCompleted`=false, `createdAt`, `updatedAt` y los campos provistos)

#### 2. Listar Subtareas
- **Endpoint:** `GET /subtasks`
- **Descripción:** Obtiene una lista de todas las subtareas.
- **Autenticación:** Requerida.
- **Respuesta:** `Subtask[]`
- **Notas Técnicas:** Para obtener subtareas de una tarea específica, el frontend necesitará filtrar la lista completa por `taskId` o solicitar una mejora al backend para un endpoint como `GET /tasks/:taskId/subtasks` o `GET /subtasks?taskId=uuid-de-la-tarea-padre`.

#### 3. Obtener Subtarea
- **Endpoint:** `GET /subtasks/:id`
- **Respuesta:** `Subtask`

#### 4. Actualizar Subtarea
- **Endpoint:** `PATCH /subtasks/:id`
- **Autenticación:** Requerida.
- **Cuerpo (`UpdateSubtaskDto`):** (Campos opcionales)
  ```json
  {
    "title": "Definir paleta de colores (revisada)",
    "description": "Descripción de subtarea actualizada.",
    "status": "DONE",       // Valores de subtaskStatusEnum
    "priority": "HIGH",       // Valores de subtaskPriorityEnum
    "dueDate": "2025-07-12",
    "assignedToId": "uuid-otro-asignado",
    "isCompleted": true, // Se puede actualizar
    "taskId": "uuid-nueva-tarea-padre" // Si se permite cambiar la tarea padre
  }
  ```
- **Respuesta:** `Subtask` (reflejando los campos actualizados)

#### 5. Eliminar Subtarea
- **Endpoint:** `DELETE /subtasks/:id`
- **Descripción:** Elimina una subtarea de forma permanente.
- **Respuesta:** 204 No Content

### Comentarios (`/comments`)

#### 1. Crear Comentario
- **Endpoint:** `POST /comments`
- **Autenticación:** Requerida.
- **Cuerpo (`CreateCommentDto`):
  ```json
  {
    "content": "Este es un comentario importante sobre la tarea.", // Requerido
    "userId": "uuid-del-usuario-que-comenta", // Requerido (generalmente se obtiene del usuario autenticado en backend)
    "taskId": "uuid-de-la-tarea-asociada", // Opcional, si es para una tarea
    "projectId": "uuid-del-proyecto-asociado" // Opcional, si es para un proyecto
    // Se debe proveer taskId o projectId
  }
  ```
- **Respuesta:** `Comment` (con `id`, `createdAt`, `updatedAt` y los campos provistos)

#### 2. Listar Comentarios
- **Endpoint:** `GET /comments`
- **Descripción:** Obtiene una lista de todos los comentarios.
- **Autenticación:** Requerida.
- **Respuesta:** `Comment[]`
- **Notas Técnicas:** Para obtener comentarios de una tarea o proyecto específico, el frontend necesitará filtrar la lista completa por `taskId` o `projectId` o solicitar una mejora al backend para un endpoint como `GET /tasks/:taskId/comments` o `GET /comments?taskId=uuid-task`.

#### 3. Obtener Comentario
- **Endpoint:** `GET /comments/:id`
- **Respuesta:** `Comment`

#### 4. Actualizar Comentario
- **Endpoint:** `PATCH /comments/:id`
- **Autenticación:** Requerida.
- **Cuerpo (`UpdateCommentDto`):** (Campos opcionales, el servicio actualiza lo que se envíe)
  ```json
  {
    "content": "Comentario actualizado y corregido.",
    "taskId": "uuid-nueva-tarea-si-se-cambia",
    "projectId": "uuid-nuevo-proyecto-si-se-cambia"
    // userId probablemente no debería ser actualizable aquí.
  }
  ```
- **Respuesta:** `Comment` (reflejando los campos actualizados)

#### 5. Eliminar Comentario
- **Endpoint:** `DELETE /comments/:id`
- **Descripción:** Elimina un comentario de forma permanente.
- **Respuesta:** 204 No Content

---

## Módulo 2: Gestión de Clientes (CRM) (FRONT-008, FRONT-009)

### Clientes (`/clients`)

La gestión de clientes se centraliza en este módulo, que interactúa con las tablas `users` y `client_profiles`. **Todos los endpoints de este módulo requieren autenticación JWT.**

#### 1. Crear Perfil de Cliente (para un usuario existente)
- **Endpoint:** `POST /clients`
- **Descripción:** Crea un perfil de cliente para un usuario que ya existe en el sistema y tiene el rol `CLIENT`. Este endpoint es ideal para ser usado por administradores.
- **Cuerpo de la Solicitud (`CreateClientDto`):
  ```json
  {
    "userId": "uuid-del-usuario-existente", // Requerido
    "companyName": "Nombre de la Empresa", // Opcional
    "contactPerson": "Persona de Contacto", // Opcional
    "phone": "+123456789", // Opcional
    "address": "Dirección Completa", // Opcional
    "socialMediaLinks": { // Opcional
      "linkedin": "https://linkedin.com/company/...",
      "twitter": "https://twitter.com/..."
    }
  }
  ```
- **Respuesta Exitosa (201 CREATED - `ClientProfile`):** Devuelve el perfil del cliente creado.
  ```json
  {
    "id": "uuid-del-perfil-cliente",
    "userId": "uuid-del-usuario-existente",
    "companyName": "Nombre de la Empresa",
    "contactPerson": "Persona de Contacto",
    "phone": "+123456789",
    "address": "Dirección Completa",
    "socialMediaLinks": {
      "linkedin": "https://linkedin.com/company/...",
      "twitter": "https://twitter.com/..."
    },
    "status": "ACTIVE",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

#### 2. Listar Clientes
- **Endpoint:** `GET /clients`
- **Descripción:** Obtiene una lista de todos los perfiles de clientes.
- **Respuesta Exitosa (200 OK - `ClientProfile[]`):
  ```json
  [
    {
      "id": "uuid-perfil-1",
      "userId": "uuid-usuario-1",
      "companyName": "Cliente Uno Corp",
      "status": "ACTIVE",
      // ...otros campos del perfil
    }
  ]
  ```

#### 3. Obtener Detalles de un Cliente
- **Endpoint:** `GET /clients/:id`
- **Descripción:** Obtiene el perfil completo de un cliente por el **ID de su perfil**.
- **Parámetros de Ruta:**
    - `id`: UUID del `client_profile`.
- **Respuesta Exitosa (200 OK - `ClientProfile`):** Similar a la respuesta de creación.

#### 4. Actualizar Perfil de Cliente
- **Endpoint:** `PATCH /clients/:id`
- **Descripción:** Actualiza los datos del perfil de un cliente por el **ID de su perfil**.
- **Parámetros de Ruta:**
    - `id`: UUID del `client_profile`.
- **Cuerpo de la Solicitud (`UpdateClientDto`):** (Campos opcionales)
  ```json
  {
    "companyName": "Nuevo Nombre Comercial",
    "contactPerson": "Nuevo Contacto",
    "phone": "+0987654321",
    "address": "Nueva Dirección",
    "socialMediaLinks": { "website": "https://new-website.com" }
  }
  ```
- **Respuesta Exitosa (200 OK - `ClientProfile`):** Devuelve el perfil completo actualizado.

#### 5. Eliminar Perfil de Cliente
- **Endpoint:** `DELETE /clients/:id`
- **Descripción:** Elimina un perfil de cliente por el **ID de su perfil**. No elimina al usuario asociado.
- **Autenticación:** Requerida (JWT).
- **Parámetros de Ruta:**
    - `id`: UUID del `client_profile`.
- **Respuesta Exitosa (200 OK):
  ```json
  {
    "message": "Perfil de cliente eliminado correctamente."
  }
  ```

#### 6. Obtener Perfil por ID de Usuario
- **Endpoint:** `GET /clients/profile/by-user/:userId`
- **Descripción:** Obtiene el perfil de cliente asociado a un ID de usuario específico. Útil para que un cliente obtenga su propio perfil.
- **Autenticación:** Requerida (JWT).
- **Parámetros de Ruta:**
    - `userId`: UUID del `user`.
- **Respuesta Exitosa (200 OK - `ClientProfile`):** Devuelve el perfil del cliente.

#### 7. Completar Perfil de Cliente (para el propio usuario)
- **Endpoint:** `POST /clients/profile/by-user/:userId`
- **Descripción:** Permite a un usuario con rol `CLIENT` que no tiene perfil, crear el suyo. Falla si el perfil ya existe.
- **Parámetros de Ruta:**
    - `userId`: UUID del `user` que está completando su perfil.
- **Cuerpo de la Solicitud (`CompleteClientProfileDto`):
  ```json
  {
    "companyName": "Mi Empresa S.A.", // Requerido
    "contactPerson": "Yo Mismo", // Opcional
    "phone": "+54911...", // Opcional
    "address": "Calle Falsa 123", // Opcional
    "socialMediaLinks": {} // Opcional
  }
  ```
- **Respuesta Exitosa (201 CREATED - `ClientProfile`):** Devuelve el perfil recién creado.

---

## Módulo 3: Facturación y Pagos (FRONT-010, FRONT-011)

### Facturas (`/invoices`)

Este módulo gestiona la creación, visualización y seguimiento de facturas. **Todos los endpoints de este módulo requieren autenticación JWT.**

#### 1. Crear Factura
- **Endpoint:** `POST /invoices`
- **Descripción:** Crea una nueva factura. El backend asigna automáticamente un `invoiceNumber` secuencial y único, calcula el `totalAmount` y establece el `status` inicial en `DRAFT`.
- **Autenticación:** Requerida.
- **Cuerpo de la Solicitud (`CreateInvoiceDto`):
  ```json
  {
    "clientId": "uuid-del-cliente", // Requerido
    "projectId": "uuid-del-proyecto", // Opcional
    "issueDate": "2025-07-10", // Formato YYYY-MM-DD
    "dueDate": "2025-08-10",   // Formato YYYY-MM-DD
    "notes": "Notas adicionales sobre la factura.", // Opcional
    "items": [ // Requerido, al menos un ítem
      {
        "description": "Desarrollo de API",
        "quantity": "40.5",
        "unitPrice": "55.00"
      },
      {
        "description": "Diseño de Base de Datos",
        "quantity": "10",
        "unitPrice": "70.00"
      }
    ]
  }
  ```
- **Respuesta Exitosa (201 CREATED - `Invoice`):
  ```json
  {
    "id": "uuid-de-la-factura",
    "invoiceNumber": "INV-2025-0001",
    "status": "DRAFT",
    "totalAmount": "2927.50",
    "clientId": "uuid-del-cliente",
    "projectId": "uuid-del-proyecto",
    "issueDate": "2025-07-10",
    "dueDate": "2025-08-10",
    "notes": "Notas adicionales sobre la factura.",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "items": [
      {
        "id": "uuid-item-1",
        "description": "Desarrollo de API",
        "quantity": "55.00",
        "unitPrice": "40.50",
        "totalPrice": "2227.50",
        "invoiceId": "uuid-de-la-factura",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
      // ...otros ítems
    ],
    "client": { "id": "...", "name": "...", "email": "..." },
    "project": { "id": "...", "name": "..." }
  }
  ```

#### 2. Listar Facturas
- **Endpoint:** `GET /invoices`
- **Descripción:** Obtiene una lista de todas las facturas con sus relaciones (cliente, proyecto, ítems).
- **Autenticación:** Requerida.
- **Respuesta Exitosa (200 OK - `Invoice[]`):** Un array de objetos `Invoice`.

#### 3. Obtener Detalles de una Factura
- **Endpoint:** `GET /invoices/:id`
- **Descripción:** Obtiene los detalles completos de una factura por su ID.
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID de la factura.
- **Respuesta Exitosa (200 OK - `Invoice`):** Similar a la respuesta de creación.

#### 4. Actualizar Factura
- **Endpoint:** `PATCH /invoices/:id`
- **Descripción:** Actualiza los datos de una factura. Si se proporciona un nuevo array de `items`, reemplazará completamente a los existentes. El `totalAmount` se recalcula si se modifican los ítems.
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID de la factura.
- **Cuerpo de la Solicitud (`UpdateInvoiceDto`):** (Campos opcionales)
  ```json
  {
    "status": "SENT", // Valores de invoiceStatusEnum: 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID'
    "notes": "Factura enviada al cliente.",
    "items": [
      {
        "description": "Servicio de consultoría (actualizado)",
        "quantity": "20",
        "unitPrice": "100.00"
      }
    ]
  }
  ```
- **Respuesta Exitosa (200 OK - `Invoice`):** Devuelve la factura completa y actualizada.

#### 5. Anular Factura (Soft Delete)
- **Endpoint:** `DELETE /invoices/:id`
- **Descripción:** Realiza un borrado lógico de la factura, cambiando su `status` a `VOID`. La factura no se elimina de la base de datos.
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID de la factura.
- **Respuesta Exitosa (200 OK - `Invoice`):** Devuelve la factura con el estado `VOID`.

---

## Panel del Cliente (FRONT-009)
Para el panel del cliente, el frontend necesitará:
1. Autenticar al usuario con rol `CLIENT`.
2. Obtener el `id` del usuario autenticado (`currentUser.id`) desde `GET /auth/me`.
3. Realizar las siguientes llamadas y procesar los datos:
    - **Proyectos del Cliente:** `GET /projects`. Filtrar donde `project.clientId === currentUser.id`.
    - **Tareas del Cliente:** `GET /tasks`. Filtrar las tareas que pertenezcan a los proyectos del cliente.
    - **Facturas del Cliente:** `GET /invoices`. Filtrar donde `invoice.clientId === currentUser.id`.
    - **Perfil del Cliente:** `GET /clients`. Buscar el perfil donde `client.userId === currentUser.id` para mostrar datos como `companyName`, `contactPerson`, etc.

---

## Notas Generales para el Frontend

- **Autenticación:** Todas las rutas (excepto `/auth/login` y `/auth/register`) requieren una cabecera `Authorization: Bearer <JWT_TOKEN>`.
- **Manejo de Errores:** La API utiliza códigos de estado HTTP estándar (400, 401, 403, 404, 500). El cuerpo de la respuesta del error usualmente contiene un objeto JSON con detalles.
  ```json
  {
    "statusCode": 404,
    "message": "Cliente con ID '...' no encontrado.",
    "error": "Not Found"
  }
  ```
- **Paginación y Filtrado:** Los endpoints de listado (`GET /projects`, `GET /tasks`, etc.) no soportan paginación ni filtrado avanzado por parámetros de query en el backend. Estas operaciones deben ser manejadas en el frontend sobre el conjunto completo de datos o ser solicitadas como mejoras.
- **Roles y Permisos:** El frontend debe gestionar la visibilidad de acciones y vistas basándose en el rol del usuario obtenido de `/auth/me`. El backend aplica una segunda capa de autorización a nivel de API.
- **DTOs (Data Transfer Objects):** Los cuerpos de las solicitudes deben adherirse estrictamente a las estructuras definidas por los DTOs del backend para evitar errores de validación (400 Bad Request).
