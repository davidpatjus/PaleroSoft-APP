"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { useRouter } from 'next/navigation';

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, isLoadingNotifications, fetchNotifications, unreadCount } = useAuth();
  const router = useRouter();

  const handleRefresh = () => {
    console.log('Refresh button clicked');
    fetchNotifications();
  };

  const handleViewAll = () => {
    console.log('View All button clicked');
    onClose();
    router.push('/notifications');
  };

  return (
    <Card className="w-full md:w-96 max-w-none md:max-w-96 shadow-xl border-palero-blue1/20 bg-white/95 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-palero-navy1">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-sm font-normal text-palero-teal1">
                ({unreadCount} new)
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingNotifications}
            className="h-8 w-8 p-0 hover:bg-palero-blue1/10 rounded-lg"
            aria-label="Refresh notifications"
          >
            <RefreshCw className={`h-4 w-4 text-palero-teal1 ${isLoadingNotifications ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <Separator className="bg-palero-blue1/20" />

      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-palero-navy2 text-sm">
              {isLoadingNotifications ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading notifications...</span>
                </div>
              ) : (
                <>
                  <div className="mb-2 text-palero-teal1">🔔</div>
                  <div>No notifications yet</div>
                  <div className="text-xs text-palero-navy2/70 mt-1">
                    You&apos;ll see updates about tasks, projects, and invoices here
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[300px] md:h-[500px]">
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationItem 
                    notification={notification} 
                    onClose={onClose}
                  />
                  {index < notifications.length - 1 && (
                    <Separator className="my-2 bg-palero-blue1/10" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {notifications.length > 0 && (
        <>
          <Separator className="bg-palero-blue1/20" />
          <div className="p-3 bg-palero-blue1/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAll}
              className="w-full text-palero-teal1 hover:bg-palero-teal1/10 rounded-lg"
            >
              View All Notifications
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
