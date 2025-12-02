'use client';

import { useState, useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    addDays,
    startOfDay,
    endOfDay,
    addWeeks,
    subWeeks,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCollection, useAuth } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Task } from '@/lib/types';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewType>('month');
    const { db, userProfile } = useAuth();

    // Fetch tasks
    const tasksQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        // Simple query: fetch all tasks for now, filter client-side for date
        // In a real app with many tasks, you'd want to query by date range
        return collection(db, 'tasks');
    }, [db, userProfile]);

    const { data: tasks } = useCollection<Task>(tasksQuery);

    // Filter tasks for the current view
    const events = useMemo(() => {
        if (!tasks) return [];
        return tasks.map(task => ({
            id: task.id,
            title: task.title,
            date: task.deadline?.toDate() || new Date(), // Fallback to now if no deadline
            type: 'task',
            status: task.status
        }));
    }, [tasks]);

    const navigate = (direction: 'prev' | 'next') => {
        if (view === 'month') {
            setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        } else if (view === 'week') {
            setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
        } else {
            setCurrentDate(prev => direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1));
        }
    };

    const goToToday = () => setCurrentDate(new Date());

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weeks: Date[][] = [];
        let week: Date[] = [];

        days.forEach((day, index) => {
            week.push(day);
            if ((index + 1) % 7 === 0) {
                weeks.push(week);
                week = [];
            }
        });

        return (
            <div className="flex flex-col h-full">
                <div className="grid grid-cols-7 border-b">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="flex-1 grid grid-rows-5 md:grid-rows-6">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
                            {week.map((day, dayIndex) => {
                                const dayEvents = events.filter(e => isSameDay(e.date, day));
                                return (
                                    <div
                                        key={day.toString()}
                                        className={cn(
                                            "min-h-[80px] p-2 border-r last:border-r-0 flex flex-col gap-1 transition-colors hover:bg-muted/5",
                                            !isSameMonth(day, monthStart) && "bg-muted/10 text-muted-foreground",
                                            isToday(day) && "bg-primary/5"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                                isToday(day) && "bg-primary text-primary-foreground"
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[100px] no-scrollbar">
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    className={cn(
                                                        "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                                                        event.status === 'Completed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 line-through" :
                                                            event.status === 'In Progress' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                                "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                    )}
                                                    title={event.title}
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(weekStart);
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="grid grid-cols-7 border-b">
                    {days.map(day => (
                        <div key={day.toString()} className={cn(
                            "p-3 text-center border-r last:border-r-0 flex flex-col gap-1",
                            isToday(day) && "bg-primary/5"
                        )}>
                            <span className="text-xs font-semibold text-muted-foreground uppercase">{format(day, 'EEE')}</span>
                            <span className={cn(
                                "text-lg font-bold h-8 w-8 flex items-center justify-center rounded-full mx-auto",
                                isToday(day) && "bg-primary text-primary-foreground"
                            )}>
                                {format(day, 'd')}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7 overflow-y-auto">
                    {days.map(day => {
                        const dayEvents = events.filter(e => isSameDay(e.date, day));
                        return (
                            <div key={day.toString()} className={cn(
                                "border-r last:border-r-0 p-2 min-h-[400px] hover:bg-muted/5 transition-colors",
                                isToday(day) && "bg-primary/5"
                            )}>
                                <div className="flex flex-col gap-2">
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "text-xs p-2 rounded border shadow-sm cursor-pointer hover:shadow-md transition-all",
                                                event.status === 'Completed' ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" :
                                                    event.status === 'In Progress' ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" :
                                                        "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
                                            )}
                                        >
                                            <div className="font-medium truncate">{event.title}</div>
                                            <div className="text-[10px] opacity-70 mt-1">{format(event.date, 'h:mm a')}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const dayEvents = events.filter(e => isSameDay(e.date, currentDate));

        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b flex items-center justify-center bg-muted/5">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-semibold text-muted-foreground uppercase">{format(currentDate, 'EEEE')}</span>
                        <span className={cn(
                            "text-4xl font-bold mt-1",
                            isToday(currentDate) && "text-primary"
                        )}>
                            {format(currentDate, 'd')}
                        </span>
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                    {dayEvents.length > 0 ? (
                        <div className="space-y-3 max-w-2xl mx-auto">
                            {dayEvents.map(event => (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 rounded-lg border shadow-sm",
                                        event.status === 'Completed' ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800" :
                                            event.status === 'In Progress' ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800" :
                                                "bg-orange-50/50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800"
                                    )}
                                >
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{event.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Due: {format(event.date, 'h:mm a')}</p>
                                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-background">
                                            {event.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                            <p>No events scheduled for this day.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAgendaView = () => {
        // Group events by date
        const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
        const groupedEvents: { [key: string]: typeof events } = {};

        sortedEvents.forEach(event => {
            const dateKey = format(event.date, 'yyyy-MM-dd');
            if (!groupedEvents[dateKey]) groupedEvents[dateKey] = [];
            groupedEvents[dateKey].push(event);
        });

        return (
            <div className="h-full overflow-y-auto p-4 space-y-6">
                {Object.keys(groupedEvents).length > 0 ? (
                    Object.entries(groupedEvents).map(([dateStr, dayEvents]) => {
                        const date = new Date(dateStr);
                        return (
                            <div key={dateStr} className="space-y-3">
                                <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                                    <div className={cn(
                                        "h-10 w-10 rounded-lg flex flex-col items-center justify-center border shadow-sm",
                                        isToday(date) ? "bg-primary text-primary-foreground border-primary" : "bg-card"
                                    )}>
                                        <span className="text-[10px] font-medium uppercase leading-none">{format(date, 'MMM')}</span>
                                        <span className="text-lg font-bold leading-none">{format(date, 'd')}</span>
                                    </div>
                                    <div className="font-semibold text-lg">
                                        {isToday(date) ? 'Today' : format(date, 'EEEE, MMMM do')}
                                    </div>
                                </div>
                                <div className="grid gap-3 pl-4 md:pl-14">
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "flex items-center gap-4 p-3 rounded-md border bg-card hover:shadow-md transition-all",
                                                event.status === 'Completed' && "opacity-60"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-1.5 self-stretch rounded-full",
                                                event.status === 'Completed' ? "bg-green-500" :
                                                    event.status === 'In Progress' ? "bg-blue-500" :
                                                        "bg-orange-500"
                                            )} />
                                            <div className="flex-1 min-w-0">
                                                <h4 className={cn("font-medium truncate", event.status === 'Completed' && "line-through")}>
                                                    {event.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">{format(event.date, 'h:mm a')}</p>
                                            </div>
                                            <div className="text-xs font-medium px-2 py-1 rounded-full bg-muted">
                                                {event.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                        <p>No upcoming events found.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                    <div className="flex items-center rounded-md border bg-background shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r" onClick={() => navigate('prev')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => navigate('next')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <h2 className="text-lg font-semibold ml-2 min-w-[150px]">
                        {format(currentDate, view === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
                    </h2>
                </div>

                <div className="flex items-center bg-muted/50 p-1 rounded-lg">
                    {(['month', 'week', 'day', 'agenda'] as ViewType[]).map((v) => (
                        <Button
                            key={v}
                            variant={view === v ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView(v)}
                            className={cn(
                                "capitalize h-8 px-3",
                                view === v && "shadow-sm"
                            )}
                        >
                            {v}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
                {view === 'agenda' && renderAgendaView()}
            </div>
        </div>
    );
}
