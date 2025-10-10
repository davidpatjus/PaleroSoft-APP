"use client";

import { useState } from 'react';
import { FileAttachment, deleteFile, getSignedDownloadUrl } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Trash2, Download, Loader2, FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AttachmentListProps {
  attachments: FileAttachment[];
  onDelete: (fileId: string) => void;
}

/**
 * Componente para listar archivos adjuntos con opciones de descarga y eliminación
 * Maneja estados de carga individuales y proporciona feedback visual al usuario
 */
export function AttachmentList({ attachments, onDelete }: AttachmentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * Maneja la descarga de un archivo mediante URL firmada
   * @param file - Archivo a descargar
   */
  const handleDownload = async (file: FileAttachment) => {
    console.log('📥 Iniciando descarga de archivo:', {
      fileId: file.id,
      fileName: file.fileName,
      filePath: file.filePath,
    });

    setIsDownloading(file.id);
    
    try {
      const url = await getSignedDownloadUrl(file.filePath);
      console.log('✅ URL firmada obtenida:', url);
      
      // Abrir en nueva pestaña para descargar
      window.open(url, '_blank');
      
      toast({
        title: 'Descarga iniciada',
        description: `Descargando ${file.fileName}`,
      });
    } catch (error: any) {
      console.error('❌ Error al descargar archivo:', {
        fileId: file.id,
        fileName: file.fileName,
        error: error.message,
      });
      
      toast({
        title: 'Error',
        description: error.message || 'No se pudo descargar el archivo',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(null);
    }
  };

  /**
   * Maneja la eliminación de un archivo
   * @param file - Archivo a eliminar
   */
  const handleDelete = async (file: FileAttachment) => {
    if (!user) {
      console.warn('⚠️ Usuario no disponible para eliminar');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar "${file.fileName}"?`)) {
      console.log('ℹ️ Eliminación cancelada por el usuario');
      return;
    }

    console.log('🗑️ Iniciando eliminación de archivo:', {
      fileId: file.id,
      fileName: file.fileName,
      userId: user.id,
    });

    setIsDeleting(file.id);
    
    try {
      await deleteFile(file.id, user.id);
      console.log('✅ Archivo eliminado exitosamente:', file.id);
      
      toast({
        title: 'Éxito',
        description: `${file.fileName} eliminado correctamente`,
      });
      
      // Notificar al componente padre para actualizar la lista
      onDelete(file.id);
    } catch (error: any) {
      console.error('❌ Error al eliminar archivo:', {
        fileId: file.id,
        fileName: file.fileName,
        error: error.message,
      });
      
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el archivo',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * Obtiene el ícono según el tipo de archivo
   */
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['pdf'].includes(ext || '')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (['doc', 'docx'].includes(ext || '')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    if (['xls', 'xlsx'].includes(ext || '')) {
      return <FileText className="h-5 w-5 text-green-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <FileIcon className="h-5 w-5 text-purple-500" />;
    }
    
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  /**
   * Formatea el tamaño del archivo
   */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Formatea la fecha de creación
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No hay archivos adjuntos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((file) => (
        <div 
          key={file.id} 
          className="flex items-center justify-between p-4 border border-palero-blue1/20 rounded-lg bg-white hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(file.fileName)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(file.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(file)}
              disabled={isDownloading === file.id || isDeleting === file.id}
              className="text-palero-teal1 hover:text-palero-teal1 hover:bg-palero-teal1/10"
              title="Descargar archivo"
            >
              {isDownloading === file.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => handleDelete(file)}
              disabled={isDownloading === file.id || isDeleting === file.id}
              title="Eliminar archivo"
            >
              {isDeleting === file.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
