'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Task, Team, UserProfile } from '@/lib/types';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { canSeeAllTeams, canAssignTasks } from '@/lib/permissions';

interface AssignTaskDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  task: Task | null;
  teams: Team[];
  users: UserProfile[];
}

export function AssignTaskDialog({ isOpen, setIsOpen, task, teams, users }: AssignTaskDialogProps) {
  const { db, userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (task && isOpen) {
      setSelectedTeamId(task.teamId);
      setSelectedUserId(task.assignee.uid);
    }
  }, [task, isOpen]);

  const canAssignToAnyTeam = canSeeAllTeams(userProfile);
  const availableTeams = canAssignToAnyTeam ? teams : teams.filter(t => t.id === userProfile?.teamId);
  const teamUsers = selectedTeamId
    ? users.filter(u => u.teamId === selectedTeamId)
    : [];

  const handleClose = () => {
    setSelectedTeamId('');
    setSelectedUserId('');
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!db || !task || !userProfile || !canAssignTasks(userProfile)) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to assign tasks.',
      });
      return;
    }

    if (!selectedUserId) {
      toast({
        variant: 'destructive',
        title: 'Invalid Selection',
        description: 'Please select a user to assign the task to.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const assignee = users.find(u => u.uid === selectedUserId);
      if (!assignee) {
        throw new Error('Assignee not found');
      }

      const taskDocRef = doc(db, 'tasks', task.id);
      await updateDoc(taskDocRef, {
        teamId: selectedTeamId,
        assignee: {
          uid: assignee.uid,
          name: assignee.displayName || 'Unknown',
          avatarUrl: assignee.photoURL || null,
          avatarHint: assignee.displayName || '',
        },
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'Task Reassigned',
        description: `Task has been assigned to ${assignee.displayName || assignee.email}.`,
      });

      handleClose();
    } catch (error: any) {
      console.error('Error reassigning task:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to reassign task',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!task || !canAssignTasks(userProfile)) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        } else {
          setIsOpen(open);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reassign Task</DialogTitle>
          <DialogDescription>
            Assign "{task.title}" to a different team member.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamId">Team</Label>
            <Select
              value={selectedTeamId}
              onValueChange={(value) => {
                setSelectedTeamId(value);
                setSelectedUserId(''); // Reset user when team changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">Assign To *</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={!selectedTeamId || teamUsers.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedTeamId ? "Select a team member" : "Select a team first"} />
              </SelectTrigger>
              <SelectContent>
                {teamUsers.map(user => (
                  <SelectItem key={user.uid} value={user.uid}>
                    {user.displayName || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTeamId && teamUsers.length === 0 && (
              <p className="text-xs text-muted-foreground">No members found in this team.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading || !selectedUserId}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Reassign Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

