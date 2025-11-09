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
import type { UserProfile, Role } from '@/lib/types';
import { canManagePermissions } from '@/lib/permissions';
import { updateUserRoleAction } from '@/firebase/actions/user-actions';

const roles: Role[] = ['Core', 'Semi-core', 'Head', 'Volunteer'];

interface ChangeUserRoleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserProfile | null;
}

export function ChangeUserRoleDialog({ isOpen, setIsOpen, user }: ChangeUserRoleDialogProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('Volunteer');

  useEffect(() => {
    if (user && isOpen) {
      setSelectedRole(user.role || 'Volunteer');
    }
  }, [user, isOpen]);

  const handleClose = () => {
    setSelectedRole('Volunteer');
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!user || !canManagePermissions(userProfile)) return;

    if (selectedRole === user.role) {
      toast({
        variant: 'default',
        title: 'No Change',
        description: 'The role is already set to this value.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUserRoleAction(user.uid, selectedRole);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Role Updated',
        description: `${user.displayName}'s role has been changed to ${selectedRole}.`,
      });

      handleClose();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update role',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManagePermissions(userProfile) || !user) {
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
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for {user.displayName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: Role) => setSelectedRole(value)}
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
              'Update Role'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

