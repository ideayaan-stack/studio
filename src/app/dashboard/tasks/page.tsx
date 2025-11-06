'use client';
import { AiTaskSuggester } from '@/components/dashboard/ai-task-suggester';
import { TaskCard } from '@/components/dashboard/task-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Task } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useMemo } from 'react';

const tasks: Task[] = [
  { id: '1', title: 'Design event poster', description: 'Create a visually appealing poster for social media.', status: 'Completed', deadline: '2024-10-25', teamId: '2', assignee: { name: 'Alice Johnson', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-1')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-1')?.imageHint! } },
  { id: '2', title: 'Develop registration page', description: 'Build the front-end and back-end for event registration.', status: 'In Progress', deadline: '2024-11-05', teamId: '3', assignee: { name: 'Bob Williams', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-2')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-2')?.imageHint! } },
  { id: '3', title: 'Book auditorium', description: 'Finalize and book the main auditorium for Day 1.', status: 'Pending', deadline: '2024-10-30', teamId: '4', assignee: { name: 'Charlie Brown', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-3')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-3')?.imageHint! } },
  { id: '4', title: 'Setup CI/CD pipeline for website', description: 'Automate deployment for the event website.', status: 'In Progress', deadline: '2024-11-02', teamId: '3', assignee: { name: 'David Lee', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-4')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-4')?.imageHint! } },
  { id: '5', title: 'Finalize workshop speakers', description: 'Confirm all speakers for the 5 workshops.', status: 'Completed', deadline: '2024-10-20', teamId: '1', assignee: { name: 'Eve Davis', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-5')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-5')?.imageHint! } },
  { id: '6', title: 'Schedule social media posts', description: 'Plan and schedule posts for the next 2 weeks.', status: 'Pending', deadline: '2024-11-01', teamId: '2', assignee: { name: 'Alice Johnson', avatarUrl: PlaceHolderImages.find(p => p.id === 'user-1')?.imageUrl!, avatarHint: PlaceHolderImages.find(p => p.id === 'user-1')?.imageHint! } },
];

export default function TasksPage() {
  const { user } = useAuth();
  const isCoreTeam = user?.role === 'core-team';

  const displayedTasks = useMemo(() => {
    return isCoreTeam ? tasks : tasks.filter(task => task.teamId === user?.teamId);
  }, [isCoreTeam, user?.teamId]);

  const columns: { title: Task['status']; tasks: Task[] }[] = useMemo(() => [
      { title: 'Pending', tasks: displayedTasks.filter((t) => t.status === 'Pending') },
      { title: 'In Progress', tasks: displayedTasks.filter((t) => t.status === 'In Progress') },
      { title: 'Completed', tasks: displayedTasks.filter((t) => t.status === 'Completed') },
  ], [displayedTasks]);

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-headline font-bold">To-Do Board</h1>
                <p className="text-muted-foreground">Organize and track tasks across all teams.</p>
            </div>
            {isCoreTeam && (
              <div className='flex gap-2'>
                  <Button variant="outline">
                      <PlusCircle className='mr-2 h-4 w-4'/>
                      Add Task
                  </Button>
                  <AiTaskSuggester />
              </div>
            )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {columns.map(column => (
                <div key={column.title} className="bg-muted/50 rounded-lg h-full">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold font-headline flex items-center">
                            {column.title} 
                            <span className='ml-2 text-sm font-normal bg-primary/10 text-primary rounded-full size-6 flex items-center justify-center'>{column.tasks.length}</span>
                        </h2>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto">
                        {column.tasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                         {column.tasks.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground py-10">
                                No tasks in this column.
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
