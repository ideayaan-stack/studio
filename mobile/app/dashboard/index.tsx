import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../firebase/useAuth';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '../../firebase/useCollection';
import { db, auth } from '../../firebase/config';
import { useMemo, useState, useCallback } from 'react';
import { Users, CheckSquare, Folder, Activity, Settings, Video, FileText } from 'lucide-react-native';
import { canSeeAllTeams, canSeeAllTasks, canSeeAllFiles } from '../../lib/permissions';
import { format } from 'date-fns';
import { Link } from 'expo-router';
import type { Team, Task, FileItem } from '../../lib/types';

export default function Dashboard() {
    const { user: authUser, userProfile, loading: isLoading } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    // Teams query
    const teamsQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        if (canSeeAllTeams(userProfile)) {
            return collection(db, 'teams');
        }
        if (userProfile?.teamId) {
            return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
        }
        return null;
    }, [db, userProfile]);

    // Tasks query
    const tasksQuery = useMemo(() => {
        if (!db || !userProfile) return null;
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

    // Files query
    const filesQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        if (canSeeAllFiles(userProfile)) {
            return collection(db, 'files');
        }
        if (userProfile?.teamId) {
            return query(collection(db, 'files'), where('teamId', '==', userProfile.teamId));
        }
        return null;
    }, [db, userProfile]);

    const { data: teams, loading: teamsLoading, refresh: refreshTeams } = useCollection<Team>(teamsQuery);
    const { data: tasks, loading: tasksLoading, refresh: refreshTasks } = useCollection<Task>(tasksQuery);
    const { data: files, loading: filesLoading, refresh: refreshFiles } = useCollection<FileItem>(filesQuery);

    const isPageLoading = isLoading || teamsLoading || tasksLoading || filesLoading;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Trigger re-fetch in useCollection if supported, or just wait a bit to simulate
        // Since useCollection is real-time (onSnapshot), "refresh" usually means ensuring connection
        // For now, we'll simulate a delay to show the spinner, as data updates are pushed automatically
        // Ideally, useCollection should expose a 'refresh' method if it was using getDocs

        // If we want to force a re-fetch, we might need to toggle the query or invalidate cache
        // But with onSnapshot, it's always "fresh". 
        // The user might be seeing "stuck" if the socket is disconnected.

        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    const summaryData = useMemo(() => {
        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'Completed').length || 0;
        const pendingTasks = tasks?.filter(t => t.status === 'Pending').length || 0;
        const inProgressTasks = tasks?.filter(t => t.status === 'In Progress').length || 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const latestFile = files?.sort((a, b) =>
            b.uploadDate.seconds - a.uploadDate.seconds
        )[0];
        const lastUploadText = latestFile
            ? `Last: ${format(new Date(latestFile.uploadDate.seconds * 1000), 'MMM dd')}`
            : 'No uploads';

        return [
            {
                icon: Users,
                title: 'Teams',
                value: String(teams?.length || 0),
                description: canSeeAllTeams(userProfile) ? 'Total teams' : 'Your team',
                color: 'text-blue-500',
                bgColor: 'bg-blue-100'
            },
            {
                icon: CheckSquare,
                title: 'Completed',
                value: `${completedTasks}/${totalTasks}`,
                description: `${completionRate}% rate`,
                color: 'text-green-500',
                bgColor: 'bg-green-100'
            },
            {
                icon: Folder,
                title: 'Files',
                value: String(files?.length || 0),
                description: lastUploadText,
                color: 'text-purple-500',
                bgColor: 'bg-purple-100'
            },
            {
                icon: Activity,
                title: 'Pending',
                value: String(pendingTasks),
                description: `${inProgressTasks} active`,
                color: 'text-orange-500',
                bgColor: 'bg-orange-100'
            },
        ];
    }, [teams, tasks, files, userProfile]);

    if (isPageLoading && !refreshing) {
        // If auth is done but no profile, show error
        if (!isLoading && !userProfile) {
            return (
                <View className="flex-1 items-center justify-center bg-gray-50 p-4">
                    <Text className="text-lg font-bold text-red-500 mb-2">User Profile Not Found</Text>
                    <Text className="text-gray-600 text-center mb-4">
                        Could not find a user profile for UID: {authUser?.uid}
                    </Text>
                    <TouchableOpacity
                        className="bg-orange-500 px-4 py-2 rounded-lg"
                        onPress={() => auth.signOut()}
                    >
                        <Text className="text-white font-medium">Sign Out</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-gray-50 px-4 pt-4"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />
            }
        >
            <View className="mb-6 flex-row justify-between items-center">
                <View>
                    <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
                    <Text className="text-gray-500">Welcome back, {userProfile?.displayName || 'User'}</Text>
                </View>
                <Link href="/dashboard/settings" asChild>
                    <TouchableOpacity className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                        <Settings size={24} color="#666" />
                    </TouchableOpacity>
                </Link>
            </View>

            <View className="flex-row flex-wrap justify-between mb-6">
                {summaryData.map((item, index) => (
                    <View key={index} className="w-[48%] bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4 border border-gray-100 dark:border-gray-700">
                        <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${item.bgColor}`}>
                            {/* @ts-ignore */}
                            <item.icon size={20} color="currentColor" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</Text>
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">{item.title}</Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</Text>
                    </View>
                ))}

                {/* Feature Navigation Grid */}
                <View className="w-full flex-row flex-wrap justify-between mb-2">
                    <Link href="/dashboard/directory" asChild>
                        <TouchableOpacity className="w-[48%] bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl shadow-sm mb-4 border border-indigo-100 dark:border-indigo-900/30">
                            <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 items-center justify-center mb-2">
                                <Users size={20} color="#6366f1" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">Directory</Text>
                            <Text className="text-xs text-gray-500 dark:text-gray-400">Find team members</Text>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/dashboard/calendar" asChild>
                        <TouchableOpacity className="w-[48%] bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl shadow-sm mb-4 border border-pink-100 dark:border-pink-900/30">
                            <View className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900 items-center justify-center mb-2">
                                <Activity size={20} color="#ec4899" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">Calendar</Text>
                            <Text className="text-xs text-gray-500 dark:text-gray-400">View schedule</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* Feature Navigation Grid Row 2 */}
                <View className="w-full flex-row flex-wrap justify-between mb-2">
                    <Link href="/dashboard/files" asChild>
                        <TouchableOpacity className="w-[48%] bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl shadow-sm mb-4 border border-blue-100 dark:border-blue-900/30">
                            <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mb-2">
                                <FileText size={20} color="#3b82f6" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">Files</Text>
                            <Text className="text-xs text-gray-500 dark:text-gray-400">Manage documents</Text>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/dashboard/tasks" asChild>
                        <TouchableOpacity className="w-[48%] bg-green-50 dark:bg-green-900/20 p-4 rounded-xl shadow-sm mb-4 border border-green-100 dark:border-green-900/30">
                            <View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center mb-2">
                                <CheckSquare size={20} color="#22c55e" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">Tasks</Text>
                            <Text className="text-xs text-gray-500 dark:text-gray-400">Track progress</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* Meetings Entry Point */}
                <Link href="/dashboard/meetings" asChild>
                    <TouchableOpacity className="w-full bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl shadow-sm mb-4 border border-orange-100 dark:border-orange-900/30 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 items-center justify-center mr-3">
                                <Video size={20} color="#f97316" />
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-gray-900 dark:text-white">Meetings</Text>
                                <Text className="text-xs text-gray-500 dark:text-gray-400">Schedule and join team calls</Text>
                            </View>
                        </View>
                        <Settings size={20} color="#f97316" className="rotate-90" />
                    </TouchableOpacity>
                </Link>
            </View>

            {/* Recent Tasks */}
            <View className="mb-6">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-gray-900">Recent Tasks</Text>
                    <Link href="/dashboard/tasks" asChild>
                        <TouchableOpacity>
                            <Text className="text-orange-500 font-medium">View All</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {tasks?.slice(0, 5).map(task => (
                    <View key={task.id} className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-100">
                        <View className="flex-row justify-between items-start">
                            <View className="flex-1 mr-4">
                                <Text className="font-semibold text-gray-900 mb-1" numberOfLines={1}>{task.title}</Text>
                                <Text className="text-xs text-gray-500">
                                    Due: {format(task.deadline.toDate(), 'MMM dd, yyyy')}
                                </Text>
                            </View>
                            <View className={`px-2 py-1 rounded text-xs ${task.status === 'Completed' ? 'bg-green-100' :
                                task.status === 'In Progress' ? 'bg-blue-100' : 'bg-orange-100'
                                }`}>
                                <Text className={`text-xs font-medium ${task.status === 'Completed' ? 'text-green-700' :
                                    task.status === 'In Progress' ? 'text-blue-700' : 'text-orange-700'
                                    }`}>
                                    {task.status}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
                {(!tasks || tasks.length === 0) && (
                    <Text className="text-gray-500 text-center py-4">No tasks found</Text>
                )}
            </View>

            <View className="h-20" />
        </ScrollView>
    );
}
