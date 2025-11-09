'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { Team, UserProfile } from '@/lib/types';
import { canSeeAllTeams } from '@/lib/permissions';
import { useAuth } from '@/firebase';

interface MultiSelectAssignDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  teams: Team[];
  users: UserProfile[];
  onConfirm: (selectedTeamIds: string[], selectedUserIds: string[]) => void;
  title?: string;
  description?: string;
}

export function MultiSelectAssignDialog({
  isOpen,
  setIsOpen,
  teams,
  users,
  onConfirm,
  title = 'Assign to Teams and Members',
  description = 'Select teams and members to assign this task to.',
}: MultiSelectAssignDialogProps) {
  const { userProfile } = useAuth();
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [assignMode, setAssignMode] = useState<'teams' | 'members' | 'custom'>('custom');

  const canAssignToAll = canSeeAllTeams(userProfile);
  const availableTeams = canAssignToAll ? teams : teams.filter(t => t.id === userProfile?.teamId);

  // Group users by team
  const usersByTeam = useMemo(() => {
    const grouped: Record<string, UserProfile[]> = {};
    availableTeams.forEach(team => {
      grouped[team.id] = users.filter(u => u.teamId === team.id);
    });
    return grouped;
  }, [availableTeams, users]);

  const handleAllTeams = () => {
    if (assignMode === 'teams' && selectedTeamIds.size === availableTeams.length) {
      setSelectedTeamIds(new Set());
      setSelectedUserIds(new Set());
    } else {
      setSelectedTeamIds(new Set(availableTeams.map(t => t.id)));
      // Select all users from all teams
      const allUserIds = new Set(users.filter(u => availableTeams.some(t => t.id === u.teamId)).map(u => u.uid));
      setSelectedUserIds(allUserIds);
    }
    setAssignMode('teams');
  };

  const handleAllMembers = () => {
    if (assignMode === 'members' && selectedUserIds.size === users.filter(u => availableTeams.some(t => t.id === u.teamId)).length) {
      setSelectedTeamIds(new Set());
      setSelectedUserIds(new Set());
    } else {
      setSelectedTeamIds(new Set(availableTeams.map(t => t.id)));
      const allUserIds = new Set(users.filter(u => availableTeams.some(t => t.id === u.teamId)).map(u => u.uid));
      setSelectedUserIds(allUserIds);
    }
    setAssignMode('members');
  };

  const handleTeamToggle = (teamId: string) => {
    const newSet = new Set(selectedTeamIds);
    if (newSet.has(teamId)) {
      newSet.delete(teamId);
      // Remove users from this team
      const teamUserIds = usersByTeam[teamId]?.map(u => u.uid) || [];
      const newUserSet = new Set(selectedUserIds);
      teamUserIds.forEach(uid => newUserSet.delete(uid));
      setSelectedUserIds(newUserSet);
    } else {
      newSet.add(teamId);
    }
    setSelectedTeamIds(newSet);
    setAssignMode('custom');
  };

  const handleUserToggle = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
    setAssignMode('custom');
  };

  const handleTeamAllMembers = (teamId: string) => {
    const teamUsers = usersByTeam[teamId] || [];
    const teamUserIds = teamUsers.map(u => u.uid);
    const allSelected = teamUserIds.every(uid => selectedUserIds.has(uid));
    
    const newUserSet = new Set(selectedUserIds);
    if (allSelected) {
      teamUserIds.forEach(uid => newUserSet.delete(uid));
    } else {
      teamUserIds.forEach(uid => newUserSet.add(uid));
    }
    setSelectedUserIds(newUserSet);
    setAssignMode('custom');
  };

  const handleConfirm = () => {
    if (selectedTeamIds.size === 0 && selectedUserIds.size === 0) {
      return;
    }
    onConfirm(Array.from(selectedTeamIds), Array.from(selectedUserIds));
    handleClose();
  };

  const handleClose = () => {
    setSelectedTeamIds(new Set());
    setSelectedUserIds(new Set());
    setAssignMode('custom');
    setIsOpen(false);
  };

  const selectedCount = selectedUserIds.size;
  const allTeamsSelected = availableTeams.length > 0 && selectedTeamIds.size === availableTeams.length;
  const allMembersSelected = users.filter(u => availableTeams.some(t => t.id === u.teamId)).length > 0 && 
    selectedUserIds.size === users.filter(u => availableTeams.some(t => t.id === u.teamId)).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Quick Actions */}
          {canAssignToAll && (
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={allTeamsSelected ? "default" : "outline"}
                size="sm"
                onClick={handleAllTeams}
              >
                {allTeamsSelected ? '✓ All Teams' : 'All Teams'}
              </Button>
              <Button
                type="button"
                variant={allMembersSelected ? "default" : "outline"}
                size="sm"
                onClick={handleAllMembers}
              >
                {allMembersSelected ? '✓ All Members' : 'All Members'}
              </Button>
            </div>
          )}

          {/* Selected Count */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{selectedCount} {selectedCount === 1 ? 'member' : 'members'} selected</Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTeamIds(new Set());
                  setSelectedUserIds(new Set());
                }}
              >
                Clear
              </Button>
            </div>
          )}

          <Separator />

          {/* Teams and Members Selection */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {availableTeams.map(team => {
                const teamUsers = usersByTeam[team.id] || [];
                const isTeamSelected = selectedTeamIds.has(team.id);
                const teamUserIds = teamUsers.map(u => u.uid);
                const allTeamMembersSelected = teamUserIds.length > 0 && teamUserIds.every(uid => selectedUserIds.has(uid));

                return (
                  <div key={team.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`team-${team.id}`}
                        checked={isTeamSelected}
                        onCheckedChange={() => handleTeamToggle(team.id)}
                      />
                      <Label
                        htmlFor={`team-${team.id}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {team.name}
                      </Label>
                      {teamUsers.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleTeamAllMembers(team.id)}
                        >
                          {allTeamMembersSelected ? 'Deselect All' : 'Select All'} ({teamUsers.length})
                        </Button>
                      )}
                    </div>
                    
                    {isTeamSelected && teamUsers.length > 0 && (
                      <div className="ml-6 space-y-2">
                        {teamUsers.map(user => (
                          <div key={user.uid} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-${user.uid}`}
                              checked={selectedUserIds.has(user.uid)}
                              onCheckedChange={() => handleUserToggle(user.uid)}
                            />
                            <Label
                              htmlFor={`user-${user.uid}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {user.displayName || user.email}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedTeamIds.size === 0 && selectedUserIds.size === 0}
          >
            Confirm ({selectedCount} {selectedCount === 1 ? 'member' : 'members'})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

