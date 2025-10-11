import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  showSidebar?: boolean;
  className?: string;
}

export function ChatLayout({ 
  sidebar, 
  main, 
  showSidebar = true, 
  className 
}: ChatLayoutProps) {
  return (
    <div className={cn("h-[calc(100vh-4rem)] flex", className)}>
      {/* Sidebar - Lista de conversaciones */}
      <div className={cn(
        "w-80 border-r border-border bg-muted/30 transition-all duration-300",
        showSidebar ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0 md:relative md:flex-shrink-0",
        !showSidebar && "absolute inset-y-0 left-0 z-40 md:z-0"
      )}>
        {sidebar}
      </div>

      {/* Main - Chat activo */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {main}
      </div>
    </div>
  );
}