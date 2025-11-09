'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Menu, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, useCollection } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { format } from 'date-fns';
import type { Team, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { getFileUrl } from '@/lib/file-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TeamIconUpload } from '@/components/dashboard/team-icon-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { canAccessTeamsPage, canChatInAllTeams, isCore, isSemiCore } from '@/lib/permissions';
import { MessageItem } from '@/components/dashboard/message-item';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Palette } from 'lucide-react';

interface ChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  deleted?: boolean;
  deletedAt?: Timestamp;
  edited?: boolean;
  editedAt?: Timestamp;
  reactions?: Record<string, string[]>;
  readBy?: Record<string, Timestamp>;
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  } | null;
}

const COMMON_CHAT_ID = 'common';

export default function ChatPage() {
  const { db, userProfile } = useAuth();
  const isMobile = useIsMobile();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [isTeamIconDialogOpen, setIsTeamIconDialogOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ messageId: string; senderName: string; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; messageId: string | null }>({ open: false, messageId: null });
  const [chatBackground, setChatBackground] = useState<string>('');
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Get teams user can chat in
  const teamsQuery = useMemo(() => {
    if (!db) return null;
    if (canChatInAllTeams(userProfile)) {
      // Core and Semi-core see all teams
      return collection(db, 'teams');
    }
    // Head and Volunteers see only their team
    if (userProfile?.teamId) {
      return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile]);

  const { data: teams, loading: teamsLoading } = useCollection<Team>(teamsQuery);

  // Get all users for message display
  const usersQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'users');
  }, [db]);
  const { data: allUsers } = useCollection<UserProfile>(usersQuery);

  // Create chat list with community chat + team chats
  const chatList = useMemo(() => {
    const list: Array<{ id: string; name: string; isCommon: boolean; team?: Team }> = [
      { id: COMMON_CHAT_ID, name: 'Community', isCommon: true }
    ];
    
    if (teams) {
      teams.forEach(team => {
        list.push({ id: team.id, name: team.name, isCommon: false, team });
      });
    }
    
    return list;
  }, [teams]);

  // Set initial selected team
  useEffect(() => {
    if (!selectedTeamId && chatList.length > 0) {
      setSelectedTeamId(chatList[0].id);
    }
  }, [chatList, selectedTeamId]);

  // Load chat background from localStorage
  useEffect(() => {
    if (selectedTeamId) {
      const saved = localStorage.getItem(`chat-background-${selectedTeamId}`);
      if (saved) {
        setChatBackground(saved);
      } else {
        setChatBackground('');
      }
    }
  }, [selectedTeamId]);

  // Save chat background to localStorage
  useEffect(() => {
    if (selectedTeamId) {
      if (chatBackground) {
        localStorage.setItem(`chat-background-${selectedTeamId}`, chatBackground);
      } else {
        localStorage.removeItem(`chat-background-${selectedTeamId}`);
      }
    }
  }, [chatBackground, selectedTeamId]);

  // Close chat list on mobile when a chat is selected
  const handleSelectChat = (chatId: string) => {
    setSelectedTeamId(chatId);
    if (isMobile) {
      setIsChatListOpen(false);
    }
  };

  // Get messages for selected team
  const messagesQuery = useMemo(() => {
    if (!db || !selectedTeamId) return null;
    return query(
      collection(db, 'messages'),
      where('teamId', '==', selectedTeamId),
      orderBy('timestamp', 'asc')
    );
  }, [db, selectedTeamId]);

  const { data: messages, loading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const selectedChat = chatList.find(chat => chat.id === selectedTeamId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedTeamId || !userProfile || !db || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        teamId: selectedTeamId,
        senderId: userProfile.uid,
        senderName: userProfile.displayName || 'Unknown',
        text: messageText.trim(),
        timestamp: Timestamp.now(),
        deleted: false,
        edited: false,
        reactions: {},
        readBy: {},
        replyTo: replyTo ? {
          messageId: replyTo.messageId,
          senderName: replyTo.senderName,
          text: replyTo.text,
        } : null,
      });
      setMessageText('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Mark messages as read when viewing
  useEffect(() => {
    if (!db || !selectedTeamId || !userProfile?.uid || !messages) return;
    
    const unreadMessages = messages.filter(msg => 
      !msg.deleted && 
      msg.senderId !== userProfile.uid && 
      (!msg.readBy || !msg.readBy[userProfile.uid])
    );

    if (unreadMessages.length > 0) {
      const batch = writeBatch(db);
      unreadMessages.forEach(msg => {
        const msgRef = doc(db, 'messages', msg.id);
        // Only update if uid is valid and not empty
        if (userProfile.uid && userProfile.uid.trim() !== '') {
          // Clean existing readBy object to remove any empty keys
          const existingReadBy = msg.readBy || {};
          const cleanReadBy: Record<string, Timestamp> = {};
          Object.keys(existingReadBy).forEach(key => {
            if (key && key.trim() !== '') {
              cleanReadBy[key] = existingReadBy[key];
            }
          });
          // Add current user's read timestamp
          cleanReadBy[userProfile.uid] = Timestamp.now();
          // Only update if we have a valid readBy object
          if (Object.keys(cleanReadBy).length > 0) {
            batch.update(msgRef, { readBy: cleanReadBy });
          }
        }
      });
      batch.commit().catch(console.error);
    }
  }, [db, selectedTeamId, userProfile, messages]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!db || !userProfile) return;
    
    const message = messages?.find(m => m.id === messageId);
    if (!message) return;

    const canDelete = message.senderId === userProfile.uid || 
                     isCore(userProfile) || 
                     isSemiCore(userProfile);
    
    if (!canDelete) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You can only delete your own messages.',
      });
      return;
    }

    setDeleteDialog({ open: true, messageId });
  };

  const confirmDeleteMessage = async () => {
    if (!db || !deleteDialog.messageId) return;
    
    try {
      const msgRef = doc(db, 'messages', deleteDialog.messageId);
      await updateDoc(msgRef, {
        deleted: true,
        deletedAt: Timestamp.now(),
        text: 'This message was deleted',
      });
      toast({
        title: 'Message Deleted',
        description: 'The message has been deleted.',
      });
      setDeleteDialog({ open: false, messageId: null });
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete message',
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages?.find(m => m.id === messageId);
    if (!message) return;

    // Check if message can be edited (within 15 minutes and is own message)
    const now = new Date();
    const messageTime = message.timestamp.toDate();
    const diffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    
    if (diffMinutes > 15) {
      toast({
        variant: 'destructive',
        title: 'Cannot Edit',
        description: 'Messages can only be edited within 15 minutes of sending.',
      });
      return;
    }

    setEditingMessageId(messageId);
    setEditText(message.text);
  };

  const handleSaveEdit = async () => {
    if (!db || !editingMessageId || !editText.trim()) return;
    
    try {
      const msgRef = doc(db, 'messages', editingMessageId);
      await updateDoc(msgRef, {
        text: editText.trim(),
        edited: true,
        editedAt: Timestamp.now(),
      });
      setEditingMessageId(null);
      setEditText('');
      toast({
        title: 'Message Updated',
        description: 'Your message has been updated.',
      });
    } catch (error: any) {
      console.error('Error editing message:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to edit message',
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!db || !userProfile?.uid) return;
    
    const message = messages?.find(m => m.id === messageId);
    if (!message) return;

    try {
      const msgRef = doc(db, 'messages', messageId);
      const currentReactions = message.reactions || {};
      const userId = userProfile.uid;
      
      // Create a new reactions object to avoid mutation
      const newReactions: Record<string, string[]> = { ...currentReactions };
      
      // Toggle reaction
      if (newReactions[emoji]?.includes(userId)) {
        // Remove reaction
        newReactions[emoji] = newReactions[emoji].filter(id => id !== userId);
        if (newReactions[emoji].length === 0) {
          delete newReactions[emoji];
        }
      } else {
        // Add reaction
        newReactions[emoji] = [...(newReactions[emoji] || []), userId];
      }

      await updateDoc(msgRef, { reactions: newReactions });
    } catch (error: any) {
      console.error('Error reacting to message:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to react',
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleReply = (message: ChatMessage) => {
    setReplyTo({
      messageId: message.id,
      senderName: message.senderName,
      text: message.text,
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatMessageTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) {
      return format(date, 'EEE, HH:mm');
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const ChatListContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-xl font-headline font-bold">Inbox</h1>
      </div>
      <ScrollArea className="flex-1">
        {chatList.map((chat) => {
          const lastMessage = selectedTeamId === chat.id && messages && messages.length > 0 
            ? messages[messages.length - 1] 
            : null;
          
          return (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={cn(
                "p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/50 transition-colors",
                selectedTeamId === chat.id && 'bg-muted/80'
              )}
            >
              <Avatar>
                {chat.team?.iconURL && !chat.isCommon ? (
                  <AvatarImage src={getFileUrl(chat.team.iconURL) || undefined} alt={chat.name} />
                ) : null}
                <AvatarFallback>
                  {chat.isCommon ? '💬' : chat.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold truncate">{chat.name}</p>
                  {lastMessage && (
                    <p className="text-xs text-muted-foreground shrink-0">
                      {formatMessageTime(lastMessage.timestamp)}
                    </p>
                  )}
                </div>
                {lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {lastMessage.senderName}: {lastMessage.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );

  if (teamsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-[calc(100vh-11rem)] md:h-[calc(100vh-8rem)] rounded-lg border shadow-sm">
        <div className="flex flex-col border-r p-4 space-y-4 hidden md:flex">
          <Skeleton className="h-8 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="flex flex-col p-4">
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-[300px_1fr] h-[calc(100vh-11rem)] md:h-[calc(100vh-8rem)] rounded-lg border shadow-sm overflow-hidden">
      {/* Desktop: Always visible sidebar */}
      <div className="hidden md:flex flex-col border-r">
        <ChatListContent />
      </div>

      {/* Mobile: Sheet for chat list */}
      {isMobile && (
        <Sheet open={isChatListOpen} onOpenChange={setIsChatListOpen}>
          <SheetContent side="left" className="w-[300px] p-0">
            <ChatListContent />
          </SheetContent>
        </Sheet>
      )}
      <div className="flex flex-col h-full flex-1 min-w-0">
        {selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center gap-4">
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setIsChatListOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <Avatar>
                {selectedChat.team?.iconURL && !selectedChat.isCommon ? (
                  <AvatarImage src={getFileUrl(selectedChat.team.iconURL) || undefined} alt={selectedChat.name} />
                ) : null}
                <AvatarFallback>
                  {selectedChat.isCommon ? '💬' : selectedChat.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg truncate">{selectedChat.name}</h2>
                <p className='text-sm text-muted-foreground truncate'>
                  {selectedChat.isCommon 
                    ? 'Community chat with all members' 
                    : `Chat with ${selectedChat.name}`}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsBackgroundDialogOpen(true)}>
                    <Palette className="h-4 w-4 mr-2" />
                    Chat Background
                  </DropdownMenuItem>
                  {!selectedChat.isCommon && selectedChat.team && canAccessTeamsPage(userProfile) && (
                    <DropdownMenuItem onClick={() => setIsTeamIconDialogOpen(true)}>
                      Change Team Icon
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 md:p-6">
              {messagesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-3/4" />
                  ))}
                </div>
              ) : (
                <div 
                  className="space-y-6" 
                  style={chatBackground ? (
                    chatBackground.startsWith('http') || chatBackground.startsWith('data:') 
                      ? { backgroundImage: `url(${chatBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
                      : { backgroundColor: chatBackground }
                  ) : undefined}
                >
                  {messages?.map((message) => {
                    if (message.deleted) {
                      return (
                        <div key={message.id} className="text-center text-muted-foreground text-sm italic py-2">
                          This message was deleted
                        </div>
                      );
                    }

                    const isOwn = message.senderId === userProfile?.uid;
                    const senderProfile = allUsers?.find(u => u.uid === message.senderId);
                    const canDelete = isOwn || isCore(userProfile) || isSemiCore(userProfile);
                    const canEdit = isOwn && !message.edited && 
                      (new Date().getTime() - message.timestamp.toDate().getTime()) < 15 * 60 * 1000;

                    if (editingMessageId === message.id) {
                      return (
                        <div key={message.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit();
                              }
                              if (e.key === 'Escape') {
                                setEditingMessageId(null);
                                setEditText('');
                              }
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setEditingMessageId(null);
                            setEditText('');
                          }}>Cancel</Button>
                        </div>
                      );
                    }

                    return (
                      <MessageItem
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        userProfile={userProfile}
                        senderProfile={senderProfile}
                        onReply={handleReply}
                        onReact={handleReact}
                        onDelete={canDelete ? handleDeleteMessage : undefined}
                        onEdit={canEdit ? handleEditMessage : undefined}
                        showAvatar={true}
                      />
                    );
                  })}
                  {messages?.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t bg-card">
              {replyTo && (
                <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Replying to {replyTo.senderName}</p>
                    <p className="text-sm truncate">{replyTo.text}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(null)}
                  >
                    ×
                  </Button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  className="flex-1"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending}
                />
                <Button type="submit" size="icon" disabled={isSending || !messageText.trim()}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
      </div>
      
      {/* Team Icon Upload Dialog */}
      {selectedChat?.team && (
        <Dialog open={isTeamIconDialogOpen} onOpenChange={setIsTeamIconDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Change Team Icon</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <TeamIconUpload team={selectedChat.team} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Chat Background Dialog */}
      <Dialog open={isBackgroundDialogOpen} onOpenChange={setIsBackgroundDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chat Background</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {['', '#f0f0f0', '#e3f2fd', '#f3e5f5', '#fff3e0', '#e8f5e9', '#fce4ec', '#fff9c4'].map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'h-16 rounded-lg border-2 transition-all',
                    chatBackground === color ? 'border-primary scale-105' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color || 'transparent' }}
                  onClick={() => setChatBackground(color)}
                >
                  {!color && <span className="text-xs">Default</span>}
                </button>
              ))}
            </div>
            <Input
              placeholder="Or enter image URL or color code (e.g., #f0f0f0)"
              value={chatBackground && (chatBackground.startsWith('http') || chatBackground.startsWith('#')) ? chatBackground : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value.startsWith('http') || value.startsWith('#') || value === '') {
                  setChatBackground(value);
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                setChatBackground('');
                localStorage.removeItem(`chat-background-${selectedTeamId}`);
              }}
            >
              Reset to Default
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Message Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, messageId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
