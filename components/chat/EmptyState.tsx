import React from 'react';
import { MessageCircle, Search, Inbox } from 'lucide-react';

interface EmptyStateProps {
  variant: 'no-conversations' | 'no-messages' | 'no-search-results';
  searchQuery?: string;
}

export function EmptyState({ variant, searchQuery }: EmptyStateProps) {
  const variants = {
    'no-conversations': {
      icon: <Inbox className="h-12 w-12 text-muted-foreground" />,
      title: 'No hay conversaciones',
      description: 'Crea una nueva conversación para comenzar a chatear',
    },
    'no-messages': {
      icon: <MessageCircle className="h-12 w-12 text-muted-foreground" />,
      title: 'No hay mensajes aún',
      description: '¡Inicia la conversación enviando el primer mensaje!',
    },
    'no-search-results': {
      icon: <Search className="h-12 w-12 text-muted-foreground" />,
      title: 'No se encontraron resultados',
      description: searchQuery
        ? `No hay conversaciones que coincidan con "${searchQuery}"`
        : 'Intenta con otro término de búsqueda',
    },
  };

  const { icon, title, description } = variants[variant];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
