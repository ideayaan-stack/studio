'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, CheckSquare, Folder, Activity } from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useAuth, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Team, Task, FileItem } from '@/lib/types';
import { canSeeAllTeams, canSeeAllTasks, canSeeAllFiles } from '@/lib/permissions';
import { format } from 'date-fns';

const chartConfig = {
    tasks: {
      label: "Tasks",
    },
    pending: {
        label: "Pending",
        color: "hsl(var(--chart-4))",
    },
    progress: {
        label: "In Progress",
        color: "hsl(var(--chart-2))",
    },
    completed: {
        label: "Completed",
        color: "hsl(var(--chart-1))",
    }
}

export default function DashboardPage() {
  const { db, userProfile, loading: authLoading } = useAuth();

  // Teams query - Core/Semi-core see all, others see their team
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

  // Tasks query - Core/Semi-core see all, others see their team or assigned
  const tasksQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTasks(userProfile)) {
      return collection(db, 'tasks');
    }
    if (userProfile?.teamId) {
      return query(collection(db, 'tasks'), where('teamId', '==', userProfile.teamId));
    }
    if (userProfile?.uid) {
      return query(collection(db, 'tasks'), where('assignee.uid', '==', userProfile.uid));
    }
    return null;
  }, [db, userProfile]);

  // Files query - Core/Semi-core see all, others see their team
  const filesQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllFiles(userProfile)) {
      return collection(db, 'files');
    }
    if (userProfile?.teamId) {
      return query(collection(db, 'files'), where('teamId', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile]);

  const { data: teams, loading: teamsLoading } = useCollection<Team>(teamsQuery);
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: files, loading: filesLoading } = useCollection<FileItem>(filesQuery);

  const isLoading = authLoading || teamsLoading || tasksLoading || filesLoading;

  // Calculate summary statistics
  const summaryData = useMemo(() => {
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'Completed').length || 0;
    const pendingTasks = tasks?.filter(t => t.status === 'Pending').length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === 'In Progress').length || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Get latest file upload time
    const latestFile = files?.sort((a, b) => 
      b.uploadDate.seconds - a.uploadDate.seconds
    )[0];
    const lastUploadText = latestFile 
      ? `Last upload: ${format(new Date(latestFile.uploadDate.seconds * 1000), 'MMM dd, HH:mm')}`
      : 'No uploads yet';

    return [
      {
        icon: Users,
        title: 'Active Teams',
        value: String(teams?.length || 0),
        description: canSeeAllTeams(userProfile) 
          ? `Total teams in system` 
          : `Your team`,
      },
      {
        icon: CheckSquare,
        title: 'Tasks Completed',
        value: `${completedTasks}/${totalTasks}`,
        description: `${completionRate}% completion rate`,
      },
      {
        icon: Folder,
        title: 'Files Uploaded',
        value: String(files?.length || 0),
        description: lastUploadText,
      },
      {
        icon: Activity,
        title: 'Pending Tasks',
        value: String(pendingTasks),
        description: `${inProgressTasks} in progress`,
      },
    ];
  }, [teams, tasks, files, userProfile]);

  const chartData = useMemo(() => {
    const pending = tasks?.filter(t => t.status === 'Pending').length || 0;
    const inProgress = tasks?.filter(t => t.status === 'In Progress').length || 0;
    const completed = tasks?.filter(t => t.status === 'Completed').length || 0;
    
    return [
      { status: 'Pending', tasks: pending, fill: 'var(--color-pending)' },
      { status: 'In Progress', tasks: inProgress, fill: 'var(--color-progress)' },
      { status: 'Completed', tasks: completed, fill: 'var(--color-completed)' },
    ];
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className='font-headline'>Task Status Overview</CardTitle>
            <CardDescription>
              {canSeeAllTasks(userProfile) 
                ? 'A summary of all tasks across teams.' 
                : 'A summary of tasks in your scope.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} accessibilityLayer>
                  <XAxis
                    dataKey="status"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                   <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                  <Bar dataKey="tasks" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
