'use client';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarWithRing } from '@/components/dashboard/avatar-with-ring';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ViewUserDialog } from '@/components/dashboard/view-user-dialog';
import { useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Team } from '@/lib/types';
import { getImageUrl } from '@/lib/image-storage';

export function UserNav() {
  const { user, userProfile, signOut, loading, db } = useAuth();
  const router = useRouter();
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  
  // Get teams for view dialog
  const teamsQuery = db ? collection(db, 'teams') : null;
  const { data: teams } = useCollection<Team>(teamsQuery);
  
  if (loading && !user) {
    return (
        <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
            </div>
      </div>
    )
  }

  if (!user) {
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
            <AvatarWithRing
              src={getImageUrl(userProfile?.photoURL) || undefined}
              alt={userProfile?.displayName || 'User Avatar'}
              fallback={getInitials(userProfile?.displayName)}
              role={userProfile?.role}
              size="md"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userProfile?.displayName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
               {userProfile?.role && (
                <p className="text-xs leading-none text-muted-foreground pt-1">
                  Role: <span className="font-semibold">{userProfile.role}</span>
                </p>
               )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setIsViewProfileOpen(true)}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/dashboard/settings')}>
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={signOut}>
              Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ViewUserDialog
        isOpen={isViewProfileOpen}
        setIsOpen={setIsViewProfileOpen}
        user={userProfile}
        teams={teams || []}
      />
    </>
  )
}
