'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { 
  Check, 
  CheckCheck, 
  MoreVertical, 
  Reply, 
  Smile, 
  Trash2,
  Edit,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AvatarWithRing } from '@/components/dashboard/avatar-with-ring';
import { getFileUrl } from '@/lib/file-storage';
import type { UserProfile } from '@/lib/types';

interface ChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  } | null;
  reactions?: Record<string, string[]>;
  readBy?: Record<string, Timestamp>;
  edited?: boolean;
  editedAt?: Timestamp;
}

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  userProfile: UserProfile | null;
  senderProfile?: UserProfile | null;
  onReply?: (message: ChatMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  showAvatar?: boolean;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageItem({
  message,
  isOwn,
  userProfile,
  senderProfile,
  onReply,
  onReact,
  onDelete,
  onEdit,
  showAvatar = true,
}: MessageItemProps) {
  const [showReactions, setShowReactions] = useState(false);
  const isRead = message.readBy && userProfile?.uid && message.readBy[userProfile.uid] ? true : false;
  const readCount = message.readBy ? Object.keys(message.readBy).length : 0;
  const isDelivered = readCount > 0;

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: Timestamp) => {
    try {
      return format(timestamp.toDate(), 'HH:mm');
    } catch {
      return '';
    }
  };

  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;
  const userReaction = message.reactions
    ? Object.entries(message.reactions).find(([_, userIds]) => 
        userIds.includes(userProfile?.uid || '')
      )?.[0]
    : null;

  return (
    <div className={cn('flex items-end gap-3 group', isOwn && 'flex-row-reverse')}>
      {showAvatar && !isOwn && (
        <AvatarWithRing
          src={getFileUrl(senderProfile?.photoURL) || undefined}
          alt={senderProfile?.displayName || message.senderName}
          fallback={getInitials(senderProfile?.displayName || message.senderName)}
          role={senderProfile?.role}
          size="sm"
        />
      )}
      {showAvatar && isOwn && <div className="w-6" />}
      
      <div className={cn('flex flex-col gap-1 max-w-[80%] md:max-w-md', isOwn && 'items-end')}>
        {message.replyTo && (
          <div className={cn(
            'text-xs p-2 rounded border-l-2 bg-muted/50 mb-1',
            isOwn ? 'border-primary' : 'border-muted-foreground'
          )}>
            <div className="font-medium text-muted-foreground">{message.replyTo.senderName}</div>
            <div className="text-muted-foreground truncate">{message.replyTo.text}</div>
          </div>
        )}

        {message.imageUrl && (
          <div className="mb-2 rounded-lg overflow-hidden">
            <img
              src={getFileUrl(message.imageUrl) || undefined}
              alt="Shared image"
              className="max-w-full max-h-64 object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {message.fileUrl && (
          <div className={cn(
            'mb-2 p-3 rounded-lg border flex items-center gap-2',
            isOwn ? 'bg-primary/10 border-primary/20' : 'bg-muted'
          )}>
            <FileText className="h-4 w-4" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{message.fileName || 'File'}</div>
              <a
                href={getFileUrl(message.fileUrl) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:underline"
              >
                Download
              </a>
            </div>
          </div>
        )}

        <div className={cn(
          'rounded-lg px-4 py-2 max-w-full',
          isOwn 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        )}>
          {message.text && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          )}
          {message.edited && (
            <p className={cn('text-xs mt-1', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              (edited)
            </p>
          )}
        </div>

        <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', isOwn && 'flex-row-reverse')}>
          <span>{formatTime(message.timestamp)}</span>
          {isOwn && (
            <span className="flex items-center gap-1">
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-primary" title="Read" />
              ) : isDelivered ? (
                <CheckCheck className="h-3 w-3" title="Delivered" />
              ) : (
                <Check className="h-3 w-3" title="Sent" />
              )}
              {readCount > 0 && (
                <span className="text-[10px] opacity-70">({readCount})</span>
              )}
            </span>
          )}
        </div>

        {hasReactions && (
          <div className={cn('flex flex-wrap gap-1 mt-1', isOwn && 'justify-end')}>
            {Object.entries(message.reactions || {}).map(([emoji, userIds]) => (
              <Button
                key={emoji}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onReact?.(message.id, emoji)}
              >
                {emoji} {userIds.length}
              </Button>
            ))}
          </div>
        )}

        <div className={cn('flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity', isOwn && 'flex-row-reverse')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
              {onReply && (
                <DropdownMenuItem onSelect={() => onReply(message)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
              )}
              {onReact && (
                <DropdownMenuItem onSelect={() => setShowReactions(!showReactions)}>
                  <Smile className="h-4 w-4 mr-2" />
                  React
                </DropdownMenuItem>
              )}
              {isOwn && onEdit && (
                <DropdownMenuItem onSelect={() => onEdit(message.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {isOwn && onDelete && (
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onDelete(message.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showReactions && (
          <div className={cn(
            'flex gap-1 p-2 bg-background border rounded-lg shadow-lg',
            isOwn ? 'flex-row-reverse' : ''
          )}>
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  onReact?.(message.id, emoji);
                  setShowReactions(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

