import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() || disabled) return;

    const messageToSend = message.trim();
    
    // Limpiar input inmediatamente (optimistic)
    setMessage('');
    
    // Mantener foco en el input
    inputRef.current?.focus();
    
    try {
      await onSend(messageToSend);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      // En caso de error, restaurar el mensaje
      setMessage(messageToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3 max-w-3xl mx-auto">
        <Input
          ref={inputRef}
          placeholder="Escribe un mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 h-11 rounded-full border-gray-300 focus:border-palero-teal1 focus:ring-palero-teal1"
        />
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-11 w-11 rounded-full bg-palero-teal1 hover:bg-palero-teal2 text-white shadow-sm disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
