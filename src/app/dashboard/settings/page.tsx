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
import { User, Palette, Bell, Shield, Menu, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Team } from '@/lib/types';
import { canSeeAllTeams, canAccessTeamsPage, isHead } from '@/lib/permissions';

export default function SettingsPage() {
  const { db, userProfile } = useAuth();
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
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-bold">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {isMobile ? (
          <MobileTabsList />
        ) : (
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2 py-3">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        <TabsContent value="profile" className="space-y-4">
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

        <TabsContent value="appearance" className="space-y-4">
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

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {canManageTeamIcons && (
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Icon</CardTitle>
                <CardDescription>Manage team icons for teams you have access to.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teams && teams.length > 0 ? (
                    <div className="space-y-4">
                      {teams.map((team) => (
                        <div key={team.id} className="space-y-2">
                          <h3 className="text-sm font-medium">{team.name}</h3>
                          <TeamIconUpload team={team} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No teams available to manage.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings and security.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Additional account settings will be available here in the future.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

