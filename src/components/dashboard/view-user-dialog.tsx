'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/firebase';
import type { UserProfile, Team } from '@/lib/types';
import { Mail, Users, Shield, Calendar } from 'lucide-react';
import { AvatarWithRing } from '@/components/dashboard/avatar-with-ring';
import { getImageUrl } from '@/lib/image-storage';

interface ViewUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserProfile | null;
  teams: Team[];
}

export function ViewUserDialog({ isOpen, setIsOpen, user, teams }: ViewUserDialogProps) {
  const { userProfile } = useAuth();

  if (!user) {
    return null;
  }

  const userTeam = teams.find(t => t.id === user.teamId);
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View information about {user.displayName || user.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <AvatarWithRing
              src={getImageUrl(user.photoURL) || undefined}
              alt={user.displayName || 'User'}
              fallback={getInitials(user.displayName)}
              role={user.role}
              size="xl"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{user.displayName || 'Unknown'}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Role</span>
              </div>
              <Badge variant={user.role === 'Core' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Team</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {userTeam?.name || 'Unassigned'}
              </span>
            </div>

            {user.uid && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">User ID</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                  {user.uid}
                </span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

