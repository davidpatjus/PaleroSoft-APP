"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Comment, UserResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MoreVertical, Trash2, Edit, Paperclip, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listFiles, StorageEntityType, FileAttachment } from '@/lib/storage';
import { AttachmentList } from '@/components/storage/AttachmentList';
import { AttachmentUploader } from '@/components/storage/AttachmentUploader';

interface CommentSectionProps {
  projectId?: string;
  taskId?: string;
}

export function CommentSection({ projectId, taskId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Determinar el tipo de entidad y su ID
  const entityId = projectId || taskId;
  const entityType: StorageEntityType | null = projectId ? 'PROJECT' : taskId ? 'TASK' : null;

  /**
   * Obtiene la lista de archivos adjuntos
   */
  const fetchAttachments = async () => {
    if (!entityType || !entityId) {
      console.log('ℹ️ No hay entityType o entityId para cargar attachments');
      setIsLoadingAttachments(false);
      return;
    }

    console.log('📎 Cargando attachments:', { entityType, entityId });
    setIsLoadingAttachments(true);

    try {
      const files = await listFiles(entityType, entityId);
      console.log('✅ Attachments cargados:', files.length);
      setAttachments(files);
    } catch (err: any) {
      console.error('❌ Error al cargar attachments:', {
        error: err.message,
        entityType,
        entityId,
      });
      // No mostramos error al usuario para no ser intrusivos
      setAttachments([]);
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await apiClient.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const allComments = await apiClient.getComments();
      const filteredComments = allComments.filter(c => 
        (projectId && c.projectId === projectId) || (taskId && c.taskId === taskId)
      );
      setComments(filteredComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      setError(err.message || 'Failed to load comments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchComments();
    fetchAttachments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, taskId]);

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      const createdComment = await apiClient.createComment({
        content: newComment,
        userId: user!.id, // Añadir el ID del usuario actual
        projectId,
        taskId,
      });
      // Refresh comments after posting
      fetchComments();
      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment) return;

    setIsSubmitting(true);
    try {
      await apiClient.updateComment(editingComment.id, { content: editingComment.content });
      setEditingComment(null);
      fetchComments();
    } catch (err: any) {
      setError(err.message || 'Failed to update comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiClient.deleteComment(commentId);
      fetchComments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Actividad</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="attachments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attachments" className="flex items-center space-x-2">
              <Paperclip className="h-4 w-4" />
              <span>Archivos ({attachments.length})</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Comentarios ({comments.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab de Archivos Adjuntos */}
          <TabsContent value="attachments" className="space-y-4 mt-4">
            {isLoadingAttachments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-palero-teal1" />
              </div>
            ) : (
              <>
                <AttachmentList
                  attachments={attachments}
                  onDelete={(deletedFileId) => {
                    console.log('🗑️ Archivo eliminado del UI:', deletedFileId);
                    setAttachments(prev => prev.filter(f => f.id !== deletedFileId));
                  }}
                />
                
                {entityType && entityId && (
                  <div className="pt-4">
                    <Separator className="mb-4" />
                    <AttachmentUploader
                      entityId={entityId}
                      entityType={entityType}
                      onUploadComplete={() => {
                        console.log('✅ Upload completado, refrescando lista...');
                        fetchAttachments();
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab de Comentarios */}
          <TabsContent value="comments" className="space-y-4 mt-4">
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className="border-palero-blue1/30 focus:border-palero-teal1"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-palero-teal1 hover:bg-palero-teal1/90"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Comentar
                </Button>
              </div>
            </form>

            <Separator />

            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-palero-teal1" />
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => {
                  const commentUser = getUserById(comment.userId);
                  return (
                    <div key={comment.id} className="flex items-start space-x-4 p-4 rounded-lg border border-palero-blue1/20 hover:bg-palero-blue1/5 transition-colors">
                      <Avatar className="ring-2 ring-palero-blue1/20">
                        <AvatarFallback className="bg-palero-teal1 text-white">
                          {commentUser?.name.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">{commentUser?.name || 'Usuario Desconocido'}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {user?.id === comment.userId && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => setEditingComment(comment)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-500">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        {editingComment?.id === comment.id ? (
                          <form onSubmit={handleUpdateComment} className="mt-2 space-y-2">
                            <Textarea
                              value={editingComment.content}
                              onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                              rows={3}
                              className="border-palero-blue1/30 focus:border-palero-teal1"
                            />
                            <div className="flex justify-end space-x-2">
                              <Button type="button" variant="ghost" onClick={() => setEditingComment(null)}>Cancelar</Button>
                              <Button type="submit" className="bg-palero-teal1 hover:bg-palero-teal1/90">Guardar</Button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No hay comentarios aún</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
