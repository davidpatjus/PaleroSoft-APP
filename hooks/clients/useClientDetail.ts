"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ClientProfile, Project } from '@/lib/api';

export function useClientDetail(clientId: string) {
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchClientDetail = useCallback(async () => {
    if (!clientId) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      // Hacer las llamadas en paralelo para mejor rendimiento
      const [clientData, allProjects] = await Promise.all([
        apiClient.getClientById(clientId),
        apiClient.getProjects()
      ]);
      
      // Si el cliente no tiene datos de usuario, los obtenemos por separado
      let clientWithUserData = clientData;
      if (!clientData.user && clientData.userId) {
        try {
          const userData = await apiClient.getUserById(clientData.userId);
          clientWithUserData = {
            ...clientData,
            user: userData
          };
        } catch (err) {
          console.warn('Could not fetch user data for client:', err);
          // Mantener el cliente sin datos de usuario si falla
        }
      }
      
      setClient(clientWithUserData);
      
      // Filtrar proyectos del cliente usando el userId del cliente
      const clientProjects = allProjects.filter(project => 
        clientWithUserData.user ? project.clientId === clientWithUserData.user.id : false
      );
      setClientProjects(clientProjects);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch client details');
      console.error('Error fetching client details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  const updateClient = useCallback(async (clientData: Partial<{
    companyName?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    socialMediaLinks?: any;
    status?: 'PROSPECT' | 'ACTIVE' | 'IN_PROJECT' | 'COMPLETED' | 'ARCHIVED';
  }>) => {
    if (!clientId) return { success: false, error: 'Client ID is required' };
    
    try {
      const updatedClient = await apiClient.updateClient(clientId, clientData);
      setClient(updatedClient);
      return { success: true, data: updatedClient };
    } catch (err: any) {
      console.error('Error updating client:', err);
      return { success: false, error: err.message || 'Failed to update client' };
    }
  }, [clientId]);

  const deleteClient = useCallback(async () => {
    if (!clientId) return { success: false, error: 'Client ID is required' };
    
    try {
      await apiClient.deleteClient(clientId);
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting client:', err);
      return { success: false, error: err.message || 'Failed to delete client' };
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientDetail();
  }, [fetchClientDetail]);

  return {
    client,
    clientProjects,
    isLoading,
    error,
    updateClient,
    deleteClient,
    refetch: fetchClientDetail
  };
}

export default useClientDetail;
