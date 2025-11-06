'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Users, User, Edit, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Team, UserProfile } from '@/lib/types';
import { useAuth, useCollection } from '@/firebase';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { AddUserDialog } from '@/components/dashboard/add-user-dialog';
import { CreateTeamDialog } from '@/components/dashboard/create-team-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function TeamsPage() {
  const { db, userProfile, isCoreAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isCreateTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  
  const isHead = userProfile?.role === 'Head';

  // Admins see all teams. Heads see only their team.
  const teamsQuery = useMemo(() => {
      if (!db) return null;
      if (isCoreAdmin) return collection(db, 'teams');
      if (isHead && userProfile?.teamId) return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
      return null;
  }, [db, isCoreAdmin, isHead, userProfile?.teamId]);

  // Admins see all users. Heads see users in their team.
  const usersQuery = useMemo(() => {
      if (!db) return null;
      if (isCoreAdmin) return collection(db, 'users');
      if (isHead && userProfile?.teamId) return query(collection(db, 'users'), where('teamId', '==', userProfile.teamId));
      return null;
  }, [db, isCoreAdmin, isHead, userProfile?.teamId]);


  const { data: teams, loading: teamsLoading } = useCollection<Team>(teamsQuery);
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(usersQuery);
  
  const isLoading = authLoading || teamsLoading || usersLoading;
  
  // Only Core admins can do top-level management
  const canManage = isCoreAdmin;

  const usersWithTeamInfo = useMemo(() => {
    if (!users || !teams) return [];
    const allTeams = isCoreAdmin ? teams : (isHead ? teams : []);
    return users.map(user => {
      const team = allTeams?.find(t => t.id === user.teamId);
      return {
        ...user,
        teamName: team?.name || 'Unassigned',
      };
    });
  }, [users, teams, isCoreAdmin, isHead]);

  const handleUpdateRole = async (uid: string, role: UserProfile['role']) => {
    if (!db || !canManage) return;
    const userDocRef = doc(db, 'users', uid);
    try {
        await updateDoc(userDocRef, { role });
        toast({ title: "Success", description: "User role updated." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };
  
  // Volunteers should not see this page. Redirect or show a message.
  if (!isLoading && userProfile?.role === 'Volunteer') {
      return (
        <Alert variant="default" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is for team management and is only accessible to Admins and Team Heads. Please navigate to other sections using the sidebar.
          </AlertDescription>
        </Alert>
      )
  }

  return (
    <>
      <div className="grid gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className='font-headline'>Teams</CardTitle>
              <CardDescription>Manage your committee's teams.</CardDescription>
            </div>
            {canManage && (
              <Button size="sm" className="gap-1" onClick={() => setCreateTeamDialogOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Create Team
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Team Head</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  {(canManage || isHead) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full max-w-sm" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                      {(canManage || isHead) && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                    </TableRow>
                  ))
                ) : (
                  teams?.map((team) => {
                    const headUser = users?.find(u => u.uid === team.head);
                    const memberCount = users?.filter(u => u.teamId === team.id).length || 0;
                    return (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell className='text-muted-foreground max-w-sm truncate'>{team.description}</TableCell>
                      <TableCell className='text-muted-foreground'>{headUser?.displayName || 'N/A'}</TableCell>
                      <TableCell className="text-center">{memberCount}</TableCell>
                      {(canManage || isHead) && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Manage Members</DropdownMenuItem>
                              {canManage && <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>Delete</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )})
                )}
                {!isLoading && teams?.length === 0 && (
                    <TableRow><TableCell colSpan={canManage || isHead ? 5 : 4} className="h-24 text-center">No teams found. Get started by creating a team.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className='font-headline'>Users</CardTitle>
                    <CardDescription>Manage user accounts and roles within your scope.</CardDescription>
                </div>
                 {(canManage || isHead) && (
                    <Button size="sm" className="gap-1" onClick={() => setAddUserDialogOpen(true)}>
                        <User className="h-4 w-4" />
                        Add User
                    </Button>
                )}
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Team</TableHead>
                    {(canManage || isHead) && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({length: 4}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                {(canManage || isHead) && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                            </TableRow>
                        ))
                    ) : (
                        usersWithTeamInfo?.map(user => (
                            <TableRow key={user.uid} className={cn(user.teamName === 'Unassigned' && 'bg-destructive/10')}>
                                <TableCell className="font-medium">{user.displayName}</TableCell>
                                <TableCell className='text-muted-foreground'>{user.email}</TableCell>
                                <TableCell><Badge variant={user.role === 'Core' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                <TableCell className={cn('font-medium', user.teamName === 'Unassigned' && 'text-destructive')}>{user.teamName}</TableCell>
                                {(canManage || (isHead && user.uid !== userProfile?.uid)) && (
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit User</DropdownMenuItem>
                                                <DropdownMenuItem>Change Team</DropdownMenuItem>
                                                {canManage && <DropdownMenuItem onSelect={() => handleUpdateRole(user.uid, user.role === 'Core' ? 'Volunteer' : 'Core')}>
                                                    Make {user.role === 'Core' ? 'Volunteer' : 'Core'}
                                                </DropdownMenuItem>}
                                                <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>Delete User</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                    {!isLoading && users?.length === 0 && (
                         <TableRow><TableCell colSpan={5} className="h-24 text-center">No users found. Get started by adding a user.</TableCell></TableRow>
                    )}
                </TableBody>
               </Table>
            </CardContent>
        </Card>
      </div>

      {(canManage || isHead) && (
        <>
          <AddUserDialog 
            isOpen={isAddUserDialogOpen} 
            setIsOpen={setAddUserDialogOpen} 
            teams={teams || []} 
          />
          {canManage && <CreateTeamDialog
            isOpen={isCreateTeamDialogOpen}
            setIsOpen={setCreateTeamDialogOpen}
            users={users || []}
          />}
        </>
      )}
    </>
  );
}
