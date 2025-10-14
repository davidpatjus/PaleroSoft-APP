"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient, UserResponse, AddParticipantsDto } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AddParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  existingParticipantIds: string[];
  onSuccess: () => void;
}

export function AddParticipantsModal({
  open,
  onOpenChange,
  meetingId,
  existingParticipantIds,
  onSuccess,
}: AddParticipantsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [role, setRole] = useState<'HOST' | 'PARTICIPANT' | 'OBSERVER'>('PARTICIPANT');

  useEffect(() => {
    if (open) {
      loadUsers();
      setSelectedUserIds([]);
      setRole('PARTICIPANT');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiClient.getUsers();
      // Filtrar usuarios que ya son participantes
      const availableUsers = data.filter(
        (user) => !existingParticipantIds.includes(user.id)
      );
      setUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Selecciona al menos un participante',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const participantsData: AddParticipantsDto = {
        userIds: selectedUserIds,
        role,
      };

      await apiClient.addMeetingParticipants(meetingId, participantsData);

      toast({
        title: 'Participantes agregados',
        description: `Se agregaron ${selectedUserIds.length} participante(s) exitosamente`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding participants:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron agregar los participantes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Participantes</DialogTitle>
            <DialogDescription>
              Selecciona los usuarios que deseas invitar a la reunión.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Rol */}
            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={role}
                onValueChange={(value: any) => setRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOST">Anfitrión</SelectItem>
                  <SelectItem value="PARTICIPANT">Participante</SelectItem>
                  <SelectItem value="OBSERVER">Observador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de usuarios */}
            <div className="grid gap-2">
              <Label>Usuarios disponibles</Label>
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-palero-blue1" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-palero-navy2">
                    <User className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">No hay usuarios disponibles</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-palero-blue1/5 transition-colors"
                      >
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-palero-blue1 text-white text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-palero-navy1 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-palero-navy2 truncate">
                            {user.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedUserIds.length > 0 && (
              <div className="text-sm text-palero-navy2">
                {selectedUserIds.length} usuario(s) seleccionado(s)
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedUserIds.length === 0}
              className="bg-palero-green1 hover:bg-palero-green2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                `Agregar (${selectedUserIds.length})`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
