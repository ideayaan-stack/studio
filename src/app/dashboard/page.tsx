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

const summaryData = [
  {
    icon: Users,
    title: 'Active Teams',
    value: '4',
    description: 'Core, Media, Technical, Events',
  },
  {
    icon: CheckSquare,
    title: 'Tasks Completed',
    value: '32/48',
    description: '66% completion rate',
  },
  {
    icon: Folder,
    title: 'Files Uploaded',
    value: '12',
    description: 'Last upload: 2 hours ago',
  },
  {
    icon: Activity,
    title: 'Pending Tasks',
    value: '16',
    description: '5 high priority',
  },
];

const chartData = [
  { status: 'Pending', tasks: 16, fill: 'var(--color-pending)' },
  { status: 'In Progress', tasks: 12, fill: 'var(--color-progress)' },
  { status: 'Completed', tasks: 20, fill: 'var(--color-completed)' },
];

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
            <CardDescription>A summary of all tasks across teams.</CardDescription>
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
