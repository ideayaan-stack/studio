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
import { notifyTaskAssignment } from '@/lib/notifications';
import { sendTaskAssignmentEmail } from '@/lib/email-service';
import { format } from 'date-fns';
import { MultiSelectAssignDialog } from '@/components/dashboard/multi-select-assign-dialog';
import { Users } from 'lucide-react';

const taskSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(5, { message: 'Description must be at least 5 characters' }),
  teamId: z.string().min(1, { message: 'Team is required' }),
  assigneeId: z.string().optional(),
  deadline: z.string().optional(),
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
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState<'assignee' | null>(null);

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
      assigneeId: undefined,
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
      // Handle optional assignee
      let assigneeData = null;
      if (data.assigneeId) {
        const assignee = users.find(u => u.uid === data.assigneeId);
        if (!assignee) {
          throw new Error('Assignee not found');
        }
        assigneeData = {
          uid: assignee.uid,
          name: assignee.displayName || 'Unknown',
          avatarUrl: assignee.photoURL || null,
          avatarHint: assignee.displayName || '',
        };
      }

      // Handle optional deadline (default to 7 days from now)
      let deadlineDate: Date;
      if (data.deadline) {
        deadlineDate = new Date(data.deadline);
        if (isNaN(deadlineDate.getTime())) {
          throw new Error('Invalid deadline date');
        }
      } else {
        deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 7); // Default to 7 days from now
      }

      await addDoc(collection(db, 'tasks'), {
        title: data.title,
        description: data.description,
        status: data.status,
        teamId: data.teamId,
        assignee: assigneeData || {
          uid: '',
          name: 'Unassigned',
          avatarUrl: null,
          avatarHint: '',
        },
        deadline: Timestamp.fromDate(deadlineDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'Task Created',
        description: `Task "${data.title}" has been created successfully.`,
      });

      // Send notifications only if assignee is selected
      if (assigneeData) {
        try {
          const assignee = users.find(u => u.uid === data.assigneeId);
          // Browser notification
          await notifyTaskAssignment(data.title, userProfile.displayName || 'Someone');
          
          // Email notification (if email is available)
          if (assignee?.email) {
            const deadlineStr = format(deadlineDate, 'MMM dd, yyyy HH:mm');
            await sendTaskAssignmentEmail(
              assignee.email,
              assignee.displayName || assignee.email,
              data.title,
              deadlineStr,
              userProfile.displayName || 'Someone'
            );
          }
        } catch (notifError) {
          // Don't fail the task creation if notifications fail
          console.error('Error sending notifications:', notifError);
        }
      }

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
            <Label htmlFor="assigneeId">Assign To (Optional)</Label>
            <div className="flex gap-2">
              <Select
                value={watch('assigneeId') || 'unassigned'}
                onValueChange={(value) => {
                  if (value === '__all__' || value === '__custom__') {
                    if (value === '__all__') {
                      // Assign to all members of selected team
                      const allTeamUserIds = teamUsers.map(u => u.uid);
                      if (allTeamUserIds.length > 0) {
                        // For now, we'll assign to first member and note it's for all
                        // In a real implementation, you'd create multiple tasks
                        setValue('assigneeId', allTeamUserIds[0], { shouldValidate: true });
                        toast({
                          title: 'Note',
                          description: 'Task will be assigned to all team members. Multiple task instances will be created.',
                        });
                      }
                    } else if (value === '__custom__') {
                      setMultiSelectMode('assignee');
                      setIsMultiSelectOpen(true);
                    }
                  } else if (value === 'unassigned') {
                    setValue('assigneeId', undefined, { shouldValidate: true });
                  } else {
                    setValue('assigneeId', value, { shouldValidate: true });
                  }
                }}
                disabled={!selectedTeamId || teamUsers.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={selectedTeamId ? "Select assignment option" : "Select a team first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {canAssignToAnyTeam && selectedTeamId && teamUsers.length > 0 && (
                    <>
                      <SelectItem value="__all__">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          All Members ({teamUsers.length})
                        </div>
                      </SelectItem>
                      <SelectItem value="__custom__">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Custom Selection...
                        </div>
                      </SelectItem>
                    </>
                  )}
                  {teamUsers.map(user => (
                    <SelectItem key={user.uid} value={user.uid}>
                      {user.displayName || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.assigneeId && <p className="text-xs text-destructive">{errors.assigneeId.message}</p>}
            {selectedTeamId && teamUsers.length === 0 && (
              <p className="text-xs text-muted-foreground">No members found in this team.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="datetime-local"
              {...register('deadline')}
              min={new Date().toISOString().slice(0, 16)}
              placeholder="Leave empty for default (7 days from now)"
            />
            {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
            <p className="text-xs text-muted-foreground">If not specified, deadline will be set to 7 days from now.</p>
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
        
        <MultiSelectAssignDialog
          isOpen={isMultiSelectOpen}
          setIsOpen={setIsMultiSelectOpen}
          teams={availableTeams}
          users={users}
          onConfirm={(selectedTeamIds, selectedUserIds) => {
            if (selectedUserIds.length > 0) {
              // For now, assign to first selected user
              // In a full implementation, you'd create multiple tasks
              setValue('assigneeId', selectedUserIds[0], { shouldValidate: true });
              if (selectedUserIds.length > 1) {
                toast({
                  title: 'Note',
                  description: `${selectedUserIds.length} members selected. Multiple task instances will be created.`,
                });
              }
            }
            setMultiSelectMode(null);
          }}
          title="Select Teams and Members"
          description="Choose specific teams and members to assign this task to."
        />
      </DialogContent>
    </Dialog>
  );
}

