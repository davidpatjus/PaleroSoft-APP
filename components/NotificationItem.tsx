"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Clock
} from 'lucide-react';
import { Notification, NotificationType, EntityType } from '@/lib/api';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
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

// Background color for notification types
const getNotificationBg = (type: NotificationType, isRead: boolean) => {
  if (isRead) return 'bg-gray-50/50';
  
  switch (type) {
    case 'NEW_TASK_ASSIGNED':
      return 'bg-palero-teal1/5 border-l-4 border-palero-teal1';
    case 'TASK_STATUS_UPDATED':
      return 'bg-palero-blue1/5 border-l-4 border-palero-blue1';
    case 'PROJECT_CREATED':
    case 'PROJECT_STATUS_UPDATED':
      return 'bg-palero-green1/5 border-l-4 border-palero-green1';
    case 'COMMENT_CREATED':
      return 'bg-palero-teal2/5 border-l-4 border-palero-teal2';
    case 'INVOICE_GENERATED':
    case 'PAYMENT_REMINDER':
      return 'bg-palero-green1/5 border-l-4 border-palero-green1';
    default:
      return 'bg-palero-blue1/5 border-l-4 border-palero-blue1';
  }
};

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead } = useAuth();
  const router = useRouter();

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
        // For comments, we might want to navigate to the parent entity
        // This would require additional logic to determine the parent
        return null;
      default:
        return null;
    }
  };

  const handleClick = async () => {
    console.log('Notification clicked:', notification.id, 'Type:', notification.type, 'Entity:', notification.entityType);
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
      
      // Navigate to related entity
      const navigationUrl = getNavigationUrl(notification.entityType, notification.entityId, notification.type);
      console.log('Navigation URL:', navigationUrl);
      if (navigationUrl) {
        router.push(navigationUrl);
      }
      
      onClose();
    } catch (error) {
      console.error('Error handling notification click:', error);
      // Still close the dropdown even if there's an error
      onClose();
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const navigationUrl = getNavigationUrl(notification.entityType, notification.entityId, notification.type);
  const isClickable = navigationUrl !== null;

  const baseClasses = "w-full p-3 transition-all duration-200 rounded-lg";
  const bgClasses = getNotificationBg(notification.type, notification.isRead);
  const interactionClasses = isClickable 
    ? "hover:bg-palero-blue1/10 cursor-pointer" 
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
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-sm leading-relaxed ${
            notification.isRead ? 'text-palero-navy2' : 'text-palero-navy1 font-medium'
          }`}>
            {notification.message}
          </p>
          
          {/* Time and status */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-palero-navy2/70">
              {timeAgo}
            </span>
            
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <Badge 
                  variant="secondary" 
                  className="h-5 px-2 text-xs bg-palero-teal1/20 text-palero-teal1 border-0 font-medium"
                >
                  New
                </Badge>
              )}
              
              {isClickable && (
                <span className="text-xs text-palero-teal1 font-medium">
                  Click to view →
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
