'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useAuth, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { canChatInAllTeams } from '@/lib/permissions';
import { format, formatDistanceToNow } from 'date-fns';
import type { Team } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
}

const COMMON_CHAT_ID = 'common';

export default function ChatPage() {
  const { db, userProfile } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  // Create chat list with community chat + team chats
  const chatList = useMemo(() => {
    const list: Array<{ id: string; name: string; isCommon: boolean }> = [
      { id: COMMON_CHAT_ID, name: 'Community', isCommon: true }
    ];
    
    if (teams) {
      teams.forEach(team => {
        list.push({ id: team.id, name: team.name, isCommon: false });
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
      });
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
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

  if (teamsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-[calc(100vh-11rem)] md:h-[calc(100vh-8rem)] rounded-lg border shadow-sm">
        <div className="flex flex-col border-r p-4 space-y-4">
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
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-[calc(100vh-11rem)] md:h-[calc(100vh-8rem)] rounded-lg border shadow-sm overflow-hidden">
      <div className="flex flex-col border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-headline font-bold">Inbox</h1>
        </div>
        <ScrollArea className="flex-1">
          {chatList.map((chat) => {
            // Get last message for this chat (only if this chat is selected, otherwise we'd need separate queries)
            // For now, show last message only for selected chat
            const lastMessage = selectedTeamId === chat.id && messages && messages.length > 0 
              ? messages[messages.length - 1] 
              : null;
            
            return (
              <div
                key={chat.id}
                onClick={() => setSelectedTeamId(chat.id)}
                className={cn(
                  "p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedTeamId === chat.id && 'bg-muted/80'
                )}
              >
                <Avatar>
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
      <div className="flex flex-col h-full">
        {selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center gap-4">
              <Avatar>
                <AvatarFallback>
                  {selectedChat.isCommon ? '💬' : selectedChat.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">{selectedChat.name}</h2>
                <p className='text-sm text-muted-foreground'>
                  {selectedChat.isCommon 
                    ? 'Community chat with all members' 
                    : `Chat with ${selectedChat.name}`}
                </p>
              </div>
            </div>
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 md:p-6">
              {messagesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-3/4" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {messages?.map((message) => {
                    const isOwn = message.senderId === userProfile?.uid;
                    return (
                      <div
                        key={message.id}
                        className={cn('flex items-end gap-3', isOwn && 'flex-row-reverse')}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            'max-w-xs md:max-w-md rounded-lg px-4 py-2',
                            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          )}
                        >
                          {!isOwn && (
                            <p className="text-xs font-semibold mb-1 opacity-70">
                              {message.senderName}
                            </p>
                          )}
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={cn(
                              'text-xs mt-1 text-right',
                              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}
                          >
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
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
    </div>
  );
}
