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
import type { UserProfile, Team, Role } from '@/lib/types';
import { canManagePermissions } from '@/lib/permissions';
import { updateUserTeamAction } from '@/firebase/actions/user-actions';

interface ChangeUserTeamDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserProfile | null;
  teams: Team[];
}

export function ChangeUserTeamDialog({ isOpen, setIsOpen, user, teams }: ChangeUserTeamDialogProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('unassigned');

  useEffect(() => {
    if (user && isOpen) {
      setSelectedTeamId(user.teamId || 'unassigned');
    }
  }, [user, isOpen]);

  const handleClose = () => {
    setSelectedTeamId('unassigned');
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!user || !canManagePermissions(userProfile)) return;

    const finalTeamId = selectedTeamId === 'unassigned' ? '' : selectedTeamId;
    
    if (finalTeamId === user.teamId) {
      toast({
        variant: 'default',
        title: 'No Change',
        description: 'The team assignment is already set to this value.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUserTeamAction(user.uid, selectedTeamId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const teamName = selectedTeamId === 'unassigned' 
        ? 'Unassigned' 
        : teams.find(t => t.id === selectedTeamId)?.name || 'Unknown';

      toast({
        title: 'Team Updated',
        description: `${user.displayName} has been ${selectedTeamId === 'unassigned' ? 'removed from' : 'assigned to'} ${teamName}.`,
      });

      handleClose();
    } catch (error: any) {
      console.error('Error updating user team:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update team',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManagePermissions(userProfile) || !user) {
    return null;
  }

  const isTeamRequired = user.role === 'Head' || user.role === 'Volunteer';

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
          <DialogTitle>Change User Team</DialogTitle>
          <DialogDescription>
            Update the team assignment for {user.displayName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamId">Team {isTeamRequired && '*'}</Label>
            <Select
              value={selectedTeamId}
              onValueChange={setSelectedTeamId}
            >
              <SelectTrigger>
                <SelectValue placeholder={isTeamRequired ? "Select a team (required)" : "Select a team (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No Team</SelectItem>
                {teams
                  .filter(team => team.id && team.id.trim() !== '' && team.name !== 'Core')
                  .map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {isTeamRequired && selectedTeamId === 'unassigned' && (
              <p className="text-xs text-destructive">Team is required for Head and Volunteer roles</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isLoading || (isTeamRequired && selectedTeamId === 'unassigned')}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Team'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

