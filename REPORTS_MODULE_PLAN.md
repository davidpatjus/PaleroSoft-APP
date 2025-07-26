# Plan de Desarrollo: Módulo de Estadísticas y Reportes

## Análisis de Contexto y Métricas Relevantes

Para construir un dashboard de reportes útil, primero debemos identificar qué datos podemos extraer y qué métricas son valiosas para un administrador o un miembro del equipo. Basado en las interfaces existentes (`Invoice`, `Project`, `Task`, `ClientProfile`, `User`), podemos calcular:

1.  **Métricas Financieras (de `Invoice`):**
    *   Ingresos totales, pagados y pendientes.
    *   Facturación por período (mes, trimestre, año).
    *   Rendimiento por cliente (quiénes generan más ingresos).
    *   Tiempo promedio de pago de facturas.
    *   Distribución de estados de facturas (Borrador, Enviada, Pagada, Vencida).

2.  **Métricas de Proyectos (de `Project`):**
    *   Número de proyectos por estado (Pendiente, En Progreso, Completado, etc.).
    *   Duración promedio de los proyectos.
    *   Carga de trabajo: proyectos por cliente.
    *   Tasa de finalización de proyectos.

3.  **Métricas de Productividad (de `Task` y `User`):**
    *   Distribución de tareas por estado (To Do, In Progress, Done).
    *   Distribución de tareas por prioridad (Alta, Media, Baja).
    *   Carga de trabajo por miembro del equipo (tareas asignadas).
    *   Tasa de finalización de tareas.

4.  **Métricas de Clientes (de `ClientProfile`):**
    *   Adquisición de nuevos clientes por período.
    *   Distribución de clientes por estado (Prospecto, Activo, Inactivo).

---

## Plan de Desarrollo y Ejecución

Este plan está diseñado para ser ejecutado paso a paso, asegurando una base sólida y una implementación coherente.

### Fase 1: Estructura y Cimientos del Módulo

El primer paso es crear la estructura de archivos y la ruta para nuestro nuevo módulo.

- [ ] **Tarea 1.1: Crear la nueva ruta y página.**
  - Crear el archivo: `app/(protected)/reports/page.tsx`.
  - Este archivo contendrá el layout principal del dashboard de reportes.

- [ ] **Tarea 1.2: Añadir enlace en la navegación.**
  - Editar `components/Layout/Sidebar.tsx`.
  - Añadir un nuevo `SidebarItem` para "Reports" con un ícono apropiado (ej. `BarChart2` de `lucide-react`).

- [ ] **Tarea 1.3: Actualizar permisos de acceso.**
  - Editar `utils/permissions.ts`.
  - Asegurarse de que los roles `ADMIN` y `TEAM_MEMBER` tengan acceso a la nueva ruta `/reports`.

### Fase 2: Lógica de Datos y Métricas

Como no tenemos endpoints de backend, crearemos una capa de servicio en el frontend para obtener y procesar los datos de los endpoints existentes.

- [ ] **Tarea 2.1: Crear un hook personalizado para la data.**
  - Crear el archivo: `hooks/useAnalyticsData.ts`.
  - Este hook será responsable de:
    1.  Hacer llamadas en paralelo a `apiClient.getInvoices()`, `apiClient.getProjects()`, `apiClient.getTasks()`, y `apiClient.getClients()`.
    2.  Manejar estados de carga (`isLoading`) y errores (`error`).
    3.  Procesar los datos crudos para calcular todas las métricas definidas anteriormente (ej. `calculateFinancialMetrics`, `calculateProjectMetrics`, etc.).
    4.  Devolver los datos procesados y listos para ser consumidos por los componentes de la UI.

### Fase 3: Maquetación del Dashboard de Reportes

Con la estructura y la lógica de datos planificada, construiremos la interfaz principal.

- [ ] **Tarea 3.1: Diseñar el layout principal en `reports/page.tsx`.**
  - Añadir un encabezado de página similar a los otros módulos (`Invoices Management`, `Tasks`, etc.), con título "Reports & Analytics" y una descripción.
  - Crear un sistema de filtros globales, principalmente un **selector de rango de fechas** (ej. "Últimos 30 días", "Este mes", "Últimos 90 días", "Todo el tiempo") que recalculará las métricas.
  - Dividir la página en secciones temáticas usando `Card` como contenedores: "Financial Overview", "Project Health", "Team Productivity", "Client Insights".

- [ ] **Tarea 3.2: Crear componentes de estadísticas reutilizables.**
  - Crear un componente `StatCard.tsx` en `components/ui/` que reciba un título, un valor, un ícono y opcionalmente una tendencia (ej. +5% desde el mes pasado). Usaremos este componente para mostrar las métricas clave en la parte superior.

### Fase 4: Implementación de Gráficos y Visualizaciones

Ahora daremos vida a los datos con gráficos interactivos.

- [ ] **Tarea 4.1: Gráfico de Ingresos.**
  - Crear un componente `RevenueChart.tsx`.
  - Usará el componente `Chart` de `recharts` (ya presente en el proyecto) para mostrar un gráfico de barras o líneas con los ingresos a lo largo del tiempo, según el filtro de fecha seleccionado.

- [ ] **Tarea 4.2: Gráfico de Estado de Proyectos y Tareas.**
  - Crear un componente `StatusDistributionChart.tsx`.
  - Será un gráfico de tipo dona (donut chart) o de barras que muestre la distribución de proyectos/tareas por estado (`PENDING`, `IN_PROGRESS`, etc.).

- [ ] **Tarea 4.3: Gráfico de Carga de Trabajo del Equipo.**
  - Crear un componente `WorkloadChart.tsx`.
  - Un gráfico de barras que muestre el número de tareas asignadas a cada `TEAM_MEMBER`.

- [ ] **Tarea 4.4: Listas de "Top 5".**
  - Crear un componente `TopList.tsx`.
  - Mostrará listas como "Top 5 Clientes por Ingresos" o "Top 5 Proyectos más largos".

### Fase 5: Integración y Pulido Final

El último paso es unir todo, asegurar que sea funcional y visualmente coherente.

- [ ] **Tarea 5.1: Integrar todos los componentes en `reports/page.tsx`.**
  - Llamar al hook `useAnalyticsData` para obtener las métricas.
  - Pasar los datos a los `StatCard`, `RevenueChart` y otros componentes de visualización.
  - Conectar el filtro de fecha para que los datos y gráficos se actualicen dinámicamente.

- [ ] **Tarea 5.2: Implementar diseño responsive.**
  - Asegurar que el grid de estadísticas y los gráficos se adapten correctamente a pantallas móviles, usando `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` y otras utilidades de Tailwind CSS.

- [ ] **Tarea 5.3: Añadir estados de carga y vacío.**
  - Mostrar `skeletons` (esqueletos de carga) mientras el hook `useAnalyticsData` está obteniendo y procesando los datos.
  - Mostrar un mensaje amigable si no hay suficientes datos para generar los reportes.
