'use client';

import { useState, useMemo } from 'react';
import { useAuth, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, LayoutGrid, List as ListIcon, Phone, Mail, Copy, AlertCircle } from 'lucide-react';
import { canSeeAllTeams } from '@/lib/permissions';
import type { UserProfile, Team } from '@/lib/types';
import { getImageUrl } from '@/lib/image-storage';
import { cn } from '@/lib/utils';
import { AvatarWithRing } from '@/components/dashboard/avatar-with-ring';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DirectoryPage() {
    const { db, userProfile } = useAuth();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    // Fetch Teams (to map team IDs to names)
    const teamsQuery = useMemo(() => {
        if (!db) return null;
        return collection(db, 'teams');
    }, [db]);
    const { data: teams } = useCollection<Team>(teamsQuery);

    // Fetch Users based on permissions
    // Fetch Users - Everyone can see everyone as per requirements
    const usersQuery = useMemo(() => {
        if (!db) return null;
        return collection(db, 'users');
    }, [db]);

    const { data: users, loading, error } = useCollection<UserProfile>(usersQuery);

    // Filter users
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        const lowerQuery = searchQuery.toLowerCase();
        return users.filter(user => {
            const name = user.displayName?.toLowerCase() || '';
            const email = user.email?.toLowerCase() || '';
            const role = user.role?.toLowerCase() || '';
            const phone = user.phoneNumber?.toLowerCase() || '';
            const usn = user.usn?.toLowerCase() || '';
            return name.includes(lowerQuery) || email.includes(lowerQuery) || role.includes(lowerQuery) || phone.includes(lowerQuery) || usn.includes(lowerQuery);
        });
    }, [users, searchQuery]);

    const getTeamName = (teamId?: string | null) => {
        if (!teamId || !teams) return 'Unassigned';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: `${label} copied to clipboard.`,
        });
    };

    if (error) {
        return (
            <div className="h-full flex flex-col p-4 md:p-6 space-y-6">
                <h1 className="text-2xl font-headline font-bold">Directory</h1>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Failed to load directory. Please try again later or contact support.
                        <br />
                        <span className="text-xs opacity-70">{error.message}</span>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4 md:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Directory</h1>
                    <p className="text-muted-foreground">Connect with your team members.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="h-8 w-8 p-0"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="h-8 w-8 p-0"
                    >
                        <ListIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 max-w-md"
                />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Card key={i} className="h-48 animate-pulse bg-muted/20" />
                        ))}
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                                {filteredUsers.map((user) => (
                                    <Card key={user.uid} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                            <AvatarWithRing
                                                src={getImageUrl(user.photoURL) || undefined}
                                                alt={user.displayName || 'User'}
                                                fallback={getInitials(user.displayName)}
                                                role={user.role}
                                                uid={user.uid}
                                                size="xl"
                                            />
                                            <div className="space-y-1 w-full">
                                                <h3 className="font-semibold truncate" title={user.displayName || 'Unknown'}>
                                                    {user.displayName || 'Unknown User'}
                                                </h3>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {getTeamName(user.teamId)}
                                                </p>
                                                {user.usn && (
                                                    <p className="text-xs text-muted-foreground truncate font-mono">
                                                        {user.usn}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="w-full space-y-2 pt-2 border-t">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center group cursor-pointer" onClick={() => user.email && copyToClipboard(user.email, 'Email')}>
                                                    <Mail className="h-3.5 w-3.5" />
                                                    <span className="truncate max-w-[180px]" title={user.email || ''}>
                                                        {user.email}
                                                    </span>
                                                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center h-5">
                                                    {user.phoneNumber ? (
                                                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(user.phoneNumber!, 'Phone Number')}>
                                                            <Phone className="h-3.5 w-3.5" />
                                                            <span>{user.phoneNumber}</span>
                                                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs italic opacity-50">No phone number</span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground sticky top-0 z-10">
                                    <div className="col-span-4 sm:col-span-3">User</div>
                                    <div className="col-span-2 hidden sm:block">Role</div>
                                    <div className="col-span-3 hidden md:block">Team</div>
                                    <div className="col-span-4 sm:col-span-4 md:col-span-3">Email</div>
                                    <div className="col-span-2 hidden xl:block">USN</div>
                                    <div className="col-span-4 sm:col-span-3 md:col-span-1 text-right">Phone</div>
                                </div>
                                <div className="divide-y">
                                    {filteredUsers.map((user) => (
                                        <div key={user.uid} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 transition-colors text-sm">
                                            <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                                                <AvatarWithRing
                                                    src={getImageUrl(user.photoURL) || undefined}
                                                    alt={user.displayName || 'User'}
                                                    fallback={getInitials(user.displayName)}
                                                    role={user.role}
                                                    uid={user.uid}
                                                    size="sm"
                                                />
                                                <span className="font-medium truncate">{user.displayName}</span>
                                            </div>
                                            <div className="col-span-2 hidden sm:block">
                                                <Badge variant="secondary" className="capitalize text-xs font-normal">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                            <div className="col-span-3 hidden md:block text-muted-foreground truncate">
                                                {getTeamName(user.teamId)}
                                            </div>
                                            <div className="col-span-4 sm:col-span-4 md:col-span-3 truncate text-muted-foreground flex items-center gap-2 group cursor-pointer" onClick={() => user.email && copyToClipboard(user.email, 'Email')}>
                                                {user.email}
                                                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="col-span-2 hidden xl:block text-muted-foreground truncate font-mono">
                                                {user.usn || '-'}
                                            </div>
                                            <div className="col-span-4 sm:col-span-3 md:col-span-1 text-right flex items-center justify-end gap-2">
                                                {user.phoneNumber ? (
                                                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(user.phoneNumber!, 'Phone Number')}>
                                                        <span>{user.phoneNumber}</span>
                                                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/30 text-xs">None</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!loading && filteredUsers.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No users found matching your search.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
