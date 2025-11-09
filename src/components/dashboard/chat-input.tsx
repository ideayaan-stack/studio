'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image as ImageIcon, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile, getFileUrl } from '@/lib/file-storage';

interface ChatInputProps {
  messageText: string;
  setMessageText: (text: string) => void;
  onSend: (text: string, imageUrl?: string, fileUrl?: string, fileName?: string) => void;
  isSending: boolean;
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  } | null;
  onCancelReply?: () => void;
}

export function ChatInput({
  messageText,
  setMessageText,
  onSend,
  isSending,
  replyTo,
  onCancelReply,
}: ChatInputProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imgbbApiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleSend = async () => {
    if (!messageText.trim() && !selectedImage && !selectedFile) return;

    setIsUploading(true);
    try {
      let imageUrl: string | undefined;
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (selectedImage) {
        const result = await uploadFile(selectedImage, !!imgbbApiKey);
        if (result.error) throw new Error(result.error);
        imageUrl = result.url;
      }

      if (selectedFile) {
        const result = await uploadFile(selectedFile, !!imgbbApiKey);
        if (result.error) throw new Error(result.error);
        fileUrl = result.url;
        fileName = selectedFile.name;
      }

      onSend(messageText.trim(), imageUrl, fileUrl, fileName);

      // Reset
      setMessageText('');
      setSelectedImage(null);
      setSelectedFile(null);
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4 space-y-2">
      {replyTo && (
        <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
          <div className="flex-1 min-w-0">
            <div className="font-medium">Replying to {replyTo.senderName}</div>
            <div className="text-muted-foreground truncate">{replyTo.text}</div>
          </div>
          {onCancelReply && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onCancelReply}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {imagePreview && (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-24 w-24 object-cover rounded-lg"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 bg-background border"
            onClick={() => {
              setSelectedImage(null);
              setImagePreview(null);
              if (imageInputRef.current) imageInputRef.current.value = '';
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
          <Paperclip className="h-4 w-4" />
          <span className="flex-1 truncate">{selectedFile.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none pr-20"
            disabled={isSending || isUploading}
          />
          <div className="absolute right-2 bottom-2 flex gap-1">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => imageInputRef.current?.click()}
              disabled={isSending || isUploading}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || isUploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={(!messageText.trim() && !selectedImage && !selectedFile) || isSending || isUploading}
          size="icon"
          className="h-11 w-11"
        >
          {isSending || isUploading ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

