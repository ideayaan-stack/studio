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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Team, UserProfile } from '@/lib/types';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { canSeeAllTeams, canAssignTasks } from '@/lib/permissions';

const taskSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(5, { message: 'Description must be at least 5 characters' }),
  teamId: z.string().min(1, { message: 'Team is required' }),
  assigneeId: z.string().min(1, { message: 'Assignee is required' }),
  deadline: z.string().min(1, { message: 'Deadline is required' }),
  status: z.enum(['Pending', 'In Progress', 'Completed']).default('Pending'),
});

type TaskInput = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teams: Team[];
  users: UserProfile[];
}

export function CreateTaskDialog({ isOpen, setIsOpen, teams, users }: CreateTaskDialogProps) {
  const { db, userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const canAssignToAnyTeam = canSeeAllTeams(userProfile);
  const availableTeams = canAssignToAnyTeam ? teams : teams.filter(t => t.id === userProfile?.teamId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'Pending',
      teamId: userProfile?.teamId || '',
    },
  });

  const selectedTeamId = watch('teamId');
  const teamUsers = selectedTeamId
    ? users.filter(u => u.teamId === selectedTeamId)
    : [];

  const onSubmit: SubmitHandler<TaskInput> = async (data) => {
    if (!db || !userProfile || !canAssignTasks(userProfile)) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to create tasks.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const assignee = users.find(u => u.uid === data.assigneeId);
      if (!assignee) {
        throw new Error('Assignee not found');
      }

      const deadlineDate = new Date(data.deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('Invalid deadline date');
      }

      await addDoc(collection(db, 'tasks'), {
        title: data.title,
        description: data.description,
        status: data.status,
        teamId: data.teamId,
        assignee: {
          uid: assignee.uid,
          name: assignee.displayName || 'Unknown',
          avatarUrl: assignee.photoURL || null,
          avatarHint: assignee.displayName || '',
        },
        deadline: Timestamp.fromDate(deadlineDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'Task Created',
        description: `Task "${data.title}" has been created successfully.`,
      });

      reset();
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create task',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAssignTasks(userProfile)) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
        }
        setIsOpen(open);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task and assign it to a team member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input id="title" {...register('title')} placeholder="e.g., Design event poster" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the task in detail..."
              rows={4}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamId">Team *</Label>
            <Select
              value={selectedTeamId}
              onValueChange={(value) => {
                setValue('teamId', value, { shouldValidate: true });
                setValue('assigneeId', '', { shouldValidate: false }); // Reset assignee when team changes
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
            {errors.teamId && <p className="text-xs text-destructive">{errors.teamId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigneeId">Assign To *</Label>
            <Select
              value={watch('assigneeId')}
              onValueChange={(value) => setValue('assigneeId', value, { shouldValidate: true })}
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
            {errors.assigneeId && <p className="text-xs text-destructive">{errors.assigneeId.message}</p>}
            {selectedTeamId && teamUsers.length === 0 && (
              <p className="text-xs text-muted-foreground">No members found in this team.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline *</Label>
            <Input
              id="deadline"
              type="datetime-local"
              {...register('deadline')}
              min={new Date().toISOString().slice(0, 16)}
            />
            {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value: 'Pending' | 'In Progress' | 'Completed') =>
                setValue('status', value, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

