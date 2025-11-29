'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Team, UserProfile } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Users, Shield } from 'lucide-react';

interface ViewTeamDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    team: Team | null;
    users: UserProfile[];
}

export function ViewTeamDialog({ isOpen, setIsOpen, team, users }: ViewTeamDialogProps) {
    if (!team) return null;

    const headUser = users.find(u => u.uid === team.head);
    // Fix: Check both primary teamId and teamIds array
    const members = users.filter(u =>
        u.teamId === team.id || (u.teamIds && u.teamIds.includes(team.id))
    );

    const getInitials = (name?: string | null) => {
        if (!name) return 'T';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Team Details</DialogTitle>
                    <DialogDescription>
                        View details for {team.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                            {getInitials(team.name)}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold">{team.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {team.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Team Head</span>
                            </div>
                            {headUser ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{headUser.displayName}</span>
                                    <Badge variant="outline" className="text-xs">Head</Badge>
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground italic">Unassigned</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Members ({members.length})</span>
                                </div>
                            </div>

                            <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                                {members.length > 0 ? (
                                    <div className="space-y-1">
                                        {members.map(member => (
                                            <div key={member.uid} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{member.displayName}</span>
                                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] uppercase">
                                                    {member.role}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic p-2">No members found.</div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
