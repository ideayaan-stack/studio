'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile, getFileUrl } from '@/lib/file-storage';
import type { Team } from '@/lib/types';

interface TeamIconUploadProps {
  team: Team;
}

export function TeamIconUpload({ team }: TeamIconUploadProps) {
  const { db, userProfile } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string | null) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please select an image file.',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB.',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!db || !userProfile || !fileInputRef.current?.files?.[0]) {
      return;
    }

    const file = fileInputRef.current.files[0];
    setIsUploading(true);

    try {
      // Upload file using free storage (ImgBB or base64)
      const result = await uploadFile(file, true);

      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to upload image');
      }

      // Update team icon in Firestore
      const teamDocRef = doc(db, 'teams', team.id);
      await updateDoc(teamDocRef, {
        iconURL: result.url || '',
      });

      toast({
        title: 'Team Icon Updated',
        description: `Team "${team.name}" icon has been successfully updated.`,
      });

      // Reset preview
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading team icon:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload team icon. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentIconUrl = previewUrl || getFileUrl(team.iconURL) || null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
        {currentIconUrl && <AvatarImage src={currentIconUrl} alt={team.name || 'Team'} />}
        <AvatarFallback className="text-base sm:text-lg">{getInitials(team.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 w-full space-y-2">
        <Label htmlFor={`team-icon-${team.id}`} className="text-sm sm:text-base">Team Icon</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id={`team-icon-${team.id}`}
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto h-11 min-h-[44px]"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
          {previewUrl && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full sm:w-auto h-11 min-h-[44px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                disabled={isUploading}
                className="h-11 w-11 min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>
    </div>
  );
}
