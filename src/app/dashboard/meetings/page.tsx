'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Calendar, Video, ExternalLink, Trash2, Edit2, Users } from 'lucide-react';
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
import type { Team } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  meetingLink: string;
  scheduledDate: Timestamp;
  teamId?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export default function MeetingsPage() {
  const { db, userProfile } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; meeting: Meeting | null }>({ open: false, meeting: null });
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  const canCreate = isCore(userProfile) || isSemiCore(userProfile);

  // Get teams
  const teamsQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTeams(userProfile)) {
      return collection(db, 'teams');
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
      return query(collection(db, 'meetings'), orderBy('scheduledDate', 'asc'));
    }
    if (userProfile?.teamId) {
      return query(
        collection(db, 'meetings'),
        where('teamId', '==', userProfile.teamId),
        orderBy('scheduledDate', 'asc')
      );
    }
    return null;
  }, [db, userProfile]);

  const { data: meetings, loading } = useCollection<Meeting>(meetingsQuery);

  // Filter meetings (upcoming vs past)
  const upcomingMeetings = useMemo(() => {
    if (!meetings) return [];
    const now = new Date();
    return meetings.filter(m => m.scheduledDate.toDate() >= now);
  }, [meetings]);

  const pastMeetings = useMemo(() => {
    if (!meetings) return [];
    const now = new Date();
    return meetings.filter(m => m.scheduledDate.toDate() < now);
  }, [meetings]);

  const handleCreateMeeting = async () => {
    if (!db || !userProfile || !canCreate) return;
    if (!title.trim() || !meetingLink.trim() || !scheduledDate) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const date = new Date(scheduledDate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      await addDoc(collection(db, 'meetings'), {
        title: title.trim(),
        description: description.trim() || null,
        meetingLink: meetingLink.trim(),
        scheduledDate: Timestamp.fromDate(date),
        teamId: selectedTeamId === 'all' ? null : selectedTeamId,
        createdBy: userProfile.uid,
        createdAt: Timestamp.now(),
      });

      toast({
        title: 'Meeting Created',
        description: 'The meeting has been scheduled successfully.',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setMeetingLink('');
      setScheduledDate('');
      setSelectedTeamId('all');
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create meeting',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!db || !deleteDialog.meeting) return;

    try {
      await deleteDoc(doc(db, 'meetings', deleteDialog.meeting.id));
      toast({
        title: 'Meeting Deleted',
        description: 'The meeting has been deleted.',
      });
      setDeleteDialog({ open: false, meeting: null });
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete meeting',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const handleJoinMeeting = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Meetings</h1>
          <p className="text-muted-foreground">Schedule and join team meetings via Google Meet.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Upcoming Meetings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Upcoming Meetings</h2>
            {upcomingMeetings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming meetings scheduled.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingMeetings.map((meeting) => (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{meeting.title}</CardTitle>
                        {canCreate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, meeting })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <CardDescription>
                        {format(meeting.scheduledDate.toDate(), 'MMM dd, yyyy HH:mm')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground">{meeting.description}</p>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => handleJoinMeeting(meeting.meetingLink)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Meeting
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Meetings */}
          {pastMeetings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Past Meetings</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastMeetings.map((meeting) => (
                  <Card key={meeting.id} className="opacity-60">
                    <CardHeader>
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <CardDescription>
                        {format(meeting.scheduledDate.toDate(), 'MMM dd, yyyy HH:mm')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground">{meeting.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Meeting Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Create a new Google Meet meeting for your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekly Team Sync"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meetingLink">Google Meet Link *</Label>
              <Input
                id="meetingLink"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scheduledDate">Date & Time *</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            {canSeeAllTeams(userProfile) && teams && teams.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="team">Team (Optional)</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team (or All Teams)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Meeting agenda or notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateMeeting} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Schedule Meeting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, meeting: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.meeting?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeeting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

