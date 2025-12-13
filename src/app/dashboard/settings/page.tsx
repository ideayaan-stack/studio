'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfilePictureUpload } from '@/components/dashboard/profile-picture-upload';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { NotificationSettings } from '@/components/dashboard/notification-settings';
import { TeamIconUpload } from '@/components/dashboard/team-icon-upload';
import { User, Palette, Bell, Shield, Menu, Users, LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Team } from '@/lib/types';
import { canSeeAllTeams, canAccessTeamsPage, isHead } from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { db, userProfile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get teams for team icon management
  const teamsQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTeams(userProfile)) {
      return collection(db, 'teams');
    }
    if (isHead(userProfile) && userProfile?.teamId) {
      return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile]);

  const { data: teams } = useCollection<Team>(teamsQuery);
  const canManageTeamIcons = canAccessTeamsPage(userProfile); // Core, Semi-core, Head

  const tabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'appearance', label: 'Appearance', icon: Palette },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    ...(canManageTeamIcons ? [{ value: 'team', label: 'Team', icon: Users }] : []),
    { value: 'account', label: 'Account', icon: Shield },
  ];

  const MobileTabsList = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden mb-4">
          <Menu className="h-4 w-4 mr-2" />
          {tabs.find(t => t.value === activeTab)?.label || 'Settings'}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <div className="space-y-2 mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab(tab.value);
                  setIsMobileMenuOpen(false);
                }}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 p-4 md:p-6">
      <div className="w-full md:w-64 flex-shrink-0 space-y-4">
        <div>
          <h1 className="text-2xl font-headline font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
          <div className="flex flex-col space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === tab.value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </Tabs>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto pr-2">
        <Tabs value={activeTab} className="w-full space-y-6">
          <TabsContent value="profile" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your profile information and picture.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfilePictureUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application.</CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeToggle />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <NotificationSettings />
              </CardContent>
            </Card>
          </TabsContent>

          {canManageTeamIcons && (
            <TabsContent value="team" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Icons</CardTitle>
                  <CardDescription>Manage icons for your teams.</CardDescription>
                </CardHeader>
                <CardContent>
                  {teams && teams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {teams.map((team) => (
                        <div key={team.id} className="p-4 border rounded-lg space-y-3 bg-muted/20">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium truncate">{team.name}</h3>
                          </div>
                          <TeamIconUpload team={team} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No teams available to manage.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="account" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account security and session.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Session</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Sign Out</p>
                      <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-destructive uppercase tracking-wider mb-4">Danger Zone</h3>
                  <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-destructive">Delete Account</p>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
                      </div>
                      <Button
                        variant="destructive"
                        disabled
                        title="Contact administrator to delete account"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

