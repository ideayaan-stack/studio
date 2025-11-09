'use client';
import { AiTaskSuggester } from '@/components/dashboard/ai-task-suggester';
import { TaskCard } from '@/components/dashboard/task-card';
import { CreateTaskDialog } from '@/components/dashboard/create-task-dialog';
import { EditTaskDialog } from '@/components/dashboard/edit-task-dialog';
import { ChangeTaskStatusDialog } from '@/components/dashboard/change-task-status-dialog';
import { AssignTaskDialog } from '@/components/dashboard/assign-task-dialog';
import { useMemo, useState } from 'react';
import type { Task, Team, UserProfile } from '@/lib/types';
import { PlusCircle, AlertTriangle, Search, Filter, Download, ArrowUpDown, CheckSquare2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useCollection } from '@/firebase';
import { collection, query, where, doc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'created' | 'title'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const userIsHead = isHead(userProfile);
  const userIsVolunteer = isVolunteer(userProfile);
  const canManage = canSeeAllTasks(userProfile);
  
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

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks || [];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.assignee.name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Team filter
    if (teamFilter !== 'all' && canManage) {
      filtered = filtered.filter(task => task.teamId === teamFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'deadline':
          comparison = a.deadline.toMillis() - b.deadline.toMillis();
          break;
        case 'created':
          comparison = a.createdAt.toMillis() - b.createdAt.toMillis();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, searchQuery, statusFilter, teamFilter, sortBy, sortOrder, canManage]);

  const columns: { title: Task['status']; tasks: Task[] }[] = useMemo(() => [
      { title: 'Pending', tasks: filteredAndSortedTasks.filter((t) => t.status === 'Pending') },
      { title: 'In Progress', tasks: filteredAndSortedTasks.filter((t) => t.status === 'In Progress') },
      { title: 'Completed', tasks: filteredAndSortedTasks.filter((t) => t.status === 'Completed') },
  ], [filteredAndSortedTasks]);

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

  const handleBulkDelete = async () => {
    if (!db || selectedTaskIds.size === 0) return;
    
    try {
      const batch = writeBatch(db);
      selectedTaskIds.forEach(taskId => {
        const taskRef = doc(db, 'tasks', taskId);
        batch.delete(taskRef);
      });
      await batch.commit();
      toast({
        title: 'Tasks Deleted',
        description: `${selectedTaskIds.size} task(s) have been deleted.`,
      });
      setSelectedTaskIds(new Set());
      setIsBulkMode(false);
    } catch (error: any) {
      console.error('Error deleting tasks:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete tasks',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: Task['status']) => {
    if (!db || selectedTaskIds.size === 0) return;
    
    try {
      const batch = writeBatch(db);
      selectedTaskIds.forEach(taskId => {
        const taskRef = doc(db, 'tasks', taskId);
        batch.update(taskRef, {
          status: newStatus,
          updatedAt: Timestamp.now(),
        });
      });
      await batch.commit();
      toast({
        title: 'Tasks Updated',
        description: `${selectedTaskIds.size} task(s) status changed to ${newStatus}.`,
      });
      setSelectedTaskIds(new Set());
      setIsBulkMode(false);
    } catch (error: any) {
      console.error('Error updating tasks:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update tasks',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setSelectedTaskIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === filteredAndSortedTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredAndSortedTasks.map(t => t.id)));
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
                  {canManage && (
                    <Button
                      variant={isBulkMode ? "default" : "outline"}
                      onClick={() => {
                        setIsBulkMode(!isBulkMode);
                        setSelectedTaskIds(new Set());
                      }}
                    >
                      {isBulkMode ? 'Cancel' : 'Bulk Actions'}
                    </Button>
                  )}
              </div>
            )}
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {canManage && teams && teams.length > 0 && (
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [by, order] = value.split('-');
              setSortBy(by as 'deadline' | 'created' | 'title');
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline-asc">Deadline (Earliest)</SelectItem>
                <SelectItem value="deadline-desc">Deadline (Latest)</SelectItem>
                <SelectItem value="created-asc">Created (Oldest)</SelectItem>
                <SelectItem value="created-desc">Created (Newest)</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {isBulkMode && canManage && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {selectedTaskIds.size === filteredAndSortedTasks.length ? (
                    <CheckSquare2 className="h-4 w-4 mr-2" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  Select All ({selectedTaskIds.size} selected)
                </Button>
              </div>
              <div className="flex gap-2">
                <Select onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedTaskIds.size === 0}
                >
                  Delete ({selectedTaskIds.size})
                </Button>
              </div>
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
                                isBulkMode={isBulkMode}
                                isSelected={selectedTaskIds.has(task.id)}
                                onToggleSelect={toggleTaskSelection}
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
