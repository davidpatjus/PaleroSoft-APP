"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  CheckSquare, 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  DollarSign,
  AlertCircle,
  Clock,
  User,
  Shield,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { AdminNotification, NotificationType, EntityType } from '@/lib/api';
import { truncateText } from '@/utils/helpers';

interface AdminNotificationItemProps {
  notification: AdminNotification;
  onMarkAsRead?: (notificationId: string) => Promise<void>;
  currentUserId?: string;
}

// Icon mapping for notification types
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'NEW_TASK_ASSIGNED':
      return <CheckSquare className="h-4 w-4 text-palero-teal1" />;
    case 'TASK_STATUS_UPDATED':
      return <Clock className="h-4 w-4 text-palero-blue1" />;
    case 'PROJECT_CREATED':
      return <FolderOpen className="h-4 w-4 text-palero-green1" />;
    case 'PROJECT_STATUS_UPDATED':
      return <FolderOpen className="h-4 w-4 text-palero-blue1" />;
    case 'COMMENT_CREATED':
      return <MessageSquare className="h-4 w-4 text-palero-teal2" />;
    case 'INVOICE_GENERATED':
      return <FileText className="h-4 w-4 text-palero-green1" />;
    case 'PAYMENT_REMINDER':
      return <DollarSign className="h-4 w-4 text-palero-green1" />;
    default:
      return <Bell className="h-4 w-4 text-palero-navy1" />;
  }
};

// Role icon mapping
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return <Shield className="h-3 w-3 text-palero-navy1" />;
    case 'TEAM_MEMBER':
      return <User className="h-3 w-3 text-palero-blue1" />;
    case 'CLIENT':
      return <Users className="h-3 w-3 text-palero-green1" />;
    case 'FAST_CLIENT':
      return <Users className="h-3 w-3 text-palero-teal1" />;
    default:
      return <User className="h-3 w-3 text-palero-navy2" />;
  }
};

// Background color for notification types (admin view)
const getAdminNotificationBg = (type: NotificationType, isRead: boolean) => {
  const baseOpacity = isRead ? '3' : '8';
  
  switch (type) {
    case 'NEW_TASK_ASSIGNED':
      return `bg-palero-teal1/${baseOpacity} border-l-2 border-palero-teal1/30`;
    case 'TASK_STATUS_UPDATED':
      return `bg-palero-blue1/${baseOpacity} border-l-2 border-palero-blue1/30`;
    case 'PROJECT_CREATED':
    case 'PROJECT_STATUS_UPDATED':
      return `bg-palero-green1/${baseOpacity} border-l-2 border-palero-green1/30`;
    case 'COMMENT_CREATED':
      return `bg-palero-teal2/${baseOpacity} border-l-2 border-palero-teal2/30`;
    case 'INVOICE_GENERATED':
    case 'PAYMENT_REMINDER':
      return `bg-palero-green1/${baseOpacity} border-l-2 border-palero-green1/30`;
    default:
      return `bg-palero-blue1/${baseOpacity} border-l-2 border-palero-blue1/30`;
  }
};

// Get user initials for avatar
const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export function AdminNotificationItem({ 
  notification, 
  onMarkAsRead, 
  currentUserId 
}: AdminNotificationItemProps) {
  const router = useRouter();
  const isOwnNotification = currentUserId === notification.userId;
  
  // Function to get navigation URL based on entity type and notification type
  const getNavigationUrl = (entityType: EntityType, entityId: string, notificationType: NotificationType): string | null => {
    switch (entityType) {
      case 'PROJECT':
        return `/projects/${entityId}`;
      case 'TASK':
        if (notificationType === 'NEW_TASK_ASSIGNED' || notificationType === 'TASK_STATUS_UPDATED') {
          return `/tasks/${entityId}/edit`;
        }
        return `/tasks`;
      case 'INVOICE':
        return `/invoices/${entityId}`;
      case 'COMMENT':
        return null;
      default:
        return null;
    }
  };

  const handleClick = async () => {
    try {
      // Only mark as read if it's the admin's own notification
      if (!notification.isRead && isOwnNotification && onMarkAsRead) {
        await onMarkAsRead(notification.id);
      }
      
      // Navigate to related entity
      const navigationUrl = getNavigationUrl(notification.entityType, notification.entityId, notification.type);
      if (navigationUrl) {
        router.push(navigationUrl);
      }
    } catch (error) {
      console.error('Error handling admin notification click:', error);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const navigationUrl = getNavigationUrl(notification.entityType, notification.entityId, notification.type);
  const isClickable = navigationUrl !== null;

  const baseClasses = "w-full p-4 transition-all duration-200 rounded-lg";
  const bgClasses = getAdminNotificationBg(notification.type, notification.isRead);
  const interactionClasses = isClickable 
    ? "hover:bg-palero-blue1/15 cursor-pointer" 
    : "cursor-default";
  const className = `${baseClasses} ${bgClasses} ${interactionClasses}`;

  return (
    <div
      className={className}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      <div className="flex items-start space-x-3 w-full">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        {/* User Avatar & Info */}
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-palero-navy1/10 text-palero-navy1">
              {notification.user ? getUserInitials(notification.user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          {/* User info header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-palero-navy1">
              {notification.user?.name || 'Unknown User'}
            </span>
            <div className="flex items-center gap-1">
              {getRoleIcon(notification.user?.role || '')}
              <span className="text-xs text-palero-navy2/70 uppercase tracking-wide">
                {notification.user?.role || 'N/A'}
              </span>
            </div>
          </div>

          {/* Notification message */}
          {notification.type === 'COMMENT_CREATED' && notification.content ? (
            <div className={`text-sm ${notification.isRead ? 'text-palero-navy2' : 'text-palero-navy1'}`}>
              <p className="leading-relaxed">
                {notification.message}
              </p>
              <blockquote className="mt-2 pl-3 py-2 border-l-4 border-palero-teal2/50 bg-palero-teal2/10 rounded-r-md">
                <div className="flex items-start gap-1">
                  <MessageSquare className="h-3 w-3 text-palero-teal2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-palero-navy1/80 italic leading-relaxed">
                    &quot;{truncateText(notification.content, 120)}&quot;
                  </p>
                </div>
              </blockquote>
            </div>
          ) : (
            <p className={`text-sm leading-relaxed ${
              notification.isRead ? 'text-palero-navy2' : 'text-palero-navy1'
            }`}>
              {notification.message}
            </p>
          )}
          
          {/* Time, status and actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-palero-navy2/70">
                {timeAgo}
              </span>
              
              {/* Read status */}
              <div className="flex items-center gap-1">
                {notification.isRead ? (
                  <Eye className="h-3 w-3 text-palero-green1" />
                ) : (
                  <EyeOff className="h-3 w-3 text-palero-navy2/50" />
                )}
                <span className="text-xs text-palero-navy2/70">
                  {notification.isRead ? 'Read' : 'Unread'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <Badge 
                  variant="secondary" 
                  className="h-5 px-2 text-xs bg-palero-teal1/20 text-palero-teal1 border-0 font-medium"
                >
                  New
                </Badge>
              )}
              
              {/* Show if admin can interact with this notification */}
              {isOwnNotification && !notification.isRead && (
                <Badge 
                  variant="outline" 
                  className="h-5 px-2 py-5 md:py-4 text-xs border-palero-navy1/30 text-palero-navy1"
                >
                  Your notification
                </Badge>
              )}
              
              {isClickable && (
                <span className="text-xs text-palero-teal1 font-medium">
                  View →
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}