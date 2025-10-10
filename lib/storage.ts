// Utilidades de Storage: upload, list, public-url, signed download y delete
// Nota: usa la misma base que el API público; asegúrate de configurar NEXT_PUBLIC_API_BASE_URL

export type StorageEntityType = 'PROJECT' | 'TASK' | 'CLIENT_DOCUMENT' | 'COMMENT' | 'PROFILE_IMAGE';

export type FileAttachment = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  createdAt: string;
};

const STORAGE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Helper para decidir bucket y folder según entityType
function getBucketAndFolder(entityType: StorageEntityType): { bucket: string; folder: string } {
  switch (entityType) {
    case 'PROJECT':
      return { bucket: 'files', folder: 'projects' };
    case 'TASK':
      return { bucket: 'files', folder: 'tasks' };
    case 'CLIENT_DOCUMENT':
      return { bucket: 'files', folder: 'documents' };
    case 'COMMENT':
      return { bucket: 'files', folder: 'comments' };
    case 'PROFILE_IMAGE':
      // Imágenes de perfil de usuario - bucket público para visualización directa
      return { bucket: 'images', folder: 'avatars' };
    default:
      return { bucket: 'files', folder: 'other' };
  }
}

export async function uploadFile(args: {
  file: File;
  entityType: StorageEntityType;
  entityId: string;
  uploadedById: string;
  customFileName?: string;
}): Promise<FileAttachment> {
  const { bucket, folder } = getBucketAndFolder(args.entityType);
  const fd = new FormData();
  fd.set('bucket', bucket);
  fd.set('folder', folder);
  fd.set('entityType', args.entityType);
  fd.set('entityId', args.entityId);
  fd.set('uploadedById', args.uploadedById);
  if (args.customFileName) fd.set('customFileName', args.customFileName);
  fd.set('file', args.file);

  const res = await fetch(`${STORAGE_BASE}/storage/upload`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      // Importante: NO establecer Content-Type manualmente con FormData
    },
    body: fd,
  });
  
  if (!res.ok) {
    let body: any = undefined;
    try { 
      body = await res.json(); 
    } catch (parseErr) {
      console.error('❌ Error al parsear respuesta del servidor:', parseErr);
    }
    
    console.error('❌ Error en uploadFile:', {
      status: res.status,
      statusText: res.statusText,
      body,
      url: `${STORAGE_BASE}/storage/upload`,
    });
    
    // Mostrar mensaje detallado
    const errorMsg = body?.message || body?.error || `Error ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }
  
  return res.json();
}

export async function listFiles(entityType: StorageEntityType, entityId: string): Promise<FileAttachment[]> {
  // Construir URL correctamente
  const url = `${STORAGE_BASE}/storage/list?entityType=${entityType}&entityId=${entityId}`;
  const res = await fetch(url, {
    headers: {
      ...authHeaders(),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    let body: any = undefined;
    try { body = await res.json(); } catch {}
    throw new Error(body?.message || 'No se pudo obtener el listado');
  }
  const data = await res.json();
  // El backend devuelve { files: [...], total, limit, offset }
  return data.files || [];
}

/**
 * Obtiene la URL pública de una imagen en el bucket 'images'
 * Hace una petición al backend que devuelve la URL real de Supabase
 */
export async function toPublicImageUrl(filePath: string): Promise<string> {
  // Construir URL correctamente
  const url = `${STORAGE_BASE}/storage/public-url?bucket=images&filePath=${encodeURIComponent(filePath)}`;
  
  console.log('🔗 Obteniendo URL pública para:', filePath);
  console.log('📍 URL completa:', url);
  
  try {
    const res = await fetch(url, {
      headers: {
        ...authHeaders(),
      },
      cache: 'no-store',
    });
    
    if (!res.ok) {
      let body: any = undefined;
      try { body = await res.json(); } catch {}
      console.error('❌ Error al obtener URL pública:', {
        status: res.status,
        body,
        filePath,
        url,
      });
      throw new Error(body?.message || 'No se pudo obtener la URL pública');
    }
    
    const data = await res.json();
    console.log('✅ URL pública obtenida:', data.publicUrl);
    return data.publicUrl as string;
  } catch (err: any) {
    console.error('❌ Error crítico en toPublicImageUrl:', err);
    throw err;
  }
}

/**
 * Versión síncrona que genera la URL del endpoint (usar solo en casos especiales)
 * Para uso normal, preferir toPublicImageUrl() que devuelve la URL real
 */
export function toPublicImageUrlEndpoint(filePath: string): string {
  return `${STORAGE_BASE}/storage/public-url?bucket=images&filePath=${encodeURIComponent(filePath)}`;
}

export async function getSignedDownloadUrl(filePath: string, expiresIn = 300): Promise<string> {
  // Validar que expiresIn esté en el rango permitido (60-86400 segundos)
  const validExpiresIn = Math.max(60, Math.min(86400, expiresIn));
  
  // Construir URL con query parameters
  // Nota: El backend espera expiresIn como número, pero los query params siempre son strings
  // Si el backend no tiene @Type() en el DTO, esto fallará
  const params = new URLSearchParams({
    bucket: 'files',
    filePath: filePath,
    expiresIn: validExpiresIn.toString(),
  });
  
  const url = `${STORAGE_BASE}/storage/download?${params.toString()}`;

  console.log('📥 Solicitando URL firmada:', {
    filePath,
    expiresIn: validExpiresIn,
    url,
  });

  const res = await fetch(url, {
    headers: {
      ...authHeaders(),
    },
    cache: 'no-store',
  });
  
  if (!res.ok) {
    let body: any = undefined;
    try { body = await res.json(); } catch {}
    const errorMessage = body?.message || 'No se pudo generar la URL';
    console.error('❌ Error en getSignedDownloadUrl:', {
      status: res.status,
      statusText: res.statusText,
      errorMessage,
      body,
      sentExpiresIn: validExpiresIn,
      sentType: typeof validExpiresIn,
    });
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log('✅ URL firmada obtenida correctamente');
  return data.signedUrl as string;
}

export async function deleteFile(fileId: string, deletedById: string): Promise<void> {
  console.log('🗑️ deleteFile llamado con:', { fileId, deletedById });
  
  const url = `${STORAGE_BASE}/storage/${fileId}`;
  // El backend espera AMBOS campos: fileId y deletedBy (no deletedById)
  const body = JSON.stringify({ 
    fileId: fileId,
    deletedBy: deletedById  // Backend usa "deletedBy", no "deletedById"
  });
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
  };
  
  console.log('📍 DELETE URL:', url);
  console.log('📦 DELETE Body:', body);
  console.log('🔑 Headers:', headers);
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    body,
  });
  
  console.log('📊 DELETE Response status:', res.status);
  
  if (!res.ok) {
    let body: any = undefined;
    try { 
      body = await res.json();
      console.error('❌ DELETE Response body:', body);
    } catch (parseErr) {
      console.error('❌ No se pudo parsear respuesta del error');
    }
    throw new Error(body?.message || 'No se pudo eliminar el archivo');
  }
  
  console.log('✅ Archivo eliminado exitosamente');
}
