'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, MessageSquare, CheckSquare, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const { userProfile, db } = useAuth();
  const { toast } = useToast();
  const { permission, requestPermission, loading, fcmToken } = usePushNotifications();

  // Initialize state from userProfile
  const [emailNotifications, setEmailNotifications] = useState(userProfile?.notificationPreferences?.email ?? true);
  const [taskNotifications, setTaskNotifications] = useState(userProfile?.notificationPreferences?.task ?? true);
  const [chatNotifications, setChatNotifications] = useState(userProfile?.notificationPreferences?.chat ?? true);
  const [teamNotifications, setTeamNotifications] = useState(userProfile?.notificationPreferences?.team ?? false);

  // Sync state when userProfile loads
  useEffect(() => {
    if (userProfile?.notificationPreferences) {
      setEmailNotifications(userProfile.notificationPreferences.email ?? true);
      setTaskNotifications(userProfile.notificationPreferences.task ?? true);
      setChatNotifications(userProfile.notificationPreferences.chat ?? true);
      setTeamNotifications(userProfile.notificationPreferences.team ?? false);
    }
  }, [userProfile]);

  const handleToggle = async (key: 'email' | 'task' | 'chat' | 'team', value: boolean) => {
    // Optimistic update
    if (key === 'email') setEmailNotifications(value);
    if (key === 'task') setTaskNotifications(value);
    if (key === 'chat') setChatNotifications(value);
    if (key === 'team') setTeamNotifications(value);

    if (userProfile?.uid && db) {
      try {
        const userRef = doc(db, 'users', userProfile.uid);
        await updateDoc(userRef, {
          [`notificationPreferences.${key}`]: value
        });
        toast({
          title: "Settings Saved",
          description: `${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${value ? 'enabled' : 'disabled'}.`
        });
      } catch (error) {
        console.error("Failed to update preference:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save notification preference."
        });
        // Revert on error (simplified)
      }
    }
  };


  const isPushEnabled = permission === 'granted' && !!fcmToken;

  return (
    <div className="space-y-6">
      {/* Main Push Enable Section */}
      <div className="flex flex-col gap-4 p-5 border rounded-xl bg-gradient-to-br from-background to-muted/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Push Notifications
            </h3>
            <p className="text-sm text-muted-foreground max-w-[80%]">
              Enable push notifications to stay updated on tasks, messages, and team announcements even when the app is closed.
            </p>
          </div>
          {isPushEnabled ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Active
            </div>
          ) : (
            <Button
              onClick={requestPermission}
              disabled={loading || permission === 'denied'}
            >
              {loading ? 'Enabling...' : permission === 'denied' ? 'Check Browser Settings' : 'Enable Notifications'}
            </Button>
          )}
        </div>
      </div>

      {/* Preferences Section */}
      <div className="rounded-xl border shadow-sm divide-y">
        <div className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive daily digests and urgent alerts via email.</p>
            </div>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={(val) => handleToggle('email', val)}
          />
        </div>

        <div className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-orange-100/50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <Label htmlFor="task-notifications" className="font-medium">Task Updates</Label>
              <p className="text-xs text-muted-foreground">Get notified when you are assigned a task or its status changes.</p>
            </div>
          </div>
          <Switch
            id="task-notifications"
            checked={taskNotifications}
            onCheckedChange={(val) => handleToggle('task', val)}
          />
        </div>

        <div className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-100/50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <Label htmlFor="chat-notifications" className="font-medium">Messages</Label>
              <p className="text-xs text-muted-foreground">Receive notifications for new direct messages and mentions.</p>
            </div>
          </div>
          <Switch
            id="chat-notifications"
            checked={chatNotifications}
            onCheckedChange={(val) => handleToggle('chat', val)}
          />
        </div>

        <div className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-teal-100/50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <Label htmlFor="team-notifications" className="font-medium">Team Announcements</Label>
              <p className="text-xs text-muted-foreground">Get notified about general team updates and news.</p>
            </div>
          </div>
          <Switch
            id="team-notifications"
            checked={teamNotifications}
            onCheckedChange={(val) => handleToggle('team', val)}
          />
        </div>
      </div>
    </div>
  );
}

