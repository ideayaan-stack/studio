'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
    format,
    addDays,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isToday,
    differenceInDays,
    startOfDay,
    addMonths,
    subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useCollection, useAuth } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Task } from '@/lib/types';

export function TimelineView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { db, userProfile } = useAuth();

    // Fetch tasks
    const tasksQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        return collection(db, 'tasks');
    }, [db, userProfile]);

    const { data: tasks } = useCollection<Task>(tasksQuery);

    // Process tasks for timeline
    const timelineTasks = useMemo(() => {
        if (!tasks) return [];

        let filtered = tasks;
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = tasks.filter(t => t.title.toLowerCase().includes(lowerQuery));
        }

        return filtered.map(task => {
            const endDate = task.deadline?.toDate() || new Date();
            // Estimate start date (e.g., 3 days before deadline or created date if available)
            // For this demo, we'll assume tasks take 2-5 days ending on deadline
            const duration = Math.floor(Math.random() * 4) + 2;
            const startDate = addDays(endDate, -duration);

            return {
                ...task,
                startDate,
                endDate,
                status: task.status
            };
        });
    }, [tasks, searchQuery]);

    // Generate timeline days (2 weeks buffer around current view)
    const days = useMemo(() => {
        const start = startOfWeek(currentDate);
        // Show 30 days
        return eachDayOfInterval({
            start: addDays(start, -7),
            end: addDays(start, 23)
        });
    }, [currentDate]);

    const navigate = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => direction === 'prev' ? addDays(prev, -7) : addDays(prev, 7));
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                    <div className="flex items-center rounded-md border bg-background shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r" onClick={() => navigate('prev')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => navigate('next')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <h2 className="text-lg font-semibold ml-2">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                </div>
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Task List */}
                <div className="w-64 flex-shrink-0 border-r flex flex-col bg-card z-10 shadow-sm">
                    <div className="h-12 border-b flex items-center px-4 font-medium text-sm text-muted-foreground bg-muted/30">
                        Task Name
                    </div>
                    <div className="flex-1 overflow-y-hidden hover:overflow-y-auto">
                        {timelineTasks.map(task => (
                            <div key={task.id} className="h-12 flex items-center px-4 border-b text-sm font-medium truncate hover:bg-muted/50 transition-colors">
                                <div className={cn(
                                    "w-2 h-2 rounded-full mr-3 flex-shrink-0",
                                    task.status === 'Completed' ? "bg-green-500" :
                                        task.status === 'In Progress' ? "bg-blue-500" :
                                            "bg-orange-500"
                                )} />
                                <span className="truncate">{task.title}</span>
                            </div>
                        ))}
                        {timelineTasks.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No tasks found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Timeline Grid */}
                <div className="flex-1 flex flex-col overflow-hidden relative" ref={scrollContainerRef}>
                    {/* Header Dates */}
                    <div className="h-12 flex border-b bg-muted/30 sticky top-0 z-10 min-w-max">
                        {days.map(day => (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "w-12 flex-shrink-0 flex flex-col items-center justify-center border-r text-xs",
                                    isToday(day) && "bg-primary/10 text-primary font-semibold"
                                )}
                            >
                                <span className="opacity-70">{format(day, 'EEE')}</span>
                                <span className="font-medium">{format(day, 'd')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid & Bars */}
                    <div className="flex-1 overflow-auto min-w-max relative">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {days.map(day => (
                                <div key={`grid-${day.toString()}`} className={cn(
                                    "w-12 flex-shrink-0 border-r h-full",
                                    isToday(day) && "bg-primary/5"
                                )} />
                            ))}
                        </div>

                        {/* Task Rows */}
                        <div className="relative">
                            {timelineTasks.map(task => {
                                // Calculate position and width
                                const startDiff = differenceInDays(startOfDay(task.startDate), startOfDay(days[0]));
                                const duration = differenceInDays(startOfDay(task.endDate), startOfDay(task.startDate)) + 1;

                                // Only render if visible in current window (roughly)
                                const isVisible = startDiff + duration > 0 && startDiff < days.length;

                                return (
                                    <div key={`row-${task.id}`} className="h-12 border-b relative flex items-center">
                                        {isVisible && (
                                            <div
                                                className={cn(
                                                    "absolute h-8 rounded-md shadow-sm flex items-center px-2 text-xs font-medium text-white transition-all hover:brightness-110 cursor-pointer",
                                                    task.status === 'Completed' ? "bg-green-500" :
                                                        task.status === 'In Progress' ? "bg-blue-500" :
                                                            "bg-orange-500"
                                                )}
                                                style={{
                                                    left: `${Math.max(0, startDiff) * 48}px`, // 48px = w-12
                                                    width: `${Math.min(duration, days.length - startDiff) * 48}px`,
                                                    marginLeft: startDiff < 0 ? `-${Math.abs(startDiff) * 48}px` : '4px', // Adjust for cutoff
                                                    maxWidth: `${(days.length - Math.max(0, startDiff)) * 48 - 8}px` // Prevent overflow
                                                }}
                                                title={`${task.title} (${format(task.startDate, 'MMM d')} - ${format(task.endDate, 'MMM d')})`}
                                            >
                                                <span className="truncate sticky left-0 px-1">{task.title}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
