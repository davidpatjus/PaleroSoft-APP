"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Comment, UserResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MoreVertical, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentSectionProps {
  projectId?: string;
  taskId?: string;
}

export function CommentSection({ projectId, taskId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitComment} className="space-y-4 mb-6">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Comment
            </Button>
          </div>
        </form>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => {
              const commentUser = getUserById(comment.userId);
              return (
                <div key={comment.id} className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {commentUser?.name.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{commentUser?.name || 'User Unknown'}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
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
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-500">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="ghost" onClick={() => setEditingComment(null)}>Cancel</Button>
                          <Button type="submit">Save</Button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
