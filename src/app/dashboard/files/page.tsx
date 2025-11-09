'use client';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, FileText, User, Calendar, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FileItem } from '@/lib/types';
import { getFileUrl } from '@/lib/file-storage';
import { useAuth, useCollection } from '@/firebase';
import { useMemo, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { canSeeAllFiles, canUploadToAnyTeam, isHead, canSeeAllTeams } from '@/lib/permissions';
import { UploadFileDialog } from '@/components/dashboard/upload-file-dialog';
import type { Team } from '@/lib/types';
import Image from 'next/image';
import { FileText as FileTextIcon } from 'lucide-react';

export default function FilesPage() {
  const { db, userProfile } = useAuth();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Get teams for upload dialog
  const teamsQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTeams(userProfile)) {
      return collection(db, 'teams');
    }
    if (userProfile?.teamId) {
      return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile]);

  const { data: teams } = useCollection<Team>(teamsQuery);

  const filesQuery = useMemo(() => {
    if (!db) return null;
    // Core/Semi-core admins see all files
    if (canSeeAllFiles(userProfile)) {
      return collection(db, 'files');
    }
    // Team members see files associated with their team
    if (userProfile?.teamId) {
      return query(collection(db, 'files'), where('teamId', '==', userProfile.teamId));
    }
    // Return null if no specific query can be formed (e.g., unassigned user)
    return null;
  }, [db, userProfile]);

  const { data: files, loading } = useCollection<FileItem>(filesQuery);

  const canUpload = canUploadToAnyTeam(userProfile) || isHead(userProfile);

  // Component to show when a user is not assigned to a team
  if (!loading && !canSeeAllFiles(userProfile) && !userProfile?.teamId) {
    return (
       <Alert variant="default" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Team Assigned</AlertTitle>
          <AlertDescription>
            You are not currently assigned to a team. You cannot view or upload files until an administrator assigns you to one. Please contact a Core team member.
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-headline font-bold">Files</h1>
                <p className="text-muted-foreground">Access and manage all team documents.</p>
            </div>
            {canUpload && (
              <Button size="sm" className="gap-1" onClick={() => setIsUploadDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4" />
                  Upload File
              </Button>
            )}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm flex flex-col">
                <CardHeader className="p-0 relative">
                  <Skeleton className="w-full aspect-[4/3] rounded-t-lg" />
                </CardHeader>
                <CardContent className="p-4 flex-grow space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                   <Skeleton className="h-4 w-1/3" />
                   <Skeleton className="h-4 w-1/4" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {files?.map((file) => (
                <Card key={file.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader className="p-0 relative">
                    <div className="w-full aspect-[4/3] bg-muted rounded-t-lg flex items-center justify-center">
                      <FileTextIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-background/70 hover:bg-background">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Download</DropdownMenuItem>
                            {(canSeeAllFiles(userProfile) || file.uploadedBy === userProfile?.uid) && (
                              <>
                                <DropdownMenuItem>Rename</DropdownMenuItem>
                                <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>Delete</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-sm font-medium leading-normal flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"/> 
                      <span className='truncate hover:text-clip'>{file.name}</span>
                    </CardTitle>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {/* In a real app, you'd fetch the user's name from their UID */}
                      <span>{file.uploadedBy.substring(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(file.uploadDate.seconds * 1000), 'yyyy-MM-dd')}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {files?.length === 0 && !loading && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                  No files found for your team.
                </div>
              )}
          </>
        )}
      {canUpload && (
        <UploadFileDialog
          isOpen={isUploadDialogOpen}
          setIsOpen={setIsUploadDialogOpen}
          teams={teams || []}
          defaultTeamId={userProfile?.teamId}
        />
      )}
    </div>
  );
}
