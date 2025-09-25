"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Header() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b border-palero-blue1/20 bg-gradient-to-r from-white to-palero-blue1/5 backdrop-blur-sm shadow-sm relative z-50">
      <div className="flex h-16 items-center px-6 md:px-8">
        <div className="flex-1 flex items-center space-x-4">
          <div className="relative max-w-md flex-1 hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-palero-teal1" />
            <Input
              placeholder="Buscar..."
              className="pl-10 border-palero-blue1/30 focus:border-palero-teal1 focus:ring-palero-teal1/20 bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* <NotificationBell /> */}

          <div className="flex items-center space-x-3 p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-palero-blue1/20 shadow-sm hover:shadow-md transition-all duration-200">
            <Avatar className="h-8 w-8 ring-2 ring-palero-green1/30">
              <AvatarFallback className="text-xs bg-gradient-to-br from-palero-teal1 to-palero-blue1 text-white font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-palero-navy1">{user.name}</p>
              <p className="text-xs text-palero-navy2 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}