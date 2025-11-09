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
import type { Task, Team, UserProfile } from '@/lib/types';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { canSeeAllTeams, canAssignTasks } from '@/lib/permissions';

const editTaskSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(5, { message: 'Description must be at least 5 characters' }),
  teamId: z.string().min(1, { message: 'Team is required' }),
  assigneeId: z.string().min(1, { message: 'Assignee is required' }),
  deadline: z.string().min(1, { message: 'Deadline is required' }),
  status: z.enum(['Pending', 'In Progress', 'Completed']),
});

type EditTaskInput = z.infer<typeof editTaskSchema>;

interface EditTaskDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  task: Task | null;
  teams: Team[];
  users: UserProfile[];
}

export function EditTaskDialog({ isOpen, setIsOpen, task, teams, users }: EditTaskDialogProps) {
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
  } = useForm<EditTaskInput>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      teamId: task?.teamId || '',
      assigneeId: task?.assignee.uid || '',
      deadline: task?.deadline ? new Date(task.deadline.toDate()).toISOString().slice(0, 16) : '',
      status: task?.status || 'Pending',
    },
  });

  useEffect(() => {
    if (task && isOpen) {
      reset({
        title: task.title || '',
        description: task.description || '',
        teamId: task.teamId || '',
        assigneeId: task.assignee.uid || '',
        deadline: task.deadline ? new Date(task.deadline.toDate()).toISOString().slice(0, 16) : '',
        status: task.status || 'Pending',
      });
    }
  }, [task, isOpen, reset]);

  const selectedTeamId = watch('teamId');
  const teamUsers = selectedTeamId
    ? users.filter(u => u.teamId === selectedTeamId)
    : [];

  const handleClose = () => {
    reset();
    setIsOpen(false);
  };

  const onSubmit: SubmitHandler<EditTaskInput> = async (data) => {
    if (!db || !userProfile || !task || !canAssignTasks(userProfile)) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to edit tasks.',
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

      const taskDocRef = doc(db, 'tasks', task.id);
      await updateDoc(taskDocRef, {
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
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'Task Updated',
        description: `Task "${data.title}" has been updated successfully.`,
      });

      handleClose();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update task',
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details and assignment.
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
                setValue('assigneeId', '', { shouldValidate: false });
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

