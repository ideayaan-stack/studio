'use client';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { canSeeAllTasks, isHead } from '@/lib/permissions';

interface ChangeTaskStatusDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  task: Task | null;
}

export function ChangeTaskStatusDialog({ isOpen, setIsOpen, task }: ChangeTaskStatusDialogProps) {
  const { db, userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Task['status']>('Pending');

  useEffect(() => {
    if (task && isOpen) {
      setStatus(task.status);
    }
  }, [task, isOpen]);

  const handleClose = () => {
    setStatus('Pending');
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!db || !task || !userProfile) return;

    // Check permissions: Core/Semi-core can change any task, Head can change team tasks, Volunteer can only change assigned tasks
    const canFullyEdit = canSeeAllTasks(userProfile) || (isHead(userProfile) && userProfile?.teamId === task.teamId);
    const isAssignee = userProfile.uid === task.assignee.uid;

    if (!canFullyEdit && !isAssignee) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You can only change the status of tasks assigned to you.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const taskDocRef = doc(db, 'tasks', task.id);
      await updateDoc(taskDocRef, {
        status,
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'Status Updated',
        description: `Task status has been changed to "${status}".`,
      });

      handleClose();
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update status',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!task) {
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Task Status</DialogTitle>
          <DialogDescription>
            Update the status of "{task.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: Task['status']) => setStatus(value)}
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

