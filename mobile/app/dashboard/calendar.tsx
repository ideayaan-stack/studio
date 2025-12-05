import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';
import { Calendar as RNCalendar, Agenda } from 'react-native-calendars';
import { useAuth } from '../../firebase/useAuth';
import { useCollection } from '../../firebase/useCollection';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { format } from 'date-fns';
import { Stack } from 'expo-router';

export default function CalendarScreen() {
    const { userProfile } = useAuth();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Fetch tasks
    const tasksQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        return query(collection(db, 'tasks'), where('assignee.uid', '==', userProfile.uid));
    }, [db, userProfile]);
    const { data: tasks, loading: tasksLoading } = useCollection(tasksQuery);

    // Fetch meetings
    const meetingsQuery = useMemo(() => {
        if (!db) return null;
        return collection(db, 'meetings');
    }, [db]);
    const { data: meetings, loading: meetingsLoading } = useCollection(meetingsQuery);

    const markedDates = useMemo(() => {
        const marks: any = {};

        tasks?.forEach((task: any) => {
            const date = task.deadline?.toDate ? format(task.deadline.toDate(), 'yyyy-MM-dd') : null;
            if (date) {
                marks[date] = { marked: true, dotColor: '#f97316' };
            }
        });

        meetings?.forEach((meeting: any) => {
            const date = meeting.date?.toDate ? format(meeting.date.toDate(), 'yyyy-MM-dd') : null;
            if (date) {
                marks[date] = { marked: true, dotColor: '#8b5cf6' };
            }
        });

        // Highlight selected date
        marks[selectedDate] = {
            ...(marks[selectedDate] || {}),
            selected: true,
            selectedColor: '#f97316'
        };

        return marks;
    }, [tasks, meetings, selectedDate]);

    const selectedDateEvents = useMemo(() => {
        const events: any[] = [];

        tasks?.forEach((task: any) => {
            const date = task.deadline?.toDate ? format(task.deadline.toDate(), 'yyyy-MM-dd') : null;
            if (date === selectedDate) {
                events.push({ ...task, type: 'task' });
            }
        });

        meetings?.forEach((meeting: any) => {
            const date = meeting.date?.toDate ? format(meeting.date.toDate(), 'yyyy-MM-dd') : null;
            if (date === selectedDate) {
                events.push({ ...meeting, type: 'meeting' });
            }
        });

        return events;
    }, [tasks, meetings, selectedDate]);

    const isLoading = tasksLoading || meetingsLoading;

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{ title: 'Calendar', headerShadowVisible: false }} />

            <RNCalendar
                onDayPress={(day: any) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                theme={{
                    todayTextColor: '#f97316',
                    selectedDayBackgroundColor: '#f97316',
                    arrowColor: '#f97316',
                    dotColor: '#f97316',
                    calendarBackground: 'transparent', // Let parent bg show through
                    textSectionTitleColor: '#6b7280',
                    dayTextColor: '#1f2937', // Need to handle dark mode dynamically if possible, or stick to neutral
                    monthTextColor: '#1f2937',
                }}
                style={{
                    borderRadius: 10,
                    margin: 10,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    backgroundColor: 'white' // Or dynamic
                }}
            />

            <View className="flex-1 px-4 pt-4">
                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Events for {format(new Date(selectedDate), 'MMM dd, yyyy')}
                </Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#f97316" />
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {selectedDateEvents.length > 0 ? (
                            selectedDateEvents.map((event, index) => (
                                <View
                                    key={index}
                                    className={`p-4 rounded-xl mb-3 border-l-4 shadow-sm bg-white dark:bg-gray-800 ${event.type === 'task'
                                            ? 'border-l-orange-500'
                                            : 'border-l-purple-500'
                                        }`}
                                >
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Text className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                                            {event.type}
                                        </Text>
                                        {event.type === 'meeting' && (
                                            <Text className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                                {event.time}
                                            </Text>
                                        )}
                                    </View>
                                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                        {event.title}
                                    </Text>
                                    {event.type === 'task' && (
                                        <View className={`self-start px-2 py-0.5 rounded ${event.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30' :
                                                event.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                    'bg-orange-100 dark:bg-orange-900/30'
                                            }`}>
                                            <Text className={`text-xs font-medium ${event.status === 'Completed' ? 'text-green-700 dark:text-green-400' :
                                                    event.status === 'In Progress' ? 'text-blue-700 dark:text-blue-400' :
                                                        'text-orange-700 dark:text-orange-400'
                                                }`}>
                                                {event.status}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            <View className="items-center justify-center py-10">
                                <Text className="text-gray-400 text-center">No events for this day</Text>
                            </View>
                        )}
                        <View className="h-10" />
                    </ScrollView>
                )}
            </View>
        </View>
    );
}
