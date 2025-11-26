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
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { UserProfile, Team } from '@/lib/types';
import { canManagePermissions } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      setSelectedTeamIds(user.teamIds || (user.teamId ? [user.teamId] : []));
    }
  }, [user, isOpen]);

  const handleClose = () => {
    setSelectedTeamIds([]);
    setIsOpen(false);
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSubmit = async () => {
    if (!user || !canManagePermissions(userProfile)) return;

    // Check if changes were made
    const currentTeamIds = user.teamIds || (user.teamId ? [user.teamId] : []);
    const hasChanges = selectedTeamIds.length !== currentTeamIds.length ||
      !selectedTeamIds.every(id => currentTeamIds.includes(id));

    if (!hasChanges) {
      toast({
        variant: 'default',
        title: 'No Change',
        description: 'The team assignments are already set to these values.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // For backward compatibility, set the first team as primary
      const primaryTeamId = selectedTeamIds.length > 0 ? selectedTeamIds[0] : '';

      const result = await updateUserTeamAction(user.uid, primaryTeamId, selectedTeamIds);

      if (result.error) {
        throw new Error(result.error);
      }

      const teamNames = selectedTeamIds.length > 0
        ? teams.filter(t => selectedTeamIds.includes(t.id)).map(t => t.name).join(', ')
        : 'Unassigned';

      toast({
        title: 'Teams Updated',
        description: `${user.displayName} has been assigned to: ${teamNames}.`,
      });

      handleClose();
    } catch (error: any) {
      console.error('Error updating user teams:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update teams',
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
  const availableTeams = teams.filter(team => team.id && team.id.trim() !== '' && team.name !== 'Core');

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change User Teams</DialogTitle>
          <DialogDescription>
            Update the team assignments for {user.displayName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label>Teams {isTeamRequired && '*'}</Label>

            {/* Selected Teams Badges */}
            <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
              {selectedTeamIds.length > 0 ? (
                selectedTeamIds.map(teamId => {
                  const team = teams.find(t => t.id === teamId);
                  return team ? (
                    <Badge key={teamId} variant="secondary" className="px-2 py-1">
                      {team.name}
                      <button
                        onClick={() => toggleTeam(teamId)}
                        className="ml-2 hover:text-destructive focus:outline-none"
                      >
                        ×
                      </button>
                    </Badge>
                  ) : null;
                })
              ) : (
                <span className="text-sm text-muted-foreground italic">No teams selected</span>
              )}
            </div>

            {/* Team Selection List */}
            <div className="border rounded-md">
              <ScrollArea className="h-[200px] p-2">
                <div className="space-y-1">
                  {availableTeams.length > 0 ? (
                    availableTeams.map(team => {
                      const isSelected = selectedTeamIds.includes(team.id);
                      return (
                        <div
                          key={team.id}
                          className={`flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                          onClick={() => toggleTeam(team.id)}
                        >
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleTeam(team.id)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`team-${team.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {team.name}
                            </Label>
                            {team.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {team.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground p-2">No teams available</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {isTeamRequired && selectedTeamIds.length === 0 && (
              <p className="text-xs text-destructive">At least one team is required for Head and Volunteer roles</p>
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
            disabled={isLoading || (isTeamRequired && selectedTeamIds.length === 0)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Teams'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

