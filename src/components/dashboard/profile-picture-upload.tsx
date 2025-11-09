'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { processImageForStorage, getImageUrl } from '@/lib/image-storage';

export function ProfilePictureUpload() {
  const { db, userProfile, user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile?.displayName) {
      setDisplayName(userProfile.displayName);
    }
  }, [userProfile]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
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
    if (!db || !user || !userProfile || !fileInputRef.current?.files?.[0]) {
      return;
    }

    const file = fileInputRef.current.files[0];
    setIsUploading(true);

    try {
      // Process image (resize and convert to base64)
      const base64Image = await processImageForStorage(file);

      // Update user profile in Firestore with base64 image
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        photoURL: base64Image,
      });

      toast({
        title: 'Profile Picture Updated',
        description: 'Your profile picture has been successfully updated.',
      });

      // Reset preview
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload profile picture. Please try again.',
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

  const handleSaveDisplayName = async () => {
    if (!db || !user || !displayName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Display name cannot be empty.',
      });
      return;
    }

    setIsSavingName(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
      });

      toast({
        title: 'Display Name Updated',
        description: 'Your display name has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating display name:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update display name. Please try again.',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const currentPhotoUrl = previewUrl || getImageUrl(userProfile?.photoURL) || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          {currentPhotoUrl && <AvatarImage src={currentPhotoUrl} alt={userProfile?.displayName || 'Profile'} />}
          <AvatarFallback className="text-lg">{getInitials(userProfile?.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Label htmlFor="profile-picture">Profile Picture</Label>
          <div className="flex gap-2">
            <Input
              id="profile-picture"
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

      <div className="space-y-2">
        <Label htmlFor="display-name">Display Name</Label>
        <div className="flex gap-2">
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            disabled={isSavingName}
          />
          <Button
            type="button"
            onClick={handleSaveDisplayName}
            disabled={isSavingName || !displayName.trim() || displayName === userProfile?.displayName}
          >
            {isSavingName ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          This is how your name appears to other users.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={userProfile?.email || user?.email || ''}
          disabled
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed. Contact an administrator if you need to update it.
        </p>
      </div>
    </div>
  );
}

