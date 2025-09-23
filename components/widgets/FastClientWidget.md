# FastClientWidget - Componente Reutilizable

## Descripción
El `FastClientWidget` es un componente reutilizable que permite crear clientes FAST_CLIENT de manera rápida desde cualquier formulario del sistema.

## Características

### 🎯 **Principios SOLID Aplicados**
- **S (Single Responsibility)**: Solo se encarga de crear FAST_CLIENT
- **O (Open/Closed)**: Extensible mediante props, cerrado para modificación
- **L (Liskov Substitution)**: Implementa interfaz consistente
- **I (Interface Segregation)**: Props específicas y opcionales
- **D (Dependency Inversion)**: Usa callbacks para comunicación

### 🎨 **Modos de Visualización**
1. **Modo Completo**: Card completa con título, descripción y formulario
2. **Modo Compacto**: Input inline con botón para espacios reducidos

### 🔧 **Props Interface**
```typescript
interface FastClientWidgetProps {
  onClientCreated?: (client: FastClientData) => void;
  onError?: (error: string) => void;
  className?: string;
  isCompact?: boolean;
  disabled?: boolean;
}
```

## Implementación

### Ejemplo 1: Modo Completo (Formulario de Proyectos)
```tsx
import FastClientWidget from '@/components/widgets/FastClientWidget';

const handleFastClientCreated = (client: { id: string; name: string }) => {
  // Actualizar lista de clientes
  fetchClients();
  // Seleccionar automáticamente el nuevo cliente
  setClientId(client.id);
  // Cerrar widget
  setShowFastClientWidget(false);
};

<FastClientWidget
  onClientCreated={handleFastClientCreated}
  onError={(error) => setError(error)}
  className="mt-2"
/>
```

### Ejemplo 2: Modo Compacto (Sidebar o Toolbar)
```tsx
<FastClientWidget
  isCompact={true}
  onClientCreated={handleClientCreated}
  disabled={isLoading}
  className="mb-4"
/>
```

## Estados del Widget

### 🔄 **Estados Visuales**
- **idle**: Estado inicial, listo para crear
- **creating**: Mostrando loader durante creación
- **success**: Confirmación visual de éxito
- **error**: Mensaje de error con opción de reintentar

### 🎨 **Indicadores Visuales**
- **Iconos dinámicos**: UserPlus → Loader → CheckCircle → XCircle
- **Colores del sistema**: Palero theme compliant
- **Animaciones sutiles**: Spinner y transiciones suaves

## Integración con Formularios Existentes

### Patrón Recomendado
```tsx
const [showFastClientWidget, setShowFastClientWidget] = useState(false);

// En la sección de selección de cliente
<div className="flex items-center justify-between">
  <span className="text-xs text-palero-navy2">
    Need to create a new client?
  </span>
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => setShowFastClientWidget(!showFastClientWidget)}
    className="border-palero-teal1/30 text-palero-teal1 hover:bg-palero-teal1/10"
  >
    <Plus className="mr-1 h-3 w-3" />
    Quick Client
  </Button>
</div>

{showFastClientWidget && (
  <FastClientWidget
    onClientCreated={handleFastClientCreated}
    onError={(error) => setError(error)}
  />
)}
```

## Casos de Uso

### ✅ **Recomendado para**
- Formularios de creación de proyectos
- Formularios de creación de tareas
- Formularios de creación de facturas
- Cualquier formulario que requiera selección de cliente

### ❌ **No recomendado para**
- Páginas dedicadas exclusivamente a gestión de clientes
- Formularios donde el cliente es opcional
- Contextos donde se requiere información completa del cliente

## Beneficios

### 🚀 **UX/UI**
- **Flujo rápido**: Crear cliente sin salir del formulario actual
- **Feedback inmediato**: Estados visuales claros
- **Integración sutil**: No interrumpe el flujo principal

### 🛠️ **Desarrollo**
- **Reutilizable**: Una vez implementado, usar en múltiples lugares
- **Mantenible**: Cambios centralizados en un componente
- **Testeable**: Componente aislado y testeable individualmente

### 🎯 **Negocio**
- **Eficiencia**: Reduce pasos en procesos de trabajo
- **Adopción**: Facilita la creación de clientes internos
- **Consistencia**: Mismo comportamiento en toda la app

## Próximas Extensiones Posibles

1. **Auto-completado inteligente**: Sugerir nombres basados en entrada
2. **Validación avanzada**: Verificar duplicados antes de crear
3. **Templates**: Plantillas predefinidas para tipos de cliente
4. **Batch creation**: Crear múltiples clientes rápidos
5. **Integration hooks**: Callbacks para analytics y logging