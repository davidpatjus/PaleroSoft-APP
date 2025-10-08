# Guía Técnica de Auditoría (Frontend) – Módulo de Almacenamiento

Esta guía está orientada a auditores técnicos y líderes de frontend para verificar la correcta integración del módulo de Storage desde aplicaciones Next.js. Cubre arquitectura, contratos de API, seguridad, manejo de errores, performance, observabilidad y cumplimiento.

Última actualización: 2025-10-03

---

## 1. Arquitectura y Responsabilidades

- Frontend (Next.js) no gestiona credenciales de Storage ni tokens de Supabase. Todo acceso a objetos se realiza vía API backend.
- Buckets:
  - `images` (público): imágenes accesibles por URL pública (no sensibles).
  - `files` (privado): documentos sensibles; acceso vía URL firmada y expirable.
- BD: `file_attachments` almacena metadatos: filePath, fileType, entityType, entityId, uploadedById, createdAt.
- Relación polimórfica: (entityType, entityId) → PROJECT | TASK | CLIENT_DOCUMENT.

Flujos soportados:
- Upload (multipart) → validación (tipo/tamaño/entidad/usuario) → guarda en Storage → inserta metadatos en BD.
- Listado por entidad/usuario → render adaptado por tipo.
- URL pública (images) y URL firmada (files) → consumo seguro.
- Eliminación segura (storage + BD) con logs.

---

## 2. Contratos de API (estable)

Base URL: `NEXT_PUBLIC_API_URL` (p.ej., `http://localhost:3000`).

- POST `/storage/upload`
  - Body: `multipart/form-data`
    - file: File (requerido)
    - entityType: 'PROJECT' | 'TASK' | 'CLIENT_DOCUMENT'
    - entityId: UUID
    - uploadedById: UUID
    - customFileName?: string
  - 200: `{ message, data: { id, fileName, filePath, fileType, entityType, entityId, uploadedById, createdAt, publicUrl? } }`
  - 400/404/500: `{ message, code }`

- GET `/storage/list`
  - Query: `entityType?`, `entityId?`, `uploadedById?`, `limit?`, `offset?`
  - 200: `{ files: FileAttachment[], total, limit, offset }`

- GET `/storage/public-url`
  - Query: `bucket=images|files`, `filePath`
  - 200: `{ publicUrl }` (nota: para files/privado no usar en UI)

- GET `/storage/download`
  - Query: `bucket=files|images`, `filePath`, `expiresIn?` (default 3600)
  - 200: `{ signedUrl, expiresIn }`

- DELETE `/storage/:fileId`
  - 200: `{ message, fileId }`

- POST `/storage/initialize` → idempotente
- GET `/storage/buckets` → diagnóstico
- GET `/storage/stats` → diagnóstico

---

## 3. Requisitos de Integración (Frontend)

- No persistir URLs públicas/firmadas en estado a largo plazo. Generarlas on-demand con `filePath`.
- Validar en cliente tamaño y tipo de archivos antes de POST `/storage/upload`.
- Diferenciar UI por tipo:
  - `image/*` → render directo con `public-url`.
  - `application/*` (PDF/docs) → `download` con URL firmada.
- Implementar reintento simple (1 intento) en fallos transitorios de red.
- Deshabilitar UI durante upload; mostrar progreso y mensajes claros.
- Paginación en listados con `limit/offset`.

---

## 4. Seguridad y Cumplimiento

- Minimizar superficie pública: solo `images` usa public-url; documentos en `files` siempre con URL firmada.
- No exponer IDs internos en rutas si no es necesario (usar UUIDs ya expuestos por el backend).
- Sanitizar nombres visibles de archivos (mostrar `fileName` original, no `filePath`).
- No renderizar directamente archivos ejecutables/HTML; limitar a imágenes previsibles y PDFs en visor.
- Caducidad de URLs firmadas: `expiresIn` 300–3600s según sensibilidad.
- no-cache para respuestas firmadas; no reusar URLs vencidas.
- Cumplimiento RGPD/privacidad:
  - Mostrar solo archivos que el usuario puede ver por su rol (delegado al backend si aplica).
  - Permitir solicitud de eliminación permanente desde UI cuando legalmente corresponda.

Checklist de seguridad:
- [ ] No se guardan URLs firmadas en localStorage/IndexedDB.
- [ ] No se inyectan filePaths en el DOM sin validación.
- [ ] Se usan accept MIME types en `<input type="file">`.
- [ ] `next.config.js` limita dominios de `next/image`.

---

## 5. Manejo de Errores (Estrategia)

Mapa de errores → acciones UI:
- 400 Bad Request
  - `File type ... not allowed` → Bloquear y mostrar recomendaciones.
  - `File size exceeds ...` → Mostrar límite y sugerir comprimir.
- 404 Not Found
  - `PROJECT/TASK ... not found` → Revalidar entidad o refrescar vista.
  - `File not found` → Quitar de UI y revalidar lista.
- 500 Server Error
  - Reintento 1x y fallback de mensaje genérico.

Patrones:
- Normalizar errores a `{ title, description, action? }` para toasts.
- Loggear en cliente (Sentry/console) solo metadatos; no contenidos.

---

## 6. Performance y Caching

- `public-url` de imágenes: aptas para `next/image` + cache CDN.
- Evitar `no-store` en imágenes públicas (permitir `force-cache`/ISR en páginas de galería).
- Prefetch de listas en server components cuando la navegación lo anticipe.
- Límite de tamaño en cliente (10MB imágenes, 50MB docs) antes de network.
- Paginación consistente (limit 20–50; offset controlado).
- Lazy-loading de imágenes (atributos `loading="lazy"` / `priority` según caso).

KPIs sugeridos:
- TTFB de listados < 300ms (en red local o CDN cacheado).
- Tiempo de subida < 3–5s para 5MB.
- CLS/INP no degradados por renders de galerías.

---

## 7. Observabilidad

- Trazabilidad mínima (cliente):
  - `upload_start` / `upload_success` / `upload_error` con `{ entityType, entityId, size, mime }`.
  - `download_request` / `download_opened`.
  - `delete_click` / `delete_success` / `delete_error`.
- Correlación con backend: incluir `X-Request-Id` si el backend lo emite (o generar UUID por request en cliente).
- Alertas UX: tasa de fallos de upload > 5% en 15 min.

---

## 8. Casos de Uso (auditoría rápida)

- Proyectos (imágenes públicas):
  - Upload → list → render con `public-url` (sin firmadas).
  - Eliminar → no debe quedar roto el listado.
- Tareas (docs privados):
  - Upload → list → descargar con `download` firmado.
  - Expiración: intento de reusar link vencido debe fallar y regenerarse.
- Documentos de cliente:
  - Ídem tareas; no usar `public-url`.

---

## 9. Contratos de Tipos (Front)

```ts
// FileAttachment (simplificado)
export type FileAttachment = {
  id: string;
  entityType: 'PROJECT' | 'TASK' | 'CLIENT_DOCUMENT';
  entityId: string;
  fileName: string;
  filePath: string;
  fileType: string; // MIME
  uploadedById: string;
  createdAt: string;
};
```

Validaciones cliente recomendadas:
- extensiones por tipo (`.jpg,.jpeg,.png,.webp` | `.pdf,.docx,.xlsx`)
- tamaño máximo (configurable por tipo)

---

## 10. Riesgos Comunes y Mitigaciones

- Guardar URLs firmadas en estado global → Filtraciones al compartir.
  - Mitigar: generar al click; expiración corta.
- Renderizar `filePath` en `<img>` para documentos privados → 403/404 visibles.
  - Mitigar: usar `download` para docs.
- Falta de paginación en listados grandes → Tiempos altos y bloqueos UI.
  - Mitigar: `limit/offset`, skeletons, virtualización si aplica.
- Doble fuente de verdad (BD vs Storage) → Items huérfanos visibles.
  - Mitigar: confiar en API `list` (BD), no listar por scanning en Storage desde el front.

---

## 11. Checklists de Cumplimiento

Integración:
- [ ] `NEXT_PUBLIC_API_URL` configurada.
- [ ] Inputs file con `accept` y límites de tamaño.
- [ ] Upload con `multipart/form-data` + campos requeridos.
- [ ] List con filtros por entidad y paginación.
- [ ] Public URL solo para `image/*`.
- [ ] Signed URL para `application/*`.
- [ ] Delete integrado y con confirmación.

Seguridad:
- [ ] No se persisten URLs firmadas.
- [ ] Dominio supabase permitido en `next/image` si aplica.
- [ ] Manejo de errores no expone detalles sensibles.
- [ ] Logs sin datos personales innecesarios.

Performance:
- [ ] Cache de imágenes públicas con `next/image`.
- [ ] Paginación en listados.
- [ ] Validación de tamaño en cliente.

Observabilidad:
- [ ] Eventos básicos instrumentados (upload/download/delete).
- [ ] Reintento simple en fallos 5xx/timeout.

---

## 12. Referencias

- Endpoints: ver `src/modules/storage/storage.controller.ts`.
- Esquema BD: `src/db/schema.ts` (`file_attachments`).
- Guía de implementación UI: `storage_frontend_guide.md`.
- Pruebas REST: `palero-soft-api/test/storage.http`.

---

Anexos opcionales (no incluidos):
- Política de conservación de archivos por tipo de entidad.
- Matriz de acceso por rol (ADMIN/TEAM_MEMBER/CLIENT).
- Auditoría de privacidad (RGPD/LOPDGDD) por tipo de documento.
