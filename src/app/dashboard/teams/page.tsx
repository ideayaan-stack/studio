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
import { PlusCircle, MoreHorizontal, Users, User, Edit } from 'lucide-react';
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
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { AddUserDialog } from '@/components/dashboard/add-user-dialog';
import { CreateTeamDialog } from '@/components/dashboard/create-team-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function TeamsPage() {
  const { db, user, isCoreAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isCreateTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);

  const teamsQuery = useMemo(() => (db ? collection(db, 'teams') : null), [db]);
  const usersQuery = useMemo(() => (db ? collection(db, 'users') : null), [db]);

  const { data: teams, loading: teamsLoading } = useCollection<Team>(teamsQuery);
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(usersQuery);
  
  const isLoading = authLoading || teamsLoading || usersLoading;
  
  const canManage = isCoreAdmin;

  const usersWithTeamInfo = useMemo(() => {
    if (!users || !teams) return [];
    return users.map(user => {
      const team = teams.find(t => t.id === user.teamId);
      return {
        ...user,
        teamName: team?.name || 'Unassigned',
      };
    });
  }, [users, teams]);

  const handleUpdateRole = async (uid: string, role: UserProfile['role']) => {
    if (!db) return;
    const userDocRef = doc(db, 'users', uid);
    try {
        await updateDoc(userDocRef, { role });
        toast({ title: "Success", description: "User role updated." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

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
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
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
                      {canManage && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
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
                      {canManage && (
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
                              <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )})
                )}
                {!isLoading && teams?.length === 0 && (
                    <TableRow><TableCell colSpan={canManage ? 5 : 4} className="h-24 text-center">No teams found. Get started by creating a team.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className='font-headline'>Users</CardTitle>
                    <CardDescription>Manage all user accounts and roles.</CardDescription>
                </div>
                 {canManage && (
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
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
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
                                {canManage && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                            </TableRow>
                        ))
                    ) : (
                        usersWithTeamInfo?.map(user => (
                            <TableRow key={user.uid} className={cn(user.teamName === 'Unassigned' && 'bg-destructive/10')}>
                                <TableCell className="font-medium">{user.displayName}</TableCell>
                                <TableCell className='text-muted-foreground'>{user.email}</TableCell>
                                <TableCell><Badge variant={user.role === 'Core' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                <TableCell className={cn('font-medium', user.teamName === 'Unassigned' && 'text-destructive')}>{user.teamName}</TableCell>
                                {canManage && (
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
                                                <DropdownMenuItem onSelect={() => handleUpdateRole(user.uid, user.role === 'Core' ? 'Volunteer' : 'Core')}>
                                                    Make {user.role === 'Core' ? 'Volunteer' : 'Core'}
                                                </DropdownMenuItem>
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

      {canManage && (
        <>
          <AddUserDialog 
            isOpen={isAddUserDialogOpen} 
            setIsOpen={setAddUserDialogOpen} 
            teams={teams || []} 
          />
          <CreateTeamDialog
            isOpen={isCreateTeamDialogOpen}
            setIsOpen={setCreateTeamDialogOpen}
            users={users || []}
          />
        </>
      )}
    </>
  );
}
