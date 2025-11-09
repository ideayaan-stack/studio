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

const roles = ['Core', 'Semi-core', 'Head', 'Volunteer', 'Unassigned'] as const;

const editUserSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name is required' }),
  role: z.enum(roles, { required_error: 'Role is required' }),
  teamId: z.string().optional(),
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
      teamId: user?.teamId || '',
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      reset({
        displayName: user.displayName || '',
        role: user.role || 'Volunteer',
        teamId: user.teamId || '',
      });
    }
  }, [user, isOpen, reset]);

  const selectedRole = watch('role');
  const isTeamRequired = selectedRole === 'Head' || selectedRole === 'Volunteer';

  if (!canManagePermissions(userProfile) || !user) {
    return null;
  }

  const onSubmit: SubmitHandler<EditUserInput> = async (data) => {
    if (!db || !user) return;
    
    setIsLoading(true);
    const finalTeamId = (data.role === 'Core' || data.role === 'Semi-core' || !data.teamId || data.teamId === 'unassigned') 
      ? '' 
      : data.teamId;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: data.displayName,
        role: data.role,
        teamId: finalTeamId,
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

  const handleClose = () => {
    reset();
    setIsOpen(false);
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

          <div className="space-y-2">
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

