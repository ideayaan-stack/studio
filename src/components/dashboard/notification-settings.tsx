'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, MessageSquare, CheckSquare } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationSettings() {
  // These are placeholder UI components - actual notification settings will be implemented later
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [teamNotifications, setTeamNotifications] = useState(false);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="email-notifications" className="text-sm sm:text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Receive notifications via email.
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
            disabled
            className="sm:ml-4 scale-110 sm:scale-100"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="task-notifications" className="text-sm sm:text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Task Notifications
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Get notified about task assignments and updates.
            </p>
          </div>
          <Switch
            id="task-notifications"
            checked={taskNotifications}
            onCheckedChange={setTaskNotifications}
            disabled
            className="sm:ml-4 scale-110 sm:scale-100"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="chat-notifications" className="text-sm sm:text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Notifications
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Receive notifications for new messages in team chats.
            </p>
          </div>
          <Switch
            id="chat-notifications"
            checked={chatNotifications}
            onCheckedChange={setChatNotifications}
            disabled
            className="sm:ml-4 scale-110 sm:scale-100"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="team-notifications" className="text-sm sm:text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Team Notifications
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Get notified about team updates and announcements.
            </p>
          </div>
          <Switch
            id="team-notifications"
            checked={teamNotifications}
            onCheckedChange={setTeamNotifications}
            disabled
            className="sm:ml-4 scale-110 sm:scale-100"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs sm:text-sm">Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Notification preferences are currently for display only. Full notification functionality will be implemented in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

