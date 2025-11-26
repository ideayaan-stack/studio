'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import type { UserProfile, Team, Role } from '@/lib/types';
import { canManagePermissions } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const roles = ['Core', 'Semi-core', 'Head', 'Volunteer', 'Unassigned'] as const;

const editUserSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name is required' }),
  role: z.enum(roles, { required_error: 'Role is required' }),
  teamIds: z.array(z.string()).optional(),
}).refine((data) => {
  if ((data.role === 'Head' || data.role === 'Volunteer') && (!data.teamIds || data.teamIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "At least one team must be selected for Head or Volunteer roles",
  path: ["teamIds"],
});

type EditUserInput = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserProfile | null;
  teams: Team[];
}

export function EditUserDialog({ isOpen, setIsOpen, user, teams }: EditUserDialogProps) {
  const { db, userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      role: user?.role || 'Volunteer',
      teamIds: user?.teamIds || (user?.teamId ? [user.teamId] : []),
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      reset({
        displayName: user.displayName || '',
        role: user.role || 'Volunteer',
        teamIds: user.teamIds || (user.teamId ? [user.teamId] : []),
      });
    }
  }, [user, isOpen, reset]);

  const selectedRole = watch('role');
  const selectedTeamIds = watch('teamIds') || [];
  const isTeamRequired = selectedRole === 'Head' || selectedRole === 'Volunteer';

  const handleTeamToggle = (teamId: string) => {
    const currentTeams = selectedTeamIds;
    if (currentTeams.includes(teamId)) {
      setValue('teamIds', currentTeams.filter(id => id !== teamId), { shouldValidate: true });
    } else {
      setValue('teamIds', [...currentTeams, teamId], { shouldValidate: true });
    }
  };

  const handleClose = () => {
    reset();
    setIsOpen(false);
  };

  if (!canManagePermissions(userProfile) || !user) {
    return null;
  }

  const onSubmit: SubmitHandler<EditUserInput> = async (data) => {
    if (!db || !user) return;

    setIsLoading(true);
    const finalTeamIds = (data.role === 'Core' || data.role === 'Semi-core')
      ? []
      : (data.teamIds || []);

    // For backward compatibility, set the first team as primary
    const primaryTeamId = finalTeamIds.length > 0 ? finalTeamIds[0] : '';

    try {
      const userDocRef = doc(db, 'users', user.uid);

      // Update directly in Firestore first for immediate feedback
      await updateDoc(userDocRef, {
        displayName: data.displayName,
        role: data.role,
        teamId: primaryTeamId,
        teamIds: finalTeamIds,
      });

      toast({
        title: 'User Updated',
        description: `${data.displayName}'s profile has been updated.`,
      });
      handleClose();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to update user',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      } else {
        setIsOpen(open);
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information, role, and team assignment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" {...register('displayName')} />
            {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={watch('role') || ''}
              onValueChange={(value: Role) => setValue('role', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

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
                        type="button"
                        onClick={() => handleTeamToggle(teamId)}
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
                  {teams
                    .filter(team => team.id && team.id.trim() !== '' && team.name !== 'Core')
                    .map(team => {
                      const isSelected = selectedTeamIds.includes(team.id);
                      return (
                        <div
                          key={team.id}
                          className={`flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                          onClick={() => handleTeamToggle(team.id)}
                        >
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleTeamToggle(team.id)}
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
                    })}
                  {teams.filter(team => team.id && team.id.trim() !== '' && team.name !== 'Core').length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">No teams available</p>
                  )}
                </div>
              </ScrollArea>
            </div>
            {errors.teamIds && <p className="text-xs text-destructive">{errors.teamIds.message}</p>}
            {isTeamRequired && selectedTeamIds.length === 0 && (
              <p className="text-xs text-muted-foreground">At least one team is required for Head and Volunteer roles</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
