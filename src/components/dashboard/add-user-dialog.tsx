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

const roles: Role[] = ['Core', 'Semi-core', 'Head', 'Volunteer'];

const addUserSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    displayName: z.string().min(2, { message: 'Display name is required' }),
    role: z.enum(roles, { required_error: 'Role is required' }),
    teamId: z.string().optional(),
}).refine((data) => {
    // Team is required only for Head and Volunteer roles
    // Core and Semi-core can be created without teams
    if ((data.role === 'Head' || data.role === 'Volunteer') && !data.teamId) {
        return false;
    }
    return true;
}, {
    message: 'Team is required for Head and Volunteer roles',
    path: ['teamId'],
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
      teamId: '',
    }
  });

  const selectedRole = watch('role');
  // Team is required only for Head and Volunteer, optional for Core and Semi-core
  const isTeamRequired = selectedRole === 'Head' || selectedRole === 'Volunteer';

  const onSubmit: SubmitHandler<AddUserInput> = async (data) => {
    setIsLoading(true);
    // Core and Semi-core can be created without teams
    // Head and Volunteer must have teams
    const finalTeamId = (data.role === 'Core' || data.role === 'Semi-core' || !data.teamId || data.teamId === 'unassigned') 
      ? '' 
      : data.teamId;

    try {
      // This now calls the server-side user creation, which doesn't log the admin out.
      const result = await createUser(data.email, data.password, data.displayName, data.role, finalTeamId);
      if (result?.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'User Created',
        description: `${data.displayName} has been added to the system.`,
      });
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
            Create a new account and assign a role and team.
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

          <div className={cn("space-y-2 transition-opacity duration-300", isTeamRequired ? 'opacity-100' : 'opacity-100')}>
              <Label htmlFor="teamId">Team {isTeamRequired && '*'}</Label>
              <Select 
                value={watch('teamId') || 'unassigned'} 
                onValueChange={(value) => setValue('teamId', value === 'unassigned' ? '' : value, { shouldValidate: true })}
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
              {errors.teamId && <p className="text-xs text-destructive">{errors.teamId.message}</p>}
              {isTeamRequired && !watch('teamId') && (
                <p className="text-xs text-muted-foreground">Team is required for Head and Volunteer roles</p>
              )}
              {!isTeamRequired && (
                <p className="text-xs text-muted-foreground">Team can be assigned later</p>
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
