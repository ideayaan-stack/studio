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
import { PlusCircle, MoreHorizontal, Users, User, Edit, AlertTriangle, Eye, UserCog, Users2, Trash2, Search } from 'lucide-react';
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
import { EditUserDialog } from '@/components/dashboard/edit-user-dialog';
import { EditTeamDialog } from '@/components/dashboard/edit-team-dialog';
import { ChangeUserRoleDialog } from '@/components/dashboard/change-user-role-dialog';
import { ChangeUserTeamDialog } from '@/components/dashboard/change-user-team-dialog';
import { ViewUserDialog } from '@/components/dashboard/view-user-dialog';
import { deleteUserAction } from '@/firebase/actions/user-actions';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  canCreateUsers,
  canCreateTeams,
  canManagePermissions,
  canAccessTeamsPage,
  canSeeAllTeams,
  isHead,
} from '@/lib/permissions';

export default function TeamsPage() {
  const { db, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isCreateTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [isEditTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [isChangeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [isChangeTeamDialogOpen, setChangeTeamDialogOpen] = useState(false);
  const [isViewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState<{ open: boolean; user: UserProfile | null; confirmText: string }>({ open: false, user: null, confirmText: '' });
  const [deleteTeamDialog, setDeleteTeamDialog] = useState<{ open: boolean; team: Team | null; confirmText: string }>({ open: false, team: null, confirmText: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  
  const userIsHead = isHead(userProfile);

  // Core and Semi-core see all teams. Heads see only their team.
  const teamsQuery = useMemo(() => {
      if (!db) return null;
      if (canSeeAllTeams(userProfile)) return collection(db, 'teams');
      if (userIsHead && userProfile?.teamId) return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
      return null;
  }, [db, userProfile, userIsHead]);

  // Core and Semi-core see all users. Heads see users in their team.
  const usersQuery = useMemo(() => {
      if (!db) return null;
      if (canSeeAllTeams(userProfile)) return collection(db, 'users');
      if (userIsHead && userProfile?.teamId) return query(collection(db, 'users'), where('teamId', '==', userProfile.teamId));
      return null;
  }, [db, userProfile, userIsHead]);


  const { data: teams, loading: teamsLoading } = useCollection<Team>(teamsQuery);
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(usersQuery);
  
  const isLoading = authLoading || teamsLoading || usersLoading;
  
  // Only Core can create users/teams and manage permissions
  const canManage = canCreateUsers(userProfile);
  const canManagePerms = canManagePermissions(userProfile);

  const usersWithTeamInfo = useMemo(() => {
    if (!users || !teams) return [];
    const allTeams = canSeeAllTeams(userProfile) ? teams : (userIsHead ? teams : []);
    return users.map(user => {
      const team = allTeams?.find(t => t.id === user.teamId);
      return {
        ...user,
        teamName: team?.name || 'Unassigned',
      };
    });
  }, [users, teams, userProfile, userIsHead]);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    if (!usersWithTeamInfo) return [];
    return usersWithTeamInfo.filter(user => {
      const matchesSearch = !searchQuery || 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.teamName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesTeam = teamFilter === 'all' || user.teamId === teamFilter;
      return matchesSearch && matchesRole && matchesTeam;
    });
  }, [usersWithTeamInfo, searchQuery, roleFilter, teamFilter]);

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    return teams.filter(team => {
      const matchesSearch = !searchQuery || 
        team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [teams, searchQuery]);

  const handleUpdateRole = async (uid: string, role: UserProfile['role']) => {
    if (!db || !canManagePerms) return;
    const userDocRef = doc(db, 'users', uid);
    try {
        await updateDoc(userDocRef, { role });
        toast({ title: "Success", description: "User role updated." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleUpdateTeam = async (uid: string, teamId: string) => {
    if (!db || !canManagePerms) return;
    const userDocRef = doc(db, 'users', uid);
    try {
        await updateDoc(userDocRef, { teamId });
        toast({ title: "Success", description: "User team updated." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDeleteUser = async () => {
    if (!canManagePerms || !deleteUserDialog.user) return;
    
    // Security check: confirm text must match user's email
    if (deleteUserDialog.confirmText !== deleteUserDialog.user.email) {
      toast({ 
        variant: "destructive", 
        title: "Confirmation Failed", 
        description: "Please type the user's email address to confirm deletion." 
      });
      return;
    }

    try {
      const result = await deleteUserAction(deleteUserDialog.user.uid);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({ 
        title: "User Deleted", 
        description: `${deleteUserDialog.user.displayName} has been permanently deleted from the system.` 
      });
      setDeleteUserDialog({ open: false, user: null, confirmText: '' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "Failed to delete user. Please try again." 
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!db || !canManage || !deleteTeamDialog.team) return;
    
    // Security check: confirm text must match team name
    if (deleteTeamDialog.confirmText !== deleteTeamDialog.team.name) {
      toast({ 
        variant: "destructive", 
        title: "Confirmation Failed", 
        description: `Please type "${deleteTeamDialog.team.name}" to confirm deletion.` 
      });
      return;
    }

    try {
      const { deleteDoc } = await import('firebase/firestore');
      const teamDocRef = doc(db, 'teams', deleteTeamDialog.team.id);
      await deleteDoc(teamDocRef);
      toast({ 
        title: "Team Deleted", 
        description: `Team "${deleteTeamDialog.team.name}" has been permanently deleted.` 
      });
      setDeleteTeamDialog({ open: false, team: null, confirmText: '' });
    } catch (error: any) {
      console.error('Error deleting team:', error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "Failed to delete team. Please try again." 
      });
    }
  };
  
  // Volunteers should not see this page. Redirect or show a message.
  if (!isLoading && !canAccessTeamsPage(userProfile)) {
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
            {canCreateTeams(userProfile) && (
              <Button size="sm" className="gap-1" onClick={() => setCreateTeamDialogOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Create Team
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Team Head</TableHead>
                    <TableHead className="text-center">Members</TableHead>
                    {(canManage || userIsHead) && <TableHead className="text-right">Actions</TableHead>}
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
                      {(canManage || userIsHead) && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                    </TableRow>
                  ))
                ) : (
                  filteredTeams?.map((team) => {
                    const headUser = users?.find(u => u.uid === team.head);
                    const memberCount = users?.filter(u => u.teamId === team.id).length || 0;
                    return (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{team.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden mt-1">{team.description}</div>
                          <div className="text-xs text-muted-foreground sm:hidden mt-1">Head: {headUser?.displayName || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className='text-muted-foreground max-w-sm truncate hidden md:table-cell'>{team.description}</TableCell>
                      <TableCell className='text-muted-foreground hidden sm:table-cell'>{headUser?.displayName || 'N/A'}</TableCell>
                      <TableCell className="text-center">{memberCount}</TableCell>
                      {(canManage || userIsHead) && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => {
                                setSelectedTeam(team);
                                // View team details - could add a view dialog later
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canManage && (
                                <DropdownMenuItem onSelect={() => {
                                  setSelectedTeam(team);
                                  setEditTeamDialogOpen(true);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Team
                                </DropdownMenuItem>
                              )}
                              {canManage && (
                                <DropdownMenuItem 
                                  className='text-destructive focus:text-destructive focus:bg-destructive/10'
                                  onSelect={() => setDeleteTeamDialog({ open: true, team, confirmText: '' })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Team
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )})
                )}
                {!isLoading && filteredTeams?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={canManage || userIsHead ? 5 : 4} className="h-24 text-center">
                        {searchQuery ? 'No teams match your search.' : 'No teams found. Get started by creating a team.'}
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <CardTitle className='font-headline'>Users</CardTitle>
                    <CardDescription className="hidden sm:block">Manage user accounts and roles within your scope.</CardDescription>
                </div>
                 {canCreateUsers(userProfile) && (
                    <Button size="sm" className="gap-1 shrink-0" onClick={() => setAddUserDialogOpen(true)}>
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Add User</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                )}
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Core">Core</SelectItem>
                      <SelectItem value="Semi-core">Semi-core</SelectItem>
                      <SelectItem value="Head">Head</SelectItem>
                      <SelectItem value="Volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams?.filter(t => t.name !== 'Core').map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden sm:table-cell">Team</TableHead>
                      {(canManagePerms || userIsHead) && <TableHead className="text-right">Actions</TableHead>}
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
                                {(canManagePerms || userIsHead) && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                            </TableRow>
                        ))
                    ) : (
                        filteredUsers?.map(user => (
                            <TableRow key={user.uid} className={cn(user.teamName === 'Unassigned' && 'bg-destructive/10')}>
                                <TableCell className="font-medium">
                                  <div>
                                    <div>{user.displayName}</div>
                                    <div className="text-xs text-muted-foreground md:hidden mt-1">{user.email}</div>
                                    <div className={cn('text-xs sm:hidden mt-1', user.teamName === 'Unassigned' && 'text-destructive')}>
                                      Team: {user.teamName}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className='text-muted-foreground hidden md:table-cell'>{user.email}</TableCell>
                                <TableCell><Badge variant={user.role === 'Core' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                <TableCell className={cn('font-medium hidden sm:table-cell', user.teamName === 'Unassigned' && 'text-destructive')}>{user.teamName}</TableCell>
                                {(canManagePerms || (userIsHead && user.uid !== userProfile?.uid)) && (
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => {
                                                  setSelectedUser(user);
                                                  setViewUserDialogOpen(true);
                                                }}>
                                                  <Eye className="h-4 w-4 mr-2" />
                                                  View Details
                                                </DropdownMenuItem>
                                                {canManagePerms && (
                                                  <DropdownMenuItem onSelect={() => {
                                                    setSelectedUser(user);
                                                    setEditUserDialogOpen(true);
                                                  }}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit User
                                                  </DropdownMenuItem>
                                                )}
                                                {canManagePerms && (
                                                  <DropdownMenuItem onSelect={() => {
                                                    setSelectedUser(user);
                                                    setChangeRoleDialogOpen(true);
                                                  }}>
                                                    <UserCog className="h-4 w-4 mr-2" />
                                                    Change Role
                                                  </DropdownMenuItem>
                                                )}
                                                {canManagePerms && (
                                                  <DropdownMenuItem onSelect={() => {
                                                    setSelectedUser(user);
                                                    setChangeTeamDialogOpen(true);
                                                  }}>
                                                    <Users2 className="h-4 w-4 mr-2" />
                                                    Change Team
                                                  </DropdownMenuItem>
                                                )}
                                                {canManagePerms && (
                                                  <DropdownMenuItem 
                                                    className='text-destructive focus:text-destructive focus:bg-destructive/10'
                                                    onSelect={() => setDeleteUserDialog({ open: true, user, confirmText: '' })}
                                                  >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete User
                                                  </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                    {!isLoading && filteredUsers?.length === 0 && (
                         <TableRow>
                           <TableCell colSpan={canManagePerms || userIsHead ? 5 : 4} className="h-24 text-center">
                             {searchQuery || roleFilter !== 'all' || teamFilter !== 'all' 
                               ? 'No users match your filters.' 
                               : 'No users found. Get started by adding a user.'}
                           </TableCell>
                         </TableRow>
                    )}
                </TableBody>
                </Table>
              </div>
            </CardContent>
        </Card>
      </div>

      {canCreateUsers(userProfile) && (
        <AddUserDialog 
          isOpen={isAddUserDialogOpen} 
          setIsOpen={setAddUserDialogOpen} 
          teams={teams || []} 
        />
      )}
      {canCreateTeams(userProfile) && (
        <CreateTeamDialog
          isOpen={isCreateTeamDialogOpen}
          setIsOpen={setCreateTeamDialogOpen}
          users={users || []}
        />
      )}
      {canManagePerms && (
        <EditUserDialog
          isOpen={isEditUserDialogOpen}
          setIsOpen={(open) => {
            setEditUserDialogOpen(open);
            if (!open) {
              setSelectedUser(null);
            }
          }}
          user={selectedUser}
          teams={teams || []}
        />
      )}
      {canManage && (
        <EditTeamDialog
          isOpen={isEditTeamDialogOpen}
          setIsOpen={(open) => {
            setEditTeamDialogOpen(open);
            if (!open) {
              setSelectedTeam(null);
            }
          }}
          team={selectedTeam}
          users={users || []}
        />
      )}
      <ChangeUserRoleDialog
        isOpen={isChangeRoleDialogOpen}
        setIsOpen={(open) => {
          setChangeRoleDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
      />
      <ChangeUserTeamDialog
        isOpen={isChangeTeamDialogOpen}
        setIsOpen={(open) => {
          setChangeTeamDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
        teams={teams || []}
      />
      <ViewUserDialog
        isOpen={isViewUserDialogOpen}
        setIsOpen={(open) => {
          setViewUserDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
        teams={teams || []}
      />
      <AlertDialog open={deleteUserDialog.open} onOpenChange={(open) => setDeleteUserDialog({ open, user: null, confirmText: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to permanently delete <strong>{deleteUserDialog.user?.displayName}</strong>? 
                This action cannot be undone and will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Delete the user from Firebase Authentication</li>
                <li>Remove all user data from Firestore</li>
                <li>Remove the user from all teams</li>
              </ul>
              <p className="pt-2 font-semibold text-destructive">
                Type the user's email address to confirm: <strong>{deleteUserDialog.user?.email}</strong>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder={deleteUserDialog.user?.email || 'Email address'}
              value={deleteUserDialog.confirmText}
              onChange={(e) => setDeleteUserDialog({ ...deleteUserDialog, confirmText: e.target.value })}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteUserDialog({ open: false, user: null, confirmText: '' })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={deleteUserDialog.confirmText !== deleteUserDialog.user?.email}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteTeamDialog.open} onOpenChange={(open) => setDeleteTeamDialog({ open, team: null, confirmText: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to permanently delete the team <strong>"{deleteTeamDialog.team?.name}"</strong>? 
                This action cannot be undone and will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Remove all team data from Firestore</li>
                <li>Unassign all team members</li>
                <li>Remove all team-related tasks and files</li>
              </ul>
              <p className="pt-2 font-semibold text-destructive">
                Type the team name to confirm: <strong>{deleteTeamDialog.team?.name}</strong>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder={deleteTeamDialog.team?.name || 'Team name'}
              value={deleteTeamDialog.confirmText}
              onChange={(e) => setDeleteTeamDialog({ ...deleteTeamDialog, confirmText: e.target.value })}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTeamDialog({ open: false, team: null, confirmText: '' })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTeam} 
              disabled={deleteTeamDialog.confirmText !== deleteTeamDialog.team?.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
