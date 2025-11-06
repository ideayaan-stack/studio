'use client';

import { useEffect } from 'react';
import { useActionState, useFormStatus } from 'react';
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
      }
    }
  }, [state, toast, setIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle /> Create New Team
          </DialogTitle>
          <DialogDescription>
            Set up a new team. You can assign a team head later.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input id="name" name="name" placeholder="e.g., Media Committee" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="What is the purpose of this team?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head">Team Head (Optional)</Label>
            <Select name="head">
                <SelectTrigger>
                    <SelectValue placeholder="Select a user to lead the team" />
                </SelectTrigger>
                <SelectContent>
                    {users.map(user => (
                        <SelectItem key={user.uid} value={user.uid}>{user.displayName}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
