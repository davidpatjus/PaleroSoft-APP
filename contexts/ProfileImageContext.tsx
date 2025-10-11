'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { listFiles, toPublicImageUrl } from '@/lib/storage';
import type { FileAttachment } from '@/lib/storage';

interface ProfileImageContextType {
  profileImage: string | null;
  profileImagePath: string | null;
  isLoading: boolean;
  error: string | null;
  /**
   * Refresca la imagen de perfil desde el backend.
   * force: si es true, ignora el cache interno del contexto y vuelve a consultar.
   */
  refreshProfileImage: (options?: { force?: boolean }) => Promise<void>;
  clearProfileImage: () => void;
}

const ProfileImageContext = createContext<ProfileImageContextType | undefined>(undefined);

export const ProfileImageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImagePath, setProfileImagePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 Ref para evitar llamadas duplicadas
  const isLoadingRef = useRef(false);
  const loadedUserIdRef = useRef<string | null>(null);

  const refreshProfileImage = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force === true;
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // 🔥 Evitar llamadas duplicadas si ya está cargando
    if (isLoadingRef.current) {
      console.log('⏭️ [ProfileImageContext] Ya hay una carga en progreso, omitiendo...');
      return;
    }

    // 🔥 Evitar recargar si ya cargamos para este usuario
    if (!force && loadedUserIdRef.current === user.id && profileImage) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      

      const files = await listFiles('PROFILE_IMAGE', user.id);

      if (files.length > 0) {
        const file = files[0] as FileAttachment;

        setProfileImagePath(file.filePath);

        const publicUrl = await toPublicImageUrl(file.filePath);
        // 🚀 Cache-busting para evitar que el navegador/CDN muestre la imagen anterior
        const bustedUrl = `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
        setProfileImage(bustedUrl);
        loadedUserIdRef.current = user.id; // 🔥 Marcar como cargado
        console.log('✅ [ProfileImageContext] Imagen cargada exitosamente');
      } else {
        console.log('ℹ️ [ProfileImageContext] No se encontró imagen de perfil');
        setProfileImage(null);
        setProfileImagePath(null);
        loadedUserIdRef.current = user.id; // 🔥 Marcar como verificado
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ [ProfileImageContext] Error al cargar imagen:', errorMessage);
      setError(errorMessage);
      setProfileImage(null);
      setProfileImagePath(null);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [user?.id, profileImage]);

  const clearProfileImage = useCallback(() => {
    console.log('🗑️ [ProfileImageContext] Limpiando imagen de perfil');
    setProfileImage(null);
    setProfileImagePath(null);
    setError(null);
    loadedUserIdRef.current = null; // 🔥 Resetear flag
  }, []);

  // 🔥 Solo cargar cuando cambie el userId
  useEffect(() => {
    if (user?.id && loadedUserIdRef.current !== user.id) {
      console.log('👤 [ProfileImageContext] Usuario cambió, cargando imagen...');
      refreshProfileImage();
    } else if (!user) {
      console.log('👋 [ProfileImageContext] Usuario deslogueado, limpiando imagen');
      clearProfileImage();
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // 🔥 Solo depende del userId, no de las funciones

  return (
    <ProfileImageContext.Provider
      value={{
        profileImage,
        profileImagePath,
        isLoading,
        error,
        refreshProfileImage,
        clearProfileImage,
      }}
    >
      {children}
    </ProfileImageContext.Provider>
  );
};

export const useProfileImage = () => {
  const context = useContext(ProfileImageContext);
  if (context === undefined) {
    throw new Error('useProfileImage must be used within a ProfileImageProvider');
  }
  return context;
};