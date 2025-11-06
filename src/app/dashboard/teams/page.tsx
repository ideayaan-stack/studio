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
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Team } from '@/lib/types';

const teams: Team[] = [
  { id: '1', name: 'Core Team', memberCount: 5, description: 'Oversees all committee activities and planning.' },
  { id: '2', name: 'Media Team', memberCount: 8, description: 'Handles social media, posters, and marketing.' },
  { id: '3', name: 'Technical Team', memberCount: 12, description: 'Manages website, apps, and technical workshops.' },
  { id: '4', name: 'Events Team', memberCount: 10, description: 'Organizes and executes event logistics.' },
];

export default function TeamsPage() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className='font-headline'>Teams</CardTitle>
          <CardDescription>Manage your committee's teams and members.</CardDescription>
        </div>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Create Team
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">
                  <div className='flex items-center gap-2'>
                    {team.name}
                    {team.name === 'Core Team' && <Badge>Admin</Badge>}
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground max-w-sm truncate'>{team.description}</TableCell>
                <TableCell className="text-center">{team.memberCount}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
