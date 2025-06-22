export type UserRole = 'ADMIN' | 'TEAM_MEMBER' | 'CLIENT';

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
    { resource: 'reports', actions: ['read'] },
    { resource: 'settings', actions: ['read', 'update'] }
  ],
  TEAM_MEMBER: [
    { resource: 'users', actions: ['read'] },
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'projects', actions: ['create', 'read', 'update'] },
    { resource: 'tasks', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'subtasks', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'comments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read'] }
  ],
  CLIENT: [
    { resource: 'projects', actions: ['read'] },
    { resource: 'tasks', actions: ['read'] },
    { resource: 'subtasks', actions: ['read'] },
    { resource: 'comments', actions: ['create', 'read'] }
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
    '/dashboard': ['ADMIN', 'TEAM_MEMBER', 'CLIENT'],
    '/users': ['ADMIN'],
    '/clients': ['ADMIN', 'TEAM_MEMBER'],
    '/projects': ['ADMIN', 'TEAM_MEMBER', 'CLIENT'],
    '/tasks': ['ADMIN', 'TEAM_MEMBER', 'CLIENT'],
    '/calendar': ['ADMIN', 'TEAM_MEMBER', 'CLIENT'],
    '/reports': ['ADMIN', 'TEAM_MEMBER'],
    '/settings': ['ADMIN']
  };

  return routePermissions[route as keyof typeof routePermissions]?.includes(userRole) || false;
}