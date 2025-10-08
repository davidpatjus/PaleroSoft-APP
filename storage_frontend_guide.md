# Guía Frontend (Next.js) para el módulo de almacenamiento

Esta guía cubre cómo integrar y usar el módulo de Storage desde el frontend en Next.js (App Router), con buenas prácticas, manejo de errores, y flujos listos para copiar/pegar.

Índice rápido:
- Setup de cliente API y utilidades
- Subida de archivos (proyectos, tareas, documentos cliente)
- Listado y visualización
- Descarga con URL firmada
- Eliminación de archivos
- Buenas prácticas y patrones
- Manejo de errores UI
- Componentes reutilizables sugeridos
- Checklists por módulo

---

## 1) Setup: cliente API y utilidades

Crea un cliente de fetch con control de errores y tiempo de espera.

```ts
// lib/api.ts
export type ApiError = { status: number; code?: string; message: string };

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    let body: any = undefined;
    try { body = await res.json(); } catch {}
    const err: ApiError = {
      status: res.status,
      code: (body?.code || body?.error || 'UNKNOWN_ERROR') as string,
      message: (body?.message || res.statusText || 'Error') as string,
    };
    throw err;
  }

  // Manejar 204
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
```

Utilidad para multipart form-data:

```ts
// lib/form.ts
export function buildUploadForm(args: {
  file: File;
  entityType: 'PROJECT' | 'TASK' | 'CLIENT_DOCUMENT';
  entityId: string;
  uploadedById: string;
  customFileName?: string;
}): FormData {
  const fd = new FormData();
  fd.set('entityType', args.entityType);
  fd.set('entityId', args.entityId);
  fd.set('uploadedById', args.uploadedById);
  if (args.customFileName) fd.set('customFileName', args.customFileName);
  fd.set('file', args.file);
  return fd;
}
```

---

## 2) Subida de archivos

Endpoints backend usados:
- POST `/storage/upload` (multipart/form-data)

Flujo general:
1) Seleccionar archivo (input file/drag&drop)
2) Validar tamaño/tipo en cliente (rápido)
3) Construir FormData con entityType/entityId/uploadedById
4) Enviar a `/storage/upload`
5) Actualizar UI con resultado

Ejemplo React server action (App Router):

```ts
// app/(projects)/projects/[id]/actions.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function uploadProjectImage(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const uploadedById = formData.get('uploadedById') as string;
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('Debe seleccionar un archivo');

  const fd = new FormData();
  fd.set('entityType', 'PROJECT');
  fd.set('entityId', projectId);
  fd.set('uploadedById', uploadedById);
  fd.set('file', file);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/storage/upload`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error' }));
    throw new Error(err.message || 'No se pudo subir el archivo');
  }

  revalidatePath(`/projects/${projectId}`);
  return await res.json();
}
```

Componente de subida con validación en cliente:

```tsx
// components/storage/UploadButton.tsx
'use client';
import { useState } from 'react';

const MAX_IMAGE_MB = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function UploadButton({ projectId, uploadedById, onDone }: {
  projectId: string;
  uploadedById: string;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <input
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setError(null);

          // Validación rápida en cliente
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError('Tipo de archivo no permitido');
            return;
          }
          if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
            setError(`El archivo excede ${MAX_IMAGE_MB}MB`);
            return;
          }

          setLoading(true);
          const fd = new FormData();
          fd.set('entityType', 'PROJECT');
          fd.set('entityId', projectId);
          fd.set('uploadedById', uploadedById);
          fd.set('file', file);

          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/storage/upload`, {
              method: 'POST',
              body: fd,
            });
            if (!res.ok) throw new Error((await res.json()).message);
            onDone?.();
          } catch (err: any) {
            setError(err?.message || 'No se pudo subir el archivo');
          } finally {
            setLoading(false);
          }
        }}
      />
      {loading && <p>Subiendo…</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

Diferenciación por módulo (TASK y CLIENT_DOCUMENT) solo cambia `entityType` y `entityId`.

---

## 3) Listar y visualizar

Endpoints:
- GET `/storage/list?entityType=PROJECT&entityId=...`
- GET `/storage/public-url?bucket=images&filePath=...`

Server Component (carga de archivos de un proyecto):

```tsx
// app/(projects)/projects/[id]/Gallery.tsx
import { apiFetch } from '@/lib/api';

type FileAttachment = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  createdAt: string;
};

async function getProjectFiles(projectId: string) {
  const files = await apiFetch<FileAttachment[]>(
    `/storage/list?entityType=PROJECT&entityId=${projectId}`,
  );
  return files;
}

function toPublicImageUrl(filePath: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(`/storage/public-url`, base);
  url.searchParams.set('bucket', 'images');
  url.searchParams.set('filePath', filePath);
  return url.toString();
}

export async function Gallery({ projectId }: { projectId: string }) {
  const files = await getProjectFiles(projectId);
  return (
    <div className="grid grid-cols-2 gap-3">
      {files
        .filter((f) => f.fileType.startsWith('image/'))
        .map((f) => (
          <img
            key={f.id}
            src={toPublicImageUrl(f.filePath)}
            alt={f.fileName}
            className="rounded border"
          />
        ))}
    </div>
  );
}
```

Para documentos (PDF), usa URL firmada (ver sección 4).

---

## 4) Descarga con URL firmada (privado)

Endpoint:
- GET `/storage/download?bucket=files&filePath=...&expiresIn=300`

Helper y botón de descarga:

```tsx
// components/storage/DownloadButton.tsx
'use client';

async function getSignedUrl(filePath: string, expiresIn = 300) {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const url = new URL(`/storage/download`, base);
  url.searchParams.set('bucket', 'files');
  url.searchParams.set('filePath', filePath);
  url.searchParams.set('expiresIn', String(expiresIn));

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo generar la URL');
  const data = await res.json();
  return data.signedUrl as string;
}

export function DownloadButton({ filePath, label = 'Descargar' }: {
  filePath: string;
  label?: string;
}) {
  return (
    <button
      onClick={async () => {
        try {
          const signed = await getSignedUrl(filePath);
          window.open(signed, '_blank');
        } catch (e: any) {
          alert(e?.message || 'No se pudo descargar');
        }
      }}
      className="btn btn-primary"
    >
      {label}
    </button>
  );
}
```

---

## 5) Eliminación de archivos

Endpoint:
- DELETE `/storage/:fileId`

Ejemplo en cliente:

```ts
// lib/storage.ts
import { apiFetch } from './api';

export async function deleteFile(fileId: string) {
  await apiFetch<void>(`/storage/${fileId}`, { method: 'DELETE' });
}
```

Uso en componente:

```tsx
<button onClick={async () => {
  if (!confirm('¿Eliminar archivo?')) return;
  try {
    await deleteFile(fileId);
    onDeleted?.();
  } catch (e: any) {
    alert(e?.message || 'No se pudo eliminar');
  }
}}>Eliminar</button>
```

---

## 6) Buenas prácticas

- Validar en cliente: tamaño (MB) y tipo (MIME) para feedback inmediato.
- Diferenciar buckets implícitamente por tipo: imágenes → `public-url`, documentos → `download` (firmada).
- Evitar guardar URL públicas en BD/estado: guardar `filePath` y generar URL on-demand.
- Manejar expiración de URLs firmadas: regenerar al abrir.
- UI responsiva: spinners, deshabilitar botón durante upload, mostrar progreso.
- Reintentos: un retry sencillo (máx 1) para fallos transitorios de red.
- Accesibilidad: inputs con etiquetas, texto alternativo en imágenes.
- Seguridad: no permitir ejecutar archivos; visualizar PDFs en visor seguro.
- Cache: imágenes públicas pueden cachearse con `next/image` + dominio permitido.
- Paginación: usar `limit/offset` en listados largos.

---

## 7) Manejo de errores (UI)

Mapa de errores típicos:

- 400 Bad Request
  - Mensaje: "File type ... is not allowed" → Mostrar: "Tipo de archivo no permitido"
  - Mensaje: "File size exceeds limit of XMB" → Mostrar: "Archivo demasiado grande (máx XMB)"
- 404 Not Found
  - Mensaje: "PROJECT with ID ... not found" → Mostrar: "Entidad no encontrada (actualiza la página)"
  - Mensaje: "File not found" → Mostrar: "El archivo ya no existe"
- 500 Internal Server Error
  - Mensaje: genérico → Mostrar: "Ocurrió un error, intenta nuevamente"

Recomendación: centralizar manejo con un helper `mapApiErrorToToast(err)`.

---

## 8) Componentes sugeridos

- `UploadButton` (genérico por entityType)
- `ProjectGallery` (solo imágenes públicas)
- `TaskFilesList` (muestra PDFs/archivos con botón `DownloadButton`)
- `FileItem` (con acciones: descargar, eliminar)

---

## 9) Checklists por módulo

### Proyectos (imágenes públicas)
- [ ] Subir imagen con `entityType=PROJECT`
- [ ] Listar `/storage/list?entityType=PROJECT&entityId=...`
- [ ] Renderizar con `public-url`
- [ ] Borrar archivo cuando aplique

### Tareas (archivos privados)
- [ ] Subir con `entityType=TASK`
- [ ] Listar por tarea
- [ ] Descargar con URL firmada (300–3600s)
- [ ] No exponer URL públicas

### Documentos de cliente (privado)
- [ ] Subir con `entityType=CLIENT_DOCUMENT`
- [ ] Listar por usuario/cliente
- [ ] Descargar con URL firmada

---

## 10) Inicialización y utilidades de admin

- GET `/storage/buckets` (debug)
- GET `/storage/stats` (dashboard interno)

---

## 11) Diferenciación de archivos

- Imágenes (`image/*`) → mostrar con `next/image` / `<img>` usando `public-url`.
- PDFs/Docs (`application/pdf`, `application/*`) → descargar con URL firmada (`/storage/download`).
- Vídeos/Audios → evaluar caso a caso (público o privado), firmadas por defecto si son sensibles.

---

## 12) Seguridad en Next.js

- Configurar `NEXT_PUBLIC_API_URL`.
- Permitir dominio de Supabase en `next.config.js` para `next/image` si se usa URL pública directa.
- No exponer tokens en cliente (el backend ya firma URLs cuando hace falta).

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};
```

