"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/utils/permissions';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Building2,
  CheckSquare,
  Calendar,
  Video,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  FolderOpen,
  FileText,
  Bell
} from 'lucide-react';
import Image from 'next/image';

// Componente para el badge de notificaciones en el sidebar
function NotificationBadge({ isActive }: { isActive: boolean }) {
  const { unreadCount } = useAuth();
  
  if (unreadCount === 0) {
    return isActive ? (
      <div className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse" />
    ) : null;
  }
  
  return (
    <div className="ml-auto">
      <span className={cn(
        "inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full min-w-[20px] h-5",
        isActive 
          ? "bg-white text-palero-green1" 
          : "bg-palero-green1 text-white group-hover:bg-white group-hover:text-palero-green1"
      )}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </div>
  );
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { name: 'Notifications', href: '/notifications', icon: Bell, route: '/notifications' },
  { name: 'Users', href: '/users', icon: Users, route: '/users' },
  { name: 'Clients', href: '/clients', icon: Building2, route: '/clients' },
  { name: 'Projects', href: '/projects', icon: FolderOpen, route: '/projects' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, route: '/tasks' },
  { name: 'Invoices', href: '/invoices', icon: FileText, route: '/invoices' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, route: '/calendar' },
  { name: 'Meetings', href: '/meetings', icon: Video, route: '/meetings' },
  { name: 'Reports', href: '/reports', icon: BarChart3, route: '/reports' },
  // { name: 'Settings', href: '/settings', icon: Settings, route: '/settings' }
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return null;

  const filteredNavigation = navigationItems.filter(item => 
    canAccessRoute(user.role, item.route)
  );

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'TEAM_MEMBER': return 'Team Member';
      case 'CLIENT': return 'Client';
      default: return role;
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-palero-navy2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="flex h-16 py-4 items-center border-b border-palero-navy1/20 px-6 bg-palero-navy1">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-palero-green1 flex items-center justify-center shadow-lg">
            <Image src="/images/LogoPalerosoft.jpg" width={40} height={40} alt="Logo" className="rounded-xl h-full w-full" />
          </div>
          <span className="text-xl font-bold text-white">CRM Palerosoft</span>
        </div>
      </div>

      <div className="flex-1 py-6">
        <div className="px-6 mb-6">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-palero-navy1/50">
            <Avatar className="ring-2 ring-palero-green1/50">
              <AvatarFallback className="bg-palero-teal1 text-white font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user.name}</p>
              <p className="text-xs text-palero-blue1">{getRoleDisplayName(user.role)}</p>
            </div>
          </div>
        </div>

        <Separator className="mx-6 mb-6 w-auto bg-palero-navy1/30" />

        <nav className="space-y-2 px-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            const isNotifications = item.href === '/notifications';
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-palero-green1 text-white shadow-lg transform scale-105"
                    : "text-palero-blue1 hover:bg-palero-navy1/60 hover:text-white hover:transform hover:scale-105"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "text-white" : "text-palero-teal1 group-hover:text-white"
                )} />
                <span className="font-medium">{item.name}</span>
                
                {/* Notification badge */}
                {isNotifications && user && (
                  <NotificationBadge isActive={isActive} />
                )}
                
                {isActive && !isNotifications && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-palero-navy1/20 p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-palero-blue1 hover:text-white hover:bg-red-500/80 transition-all duration-200 rounded-xl"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-medium">Sign out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "fixed top-4 z-[9999] md:hidden bg-palero-navy2/90 text-white hover:bg-palero-navy1 backdrop-blur-sm border border-palero-blue1/30 rounded-xl shadow-lg transition-all duration-300",
          isMobileOpen ? "right-4" : "left-4"
        )}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[9990] md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 border-r border-palero-blue1/20 shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex w-auto md:flex-col">
        <div className="flex flex-col border-r border-palero-blue1/20 shadow-xl h-full">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}