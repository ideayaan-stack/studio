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

const roles: Role[] = ['Core', 'Semi-core', 'Head', 'Volunteer'];

const addUserSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    displayName: z.string().min(2, { message: 'Display name is required' }),
    role: z.enum(roles),
    teamId: z.string().optional(),
}).refine(data => data.role === 'Core' || !!data.teamId, {
    message: "A team is required for non-Core members",
    path: ["teamId"],
});

type AddUserInput = z.infer<typeof addUserSchema>;

interface AddUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teams: Team[];
}

export function AddUserDialog({ isOpen, setIsOpen, teams }: AddUserDialogProps) {
  const { createUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddUserInput>({
    resolver: zodResolver(addUserSchema),
  });

  const selectedRole = watch('role');
  const isTeamRequired = selectedRole && selectedRole !== 'Core';

  const onSubmit: SubmitHandler<AddUserInput> = async (data) => {
    setIsLoading(true);
    try {
      await createUser(data.email, data.password, data.displayName, data.role, data.teamId);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new account and assign a role and team. The user will be sent their credentials.
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
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={(value: Role) => setValue('role', value)}>
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

          {isTeamRequired && (
            <div className="space-y-2">
                <Label htmlFor="teamId">Team</Label>
                <Select onValueChange={(value) => setValue('teamId', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                        {teams.filter(team => team.name !== 'Core').map(team => (
                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.teamId && <p className="text-xs text-destructive">{errors.teamId.message}</p>}
            </div>
          )}

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
