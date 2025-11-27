'use client';

import { useState } from 'react';
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
import type { Team, Role } from '@/lib/types';
import { cn } from '@/lib/utils';
import { canCreateUsers } from '@/lib/permissions';
import { sendWelcomeEmail } from '@/lib/email-service';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const roles = ['Core', 'Semi-core', 'Head', 'Volunteer', 'Unassigned'] as const;

const addUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  displayName: z.string().min(2, { message: 'Display name is required' }),
  role: z.enum(roles, { required_error: 'Role is required' }),
  teamIds: z.array(z.string()).optional(),
}).refine((data) => {
  // Team is required only for Head and Volunteer roles
  // Core and Semi-core can be created without teams
  if ((data.role === 'Head' || data.role === 'Volunteer') && (!data.teamIds || data.teamIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'At least one team is required for Head and Volunteer roles',
  path: ['teamIds'],
});

type AddUserInput = z.infer<typeof addUserSchema>;

interface AddUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teams: Team[];
}

export function AddUserDialog({ isOpen, setIsOpen, teams }: AddUserDialogProps) {
  const { createUser, userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Only Core can create users
  if (!canCreateUsers(userProfile)) {
    return null;
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddUserInput>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      teamIds: [],
    }
  });

  const selectedRole = watch('role');
  const selectedTeamIds = watch('teamIds') || [];
  // Team is required only for Head and Volunteer, optional for Core and Semi-core
  const isTeamRequired = selectedRole === 'Head' || selectedRole === 'Volunteer';

  const toggleTeam = (teamId: string) => {
    const current = selectedTeamIds;
    if (current.includes(teamId)) {
      setValue('teamIds', current.filter(id => id !== teamId), { shouldValidate: true });
    } else {
      setValue('teamIds', [...current, teamId], { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<AddUserInput> = async (data) => {
    setIsLoading(true);
    // Core and Semi-core can be created without teams
    // Head and Volunteer must have teams
    const finalTeamIds = (data.role === 'Core' || data.role === 'Semi-core' || !data.teamIds)
      ? []
      : data.teamIds;

    try {
      // Pass the first team as primary teamId for backward compatibility, and full list as teamIds
      const primaryTeamId = finalTeamIds.length > 0 ? finalTeamIds[0] : '';

      const result = await createUser(
        data.email,
        data.password,
        data.displayName,
        data.role,
        primaryTeamId,
        finalTeamIds // Pass all teams
      );

      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'User Created',
        description: `${data.displayName} has been added to the system.`,
      });

      // Send welcome email
      try {
        let teamNames = 'Unassigned';
        if (finalTeamIds.length > 0) {
          teamNames = teams
            .filter(t => finalTeamIds.includes(t.id))
            .map(t => t.name)
            .join(', ');
        }

        await sendWelcomeEmail(
          data.email,
          data.displayName,
          data.role,
          teamNames
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        toast({
          variant: 'destructive',
          title: 'Email Warning',
          description: 'User created, but failed to send welcome email.',
        });
      }

      reset();
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to create user',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        reset();
      }
      setIsOpen(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new account and assign a role and teams.
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
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
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

          <div className={cn("space-y-3 transition-opacity duration-300", isTeamRequired ? 'opacity-100' : 'opacity-50')}>
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
                  {teams
                    .filter(team => team.id && team.id.trim() !== '' && team.name !== 'Core')
                    .map(team => {
                      const isSelected = selectedTeamIds.includes(team.id);
                      return (
                        <div
                          key={team.id}
                          className={`flex items-center space-x-3 p-2 rounded-md transition-colors hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                        >
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleTeam(team.id)}
                          />
                          <div className="flex-1">
                            <span
                              className="text-sm font-medium cursor-pointer"
                              onClick={() => toggleTeam(team.id)}
                            >
                              {team.name}
                            </span>
                            {team.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {team.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {teams.length === 0 && <p className="text-sm text-muted-foreground p-2">No teams available</p>}
                </div>
              </ScrollArea>
            </div>
            {errors.teamIds && <p className="text-xs text-destructive">{errors.teamIds.message}</p>}
            {isTeamRequired && selectedTeamIds.length === 0 && (
              <p className="text-xs text-muted-foreground">At least one team is required for Head and Volunteer roles</p>
            )}
            {!isTeamRequired && (
              <p className="text-xs text-muted-foreground">Teams can be assigned later</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
