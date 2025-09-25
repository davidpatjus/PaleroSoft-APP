"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Settings, 
  Filter, 
  Users, 
  Eye, 
  EyeOff,
  BarChart3,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { AdminNotificationItem } from '@/components/AdminNotificationItem';
import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Notification, AdminNotification, UserResponse, apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

type FilterType = 'all' | 'unread' | 'read' | 'my-notifications';
type RoleFilter = 'all' | 'ADMIN' | 'TEAM_MEMBER' | 'CLIENT' | 'FAST_CLIENT';
type NotificationTypeFilter = 'all' | 'NEW_TASK_ASSIGNED' | 'TASK_STATUS_UPDATED' | 'PROJECT_CREATED' | 'PROJECT_STATUS_UPDATED' | 'COMMENT_CREATED' | 'INVOICE_GENERATED' | 'PAYMENT_REMINDER';

export default function AdminNotificationsPage() {
  const { user, isLoadingNotifications, markAsRead } = useAuth();
  const router = useRouter();
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [readFilter, setReadFilter] = useState<FilterType>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>('all');

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/notifications');
    }
  }, [user, router]);

  // Load all notifications for admin view
  const loadAdminNotifications = useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch notifications and users simultaneously
      const [notifications, users] = await Promise.all([
        apiClient.getAllNotificationsForAdmin(),
        apiClient.getUsers()
      ]);
      
      // Create a users map for quick lookup
      const usersMap = new Map<string, UserResponse>();
      users.forEach(u => usersMap.set(u.id, u));
      
      // Combine notifications with user information
      const adminNotifications: AdminNotification[] = notifications.map(notification => ({
        ...notification,
        user: usersMap.get(notification.userId) ? {
          id: usersMap.get(notification.userId)!.id,
          name: usersMap.get(notification.userId)!.name,
          email: usersMap.get(notification.userId)!.email,
          role: usersMap.get(notification.userId)!.role
        } : undefined
      }));
      
      console.log(`Loaded ${notifications.length} notifications and ${users.length} users`);
      console.log(`Combined into ${adminNotifications.length} admin notifications`);
      
      setAdminNotifications(adminNotifications);
    } catch (error) {
      console.error('Error loading admin notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAdminNotifications();
  }, [loadAdminNotifications]);

  const filteredNotifications = adminNotifications.filter(notification => {
    // Read/unread filter
    if (readFilter === 'unread' && notification.isRead) return false;
    if (readFilter === 'read' && !notification.isRead) return false;
    if (readFilter === 'my-notifications' && notification.userId !== user?.id) return false;
    
    // Role filter
    if (roleFilter !== 'all' && notification.user?.role !== roleFilter) return false;
    
    // Type filter
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    return true;
  });

  const handleRefresh = async () => {
    await loadAdminNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      // Update local state
      setAdminNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Statistics
  const totalNotifications = adminNotifications.length;
  const unreadCount = adminNotifications.filter(n => !n.isRead).length;
  const myNotificationsCount = adminNotifications.filter(n => n.userId === user?.id).length;
  const myUnreadCount = adminNotifications.filter(n => n.userId === user?.id && !n.isRead).length;

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <Card className="shadow-xl border-red-200">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2 text-red-700">Access Denied</h3>
            <p className="text-sm text-red-600">
              You don&apos;t have permission to access the admin notifications panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="responsive-container">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-full overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-palero-navy1 flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center flex-shrink-0">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              Notifications Dashboard
            </h1>
            <p className="text-sm sm:text-base text-palero-navy2 mt-2">
              Monitor and manage all system notifications across the platform
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="border-palero-blue1/30 text-palero-blue1 hover:bg-palero-blue1/10 hover:border-palero-blue1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="border-palero-blue1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Total Notifications</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-blue1 to-palero-blue2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-blue2 mb-1">{totalNotifications}</div>
              <p className="text-xs text-palero-navy2">system notifications</p>
            </CardContent>
          </Card>

          <Card className="border-palero-green1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">Unread Total</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-green1 to-palero-green2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <EyeOff className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-green2 mb-1">{unreadCount}</div>
              <p className="text-xs text-palero-navy2">pending attention</p>
            </CardContent>
          </Card>

          <Card className="border-palero-teal1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">My Notifications</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-teal1 to-palero-teal2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Users className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-teal2 mb-1">{myNotificationsCount}</div>
              <p className="text-xs text-palero-navy2">assigned to me</p>
            </CardContent>
          </Card>

          <Card className="border-palero-navy1/20 border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-palero-navy1">My Unread</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-palero-navy1 to-palero-navy2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Eye className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-3xl font-bold text-palero-navy1 mb-1">{myUnreadCount}</div>
              <p className="text-xs text-palero-navy2">need my attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-blue1 to-palero-teal1 flex items-center justify-center">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-palero-navy1">Advanced Filters</h3>
                  <p className="text-sm text-palero-navy2">Customize your notification view</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {/* Read Status Filter */}
                <div className="space-y-2">
                  <span className="text-xs text-palero-navy2 font-medium">Status:</span>
                  <Select value={readFilter} onValueChange={(value: FilterType) => setReadFilter(value)}>
                    <SelectTrigger className="w-full h-9 border-palero-blue1/30 focus:border-palero-teal1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start" side="bottom" className="max-w-[200px]">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unread">Unread Only</SelectItem>
                      <SelectItem value="read">Read Only</SelectItem>
                      <SelectItem value="my-notifications">My Notifications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Filter */}
                <div className="space-y-2">
                  <span className="text-xs text-palero-navy2 font-medium">Role:</span>
                  <Select value={roleFilter} onValueChange={(value: RoleFilter) => setRoleFilter(value)}>
                    <SelectTrigger className="w-full h-9 border-palero-blue1/30 focus:border-palero-teal1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start" side="bottom" className="max-w-[160px]">
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                      <SelectItem value="FAST_CLIENT">Fast Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <span className="text-xs text-palero-navy2 font-medium">Type:</span>
                  <Select value={typeFilter} onValueChange={(value: NotificationTypeFilter) => setTypeFilter(value)}>
                    <SelectTrigger className="w-full h-9 border-palero-blue1/30 focus:border-palero-teal1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start" side="bottom" className="max-w-[220px]">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="NEW_TASK_ASSIGNED">New Task Assigned</SelectItem>
                      <SelectItem value="TASK_STATUS_UPDATED">Task Status Updated</SelectItem>
                      <SelectItem value="PROJECT_CREATED">Project Created</SelectItem>
                      <SelectItem value="PROJECT_STATUS_UPDATED">Project Status Updated</SelectItem>
                      <SelectItem value="COMMENT_CREATED">Comment Created</SelectItem>
                      <SelectItem value="INVOICE_GENERATED">Invoice Generated</SelectItem>
                      <SelectItem value="PAYMENT_REMINDER">Payment Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="bg-white/80 backdrop-blur-sm border-palero-blue1/20 shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-palero-navy1 to-palero-navy2 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-palero-navy1">System Notifications</CardTitle>
                  <p className="text-sm text-palero-navy2">
                    {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-palero-green1/10 border-palero-green1/30 text-palero-green1">
                  {filteredNotifications.length} active
                </Badge>
              </div>
            </div>
          </CardHeader>
        
          <CardContent className="p-0 sm:p-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-palero-blue1/30 border-t-palero-green1"></div>
                    <p className="text-palero-navy1 font-medium">Loading notifications...</p>
                  </div>
                ) : (
                  <div className="text-palero-navy2">
                    <Filter className="h-12 w-12 mx-auto mb-4 text-palero-teal1/50" />
                    <h3 className="text-lg font-medium mb-2">No notifications match your filters</h3>
                    <p className="text-sm text-palero-navy2/70">
                      Try adjusting your filter settings to see more notifications
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-palero-blue1/10">
                {filteredNotifications.map((notification) => (
                  <div key={notification.id} className="p-3 hover:bg-palero-blue1/5 transition-colors duration-200">
                    <AdminNotificationItem 
                      notification={notification} 
                      onMarkAsRead={handleMarkAsRead}
                      currentUserId={user?.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results info */}
        {filteredNotifications.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-palero-navy2/70">
              Showing {filteredNotifications.length} of {totalNotifications} notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}