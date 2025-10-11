import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquarePlus, Loader2 } from 'lucide-react';
import { ConversationWithParticipant } from '@/lib/api';
import { ConversationListItem } from './ConversationListItem';
import { EmptyState } from './EmptyState';

interface ConversationListProps {
  conversations: ConversationWithParticipant[];
  loading: boolean;
  selectedId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelectConversation,
  onNewChat
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    return conversations.filter(conv =>
      conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.otherUser.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Cargando conversaciones...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mensajes</h2>
          <Button onClick={onNewChat} size="sm" className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            Nuevo
          </Button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de conversaciones */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-4">
            {searchQuery ? (
              <EmptyState
                variant="no-search-results"
                searchQuery={searchQuery}
              />
            ) : (
              <EmptyState variant="no-conversations" />
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedId === conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}