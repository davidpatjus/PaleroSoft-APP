# Documentación - Endpoint Fast Client

## 📋 Resumen

El endpoint de **Fast Client** permite crear usuarios tipo cliente rápido para gestión interna sin necesidad de credenciales de acceso (email/password). Estos usuarios están diseñados para casos donde se necesita asignar proyectos a clientes que no requieren acceso al sistema.

---

## 🔗 Endpoint: Crear Fast Client

### **POST** `/api/users/fast-client`

Crea un nuevo usuario con rol `FAST_CLIENT` y su perfil de cliente básico.

---

## 📝 Request

### **Headers**
```http
Content-Type: application/json
```

### **Body (JSON)**
```json
{
  "name": "string" // REQUERIDO: Nombre del cliente/empresa
}
```

### **Ejemplo de Request**
```javascript
// Fetch API
const response = await fetch('/api/users/fast-client', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "Empresa ABC S.A."
  })
});

const fastClient = await response.json();
```

---

## 📤 Response

### **Status: 201 Created**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Empresa ABC S.A.",
  "role": "FAST_CLIENT",
  "createdAt": "2025-09-22T15:30:00.000Z",
  "updatedAt": "2025-09-22T15:30:00.000Z"
}
```

### **Campos de Response**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID único del usuario |
| `name` | `string` | Nombre del cliente/empresa |
| `role` | `string` | Siempre será `"FAST_CLIENT"` |
| `createdAt` | `string` | Fecha de creación (ISO 8601) |
| `updatedAt` | `string` | Fecha de última actualización (ISO 8601) |

**Nota:** Los campos `email` y `password` no aparecen en la respuesta ya que los fast clients no los tienen.

---

## ⚠️ Errores Posibles

### **400 Bad Request**
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "name must be a string"
  ],
  "error": "Bad Request"
}
```

### **401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### **500 Internal Server Error**
```json
{
  "statusCode": 500,
  "message": "Error interno del servidor"
}
```

---

## 📊 Comportamiento del Sistema

### **Lo que sucede automáticamente:**

1. ✅ **Usuario creado** con rol `FAST_CLIENT`
2. ✅ **Perfil de cliente básico** creado automáticamente con:
   - `userId`: ID del usuario creado
   - `companyName`: Mismo valor que `name`
   - `status`: `"PROSPECT"` por defecto
   - Otros campos: `null` (se pueden completar después)

### **Características importantes:**

- ✅ **Sin credenciales**: No tienen email ni password
- ✅ **No pueden hacer login**: Excluidos del sistema de autenticación
- ✅ **Solo gestión interna**: Para asignación de proyectos
- ✅ **Perfil expandible**: Se puede completar más información después

---

## 🔄 Endpoints Relacionados

### **Completar información del cliente:**
- `PATCH /api/clients/{clientId}` - Para agregar más datos al perfil
- `GET /api/clients/{clientId}` - Para obtener el perfil completo

### **Gestión de usuarios:**
- `GET /api/users` - Lista todos los usuarios (incluye fast clients)
- `GET /api/users/{userId}` - Obtener usuario específico
- `DELETE /api/users/{userId}` - Eliminar usuario

### **Asignación a proyectos:**
- `POST /api/projects` - Crear proyecto y asignar al fast client
- `PATCH /api/projects/{projectId}` - Actualizar proyecto con fast client

---

## 💡 Tips de Implementación

### **Filtros en Lista de Usuarios:**
```javascript
const filterFastClients = (users) => {
  return users.filter(user => user.role === 'FAST_CLIENT');
};

const filterRegularUsers = (users) => {
  return users.filter(user => user.role !== 'FAST_CLIENT');
};
```

---

## 🎯 Casos de Uso

1. **Cliente nuevo sin sistema**: Crear fast client para asignar proyecto inmediatamente
2. **Gestión rápida**: Agregar cliente para cotización sin proceso completo
3. **Proyectos internos**: Clientes que no necesitan acceso al sistema
4. **Migración de datos**: Importar clientes existentes sin credenciales

Esta documentación te permitirá integrar fácilmente el endpoint de fast clients en tu frontend. ¿Necesitas alguna aclaración o ejemplo adicional?