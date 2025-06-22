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
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  FolderOpen
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { name: 'Users', href: '/users', icon: Users, route: '/users' },
  { name: 'Clients', href: '/clients', icon: Building2, route: '/clients' },
  { name: 'Projects', href: '/projects', icon: FolderOpen, route: '/projects' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, route: '/tasks' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, route: '/calendar' },
  { name: 'Reports', href: '/reports', icon: BarChart3, route: '/reports' },
  { name: 'Settings', href: '/settings', icon: Settings, route: '/settings' }
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
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">CRM Palerosoft</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-6">
        <div className="px-6 mb-6">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{getRoleDisplayName(user.role)}</p>
            </div>
          </div>
        </div>

        <Separator className="mx-6 mb-6" />

        <nav className="space-y-1 px-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
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
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-72 bg-background border-r">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col">
        <div className="flex flex-col border-r bg-background">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}