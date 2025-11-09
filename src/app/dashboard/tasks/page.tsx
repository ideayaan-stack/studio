'use client';
import { AiTaskSuggester } from '@/components/dashboard/ai-task-suggester';
import { TaskCard } from '@/components/dashboard/task-card';
import { CreateTaskDialog } from '@/components/dashboard/create-task-dialog';
import { EditTaskDialog } from '@/components/dashboard/edit-task-dialog';
import { ChangeTaskStatusDialog } from '@/components/dashboard/change-task-status-dialog';
import { AssignTaskDialog } from '@/components/dashboard/assign-task-dialog';
import { useMemo, useState } from 'react';
import type { Task, Team, UserProfile } from '@/lib/types';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useCollection } from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { canSeeAllTasks, canCreateTasks, isHead, isVolunteer, canSeeAllTeams } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TasksPage() {
  const { db, userProfile } = useAuth();
  const { toast } = useToast();
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteTaskDialog, setDeleteTaskDialog] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const userIsHead = isHead(userProfile);
  const userIsVolunteer = isVolunteer(userProfile);
  
  const tasksQuery = useMemo(() => {
    if (!db) return null;
    // Core/Semi-core admins see all tasks
    if (canSeeAllTasks(userProfile)) {
      return collection(db, 'tasks');
    }
    // Team members see tasks associated with their team
    if (userProfile?.teamId) {
      return query(collection(db, 'tasks'), where('teamId', '==', userProfile.teamId));
    }
    // Volunteers see only tasks directly assigned to them, even if teamId isn't set
    if (userIsVolunteer && userProfile?.uid) {
       return query(collection(db, 'tasks'), where('assignee.uid', '==', userProfile.uid));
    }
    // Return null if no specific query can be formed (e.g., unassigned user)
    return null;
  }, [db, userProfile, userIsVolunteer]);
  
  const { data: tasks, loading } = useCollection<Task>(tasksQuery);

  // Get teams for task creation
  const teamsQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTeams(userProfile)) {
      return collection(db, 'teams');
    }
    if (userProfile?.teamId) {
      return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile]);

  // Get users for task assignment
  const usersQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTeams(userProfile)) {
      return collection(db, 'users');
    }
    if (userProfile?.teamId) {
      return query(collection(db, 'users'), where('teamId', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile]);

  const { data: teams } = useCollection<Team>(teamsQuery);
  const { data: users } = useCollection<UserProfile>(usersQuery);

  const displayedTasks = tasks || [];

  const columns: { title: Task['status']; tasks: Task[] }[] = useMemo(() => [
      { title: 'Pending', tasks: displayedTasks.filter((t) => t.status === 'Pending') },
      { title: 'In Progress', tasks: displayedTasks.filter((t) => t.status === 'In Progress') },
      { title: 'Completed', tasks: displayedTasks.filter((t) => t.status === 'Completed') },
  ], [displayedTasks]);

  const canAddTask = canCreateTasks(userProfile);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditTaskDialogOpen(true);
  };

  const handleStatusChange = (task: Task) => {
    setSelectedTask(task);
    setIsStatusDialogOpen(true);
  };

  const handleAssignTask = (task: Task) => {
    setSelectedTask(task);
    setIsAssignDialogOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeleteTaskDialog({ open: true, task });
  };

  const confirmDeleteTask = async () => {
    if (!db || !deleteTaskDialog.task) return;
    
    try {
      const taskDocRef = doc(db, 'tasks', deleteTaskDialog.task.id);
      await deleteDoc(taskDocRef);
      toast({
        title: 'Task Deleted',
        description: `Task "${deleteTaskDialog.task.title}" has been deleted.`,
      });
      setDeleteTaskDialog({ open: false, task: null });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete task',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  // Component to show when a user is not assigned to a team
  if (!loading && !canSeeAllTasks(userProfile) && !userProfile?.teamId) {
    return (
       <Alert variant="default" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Team Assigned</AlertTitle>
          <AlertDescription>
            You are not currently assigned to a team. You can only see tasks specifically assigned to you. For broader team access, please contact a Core team member.
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-headline font-bold">To-Do Board</h1>
                <p className="text-muted-foreground">Organize and track tasks for your team.</p>
            </div>
            {canAddTask && (
              <div className='flex gap-2 flex-wrap'>
                  <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(true)}>
                      <PlusCircle className='mr-2 h-4 w-4'/>
                      Add Task
                  </Button>
                  {canSeeAllTasks(userProfile) && <AiTaskSuggester />}
              </div>
            )}
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 items-start">
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
                              <TaskCard 
                                key={task.id} 
                                task={task}
                                onEdit={handleEditTask}
                                onStatusChange={handleStatusChange}
                                onAssign={handleAssignTask}
                                onDelete={handleDeleteTask}
                              />
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

        {canAddTask && (
          <CreateTaskDialog
            isOpen={isCreateTaskDialogOpen}
            setIsOpen={setIsCreateTaskDialogOpen}
            teams={teams || []}
            users={users || []}
          />
        )}
        <EditTaskDialog
          isOpen={isEditTaskDialogOpen}
          setIsOpen={(open) => {
            setIsEditTaskDialogOpen(open);
            if (!open) setSelectedTask(null);
          }}
          task={selectedTask}
          teams={teams || []}
          users={users || []}
        />
        <ChangeTaskStatusDialog
          isOpen={isStatusDialogOpen}
          setIsOpen={(open) => {
            setIsStatusDialogOpen(open);
            if (!open) setSelectedTask(null);
          }}
          task={selectedTask}
        />
        <AssignTaskDialog
          isOpen={isAssignDialogOpen}
          setIsOpen={(open) => {
            setIsAssignDialogOpen(open);
            if (!open) setSelectedTask(null);
          }}
          task={selectedTask}
          teams={teams || []}
          users={users || []}
        />
        <AlertDialog open={deleteTaskDialog.open} onOpenChange={(open) => setDeleteTaskDialog({ open, task: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the task "{deleteTaskDialog.task?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
