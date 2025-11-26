'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Team } from '@/lib/types';
import { canSeeAllTeams } from '@/lib/permissions';

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

interface EditMeetingDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    meeting: Meeting;
    teams: Team[];
}

export function EditMeetingDialog({ isOpen, setIsOpen, meeting, teams }: EditMeetingDialogProps) {
    const { db, userProfile } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [title, setTitle] = useState(meeting.title);
    const [description, setDescription] = useState(meeting.description || '');
    const [meetingLink, setMeetingLink] = useState(meeting.meetingLink || '');
    const [date, setDate] = useState('');
    const [time, setTime] = useState(meeting.time);
    const [selectedTeamId, setSelectedTeamId] = useState<string>(meeting.teamId || 'all');

    useEffect(() => {
        if (meeting) {
            setTitle(meeting.title);
            setDescription(meeting.description || '');
            setMeetingLink(meeting.meetingLink || '');
            setTime(meeting.time);
            setSelectedTeamId(meeting.teamId || 'all');

            // Format date for input
            const meetingDate = meeting.date.toDate();
            const formattedDate = meetingDate.toISOString().split('T')[0];
            setDate(formattedDate);
        }
    }, [meeting]);

    const handleUpdateMeeting = async () => {
        if (!db || !userProfile) return;
        if (!title.trim() || !date || !time) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fill in all required fields (Title, Date, Time).',
            });
            return;
        }

        setIsLoading(true);
        try {
            const scheduledDateTime = new Date(`${date}T${time}`);
            if (isNaN(scheduledDateTime.getTime())) {
                throw new Error('Invalid date or time');
            }

            await updateDoc(doc(db, 'meetings', meeting.id), {
                title: title.trim(),
                description: description.trim() || null,
                meetingLink: meetingLink.trim() || null,
                date: Timestamp.fromDate(scheduledDateTime),
                time: time,
                teamId: selectedTeamId === 'all' ? null : selectedTeamId,
            });

            toast({
                title: 'Meeting Updated',
                description: 'The meeting has been updated successfully.',
            });

            setIsOpen(false);
        } catch (error: any) {
            console.error('Error updating meeting:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to update meeting',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Meeting</DialogTitle>
                    <DialogDescription>
                        Update meeting details.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-title">Meeting Title *</Label>
                        <Input
                            id="edit-title"
                            value={title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                            placeholder="e.g., Weekly Team Sync"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-date">Date *</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={date}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-time">Time *</Label>
                            <Input
                                id="edit-time"
                                type="time"
                                value={time}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-meetingLink">Meeting Link (Optional)</Label>
                        <Input
                            id="edit-meetingLink"
                            value={meetingLink}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeetingLink(e.target.value)}
                            placeholder="https://meet.google.com/..."
                        />
                    </div>

                    {canSeeAllTeams(userProfile) && teams.length > 0 && (
                        <div className="grid gap-2">
                            <Label htmlFor="edit-team">Team (Optional)</Label>
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
                        <Label htmlFor="edit-description">Description (Optional)</Label>
                        <Textarea
                            id="edit-description"
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            placeholder="Meeting agenda or notes..."
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateMeeting} disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Meeting'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
