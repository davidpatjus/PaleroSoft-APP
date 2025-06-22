# Tickets de Desarrollo Frontend: CRM PaleroSoft (Next.js + Tailwind + shadcn/ui)

Este documento define los tickets de desarrollo frontend para el MVP del CRM PaleroSoft, alineados con los módulos y flujos del backend. El objetivo es entregar una app usable y validable hasta el Módulo 2 (Proyectos y Clientes), con autenticación JWT y vistas diferenciadas por rol.

---

## Fase 0: Core y Autenticación

### FRONT-001: Configuración Inicial del Proyecto Next.js
- Crear proyecto Next.js con TypeScript, Tailwind CSS y shadcn/ui.
- Configurar estructura de carpetas (app, components, hooks, services, etc.).
- Integrar eslint, prettier y configuración básica de calidad de código.

### FRONT-002: Sistema de Autenticación (JWT)
- Implementar login y registro de usuarios (consumiendo endpoints del backend).
- Guardar JWT en localStorage tras login/registro.
- Implementar contexto de usuario y hook de autenticación.
- Proteger rutas según autenticación y rol (admin, gestor, cliente).
- Implementar logout y expiración de sesión.

### FRONT-003: Layout General y Navegación
- Crear layout principal con sidebar y topbar responsivos.
- Menú dinámico según rol del usuario.
- Implementar rutas públicas (login, registro) y privadas (dashboard, módulos).

---

## Módulo 1: Gestión de Proyectos y Tareas

### FRONT-004: Dashboard Inicial
- Vista de bienvenida con resumen de proyectos, tareas y accesos rápidos.
- Mostrar métricas básicas (proyectos activos, tareas pendientes, etc.).

### FRONT-005: CRUD de Proyectos
- Listar proyectos (tabla y vista Kanban).
- Crear, editar y eliminar proyectos (formularios con validación).
- Asignar cliente y miembros del equipo al crear/editar proyecto.
- Filtros por estado, cliente y búsqueda.

### FRONT-006: Tablero Kanban de Tareas
- Visualizar tareas de un proyecto en tablero Kanban (drag & drop, react-beautiful-dnd o similar).
- Cambiar estado de tareas arrastrando entre columnas.
- Crear, editar y eliminar tareas y subtareas.
- Asignar responsables, fechas límite y prioridad.
- Adjuntar archivos y agregar comentarios a tareas.

### FRONT-007: Detalle de Proyecto y Tarea
- Vista detallada de proyecto (info, tareas, archivos, comentarios).
- Vista detallada de tarea (checklist, historial, comentarios, adjuntos).

---

## Módulo 2: Gestión de Clientes (CRM)

### FRONT-008: CRUD de Clientes
- Listar clientes (tabla con filtros y búsqueda).
- Crear, editar y eliminar clientes (formularios con validación).
- Ver perfil de cliente (datos, proyectos asociados, historial de interacción).

### FRONT-009: Panel del Cliente
- Vista personalizada para usuarios con rol CLIENTE.
- Mostrar proyectos, tareas, archivos y facturas del cliente autenticado.
- Permitir descarga de archivos y envío de comentarios.

---

## Extras y Consideraciones

### FRONT-010: Manejo de Errores y Feedback
- Mostrar mensajes claros de error y éxito en formularios y acciones.
- Loading states y skeletons para mejorar UX.

### FRONT-011: Accesibilidad y Responsividad
- Garantizar que todas las vistas sean responsivas (desktop y mobile).
- Aplicar buenas prácticas básicas de accesibilidad (a11y).

### FRONT-012: Branding y Personalización
- Aplicar colores, logos y fuentes del cliente (si están definidos).
- Personalización mínima usando Tailwind y shadcn/ui.

---

## Alcance de la Demo MVP
- Todo el flujo de autenticación, gestión de proyectos (incluyendo Kanban), tareas y clientes debe estar funcional y validado para la revisión con el cliente.
- Los módulos siguientes (facturación, chat, notificaciones, etc.) quedarán planificados para fases posteriores.

---

Este documento servirá como guía para el desarrollo frontend y la priorización de tareas en el MVP.
