'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Calendar, Video, ExternalLink, Trash2, Edit, Clock, MoreVertical, Filter, Search } from 'lucide-react';
import { useAuth, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, Timestamp, query, where, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { canSeeAllTeams, isCore, isSemiCore } from '@/lib/permissions';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Team } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ScheduleMeetingDialog } from '@/components/dashboard/schedule-meeting-dialog';
import { EditMeetingDialog } from '@/components/dashboard/edit-meeting-dialog';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  meetingLink?: string;
  date: Timestamp;
  time: string;
  teamId?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export default function MeetingsPage() {
  const { db, userProfile } = useAuth();
  const { toast } = useToast();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; meeting: Meeting | null }>({ open: false, meeting: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; meeting: Meeting | null }>({ open: false, meeting: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState(false);

  const canSchedule = isCore(userProfile) || isSemiCore(userProfile);

  // Get teams
  const teamsQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTeams(userProfile)) {
      return collection(db, 'teams');
    }
    if (userProfile?.teamIds && userProfile.teamIds.length > 0) {
      return query(collection(db, 'teams'), where('__name__', 'in', userProfile.teamIds));
    }
    if (userProfile?.teamId) {
      return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile]);

  const { data: teams } = useCollection<Team>(teamsQuery);

  // Get meetings
  const meetingsQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTeams(userProfile)) {
      return query(collection(db, 'meetings'), orderBy('date', 'asc'));
    }

    // For team members, fetch meetings for their team(s)
    if (userProfile?.teamIds && userProfile.teamIds.length > 0) {
      // Note: Firestore 'in' query supports up to 10 values.
      // We'll query for meetings where teamId is in the user's teamIds.
      // We are EXCLUDING 'null' (all-team meetings) for now to be safe with permissions,
      // unless we confirm the rule allows 'null' AND the query works.
      // Given the user report, let's stick to strict teamIds first.
      return query(
        collection(db, 'meetings'),
        where('teamId', 'in', userProfile.teamIds),
        orderBy('date', 'asc')
      );
    }

    if (userProfile?.teamId) {
      return query(
        collection(db, 'meetings'),
        where('teamId', '==', userProfile.teamId),
        orderBy('date', 'asc')
      );
    }
    return null;
  }, [db, userProfile]);

  const { data: meetings, loading } = useCollection<Meeting>(meetingsQuery);

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];

    return meetings.filter(meeting => {
      const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (meeting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesTeam = selectedTeamFilter === 'all' || meeting.teamId === selectedTeamFilter;

      return matchesSearch && matchesTeam;
    });
  }, [meetings, searchQuery, selectedTeamFilter]);

  const isPastMeeting = (meeting: Meeting) => {
    const meetingDate = meeting.date.toDate();
    const now = new Date();
    // Reset time part for date comparison if needed, but simple comparison is fine
    return meetingDate < now && !isSameDay(meetingDate, now);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const handleDelete = async () => {
    if (!db || !deleteDialog.meeting) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'meetings', deleteDialog.meeting.id));
      toast({
        title: 'Meeting Deleted',
        description: 'The meeting has been cancelled.',
      });
      setDeleteDialog({ open: false, meeting: null });
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete meeting',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canManageMeeting = (meeting: Meeting) => {
    if (!userProfile) return false;
    if (isCore(userProfile)) return true;
    if (isSemiCore(userProfile) && meeting.createdBy === userProfile.uid) return true;
    return false;
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-headline font-bold">Meetings</h1>
            <p className="text-muted-foreground">Schedule and manage team meetings.</p>
          </div>
          {canSchedule && (
            <Button size="sm" className="gap-1" onClick={() => setIsScheduleDialogOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Schedule Meeting
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {canSeeAllTeams(userProfile) && teams && teams.length > 0 && (
            <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by team" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMeetings.map((meeting) => {
              const meetingTeam = teams?.find(t => t.id === meeting.teamId);
              const isPast = isPastMeeting(meeting);

              return (
                <Card key={meeting.id} className={cn("shadow-sm transition-all hover:shadow-md flex flex-col", isPast && "opacity-70 bg-muted/30")}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-semibold leading-tight">{meeting.title}</CardTitle>
                      {canManageMeeting(meeting) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditDialog({ open: true, meeting })}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => setDeleteDialog({ open: true, meeting })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">
                        {meetingTeam?.name || 'Unknown Team'}
                      </Badge>
                      {isPast && <Badge variant="secondary" className="text-xs">Past</Badge>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow">
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span>
                        {format(new Date(meeting.date.seconds * 1000), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span>{meeting.time}</span>
                    </div>
                    {meeting.meetingLink && (
                      <div className="flex items-start gap-2 text-sm">
                        <Video className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                    {meeting.description && (
                      <div className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {meeting.description}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 text-xs text-muted-foreground">
                    Scheduled by {meeting.createdBy}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filteredMeetings.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            {searchQuery || selectedTeamFilter !== 'all'
              ? 'No meetings match your filters.'
              : 'No upcoming meetings scheduled.'}
          </div>
        )}

        {canSchedule && (
          <ScheduleMeetingDialog
            isOpen={isScheduleDialogOpen}
            setIsOpen={setIsScheduleDialogOpen}
            teams={teams || []}
            defaultTeamId={userProfile?.teamId}
          />
        )}

        {/* Edit Meeting Dialog */}
        {editDialog.meeting && (
          <EditMeetingDialog
            isOpen={editDialog.open}
            setIsOpen={(open: boolean) => setEditDialog({ ...editDialog, open })}
            meeting={editDialog.meeting}
            teams={teams || []}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, meeting: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteDialog.meeting?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
