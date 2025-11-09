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
import { FileText as FileTextIcon, Search, Download, Trash2, Edit2, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { deleteFileAction, renameFileAction } from '@/firebase/actions/file-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function FilesPage() {
  const { db, userProfile } = useAuth();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; file: FileItem | null }>({ open: false, file: null });
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; file: FileItem | null; newName: string }>({ open: false, file: null, newName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const { toast } = useToast();

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

  // Filter and search files
  const filteredFiles = useMemo(() => {
    let filtered = files || [];
    
    // Filter by team
    if (selectedTeamFilter !== 'all') {
      filtered = filtered.filter(file => file.teamId === selectedTeamFilter);
    }
    
    // Search by name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [files, selectedTeamFilter, searchQuery]);

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

  const handleDelete = async () => {
    if (!deleteDialog.file) return;
    setIsDeleting(true);
    try {
      const result = await deleteFileAction(deleteDialog.file.id);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'File Deleted',
        description: `File "${deleteDialog.file.name}" has been deleted.`,
      });
      setDeleteDialog({ open: false, file: null });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete file.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!renameDialog.file || !renameDialog.newName.trim()) return;
    setIsRenaming(true);
    try {
      const result = await renameFileAction(renameDialog.file.id, renameDialog.newName.trim());
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'File Renamed',
        description: `File renamed to "${renameDialog.newName.trim()}".`,
      });
      setRenameDialog({ open: false, file: null, newName: '' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Rename Failed',
        description: error.message || 'Failed to rename file.',
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDownload = (file: FileItem) => {
    const url = getFileUrl(file.url);
    if (url) {
      if (url.startsWith('data:')) {
        // Base64 file - create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // External URL - open in new tab
        window.open(url, '_blank');
      }
    }
  };

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

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {canSeeAllTeams(userProfile) && teams && teams.length > 0 && (
            <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by team" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {filteredFiles.map((file) => (
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
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {(canSeeAllFiles(userProfile) || file.uploadedBy === userProfile?.uid) && (
                              <>
                                <DropdownMenuItem onClick={() => setRenameDialog({ open: true, file, newName: file.name })}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className='text-destructive focus:text-destructive focus:bg-destructive/10'
                                  onClick={() => setDeleteDialog({ open: true, file })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
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
            {filteredFiles.length === 0 && !loading && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                  {searchQuery || selectedTeamFilter !== 'all' 
                    ? 'No files match your search criteria.' 
                    : 'No files found for your team.'}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, file: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.file?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ open, file: null, newName: '' })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter a new name for "{renameDialog.file?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newName">File Name</Label>
              <Input
                id="newName"
                value={renameDialog.newName}
                onChange={(e) => setRenameDialog({ ...renameDialog, newName: e.target.value })}
                placeholder="Enter new file name"
                disabled={isRenaming}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameDialog({ open: false, file: null, newName: '' })}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRename}
              disabled={isRenaming || !renameDialog.newName.trim()}
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
