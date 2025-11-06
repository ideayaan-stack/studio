'use client';
import { AiTaskSuggester } from '@/components/dashboard/ai-task-suggester';
import { TaskCard } from '@/components/dashboard/task-card';
import { useMemo } from 'react';
import type { Task } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function TasksPage() {
  const { db, userProfile } = useAuth();
  const isCoreOrSemiCore = userProfile?.role === 'Core' || userProfile?.role === 'Semi-core';
  const isHead = userProfile?.role === 'Head';

  const tasksQuery = useMemo(() => {
    if (!db) return null;
    if (isCoreOrSemiCore) {
      return collection(db, 'tasks');
    }
    if (userProfile?.teamId) {
      return query(collection(db, 'tasks'), where('teamId', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile, isCoreOrSemiCore]);
  
  const { data: tasks, loading } = useCollection<Task>(tasksQuery);

  const displayedTasks = tasks || [];

  const columns: { title: Task['status']; tasks: Task[] }[] = useMemo(() => [
      { title: 'Pending', tasks: displayedTasks.filter((t) => t.status === 'Pending') },
      { title: 'In Progress', tasks: displayedTasks.filter((t) => t.status === 'In Progress') },
      { title: 'Completed', tasks: displayedTasks.filter((t) => t.status === 'Completed') },
  ], [displayedTasks]);

  const canAddTask = isCoreOrSemiCore || isHead;

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-headline font-bold">To-Do Board</h1>
                <p className="text-muted-foreground">Organize and track tasks across all teams.</p>
            </div>
            {canAddTask && (
              <div className='flex gap-2'>
                  <Button variant="outline">
                      <PlusCircle className='mr-2 h-4 w-4'/>
                      Add Task
                  </Button>
                  {isCoreOrSemiCore && <AiTaskSuggester />}
              </div>
            )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted/50 rounded-lg h-full">
                  <div className="p-4 border-b">
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                  </div>
                </div>
              ))
            ) : (
              columns.map(column => (
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
              ))
            )}
        </div>
    </div>
  );
}
