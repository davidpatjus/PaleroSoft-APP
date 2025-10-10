"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile, StorageEntityType } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2, X, Upload, FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AttachmentUploaderProps {
  entityId: string;
  entityType: StorageEntityType;
  onUploadComplete: () => void;
}

// Constantes de validación
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Tipos de archivo permitidos (puedes ajustar según tus necesidades)
const ALLOWED_FILE_TYPES = [
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Hojas de cálculo
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Presentaciones
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Imágenes
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Comprimidos
  'application/zip',
  'application/x-rar-compressed',
  // Texto
  'text/plain',
  'text/csv',
];

/**
 * Componente para subir archivos adjuntos a proyectos o tareas
 * Incluye validación de tamaño y tipo, preview del archivo seleccionado,
 * y actualización automática de la lista al completar
 */
export function AttachmentUploader({ 
  entityId, 
  entityType, 
  onUploadComplete 
}: AttachmentUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Valida el tipo de archivo
   */
  const validateFileType = (file: File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      console.warn('⚠️ Tipo de archivo no permitido:', {
        fileName: file.name,
        fileType: file.type,
      });
      return false;
    }
    return true;
  };

  /**
   * Valida el tamaño del archivo
   */
  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      console.warn('⚠️ Archivo demasiado grande:', {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        maxSize: `${MAX_FILE_SIZE_MB} MB`,
      });
      return false;
    }
    return true;
  };

  /**
   * Maneja la selección de archivo
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      console.log('ℹ️ No se seleccionó ningún archivo');
      return;
    }

    console.log('📎 Archivo seleccionado:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
    });

    // Validar tamaño
    if (!validateFileSize(file)) {
      toast({
        title: 'Archivo demasiado grande',
        description: `El archivo no debe superar ${MAX_FILE_SIZE_MB}MB`,
        variant: 'destructive',
      });
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validar tipo
    if (!validateFileType(file)) {
      toast({
        title: 'Tipo de archivo no permitido',
        description: 'Por favor selecciona un archivo válido (PDF, DOC, XLS, imágenes, etc.)',
        variant: 'destructive',
      });
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
  };

  /**
   * Cancela la selección del archivo
   */
  const handleCancelSelection = () => {
    console.log('❌ Selección de archivo cancelada');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Maneja la subida del archivo
   */
  const handleUpload = async () => {
    if (!selectedFile || !user) {
      console.warn('⚠️ Upload cancelado: archivo o usuario no disponible');
      return;
    }

    console.log('⬆️ Iniciando upload de archivo:', {
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: `${(selectedFile.size / 1024).toFixed(2)} KB`,
      entityType,
      entityId,
      userId: user.id,
    });

    setIsUploading(true);
    
    try {
      const result = await uploadFile({
        file: selectedFile,
        entityType,
        entityId,
        uploadedById: user.id,
      });

      console.log('✅ Archivo subido exitosamente:', {
        fileId: result.id,
        fileName: result.fileName,
        filePath: result.filePath,
      });

      toast({
        title: 'Éxito',
        description: `${selectedFile.name} subido correctamente`,
      });

      // Limpiar estado
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notificar al componente padre para refrescar la lista
      onUploadComplete();
    } catch (error: any) {
      console.error('❌ Error al subir archivo:', {
        fileName: selectedFile.name,
        error: error.message,
        entityType,
        entityId,
      });

      toast({
        title: 'Error al subir archivo',
        description: error.message || 'No se pudo subir el archivo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Formatea el tamaño del archivo para mostrar
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Input oculto para selección de archivo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        id={`file-upload-${entityType}-${entityId}`}
        disabled={isUploading}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.txt,.csv"
      />

      {/* Botón para seleccionar archivo */}
      {!selectedFile && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto border-palero-blue1/30 hover:border-palero-teal1 hover:bg-palero-teal1/5"
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Adjuntar Archivo
        </Button>
      )}

      {/* Preview del archivo seleccionado */}
      {selectedFile && !isUploading && (
        <div className="flex items-center justify-between p-4 border border-palero-blue1/30 rounded-lg bg-palero-blue1/5">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <FileIcon className="h-5 w-5 text-palero-teal1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Button 
              size="sm" 
              onClick={handleUpload}
              className="bg-palero-teal1 hover:bg-palero-teal1/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCancelSelection}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Indicador de subida en progreso */}
      {isUploading && (
        <div className="flex items-center justify-center p-4 border border-palero-teal1/30 rounded-lg bg-palero-teal1/5">
          <Loader2 className="h-5 w-5 animate-spin text-palero-teal1 mr-3" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Subiendo {selectedFile?.name}...
            </p>
            <p className="text-xs text-gray-500">
              Por favor espera
            </p>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <p className="text-xs text-gray-500">
        Tamaño máximo: {MAX_FILE_SIZE_MB}MB • Formatos: PDF, DOC, XLS, imágenes, etc.
      </p>
    </div>
  );
}
