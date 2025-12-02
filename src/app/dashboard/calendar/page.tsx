'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarView } from '@/components/dashboard/calendar/calendar-view';
import { TimelineView } from '@/components/dashboard/calendar/timeline-view';
import { Calendar as CalendarIcon, GanttChart } from 'lucide-react';

export default function CalendarPage() {
    const [activeTab, setActiveTab] = useState('calendar');

    return (
        <div className="h-full flex flex-col p-4 md:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-headline font-bold">Calendar</h1>
                <p className="text-muted-foreground">Manage your schedule and timeline.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="calendar" className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Calendar
                        </TabsTrigger>
                        <TabsTrigger value="timeline" className="flex items-center gap-2">
                            <GanttChart className="h-4 w-4" />
                            Timeline
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 border rounded-lg bg-card shadow-sm overflow-hidden">
                    <TabsContent value="calendar" className="h-full m-0 p-0 border-0">
                        <CalendarView />
                    </TabsContent>
                    <TabsContent value="timeline" className="h-full m-0 p-0 border-0">
                        <TimelineView />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
