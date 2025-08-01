"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ClientProfile, UserResponse } from '@/lib/api';

export function useClients() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Hacer las llamadas en paralelo para mejor rendimiento
      const [clientProfiles, allUsers] = await Promise.all([
        apiClient.getClients(),
        apiClient.getUsers()
      ]);
      
      // Crear un mapa de usuarios por ID para búsqueda eficiente
      const usersMap = new Map(allUsers.map(user => [user.id, user]));
      
      // Simular el JOIN: agregar datos de usuario a cada perfil de cliente
      const clientsWithUserData = clientProfiles.map(client => ({
        ...client,
        user: usersMap.get(client.userId) || undefined
      }));
      
      setUsers(allUsers);
      setClients(clientsWithUserData);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createClient = useCallback(async (clientData: {
    userId: string;
    companyName?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    socialMediaLinks?: any;
    status: 'PROSPECT' | 'ACTIVE' | 'IN_PROJECT' | 'COMPLETED' | 'ARCHIVED';
  }) => {
    try {
      const newClient = await apiClient.createClient(clientData);
      
      // Buscar los datos del usuario para el nuevo cliente
      const user = users.find(u => u.id === clientData.userId);
      const clientWithUserData = {
        ...newClient,
        user: user || undefined
      };
      
      setClients(prev => [...prev, clientWithUserData]);
      return { success: true, data: clientWithUserData };
    } catch (err: any) {
      console.error('Error creating client:', err);
      return { success: false, error: err.message || 'Failed to create client' };
    }
  }, [users]);

  const updateClient = useCallback(async (id: string, clientData: Partial<{
    companyName?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    socialMediaLinks?: any;
    status?: 'PROSPECT' | 'ACTIVE' | 'IN_PROJECT' | 'COMPLETED' | 'ARCHIVED';
  }>) => {
    try {
      const updatedClient = await apiClient.updateClient(id, clientData);
      
      // Mantener los datos del usuario en el cliente actualizado
      setClients(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...updatedClient,
            user: c.user // Preservar los datos del usuario existentes
          };
        }
        return c;
      }));
      
      return { success: true, data: updatedClient };
    } catch (err: any) {
      console.error('Error updating client:', err);
      return { success: false, error: err.message || 'Failed to update client' };
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    try {
      await apiClient.deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting client:', err);
      return { success: false, error: err.message || 'Failed to delete client' };
    }
  }, []);

  const getClientById = useCallback(async (id: string) => {
    try {
      const client = await apiClient.getClientById(id);
      return { success: true, data: client };
    } catch (err: any) {
      console.error('Error fetching client:', err);
      return { success: false, error: err.message || 'Failed to fetch client' };
    }
  }, []);

  const getClientByUserId = useCallback(async (userId: string) => {
    try {
      const client = await apiClient.getClientProfileByUserId(userId);
      return { success: true, data: client };
    } catch (err: any) {
      console.error('Error fetching client by user ID:', err);
      return { success: false, error: err.message || 'Failed to fetch client profile' };
    }
  }, []);

  // Obtener usuarios que pueden ser clientes (role CLIENT pero sin perfil)
  const getAvailableUsersForClientProfile = useCallback(() => {
    const clientUsers = users.filter(user => user.role === 'CLIENT');
    const usersWithProfiles = clients.map(client => client.userId);
    return clientUsers.filter(user => !usersWithProfiles.includes(user.id));
  }, [users, clients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    users,
    isLoading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    getClientByUserId,
    getAvailableUsersForClientProfile,
    refetch: fetchClients
  };
}

export default useClients;
