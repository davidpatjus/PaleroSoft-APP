import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MessageCircle } from 'lucide-react';
import { apiClient, UserResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface NewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipient: (userId: string, userName: string) => void;
}

/**
 * Determina qué roles puede contactar el usuario actual
 * NOTA: Los usuarios FAST_CLIENT están excluidos del chat ya que no tienen acceso al sistema
 */
function getAllowedRecipientRoles(currentRole: UserResponse['role']): UserResponse['role'][] {
  switch (currentRole) {
    case 'ADMIN':
      return ['ADMIN', 'TEAM_MEMBER', 'CLIENT']; // Excluido FAST_CLIENT
    case 'TEAM_MEMBER':
      return ['ADMIN', 'CLIENT']; // Excluido FAST_CLIENT
    case 'CLIENT':
      return ['ADMIN', 'TEAM_MEMBER']; // Los clientes pueden chatear con admins y team members
    case 'FAST_CLIENT':
      return []; // Los FAST_CLIENT no tienen acceso al chat
    default:
      return [];
  }
}

export function NewChatModal({ open, onOpenChange, onSelectRecipient }: NewChatModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      loadUsers();
      setSearchQuery('');
    }
  }, [open]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await apiClient.getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: UserResponse['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'TEAM_MEMBER':
        return 'default';
      case 'CLIENT':
        return 'secondary';
      case 'FAST_CLIENT':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: UserResponse['role']) => {
    const labels: Record<UserResponse['role'], string> = {
      ADMIN: 'Admin',
      TEAM_MEMBER: 'Equipo',
      CLIENT: 'Cliente',
      FAST_CLIENT: 'Cliente Rápido',
    };
    return labels[role];
  };

  // Filtrar usuarios según rol y búsqueda
  const allowedRoles = user ? getAllowedRecipientRoles(user.role) : [];
  const filteredUsers = users.filter(u => {
    // Excluir al usuario actual
    if (u.id === user?.id) return false;
    
    // Filtrar por roles permitidos
    if (!allowedRoles.includes(u.role)) return false;
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Nueva Conversación
          </DialogTitle>
          <DialogDescription>
            Selecciona un usuario para iniciar una conversación
          </DialogDescription>
        </DialogHeader>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de usuarios */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'No se encontraron usuarios'
                  : 'No hay usuarios disponibles'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectRecipient(u.id, u.name);
                    onOpenChange(false);
                  }}
                  className="w-full p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 text-left"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-primary/60 to-primary text-primary-foreground">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      <Badge variant={getRoleBadgeVariant(u.role)} className="text-xs">
                        {getRoleLabel(u.role)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Info de permisos */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          {user?.role === 'ADMIN' && (
            <p>Como administrador, puedes chatear con miembros del equipo y clientes.</p>
          )}
          {user?.role === 'TEAM_MEMBER' && (
            <p>Puedes chatear con administradores y clientes.</p>
          )}
          {user?.role === 'CLIENT' && (
            <p>Puedes chatear con administradores y miembros del equipo.</p>
          )}
          {user?.role === 'FAST_CLIENT' && (
            <p>Los clientes rápidos no tienen acceso al sistema de chat.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
