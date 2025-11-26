'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, CheckSquare, Folder, Activity, Video, Calendar, Clock, Download } from 'lucide-react';
import { exportDataToExcel } from '@/lib/export';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useAuth, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Team, Task, FileItem } from '@/lib/types';
import { canSeeAllTeams, canSeeAllTasks, canSeeAllFiles } from '@/lib/permissions';
import { format, isSameDay, subDays, isAfter, isBefore, addDays, startOfDay, endOfDay } from 'date-fns';

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
  },
  overdue: {
    label: "Overdue",
    color: "#ef4444", // red-500
  },
  dueToday: {
    label: "Due Today",
    color: "#f97316", // orange-500
  },
  dueWeek: {
    label: "Due This Week",
    color: "#eab308", // yellow-500
  },
  dueLater: {
    label: "Due Later",
    color: "#22c55e", // green-500
  },
  created: {
    label: "New Tasks",
    color: "hsl(var(--primary))",
  }
}

export default function DashboardPage() {
  const { db, userProfile, loading: authLoading } = useAuth();

  // ... (existing queries) ...
  // Teams query - Core/Semi-core see all, others see their team
  const teamsQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTeams(userProfile)) {
      return collection(db, 'teams');
    }
    if (userProfile?.teamIds && userProfile.teamIds.length > 0) {
      return query(collection(db, 'teams'), where('__name__', 'in', userProfile.teamIds));
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
    if (userProfile?.teamIds && userProfile.teamIds.length > 0) {
      return query(collection(db, 'tasks'), where('teamId', 'in', userProfile.teamIds));
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
    if (userProfile?.teamIds && userProfile.teamIds.length > 0) {
      return query(collection(db, 'files'), where('teamId', 'in', userProfile.teamIds));
    }
    if (userProfile?.teamId) {
      return query(collection(db, 'files'), where('teamId', '==', userProfile.teamId));
    }
    return null;
  }, [db, userProfile]);

  const { data: teams, loading: teamsLoading } = useCollection<Team>(teamsQuery);
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: files, loading: filesLoading } = useCollection<FileItem>(filesQuery);

  // Get meetings for dashboard
  const meetingsQuery = useMemo(() => {
    if (!db) return null;
    if (canSeeAllTeams(userProfile)) {
      return query(collection(db, 'meetings'), orderBy('scheduledDate', 'asc'));
    }

    const userTeamIds = userProfile?.teamIds || [];
    if (userProfile?.teamId && !userTeamIds.includes(userProfile.teamId)) {
      userTeamIds.push(userProfile.teamId);
    }

    if (userTeamIds.length > 0) {
      // Include team meetings and all-team meetings (teamId == null)
      // Firestore 'in' query supports up to 10 values. 
      // We need to handle null separately or include it in the list if possible, but 'in' doesn't support null mixed with strings well in all SDK versions or requires specific handling.
      // A simpler approach for now is to just query by teamIds if we can, or rely on client side filtering if complex.
      // However, let's try to include null in the 'in' array if possible, or just query for teams.
      // Actually, 'in' query with null is tricky. Let's stick to querying for teams and maybe a separate query for global meetings if needed, 
      // but for now let's just query for the user's teams. Global meetings might need a separate handling or be assigned to a 'common' team id.
      // Assuming 'null' teamId means global.

      return query(
        collection(db, 'meetings'),
        where('teamId', 'in', [...userTeamIds, null]),
        orderBy('scheduledDate', 'asc')
      );
    }

    return null;
  }, [db, userProfile]);

  const { data: meetings } = useCollection(meetingsQuery);

  const isLoading = authLoading || teamsLoading || tasksLoading || filesLoading;

  // Calculate summary statistics
  // Get user's team info
  const userTeams = useMemo(() => {
    if (!teams) return [];
    if (userProfile?.teamIds && userProfile.teamIds.length > 0) {
      return teams.filter(t => userProfile.teamIds?.includes(t.id));
    }
    if (userProfile?.teamId) {
      return teams.filter(t => t.id === userProfile.teamId);
    }
    return [];
  }, [teams, userProfile]);

  // Get upcoming tasks for user
  const upcomingTasks = useMemo(() => {
    if (!tasks) return [];
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return tasks
      .filter(t => {
        const deadline = t.deadline.toDate();
        return deadline >= now && deadline <= sevenDaysFromNow && t.status !== 'Completed';
      })
      .sort((a, b) => a.deadline.toMillis() - b.deadline.toMillis())
      .slice(0, 5);
  }, [tasks]);

  // Get upcoming meetings
  const upcomingMeetings = useMemo(() => {
    if (!meetings || !Array.isArray(meetings)) return [];
    const now = new Date();
    return meetings
      .filter((m: any) => m.scheduledDate && m.scheduledDate.toDate && m.scheduledDate.toDate() >= now)
      .sort((a: any, b: any) => a.scheduledDate.toMillis() - b.scheduledDate.toMillis())
      .slice(0, 5);
  }, [meetings]);

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

  // Urgency Data for Pie Chart
  const urgencyData = useMemo(() => {
    if (!tasks) return [];
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = addDays(now, 7);

    let overdue = 0;
    let dueToday = 0;
    let dueWeek = 0;
    let dueLater = 0;

    tasks.forEach(t => {
      if (t.status === 'Completed') return;
      const d = t.deadline.toDate();

      if (isBefore(d, now)) {
        overdue++;
      } else if (isAfter(d, todayStart) && isBefore(d, todayEnd)) {
        dueToday++;
      } else if (isBefore(d, weekEnd)) {
        dueWeek++;
      } else {
        dueLater++;
      }
    });

    return [
      { name: 'Overdue', value: overdue, fill: chartConfig.overdue.color },
      { name: 'Due Today', value: dueToday, fill: chartConfig.dueToday.color },
      { name: 'Due This Week', value: dueWeek, fill: chartConfig.dueWeek.color },
      { name: 'Due Later', value: dueLater, fill: chartConfig.dueLater.color },
    ].filter(d => d.value > 0);
  }, [tasks]);

  // Trend Data for Line Chart
  const trendData = useMemo(() => {
    if (!tasks) return [];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        date: format(d, 'MMM dd'),
        fullDate: startOfDay(d),
        tasks: 0,
      };
    });

    tasks.forEach(t => {
      const created = startOfDay(t.createdAt.toDate());
      const day = days.find(d => d.fullDate.getTime() === created.getTime());
      if (day) {
        day.tasks++;
      }
    });

    return days;
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
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
          {(canSeeAllTeams(userProfile)) && (
            <Button onClick={exportDataToExcel} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          )}
        </div>
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status Bar Chart */}
          <Card className="shadow-sm col-span-1">
            <CardHeader>
              <CardTitle className='font-headline'>Task Status</CardTitle>
              <CardDescription>Overview of task progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="status" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="tasks" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Urgency Pie Chart */}
          <Card className="shadow-sm col-span-1">
            <CardHeader>
              <CardTitle className='font-headline'>Task Urgency</CardTitle>
              <CardDescription>Tasks by deadline proximity</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={urgencyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {urgencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Trend Line Chart */}
          <Card className="shadow-sm col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className='font-headline'>New Tasks</CardTitle>
              <CardDescription>Tasks created in last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="tasks" stroke="var(--color-created)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Dashboard for Volunteers and Heads */}
        {(userProfile?.role === 'Volunteer' || userProfile?.role === 'Head') && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Team Info */}
            {userTeams.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userTeams.map(team => (
                      <div key={team.id} className="space-y-1 pb-2 border-b last:border-0 last:pb-0">
                        <p className="text-xl font-bold">{team.name}</p>
                        {team.description && (
                          <p className="text-sm text-muted-foreground">{team.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {team.members?.length || 0} member(s)
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Pending Tasks
                </CardTitle>
                <CardDescription>Tasks assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending tasks</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {format(task.deadline.toDate(), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Link href="/dashboard/tasks">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </div>
                    ))}
                    {tasks && tasks.filter(t => t.status !== 'Completed').length > 5 && (
                      <Link href="/dashboard/tasks">
                        <Button variant="outline" className="w-full mt-2">
                          View All Tasks
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription>Tasks due in the next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(task.deadline.toDate(), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Upcoming Meetings
                </CardTitle>
                <CardDescription>Scheduled team meetings</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingMeetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingMeetings.map((meeting: any) => (
                      <div key={meeting.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {meeting.scheduledDate && meeting.scheduledDate.toDate ? format(meeting.scheduledDate.toDate(), 'MMM dd, yyyy HH:mm') : 'Date TBD'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => meeting.meetingLink && window.open(meeting.meetingLink, '_blank')}
                        >
                          Join
                        </Button>
                      </div>
                    ))}
                    <Link href="/dashboard/meetings">
                      <Button variant="outline" className="w-full mt-2">
                        View All Meetings
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
