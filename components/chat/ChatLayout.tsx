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
    <div className={cn("h-[calc(100vh-4rem)] flex bg-gray-50", className)}>
      {/* Sidebar - Oculto en mobile, visible en desktop */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex-shrink-0 transition-all",
        // En mobile: mostrar sidebar o main según showSidebar
        showSidebar ? "block" : "hidden",
        // En desktop: siempre visible
        "md:block"
      )}>
        {sidebar}
      </div>

      {/* Main - Oculto en mobile cuando sidebar está visible */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-white",
        // En mobile: ocultar cuando sidebar está visible
        showSidebar ? "hidden md:flex" : "flex"
      )}>
        {main}
      </div>
    </div>
  );
}