'use client';

import { useState } from 'react';
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
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Team } from '@/lib/types';
import { canSeeAllTeams } from '@/lib/permissions';

interface ScheduleMeetingDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    teams: Team[];
    defaultTeamId?: string;
}

export function ScheduleMeetingDialog({ isOpen, setIsOpen, teams, defaultTeamId }: ScheduleMeetingDialogProps) {
    const { db, userProfile } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<string>(defaultTeamId || 'all');

    const handleCreateMeeting = async () => {
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

            await addDoc(collection(db, 'meetings'), {
                title: title.trim(),
                description: description.trim() || null,
                meetingLink: meetingLink.trim() || null,
                date: Timestamp.fromDate(scheduledDateTime),
                time: time,
                teamId: selectedTeamId === 'all' ? null : selectedTeamId,
                createdBy: userProfile.uid,
                createdAt: Timestamp.now(),
            });

            toast({
                title: 'Meeting Scheduled',
                description: 'The meeting has been scheduled successfully.',
            });

            // Reset form
            setTitle('');
            setDescription('');
            setMeetingLink('');
            setDate('');
            setTime('');
            setSelectedTeamId(defaultTeamId || 'all');
            setIsOpen(false);
        } catch (error: any) {
            console.error('Error creating meeting:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to schedule meeting',
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
                    <DialogTitle>Schedule Meeting</DialogTitle>
                    <DialogDescription>
                        Schedule a new meeting for your team.
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="time">Time *</Label>
                            <Input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="meetingLink">Meeting Link (Optional)</Label>
                        <Input
                            id="meetingLink"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            placeholder="https://meet.google.com/..."
                        />
                    </div>

                    {canSeeAllTeams(userProfile) && teams.length > 0 && (
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
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateMeeting} disabled={isLoading}>
                        {isLoading ? 'Scheduling...' : 'Schedule Meeting'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
