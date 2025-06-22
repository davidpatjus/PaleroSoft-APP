# Guía de Endpoints API para Frontend - CRM PaleroSoft

Este documento detalla los endpoints de la API backend que el equipo de frontend necesitará para desarrollar las funcionalidades del CRM PaleroSoft, basándose en los tickets definidos en `tickets_frontend_crm.md` y el estado actual de la API y sus servicios, y el `schema.ts`.

---

## Fase 0: Core y Autenticación (FRONT-001, FRONT-002, FRONT-003)

### Autenticación (`/auth`)

#### 1. Registro de Usuario
- **Endpoint:** `POST /auth/register`
- **Descripción:** Registra un nuevo usuario en el sistema.
- **Cuerpo de la Solicitud (`RegisterAuthDto`):
  ```json
  {
    "fullName": "Nombre Completo Apellido",
    "email": "user@example.com",
    "password": "password123"
    // El 'role' se asigna por defecto a 'CLIENT' en UsersService.
    // RegisterAuthDto de AuthService no toma 'role'.
    // UsersService.create lo usa si se le pasa, pero AuthService no lo hace.
  }
  ```
- **Respuesta Exitosa (201 CREATED - `AuthResponse`):
  ```json
  {
    "user": {
      "id": "uuid-del-usuario",
      "fullName": "Nombre Completo Apellido", // Mapeado desde user.name por AuthService
      "email": "user@example.com",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
      // El rol no se devuelve explícitamente en este objeto user de AuthService
    },
    "accessToken": "jwt.token.aqui"
  }
  ```
- **Notas:** El token JWT debe guardarse. `AuthService` mapea `user.name` (de la DB) a `fullName` en la respuesta.

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
      "fullName": "Nombre Completo Apellido", // Mapeado desde user.name por AuthService
      "email": "user@example.com",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
      // El rol no se devuelve explícitamente en este objeto user de AuthService
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
    "name": "Nombre Completo Apellido", // Campo 'name' de la tabla users
    "role": "CLIENT", // O 'ADMIN', 'TEAM_MEMBER' según el usuario
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
    // No incluye la contraseña. El campo isActive no existe en usersTable.
  }
  ```
- **Notas:** Esta respuesta proviene de `UsersService` y sí incluye el `name` y `role` reales de la base de datos.

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
- **Notas:** Actualmente, el endpoint base `GET /projects` devuelve todos los proyectos. El filtrado específico (por estado, cliente, búsqueda) deberá implementarse en el frontend si es necesario sobre la data completa, o solicitarse como mejora al backend.

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
- **Descripción:** Elimina un proyecto (puede ser soft delete).
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID del proyecto.
- **Respuesta Exitosa (204 No Content o similar):** No devuelve cuerpo.

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
- **Notas:** Actualmente, `GET /tasks` devuelve todas las tareas. El filtrado (por proyecto, estado, asignado) deberá realizarse en el frontend con los datos obtenidos o solicitarse como mejora al backend para implementarlo vía query params.

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
- **Descripción:** Elimina una tarea.
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID de la tarea.
- **Respuesta Exitosa (204 No Content o similar):** No devuelve cuerpo.

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
- **Notas:** Para obtener subtareas de una tarea específica, el frontend necesitará filtrar la lista completa por `taskId` o solicitar una mejora al backend para un endpoint como `GET /tasks/:taskId/subtasks` o `GET /subtasks?taskId=uuid-de-la-tarea-padre`.

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
- **Notas:** Para obtener comentarios de una tarea o proyecto específico, el frontend necesitará filtrar la lista completa por `taskId` o `projectId` o solicitar una mejora al backend para un endpoint como `GET /tasks/:taskId/comments` o `GET /comments?taskId=uuid-task`.

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
- **Respuesta:** 204 No Content

---

## Módulo 2: Gestión de Clientes (CRM) (FRONT-008, FRONT-009)

### Clientes (Gestionados a través de `/users`)

*Actualmente, no existe un `ClientsController` dedicado. La gestión de clientes se realiza a través del `UsersController` existente, identificando a los clientes por su rol. Cuando un usuario con rol 'CLIENT' es creado vía `POST /users` o `POST /auth/register` (que internamente usa `UsersService.create`), un `ClientProfile` básico es creado automáticamente con `status: 'PROSPECT'`.*

#### 1. Crear Cliente (Usuario con rol "cliente")
- **Endpoint:** `POST /users`
- **Descripción:** Crea un nuevo usuario. Si el rol es 'CLIENT' (o se omite, ya que es el default en `UsersService`), se crea también un perfil de cliente básico (`status: 'PROSPECT'`).
- **Cuerpo de la Solicitud (`CreateUserDto`):
  ```json
  {
    "email": "cliente@example.com",
    "password": "securepassword",
    "fullName": "Empresa Cliente SA de CV", // Se guarda en el campo 'name' en la tabla users
    "role": "CLIENT" // Valores de userRoleEnum: 'ADMIN', 'TEAM_MEMBER', 'CLIENT'. Opcional, por defecto 'CLIENT' en UsersService.
  }
  ```
- **Respuesta Exitosa (201 CREATED - `UserResponse`):
  ```json
  {
    "id": "uuid-del-cliente",
    "email": "cliente@example.com",
    "name": "Empresa Cliente SA de CV",
    "role": "CLIENT",
    // isActive no existe en la tabla users
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
    // No incluye contraseña
  }
  ```

#### 2. Listar Clientes (Usuarios con rol "cliente")
- **Endpoint:** `GET /users`
- **Descripción:** Obtiene una lista de todos los usuarios. El frontend deberá filtrar localmente aquellos usuarios que tengan `role === 'cliente'`.
- **Autenticación:** Requerida (probablemente rol admin/gestor).
- **Respuesta Exitosa (200 OK - `UserResponse[]`):
  ```json
  [
    {
      "id": "uuid-cliente-1",
      "name": "Cliente Uno",
      "role": "CLIENT", // Corregido de "cliente" a "CLIENT"
      // ...
    },
    {
      "id": "uuid-gestor-1",
      "name": "Gestor Principal",
      "role": "TEAM_MEMBER", // Asumiendo un rol válido, corregido de "gestor"
      // ...
    }
  ]
  ```
- **Notas:** El backend no ofrece actualmente un filtrado por rol en `GET /users`. El frontend debe realizar este filtro.

#### 3. Obtener Detalles de un Cliente
- **Endpoint:** `GET /users/:id`
- **Descripción:** Obtiene los detalles de un usuario/cliente específico.
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID del usuario/cliente.
- **Respuesta Exitosa (200 OK - `UserResponse`):
  ```json
  {
    "id": "uuid-del-cliente",
    "name": "Empresa Cliente SA de CV",
    "role": "CLIENT",
    // "isActive": true, // Eliminado, no existe en usersTable
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
    // ...datos del cliente, proyectos asociados (requerirá lógica adicional o endpoints)
  }
  ```

#### 4. Actualizar Cliente (Datos básicos del Usuario)
- **Endpoint:** `PATCH /users/:id`
- **Descripción:** Actualiza los datos básicos de un usuario (cliente o cualquier otro rol).
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID del usuario/cliente.
- **Cuerpo de la Solicitud (`UpdateUserDto`):
  ```json
  {
    "fullName": "Nuevo Nombre Cliente Inc.", // Actualiza el campo 'name'
    "email": "nuevo_email@example.com",   // Opcional
    "password": "nuevaSuperSegura123"      // Opcional, si se desea cambiar
  }
  ```
- **Respuesta Exitosa (200 OK - `UserResponse`):** (Refleja los campos actualizados del usuario)
- **Notas Importantes:**
    - Este endpoint **NO** actualiza campos específicos del `ClientProfile` (como `companyName`, `contactPerson`, `phone`, `address`, `status` del perfil de cliente, etc.).
    - Para actualizar esos detalles del perfil de cliente, se necesitaría un endpoint dedicado (ej. `PATCH /client-profiles/:userId`) que actualmente no está expuesto a través de un controlador.

#### 5. Eliminar Cliente
- **Endpoint:** `DELETE /users/:id`
- **Descripción:** Elimina un usuario/cliente (hard delete) y su perfil de cliente asociado si existe (por la configuración de la base de datos con `onDelete: 'CASCADE'` en la relación `userId` de `clientProfilesTable`).
- **Autenticación:** Requerida.
- **Parámetros de Ruta:**
    - `id`: UUID del usuario/cliente.
- **Respuesta Exitosa (204 No Content):** No devuelve cuerpo.

### Panel del Cliente (FRONT-009)
Para el panel del cliente, el frontend necesitará:
1. Autenticar al usuario con rol "CLIENTE".
2. Obtener el `id` del usuario autenticado (`currentUser.id`) y su `role` desde `GET /auth/me`.
3. Realizar las siguientes llamadas y filtrar/procesar los datos en el frontend:
    - **Proyectos del Cliente:** Llamar a `GET /projects`. Luego, filtrar los proyectos donde `project.clientId === currentUser.id`. El campo `clientId` en `CreateProjectDto` y la interfaz `Project` es crucial.
    - **Tareas del Cliente:** Llamar a `GET /tasks`. Luego, filtrar las tareas donde `task.assignedToId === currentUser.id` o aquellas tareas que pertenezcan a proyectos del cliente (requiere obtener primero los proyectos del cliente y luego filtrar tareas por `task.projectId`).
- **Archivos y Facturas:** Estos módulos no están implementados en el backend actual. Requerirán nuevos endpoints (`/files`, `/invoices`) en el futuro.
- **Visualización de Datos del Perfil de Cliente:** Para mostrar datos como `companyName`, `contactPerson`, etc., el frontend necesitaría un endpoint para obtener el `ClientProfile` (ej. `GET /client-profiles/user/:userId`), que actualmente no está expuesto.

---

## Notas Generales para el Frontend

- **Autenticación:** Todas las rutas (excepto `/auth/login` y `/auth/register`) requerirán un `Authorization: Bearer <JWT_TOKEN>` header.
- **Manejo de Errores:** La API devolverá códigos de estado HTTP estándar para errores (400, 401, 403, 404, 500). El cuerpo de la respuesta del error usualmente contendrá un mensaje.
  ```json
  {
    "statusCode": 400,
    "message": "Validación fallida o datos incorrectos.",
    "error": "Bad Request"
  }
  ```
- **Paginación y Filtrado:** Actualmente, los endpoints de listado (`GET /projects`, `GET /tasks`, etc.) no soportan paginación ni filtrado avanzado por parámetros de query desde el backend. Estas funcionalidades deberían ser manejadas en el frontend sobre el conjunto completo de datos o ser solicitadas como mejoras al backend.
- **Roles y Permisos:** El frontend deberá manejar la visibilidad de ciertas acciones/vistas basándose en el rol del usuario obtenido de `/auth/me`. El backend también aplicará la autorización a nivel de API.
- **DTOs (Data Transfer Objects):** Los cuerpos de las solicitudes y las respuestas seguirán las estructuras definidas por los DTOs e Interfaces en el backend. Es importante que el frontend envíe los datos en el formato esperado.

Este documento es una guía inicial basada en el estado actual del backend y sus servicios, y el `schema.ts`. A medida que el desarrollo avance, pueden surgir nuevos endpoints o modificaciones a los existentes. La comunicación constante entre los equipos de frontend y backend es clave.
