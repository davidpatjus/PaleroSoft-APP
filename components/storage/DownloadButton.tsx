'use client';

import { useState } from 'react';
import { getSignedDownloadUrl } from '@/lib/storage';

export function DownloadButton({ filePath, label = 'Descargar', expiresIn = 300 }: {
  filePath: string;
  label?: string;
  expiresIn?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const url = await getSignedDownloadUrl(filePath, expiresIn);
      window.open(url, '_blank');
    } catch (e: any) {
      setError(e?.message || 'No se pudo descargar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-3 py-2 rounded bg-palero-teal1 text-white text-sm disabled:opacity-60"
      >
        {loading ? 'Generando…' : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
