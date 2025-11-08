'use client';

import { useEffect, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { createTeamAction, type CreateTeamState } from '@/app/actions';
import type { UserProfile } from '@/lib/types';

interface CreateTeamDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  users: UserProfile[];
}

const initialState: CreateTeamState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : 'Create Team'}
    </Button>
  );
}

export function CreateTeamDialog({ isOpen, setIsOpen, users }: CreateTeamDialogProps) {
  const [state, formAction] = useActionState(createTeamAction, initialState);
  const [selectedHead, setSelectedHead] = useState<string>('no-head');
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      } else {
        toast({
          title: 'Success',
          description: state.message,
        });
        setIsOpen(false);
        setSelectedHead('no-head');
      }
    }
  }, [state, toast, setIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setSelectedHead('no-head');
      }
      setIsOpen(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" /> Create New Team
          </DialogTitle>
          <DialogDescription>
            Set up a new team. You can assign a team head later.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input id="name" name="name" placeholder="e.g., Media Committee" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" name="description" placeholder="What is the purpose of this team?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head">Team Head (Optional)</Label>
            <Select value={selectedHead} onValueChange={setSelectedHead}>
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
            <input type="hidden" name="head" value={selectedHead === 'no-head' ? 'none' : selectedHead} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
