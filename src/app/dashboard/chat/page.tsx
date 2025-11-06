import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Message, ChatTeam } from '@/lib/types';
import { cn } from '@/lib/utils';

const teams: ChatTeam[] = [
  { id: '1', name: 'Media Team', lastMessage: 'Sure, I will get it done.', timestamp: '10:30 AM', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-2')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-2')?.imageHint! },
  { id: '2', name: 'Technical Team', lastMessage: 'The API is ready for testing.', timestamp: '9:45 AM', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-3')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-3')?.imageHint! },
  { id: '3', name: 'Events Team', lastMessage: 'Venue confirmed!', timestamp: 'Yesterday', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-4')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-4')?.imageHint! },
];

const messages: Message[] = [
  { id: '1', sender: { name: 'Alice', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-1')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-1')?.imageHint! }, text: 'Hey team, the event proposal v2 is uploaded. Please review.', timestamp: '10:25 AM', isOwn: false },
  { id: '2', sender: { name: 'You', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-5')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-5')?.imageHint! }, text: 'Looks great! I have a few minor suggestions for the budget section.', timestamp: '10:28 AM', isOwn: true },
  { id: '3', sender: { name: 'Alice', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-1')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-1')?.imageHint! }, text: 'Sure, I will get it done.', timestamp: '10:30 AM', isOwn: false },
];

export default function ChatPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-[calc(100vh-11rem)] md:h-[calc(100vh-8rem)] rounded-lg border shadow-sm">
      <div className="flex flex-col border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-headline font-bold">Inbox</h1>
        </div>
        <ScrollArea className="flex-1">
          {teams.map((team, index) => (
            <div key={team.id} className={cn("p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/50", index === 0 && 'bg-muted/80')}>
              <Avatar>
                <AvatarImage src={team.avatarUrl} alt={team.name} data-ai-hint={team.avatarHint} />
                <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <div className="flex items-baseline justify-between">
                    <p className="font-semibold">{team.name}</p>
                    <p className="text-xs text-muted-foreground">{team.timestamp}</p>
                </div>
                <p className="text-sm text-muted-foreground truncate">{team.lastMessage}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-4">
            <Avatar>
                <AvatarImage src={teams[0].avatarUrl} alt={teams[0].name} data-ai-hint={teams[0].avatarHint} />
                <AvatarFallback>{teams[0].name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="font-semibold text-lg">{teams[0].name}</h2>
                <p className='text-sm text-muted-foreground'>Chat with the media team</p>
            </div>
        </div>
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={cn('flex items-end gap-3', message.isOwn && 'flex-row-reverse')}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender.avatarUrl} alt={message.sender.name} data-ai-hint={message.sender.avatarHint} />
                  <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={cn('max-w-xs md:max-w-md rounded-lg px-4 py-2', message.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  <p className="text-sm">{message.text}</p>
                  <p className={cn('text-xs mt-1', message.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground', 'text-right')}>{message.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-card">
          <form className="flex items-center gap-2">
            <Input placeholder="Type a message..." className="flex-1" />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
