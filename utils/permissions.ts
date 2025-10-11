export type UserRole = 'ADMIN' | 'TEAM_MEMBER' | 'CLIENT' | 'FAST_CLIENT';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface RolePermissions {
  [key: string]: Permission[];
}

export const rolePermissions: RolePermissions = {
  ADMIN: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'projects', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tasks', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'subtasks', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'comments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'notifications', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'chat', actions: ['create', 'read', 'update'] },
    { resource: 'settings', actions: ['read', 'update'] }
  ],
  TEAM_MEMBER: [
    { resource: 'users', actions: ['read'] },
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'projects', actions: ['create', 'read', 'update'] },
    { resource: 'tasks', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'subtasks', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'comments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'invoices', actions: ['create', 'read', 'update'] },
    { resource: 'notifications', actions: ['read'] },
    { resource: 'chat', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] }
  ],
  CLIENT: [
    { resource: 'projects', actions: ['read'] },
    { resource: 'tasks', actions: ['read'] },
    { resource: 'subtasks', actions: ['read'] },
    { resource: 'comments', actions: ['create', 'read'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'notifications', actions: ['read'] },
    { resource: 'chat', actions: ['create', 'read', 'update'] }
  ],
  FAST_CLIENT: [
    { resource: 'projects', actions: ['read'] },
    { resource: 'tasks', actions: ['read'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'notifications', actions: ['read'] }
    // chat: No incluido - los FAST_CLIENT no tienen acceso al chat
  ]
};

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissions = rolePermissions[userRole];
  const resourcePermission = permissions.find(p => p.resource === resource);
  return resourcePermission?.actions.includes(action) || false;
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const routePermissions = {
    '/dashboard': ['ADMIN', 'TEAM_MEMBER', 'CLIENT', 'FAST_CLIENT'],
    '/users': ['ADMIN'],
    '/clients': ['ADMIN', 'TEAM_MEMBER'],
    '/projects': ['ADMIN', 'TEAM_MEMBER', 'CLIENT', 'FAST_CLIENT'],
    '/tasks': ['ADMIN', 'TEAM_MEMBER', 'CLIENT', 'FAST_CLIENT'],
    '/invoices': ['ADMIN', 'TEAM_MEMBER', 'CLIENT', 'FAST_CLIENT'],
    '/calendar': ['ADMIN', 'TEAM_MEMBER', 'CLIENT', 'FAST_CLIENT'],
    '/meetings': ['ADMIN', 'TEAM_MEMBER', 'CLIENT', 'FAST_CLIENT'],
    '/reports': ['ADMIN', 'TEAM_MEMBER'],
    '/notifications': ['ADMIN', 'TEAM_MEMBER', 'CLIENT', 'FAST_CLIENT'],
    '/chat': ['ADMIN', 'TEAM_MEMBER', 'CLIENT'], // FAST_CLIENT excluido
    '/settings': ['ADMIN'],
    '/user-profile': ['ADMIN', 'TEAM_MEMBER', 'CLIENT', 'FAST_CLIENT'] // Todos pueden acceder a su perfil
  };

  return routePermissions[route as keyof typeof routePermissions]?.includes(userRole) || false;
}