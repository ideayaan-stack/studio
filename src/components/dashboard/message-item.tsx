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

  return (
    <div className={cn('flex w-full mb-2', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[85%] md:max-w-[70%] lg:max-w-[60%] group relative', isOwn ? 'flex-row-reverse' : 'flex-row')}>

        {/* Avatar for others */}
        {!isOwn && showAvatar && (
          <div className="mr-2 flex-shrink-0 self-end mb-1">
            <AvatarWithRing
              src={getFileUrl(senderProfile?.photoURL) || undefined}
              alt={senderProfile?.displayName || message.senderName}
              fallback={getInitials(senderProfile?.displayName || message.senderName)}
              role={senderProfile?.role}
              size="sm"
              uid={message.senderId}
            />
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'relative px-3 py-2 shadow-sm flex flex-col min-w-[120px]',
            isOwn
              ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-black dark:text-white rounded-l-lg rounded-tr-lg rounded-br-none'
              : 'bg-white dark:bg-[#202c33] text-black dark:text-white rounded-r-lg rounded-tl-lg rounded-bl-none'
          )}
        >
          {/* Sender Name (only for others) */}
          {!isOwn && (
            <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">
              {message.senderName}
            </div>
          )}

          {/* Reply Context */}
          {message.replyTo && (
            <div className={cn(
              'text-xs p-2 rounded border-l-4 mb-1 bg-black/5 dark:bg-white/10',
              isOwn ? 'border-green-600' : 'border-orange-500'
            )}>
              <div className="font-medium opacity-80">{message.replyTo.senderName}</div>
              <div className="opacity-70 truncate">{message.replyTo.text}</div>
            </div>
          )}

          {/* Images */}
          {message.imageUrl && (
            <div className="mb-1 rounded-lg overflow-hidden">
              <img
                src={getFileUrl(message.imageUrl) || undefined}
                alt="Shared image"
                className="max-w-full max-h-64 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Files */}
          {message.fileUrl && (
            <div className="mb-1 p-2 rounded-lg bg-black/5 dark:bg-white/10 flex items-center gap-2">
              <FileText className="h-8 w-8 opacity-70" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-sm font-medium truncate">{message.fileName || 'File'}</div>
                <a
                  href={getFileUrl(message.fileUrl) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs opacity-70 hover:underline"
                >
                  Download
                </a>
              </div>
            </div>
          )}

          {/* Text Content */}
          {message.text && (
            <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.text}
              {message.edited && <span className="text-xs opacity-60 ml-1">(edited)</span>}
            </div>
          )}

          {/* Timestamp & Status (Bottom Right) */}
          <div className={cn(
            'flex items-center justify-end gap-1 mt-1 select-none',
            'text-[10px] opacity-70'
          )}>
            <span>{formatTime(message.timestamp)}</span>
            {isOwn && (
              <span className="flex items-center">
                {isRead ? (
                  <CheckCheck className="h-3 w-3 text-blue-500" />
                ) : isDelivered ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
          </div>

          {/* Reactions Display */}
          {hasReactions && (
            <div className="absolute -bottom-2 right-0 flex gap-0.5 bg-white dark:bg-gray-800 rounded-full px-1.5 py-0.5 shadow border border-gray-100 dark:border-gray-700 z-10">
              {Object.entries(message.reactions || {}).map(([emoji, userIds]) => (
                <span key={emoji} className="text-[10px] leading-none flex items-center">
                  {emoji}
                  {userIds.length > 1 && <span className="ml-0.5 text-[9px]">{userIds.length}</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hover Actions (Dropdown) */}
        <div className={cn(
          'opacity-0 group-hover:opacity-100 transition-opacity absolute top-0',
          isOwn ? '-left-8' : '-right-8'
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20">
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

        {/* Reaction Picker Popover */}
        {showReactions && (
          <div className={cn(
            'absolute -top-10 z-20 flex gap-1 p-1 bg-white dark:bg-gray-800 border rounded-full shadow-lg',
            isOwn ? 'right-0' : 'left-0'
          )}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                className="hover:scale-125 transition-transform text-lg leading-none p-1"
                onClick={() => {
                  onReact?.(message.id, emoji);
                  setShowReactions(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
