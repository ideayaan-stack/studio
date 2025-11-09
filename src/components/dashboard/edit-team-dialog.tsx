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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import type { Team, UserProfile } from '@/lib/types';
import { canCreateTeams } from '@/lib/permissions';

const editTeamSchema = z.object({
  name: z.string().min(2, { message: 'Team name is required' }),
  description: z.string().optional(),
  head: z.string().optional(),
});

type EditTeamInput = z.infer<typeof editTeamSchema>;

interface EditTeamDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  team: Team | null;
  users: UserProfile[];
}

export function EditTeamDialog({ isOpen, setIsOpen, team, users }: EditTeamDialogProps) {
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
  } = useForm<EditTeamInput>({
    resolver: zodResolver(editTeamSchema),
    defaultValues: {
      name: team?.name || '',
      description: team?.description || '',
      head: team?.head || 'no-head',
    },
  });

  useEffect(() => {
    if (team && isOpen) {
      reset({
        name: team.name || '',
        description: team.description || '',
        head: team.head || 'no-head',
      });
    }
  }, [team, isOpen, reset]);

  const selectedHead = watch('head');

  if (!canCreateTeams(userProfile) || !team) {
    return null;
  }

  const onSubmit: SubmitHandler<EditTeamInput> = async (data) => {
    if (!db || !team) return;
    
    setIsLoading(true);

    try {
      const teamDocRef = doc(db, 'teams', team.id);
      const updateData: any = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
      };

      // Handle head assignment
      const newHead = data.head && data.head !== 'no-head' ? data.head : '';
      const oldHead = team.head || '';
      
      if (newHead !== oldHead) {
        updateData.head = newHead || null;
        
        // Update members array
        const currentMembers = team.members || [];
        const updatedMembers = [...currentMembers];
        
        // Remove old head if exists
        if (oldHead && updatedMembers.includes(oldHead)) {
          const index = updatedMembers.indexOf(oldHead);
          updatedMembers.splice(index, 1);
        }
        
        // Add new head if exists
        if (newHead && !updatedMembers.includes(newHead)) {
          updatedMembers.push(newHead);
        }
        
        updateData.members = updatedMembers;
      }

      await updateDoc(teamDocRef, updateData);
      
      toast({
        title: 'Team Updated',
        description: `Team "${data.name}" has been updated.`,
      });
      handleClose();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to update team',
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
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team information and assign a team head.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="What is the purpose of this team?" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="head">Team Head</Label>
            <Select 
              value={selectedHead || 'no-head'} 
              onValueChange={(value) => setValue('head', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user to lead the team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-head">No Head</SelectItem>
                {users
                  .filter(user => user.uid && user.uid.trim() !== '')
                  .map(user => (
                    <SelectItem key={user.uid} value={user.uid}>
                      {user.displayName || user.email || `User ${user.uid.substring(0, 8)}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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

