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
import { PlusCircle, MoreHorizontal, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Team } from '@/lib/types';
import { useAuth, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { AddUserDialog } from '@/components/dashboard/add-user-dialog';

export default function TeamsPage() {
  const { db, userProfile } = useAuth();
  const isCoreTeam = userProfile?.role === 'Core';
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);

  const teamsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'teams');
  }, [db]);
  
  const { data: teams, loading } = useCollection<Team>(teamsQuery);
  
  return (
    <>
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className='font-headline'>Teams</CardTitle>
          <CardDescription>Manage your committee's teams and members.</CardDescription>
        </div>
        {isCoreTeam && (
          <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={() => setAddUserDialogOpen(true)}>
              <Users className="h-4 w-4" />
              Add User
            </Button>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Create Team
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Members</TableHead>
              {isCoreTeam && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({length: 4}).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                  {isCoreTeam && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                </TableRow>
              ))
            ) : (
              teams?.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <div className='flex items-center gap-2'>
                      {team.name}
                      {team.name === 'Core' && <Badge>Admin</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className='text-muted-foreground max-w-sm truncate'>{team.description}</TableCell>
                  <TableCell className="text-center">{team.members?.length || 0}</TableCell>
                  {isCoreTeam && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
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
              ))
            )}
            {!loading && teams?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={isCoreTeam ? 4 : 3} className="h-24 text-center">
                        No teams found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    {isCoreTeam && (
      <AddUserDialog 
        isOpen={isAddUserDialogOpen} 
        setIsOpen={setAddUserDialogOpen} 
        teams={teams || []} 
      />
    )}
    </>
  );
}
