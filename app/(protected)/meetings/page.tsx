"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Users, Clock, Plus, Settings, Mic, MicOff, Camera, CameraOff } from 'lucide-react';

export default function MeetingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight text-palero-navy1 break-words">
            Meetings & Video Calls
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-palero-navy2 mt-1 break-words">
            Schedule and manage video conferences with your team and clients
          </p>
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Button 
            size="sm"
            disabled
            className="bg-palero-green1/50 text-white w-full sm:w-auto text-sm cursor-not-allowed opacity-50"
          >
            <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Development Notice */}
      <Card className="border-palero-blue1/20 border-2 bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="text-center p-6 sm:p-8">
          <div className="mx-auto mb-4 p-4 bg-palero-blue1/10 rounded-full w-fit">
            <Video className="h-8 w-8 sm:h-12 sm:w-12 text-palero-blue1" />
          </div>
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-palero-navy1 mb-2">
            Module Under Development
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-palero-navy2 max-w-2xl mx-auto">
            We&apos;re building an advanced video conferencing system that will allow you to schedule, manage, and conduct meetings directly within the CRM platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-6">
            {/* Coming Soon Features */}
            <div>
              <h3 className="text-lg font-semibold text-palero-navy1 mb-4 text-center">
                Coming Soon Features
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Feature 1 */}
                <Card className="border-palero-green1/20 bg-palero-green1/5">
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 text-palero-green1 mx-auto mb-2" />
                    <h4 className="font-medium text-palero-navy1 mb-1">Meeting Scheduler</h4>
                    <p className="text-xs text-palero-navy2">Schedule meetings with clients and team members</p>
                  </CardContent>
                </Card>

                {/* Feature 2 */}
                <Card className="border-palero-teal1/20 bg-palero-teal1/5">
                  <CardContent className="p-4 text-center">
                    <Video className="h-6 w-6 text-palero-teal1 mx-auto mb-2" />
                    <h4 className="font-medium text-palero-navy1 mb-1">HD Video Calls</h4>
                    <p className="text-xs text-palero-navy2">High-quality video conferences with screen sharing</p>
                  </CardContent>
                </Card>

                {/* Feature 3 */}
                <Card className="border-palero-blue1/20 bg-palero-blue1/5">
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 text-palero-blue1 mx-auto mb-2" />
                    <h4 className="font-medium text-palero-navy1 mb-1">Team Collaboration</h4>
                    <p className="text-xs text-palero-navy2">Multi-participant meetings with role management</p>
                  </CardContent>
                </Card>

                {/* Feature 4 */}
                <Card className="border-palero-yellow1/20 bg-palero-yellow1/5">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 text-palero-yellow1 mx-auto mb-2" />
                    <h4 className="font-medium text-palero-navy1 mb-1">Meeting History</h4>
                    <p className="text-xs text-palero-navy2">Access recordings and meeting notes</p>
                  </CardContent>
                </Card>

                {/* Feature 5 */}
                <Card className="border-palero-navy1/20 bg-palero-navy1/5">
                  <CardContent className="p-4 text-center">
                    <Settings className="h-6 w-6 text-palero-navy1 mx-auto mb-2" />
                    <h4 className="font-medium text-palero-navy1 mb-1">Advanced Settings</h4>
                    <p className="text-xs text-palero-navy2">Customizable meeting preferences and controls</p>
                  </CardContent>
                </Card>

                {/* Feature 6 */}
                <Card className="border-palero-green2/20 bg-palero-green2/5">
                  <CardContent className="p-4 text-center">
                    <Mic className="h-6 w-6 text-palero-green2 mx-auto mb-2" />
                    <h4 className="font-medium text-palero-navy1 mb-1">Audio Controls</h4>
                    <p className="text-xs text-palero-navy2">Professional audio management and noise cancellation</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Mock Interface Preview */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-palero-navy1 mb-4 text-center">
                Interface Preview
              </h3>
              
              <Card className="border-palero-blue1/20 bg-gradient-to-br from-palero-blue1/5 to-palero-green1/5">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upcoming Meetings */}
                    <div>
                      <h4 className="font-medium text-palero-navy1 mb-3 flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Upcoming Meetings
                      </h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-white/60 rounded border border-palero-green1/20">
                          <p className="text-sm font-medium text-palero-navy1">Project Review</p>
                          <p className="text-xs text-palero-navy2">Today, 2:00 PM</p>
                          <Badge variant="outline" className="text-xs mt-1">Scheduled</Badge>
                        </div>
                        <div className="p-3 bg-white/60 rounded border border-palero-yellow1/20">
                          <p className="text-sm font-medium text-palero-navy1">Client Presentation</p>
                          <p className="text-xs text-palero-navy2">Tomorrow, 10:00 AM</p>
                          <Badge variant="outline" className="text-xs mt-1">Pending</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h4 className="font-medium text-palero-navy1 mb-3 flex items-center">
                        <Video className="mr-2 h-4 w-4" />
                        Quick Actions
                      </h4>
                      <div className="space-y-2">
                        <Button size="sm" variant="outline" disabled className="w-full justify-start">
                          <Video className="mr-2 h-4 w-4" />
                          Start Instant Meeting
                        </Button>
                        <Button size="sm" variant="outline" disabled className="w-full justify-start">
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Meeting
                        </Button>
                        <Button size="sm" variant="outline" disabled className="w-full justify-start">
                          <Users className="mr-2 h-4 w-4" />
                          Join Meeting
                        </Button>
                      </div>
                    </div>

                    {/* Meeting Controls */}
                    <div>
                      <h4 className="font-medium text-palero-navy1 mb-3 flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Meeting Controls
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" disabled className="flex flex-col items-center p-3">
                          <Mic className="h-4 w-4 mb-1" />
                          <span className="text-xs">Mic</span>
                        </Button>
                        <Button size="sm" variant="outline" disabled className="flex flex-col items-center p-3">
                          <Camera className="h-4 w-4 mb-1" />
                          <span className="text-xs">Camera</span>
                        </Button>
                        <Button size="sm" variant="outline" disabled className="flex flex-col items-center p-3">
                          <MicOff className="h-4 w-4 mb-1" />
                          <span className="text-xs">Mute</span>
                        </Button>
                        <Button size="sm" variant="outline" disabled className="flex flex-col items-center p-3">
                          <CameraOff className="h-4 w-4 mb-1" />
                          <span className="text-xs">Hide</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Development Timeline */}
            <div className="mt-8 text-center">
              <h3 className="text-lg font-semibold text-palero-navy1 mb-4">
                Development Timeline
              </h3>
              <div className="bg-palero-blue1/10 rounded-lg p-6">
                <p className="text-palero-navy1 font-medium mb-2">
                  Expected Release: before migrate project to vps
                </p>
                <p className="text-sm text-palero-navy2">
                  We&apos;re working hard to bring you a comprehensive meeting solution that integrates seamlessly with your CRM workflow. 
                  Stay tuned for updates!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
