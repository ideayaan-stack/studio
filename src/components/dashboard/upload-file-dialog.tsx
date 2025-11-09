'use client';

import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import type { Team } from '@/lib/types';
import { canUploadToAnyTeam } from '@/lib/permissions';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { uploadFile } from '@/lib/file-storage';

interface UploadFileDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teams: Team[];
  defaultTeamId?: string;
}

export function UploadFileDialog({ isOpen, setIsOpen, teams, defaultTeamId }: UploadFileDialogProps) {
  const { db, userProfile } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(defaultTeamId || '');
  const [isUploading, setIsUploading] = useState(false);

  const imgbbApiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  const canUploadAnyTeam = canUploadToAnyTeam(userProfile);
  const availableTeams = canUploadAnyTeam ? teams : teams.filter(t => t.id === userProfile?.teamId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedTeamId || !db || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a file and team.',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file using free storage (ImgBB or base64)
      // For faster uploads, skip resizing for small files
      const shouldResize = selectedFile.size > 2 * 1024 * 1024; // Only resize files > 2MB
      const result = await uploadFile(selectedFile, shouldResize, imgbbApiKey);

      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to upload file');
      }

      // Create metadata in Firestore (don't wait for this to complete)
      addDoc(collection(db, 'files'), {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        url: result.url || '',
        teamId: selectedTeamId,
        uploadedBy: userProfile.uid,
        uploadDate: Timestamp.now(),
      }).catch(err => {
        console.error('Error saving file metadata:', err);
        // Still show success since file is uploaded
      });

      toast({
        title: 'Success',
        description: 'File uploaded successfully.',
      });

      // Reset form
      setSelectedFile(null);
      setSelectedTeamId(defaultTeamId || '');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An error occurred while uploading the file.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to share with your team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select
              value={selectedTeamId}
              onValueChange={setSelectedTeamId}
              disabled={isUploading}
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
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !selectedTeamId}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

