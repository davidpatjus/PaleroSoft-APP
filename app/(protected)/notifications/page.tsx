"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Bell, CheckCheck, Filter } from 'lucide-react';
import { NotificationItem } from '@/components/NotificationItem';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NotificationsPage() {
  const { 
    notifications, 
    isLoadingNotifications, 
    fetchNotifications, 
    unreadCount,
    markAsRead 
  } = useAuth();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-palero-navy1 flex items-center gap-2">
              <Bell className="h-6 w-6 md:h-8 md:w-8 text-palero-teal1" />
              Notifications
            </h1>
            <p className="text-palero-navy2 mt-1">
              Stay updated with all your project activities
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="border-palero-teal1 text-palero-teal1 hover:bg-palero-teal1/10"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )} */}
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoadingNotifications}
              className="border-palero-blue1 text-palero-blue1 hover:bg-palero-blue1/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingNotifications ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats and Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-palero-blue1/10 text-palero-blue1 border-0">
              Total: {notifications.length}
            </Badge>
            
            {unreadCount > 0 && (
              <Badge className="bg-palero-green1 hover:bg-palero-green1 text-white border-0">
                New: {unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Filter className="h-4 w-4 text-palero-navy2 flex-shrink-0" />
            <Select value={filter} onValueChange={(value: 'all' | 'unread' | 'read') => setFilter(value)}>
              <SelectTrigger className="w-32 border-palero-blue1/30 focus:border-palero-teal1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" side="bottom" className="max-w-[140px]">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <Card className="shadow-xl border-palero-blue1/20 bg-white/95 backdrop-blur-sm">
        {filteredNotifications.length === 0 ? (
          <CardContent className="p-8 text-center">
            {isLoadingNotifications ? (
              <div className="flex items-center justify-center space-x-2 text-palero-navy2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Loading notifications...</span>
              </div>
            ) : filter === 'all' ? (
              <div className="text-palero-navy2">
                <Bell className="h-12 w-12 mx-auto mb-4 text-palero-teal1/50" />
                <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
                <p className="text-sm text-palero-navy2/70">
                  You&apos;ll see updates about tasks, projects, and invoices here
                </p>
              </div>
            ) : (
              <div className="text-palero-navy2">
                <Filter className="h-12 w-12 mx-auto mb-4 text-palero-teal1/50" />
                <h3 className="text-lg font-medium mb-2">
                  No {filter} notifications
                </h3>
                <p className="text-sm text-palero-navy2/70">
                  Try changing the filter to see more notifications
                </p>
              </div>
            )}
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="divide-y divide-palero-blue1/10">
              {filteredNotifications.map((notification) => (
                <div key={notification.id} className="p-2">
                  <NotificationItem 
                    notification={notification} 
                    onClose={() => {}} // No need to close on this page
                  />
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Mobile-friendly pagination hint */}
      {filteredNotifications.length > 10 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-palero-navy2/70">
            Showing {filteredNotifications.length} notifications
          </p>
        </div>
      )}
    </div>
  );
}
