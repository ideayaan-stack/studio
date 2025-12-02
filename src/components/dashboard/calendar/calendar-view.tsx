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
import type { Task, Meeting, Team } from '@/lib/types';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewType>('month');
    const { db, userProfile } = useAuth();

    // Fetch Teams to map names
    const teamsQuery = useMemo(() => {
        if (!db) return null;
        return collection(db, 'teams');
    }, [db]);
    const { data: teams } = useCollection<Team>(teamsQuery);

    const getTeamName = (teamId?: string) => {
        if (!teamId || !teams) return '';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : '';
    };

    // Fetch tasks (Private to assignee)
    const tasksQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        // User sees only their assigned tasks
        return query(collection(db, 'tasks'), where('assignee.uid', '==', userProfile.uid));
    }, [db, userProfile]);

    const { data: tasks } = useCollection<Task>(tasksQuery);

    // Fetch meetings (Public/All)
    const meetingsQuery = useMemo(() => {
        if (!db) return null;
        return collection(db, 'meetings');
    }, [db]);

    const { data: meetings } = useCollection<Meeting>(meetingsQuery);

    // Combine and filter events
    const events = useMemo(() => {
        const allEvents: any[] = [];

        if (tasks) {
            tasks.forEach(task => {
                allEvents.push({
                    id: task.id,
                    title: task.title,
                    date: task.deadline?.toDate() || new Date(),
                    type: 'task',
                    status: task.status,
                    teamId: task.teamId
                });
            });
        }

        if (meetings) {
            meetings.forEach(meeting => {
                allEvents.push({
                    id: meeting.id,
                    title: meeting.title,
                    date: meeting.date?.toDate() || new Date(),
                    type: 'meeting',
                    status: 'Scheduled',
                    teamId: meeting.teamId,
                    time: meeting.time
                });
            });
        }

        return allEvents;
    }, [tasks, meetings]);

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

    const renderEvent = (event: any, isCompact = false) => {
        const teamName = getTeamName(event.teamId);
        return (
            <div
                key={event.id}
                className={cn(
                    "text-xs rounded border shadow-sm cursor-pointer hover:opacity-80 transition-all",
                    isCompact ? "px-1 py-0.5 truncate" : "p-2",
                    event.type === 'task' ? (
                        event.status === 'Completed' ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 line-through" :
                            event.status === 'In Progress' ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" :
                                "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
                    ) : (
                        "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                    )
                )}
                title={`${event.title} ${teamName ? `(${teamName})` : ''}`}
            >
                <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-medium">{event.title}</span>
                    {event.type === 'meeting' && <span className="text-[10px] opacity-80">{event.time}</span>}
                </div>
                {!isCompact && teamName && (
                    <div className="text-[10px] opacity-70 mt-0.5 truncate">{teamName}</div>
                )}
            </div>
        );
    };

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
                <div className="grid grid-cols-7 border-b bg-muted/5">
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
                                            "min-h-[80px] p-1 border-r last:border-r-0 flex flex-col gap-1 transition-colors hover:bg-muted/5",
                                            !isSameMonth(day, monthStart) && "bg-muted/10 text-muted-foreground",
                                            isToday(day) && "bg-primary/5"
                                        )}
                                    >
                                        <div className="flex items-center justify-between px-1">
                                            <span className={cn(
                                                "text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full",
                                                isToday(day) && "bg-primary text-primary-foreground"
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[100px] no-scrollbar">
                                            {dayEvents.map(event => renderEvent(event, true))}
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
                <div className="grid grid-cols-7 border-b bg-muted/5">
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
                                    {dayEvents.map(event => renderEvent(event))}
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
                                        event.type === 'task' ? (
                                            event.status === 'Completed' ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800" :
                                                event.status === 'In Progress' ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800" :
                                                    "bg-orange-50/50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800"
                                        ) : (
                                            "bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800"
                                        )
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-lg">{event.title}</h3>
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-background border">
                                                {getTeamName(event.teamId)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span>{format(event.date, 'h:mm a')}</span>
                                            {event.type === 'meeting' && <span>• Meeting</span>}
                                        </div>
                                        {event.type === 'task' && (
                                            <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-background">
                                                {event.status}
                                            </div>
                                        )}
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
                                                event.type === 'meeting' ? "bg-purple-500" :
                                                    event.status === 'Completed' ? "bg-green-500" :
                                                        event.status === 'In Progress' ? "bg-blue-500" :
                                                            "bg-orange-500"
                                            )} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={cn("font-medium truncate", event.status === 'Completed' && "line-through")}>
                                                        {event.title}
                                                    </h4>
                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        {getTeamName(event.teamId)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(event.date, 'h:mm a')}
                                                    {event.type === 'meeting' && " • Meeting"}
                                                </p>
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

            <div className="flex-1 overflow-y-auto min-h-0">
                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
                {view === 'agenda' && renderAgendaView()}
            </div>
        </div>
    );
}
