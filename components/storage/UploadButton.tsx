'use client';

import { useState } from 'react';
import { uploadFile, StorageEntityType } from '@/lib/storage';

const DEFAULT_MAX_MB = 10;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function UploadButton({
  entityType,
  entityId,
  uploadedById,
  accept = IMAGE_TYPES.join(','),
  maxMB = DEFAULT_MAX_MB,
  label = 'Subir archivo',
  onDone,
}: {
  entityType: StorageEntityType;
  entityId: string;
  uploadedById: string;
  accept?: string;
  maxMB?: number;
  label?: string;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <span className="px-3 py-2 rounded bg-palero-blue1 text-white text-sm">
          {loading ? 'Subiendo…' : label}
        </span>
        <input
          type="file"
          className="hidden"
          accept={accept}
          disabled={loading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError(null);

            if (file.size > maxMB * 1024 * 1024) {
              setError(`El archivo excede ${maxMB}MB`);
              return;
            }

            setLoading(true);
            try {
              await uploadFile({ file, entityType, entityId, uploadedById });
              onDone?.();
              // limpiar input solo si todo salió bien
              if (e.target) e.target.value = '';
            } catch (err: any) {
              setError(err?.message || 'No se pudo subir el archivo');
            } finally {
              setLoading(false);
            }
          }}
        />
      </label>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
