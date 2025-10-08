"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileImage } from '@/contexts/ProfileImageContext';
import { apiClient } from '@/lib/api';
import { uploadFile, listFiles, deleteFile } from '@/lib/storage';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Loader2, Save, Trash2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();
  const { 
    profileImage, 
    profileImagePath, 
    isLoading: isLoadingProfile, 
    refreshProfileImage 
  } = useProfileImage();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del usuario (la imagen se carga automáticamente por el contexto)
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      console.warn('❌ Upload cancelado: archivo o usuario no disponible');
      return;
    }

    console.log('📤 Iniciando upload de imagen de perfil:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      userId: user.id,
    });

    // Validación de tipo
    if (!file.type.startsWith('image/')) {
      console.error('❌ Tipo de archivo inválido:', file.type);
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos de imagen',
        variant: 'destructive',
      });
      return;
    }

    // Validación de tamaño
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ Archivo demasiado grande:', file.size, 'bytes');
      toast({
        title: 'Error',
        description: 'La imagen no debe superar 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      // 1. VERIFICAR SI HAY IMAGEN ANTERIOR
      console.log('🔍 Verificando si existe imagen de perfil anterior...');
      let existingFiles: any[] = [];
      
      try {
        existingFiles = await listFiles('PROFILE_IMAGE', user.id);
        console.log('📋 Archivos de perfil encontrados:', existingFiles.length);
        
        if (existingFiles.length > 0) {
          console.log('📄 Detalles de archivos existentes:', existingFiles.map(f => ({
            id: f.id,
            fileName: f.fileName,
            filePath: f.filePath,
          })));
        }
      } catch (listErr: any) {
        console.warn('⚠️ Error al listar archivos (continuando):', listErr.message);
        // No bloqueamos el upload si falla el listado
      }

      // 2. ELIMINAR IMAGEN ANTERIOR SI EXISTE
      if (existingFiles.length > 0) {
        console.log('🗑️ Intentando eliminar imágenes anteriores...');
        
        for (const oldFile of existingFiles) {
          try {
            console.log(`🗑️ Eliminando archivo: ${oldFile.id} (${oldFile.fileName})`);
            
            // Validar que tenemos un ID válido
            if (!oldFile.id || typeof oldFile.id !== 'string') {
              console.error('❌ ID de archivo inválido:', oldFile.id);
              continue;
            }

            await deleteFile(oldFile.id, user.id);
            console.log(`✅ Archivo eliminado exitosamente: ${oldFile.id}`);
          } catch (deleteErr: any) {
            console.error(`❌ Error al eliminar archivo ${oldFile.id}:`, {
              message: deleteErr.message,
              status: deleteErr.status,
              error: deleteErr,
            });
            
            // Si falla la eliminación, notificamos pero continuamos con el upload
            toast({
              title: 'Advertencia',
              description: 'No se pudo eliminar la imagen anterior, pero se continuará con la subida',
              variant: 'destructive',
            });
          }
        }
      } else {
        console.log('ℹ️ No hay imágenes anteriores que eliminar');
      }

      // 3. SUBIR NUEVA IMAGEN
      console.log('⬆️ Subiendo nueva imagen de perfil...');
      console.log('📋 Datos del upload:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        entityType: 'PROFILE_IMAGE',
        entityId: user.id,
        uploadedById: user.id,
        customFileName: `avatar-${user.id}`,
      });
      
      await uploadFile({
        file,
        entityType: 'PROFILE_IMAGE',
        entityId: user.id,
        uploadedById: user.id,
        // Usar nombre único para evitar caché de CDNs/proxies
        customFileName: `avatar-${user.id}-${Date.now()}`,
      });

      console.log('✅ Imagen subida exitosamente');

      toast({
        title: 'Éxito',
        description: 'Imagen de perfil actualizada',
      });

      // 4. RECARGAR IMAGEN DESDE EL CONTEXTO
  console.log('🔄 Recargando imagen de perfil (force=true)...');
  await refreshProfileImage({ force: true });
      console.log('✅ Proceso completado');

    } catch (err: any) {
      console.error('❌ Error crítico en handleImageUpload:', {
        message: err.message,
        stack: err.stack,
        error: err,
        fileName: file?.name,
        userId: user?.id,
      });
      
      const errorMessage = err?.message || 'No se pudo subir la imagen';
      setError(errorMessage);
      
      toast({
        title: 'Error al subir imagen',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      // Limpiar input
      try {
        e.target.value = '';
      } catch (cleanupErr) {
        console.warn('⚠️ Error al limpiar input (no crítico):', cleanupErr);
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!user) {
      console.warn('❌ Eliminación cancelada: usuario no disponible');
      return;
    }

    if (!profileImage && !profileImagePath) {
      console.warn('⚠️ No hay imagen de perfil para eliminar');
      toast({
        title: 'Información',
        description: 'No hay imagen de perfil para eliminar',
      });
      return;
    }

    if (!confirm('¿Eliminar imagen de perfil?')) {
      console.log('ℹ️ Eliminación cancelada por el usuario');
      return;
    }

    console.log('🗑️ Iniciando eliminación de imagen de perfil:', {
      profileImagePath,
      userId: user.id,
    });

    setIsUploadingImage(true);
    
    try {
      // 1. VERIFICAR ARCHIVOS EXISTENTES
      console.log('🔍 Buscando archivos de perfil...');
      let files: any[] = [];
      
      try {
        files = await listFiles('PROFILE_IMAGE', user.id);
        console.log('📋 Archivos encontrados:', files.length);
        
        if (files.length > 0) {
          console.log('📄 Detalles:', files.map(f => ({
            id: f.id,
            fileName: f.fileName,
            filePath: f.filePath,
          })));
        }
      } catch (listErr: any) {
        console.error('❌ Error al listar archivos:', {
          message: listErr.message,
          error: listErr,
        });
        throw new Error('No se pudo verificar los archivos existentes');
      }

      // 2. VERIFICAR SI HAY ARCHIVOS PARA ELIMINAR
      if (files.length === 0) {
        console.warn('⚠️ No se encontraron archivos para eliminar');
        toast({
          title: 'Información',
          description: 'No se encontró imagen de perfil',
        });
        return;
      }

      // 3. INTENTAR ELIMINAR CADA ARCHIVO
      let successCount = 0;
      let errorCount = 0;
      
      for (const imageFile of files) {
        try {
          // Validar ID del archivo
          if (!imageFile.id || typeof imageFile.id !== 'string') {
            console.error('❌ ID de archivo inválido:', imageFile.id);
            errorCount++;
            continue;
          }

          console.log(`🗑️ Eliminando archivo: ${imageFile.id} (${imageFile.fileName})`);
          
          await deleteFile(imageFile.id, user.id);
          
          console.log(`✅ Archivo eliminado: ${imageFile.id}`);
          successCount++;
          
        } catch (deleteErr: any) {
          console.error(`❌ Error al eliminar archivo ${imageFile.id}:`, {
            message: deleteErr.message,
            status: deleteErr.status,
            error: deleteErr,
          });
          errorCount++;
        }
      }

      // 4. MOSTRAR RESULTADO
      console.log(`📊 Resultado: ${successCount} eliminados, ${errorCount} errores`);
      
      if (successCount > 0) {
        toast({
          title: 'Éxito',
          description: errorCount > 0 
            ? `${successCount} imagen(es) eliminada(s), ${errorCount} error(es)`
            : 'Imagen de perfil eliminada',
        });

  // Recargar desde el contexto, forzando para evitar caché
  await refreshProfileImage({ force: true });
      } else {
        throw new Error('No se pudo eliminar ningún archivo');
      }

    } catch (err: any) {
      console.error('❌ Error crítico en handleDeleteImage:', {
        message: err.message,
        error: err,
      });
      
      toast({
        title: 'Error',
        description: err?.message || 'No se pudo eliminar la imagen',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    // Validaciones
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSaving(true);

    try {
      const updateData: any = {
        fullName: name,
        email,
      };

      if (password) {
        updateData.password = password;
      }

      await apiClient.updateUser(user.id, updateData);
      
      // Refrescar datos del usuario en el contexto
      await refreshUser();

      toast({
        title: 'Éxito',
        description: 'Perfil actualizado correctamente',
      });

      // Limpiar contraseñas
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el perfil');
      toast({
        title: 'Error',
        description: err?.message || 'No se pudo actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-palero-blue1" />
      </div>
    );
  }

  const userInitials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Gestiona tu información personal y foto de perfil</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Foto de perfil */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Sube o actualiza tu imagen de perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {/* Avatar */}
              <div className="relative">
                {isLoadingProfile ? (
                  <Skeleton className="h-32 w-32 rounded-full" />
                ) : (
                  <Avatar className="h-32 w-32 ring-4 ring-palero-blue1/20">
                    {profileImage ? (
                      <AvatarImage 
                        src={profileImage} 
                        alt={user.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-palero-teal1 text-white text-3xl">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={isUploadingImage}
                  onClick={() => document.getElementById('profile-image-input')?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {profileImage ? 'Cambiar' : 'Subir'}
                </Button>
                
                {profileImage && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    disabled={isUploadingImage}
                    onClick={handleDeleteImage}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              <p className="text-xs text-gray-500 text-center">
                Formatos: JPG, PNG, WEBP<br />
                Tamaño máximo: 5MB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha: Datos del perfil */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tus datos personales</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Input
                  id="role"
                  type="text"
                  value={user.role}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Cambiar Contraseña</h3>
                <p className="text-xs text-gray-500">Deja en blanco si no deseas cambiarla</p>

                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
