import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useAuth } from '../../firebase/useAuth';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '../../firebase/useCollection';
import { db, auth } from '../../firebase/config';
import { useMemo, useState, useCallback } from 'react';
import { Users, CheckSquare, Folder, Calendar, Settings, Video, Download, ChevronRight, Bell } from 'lucide-react-native';
import { canSeeAllTeams, canSeeAllTasks, canSeeAllFiles, canExportData } from '../../lib/permissions';
import { exportDataToExcel } from '../../lib/export';
import { format } from 'date-fns';
import { Link, useRouter } from 'expo-router'; // Added useRouter
import type { Team, Task, FileItem } from '../../lib/types';
import { useTheme } from '../../lib/theme';
import clsx from 'clsx'; // Useful if you have it, otherwise standard string concat

export default function Dashboard() {
    const { user: authUser, userProfile, loading: isLoading } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const { isDark } = useTheme();
    const router = useRouter(); // Use router for navigation

    // Teams query
    const teamsQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        if (canSeeAllTeams(userProfile)) {
            return collection(db, 'teams');
        }
        if (userProfile?.teamId) {
            return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
        }
        return null; // Don't fetch if no permissions/team
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

    const { data: teams, loading: teamsLoading } = useCollection<Team>(teamsQuery);
    const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
    const { data: files, loading: filesLoading } = useCollection<FileItem>(filesQuery);

    const isPageLoading = isLoading || (teamsLoading && !teams) || (tasksLoading && !tasks) || (filesLoading && !files);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // In a real query hook like useCollection, you might force re-fetch, but onSnapshot does it live.
        // We'll simulate a UI refresh delay.
        setTimeout(() => {
            setRefreshing(false);
        }, 800);
    }, []);

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            await exportDataToExcel();
            Alert.alert("Success", "Data exported successfully.");
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", "Failed to export data: " + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const summaryData = useMemo(() => {
        const totalTasks = tasks?.length || 0;
        const pendingTasks = tasks?.filter(t => t.status === 'Pending').length || 0;
        const inProgressTasks = tasks?.filter(t => t.status === 'In Progress').length || 0;

        const latestFile = files?.sort((a, b) => b.uploadDate.seconds - a.uploadDate.seconds)[0];
        const lastUploadText = latestFile
            ? `Last: ${format(new Date(latestFile.uploadDate.seconds * 1000), 'MMM dd')}`
            : 'No uploads';

        return [
            {
                icon: Users,
                title: 'Teams',
                value: String(teams?.length || 0),
                description: canSeeAllTeams(userProfile) ? 'Total teams' : 'Your team',
                color: '#3b82f6', // blue-500
                bgLight: 'bg-blue-50',
                bgDark: 'dark:bg-blue-900/20',
                borderDark: 'dark:border-blue-900/30'
            },
            {
                icon: CheckSquare,
                title: 'Pending',
                value: String(pendingTasks),
                description: 'Tasks needing attention',
                color: '#f97316', // orange-500
                bgLight: 'bg-orange-50',
                bgDark: 'dark:bg-orange-900/20',
                borderDark: 'dark:border-orange-900/30'
            },
            {
                icon: CheckSquare,
                title: 'In Progress',
                value: String(inProgressTasks),
                description: 'Active tasks',
                color: '#a855f7', // purple-500
                bgLight: 'bg-purple-50',
                bgDark: 'dark:bg-purple-900/20',
                borderDark: 'dark:border-purple-900/30'
            },
            {
                icon: Folder,
                title: 'Files',
                value: String(files?.length || 0),
                description: lastUploadText,
                color: '#22c55e', // green-500
                bgLight: 'bg-green-50',
                bgDark: 'dark:bg-green-900/20',
                borderDark: 'dark:border-green-900/30'
            }
        ];
    }, [teams, tasks, files, userProfile]);

    if (isLoading && !userProfile) {
        return (
            <View className="flex-1 items-center justify-center bg-apple-gray-50 dark:bg-apple-gray-900">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    if (!isLoading && !userProfile) {
        return (
            <View className="flex-1 items-center justify-center bg-apple-gray-50 dark:bg-apple-gray-900 p-6">
                <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
                    Could not load user profile. Please try signing out and back in.
                </Text>
                <TouchableOpacity
                    className="bg-apple-orange-500 px-6 py-3 rounded-full"
                    onPress={() => auth.signOut()}
                >
                    <Text className="text-white font-semibold">Sign Out</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-apple-gray-50 dark:bg-apple-gray-900">
            {/* Header */}
            <View className="px-5 pt-2 pb-4 flex-row justify-between items-center bg-apple-gray-50 dark:bg-apple-gray-900">
                <View>
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">Workspace</Text>
                    <Text className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/dashboard/settings')}
                    className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700"
                >
                    <Settings size={20} color={isDark ? '#fff' : '#333'} />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={['#f97316']} />
                }
            >
                {/* Stats Grid */}
                <View className="flex-row flex-wrap justify-between mb-6">
                    {summaryData.map((item, index) => (
                        <View
                            key={index}
                            className={`w-[48%] bg-white dark:bg-apple-gray-800 p-4 rounded-2xl shadow-sm mb-4 border border-gray-100 dark:border-gray-700`}
                        >
                            <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${item.bgLight} ${item.bgDark}`}>
                                <item.icon size={20} color={item.color} />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</Text>
                            <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase">{item.title}</Text>
                        </View>
                    ))}
                </View>

                {/* Quick Actions (Apple Style List) */}
                <View className="mb-8">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3 px-1">Quick Actions</Text>
                    <View className="bg-white dark:bg-apple-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                        {/* Directory */}
                        <TouchableOpacity onPress={() => router.push('/dashboard/directory')} className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700">
                            <View className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-4">
                                <Users size={18} color="#6366f1" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-gray-900 dark:text-white">Directory</Text>
                            </View>
                            <ChevronRight size={20} color={isDark ? '#666' : '#ccc'} />
                        </TouchableOpacity>

                        {/* Calendar */}
                        <TouchableOpacity onPress={() => router.push('/dashboard/calendar')} className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700">
                            <View className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 items-center justify-center mr-4">
                                <Calendar size={18} color="#ec4899" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-gray-900 dark:text-white">Calendar</Text>
                            </View>
                            <ChevronRight size={20} color={isDark ? '#666' : '#ccc'} />
                        </TouchableOpacity>

                        {/* Files */}
                        <TouchableOpacity onPress={() => router.push('/dashboard/files')} className="flex-row items-center p-4 active:bg-gray-50 dark:active:bg-gray-700">
                            <View className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-4">
                                <Folder size={18} color="#3b82f6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-gray-900 dark:text-white">Files</Text>
                            </View>
                            <ChevronRight size={20} color={isDark ? '#666' : '#ccc'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Modules Row */}
                <View className="flex-row gap-3 mb-8">
                    <TouchableOpacity
                        onPress={() => router.push('/dashboard/tasks')}
                        className="flex-1 bg-white dark:bg-apple-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-8">
                            <CheckSquare size={22} color="#22c55e" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">Tasks</Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">Track Work</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/dashboard/meetings')}
                        className="flex-1 bg-white dark:bg-apple-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mb-8">
                            <Video size={22} color="#f97316" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">Meetings</Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">Team Calls</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Tasks */}
                <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-3 px-1">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">Recent Tasks</Text>
                        <Link href="/dashboard/tasks" asChild>
                            <TouchableOpacity>
                                <Text className="text-apple-orange-500 font-semibold">See All</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {tasks?.slice(0, 3).map(task => (
                        <View key={task.id} className="bg-white dark:bg-apple-gray-800 p-4 rounded-2xl mb-3 shadow-sm border border-gray-100 dark:border-gray-700">
                            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-1" numberOfLines={1}>{task.title}</Text>
                            <View className="flex-row justify-between items-center">
                                <Text className="text-xs text-gray-500 dark:text-gray-400">
                                    Due {format(task.deadline.toDate(), 'MMM dd')}
                                </Text>
                                <View className={`px-2 py-1 rounded-md ${task.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30' :
                                    task.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                        'bg-orange-100 dark:bg-orange-900/30'
                                    }`}>
                                    <Text className={`text-xs font-bold ${task.status === 'Completed' ? 'text-green-700 dark:text-green-400' :
                                        task.status === 'In Progress' ? 'text-blue-700 dark:text-blue-400' :
                                            'text-orange-700 dark:text-orange-400'
                                        }`}>
                                        {task.status}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                    {(!tasks || tasks.length === 0) && (
                        <Text className="text-gray-400 text-center py-4 italic">No recent tasks</Text>
                    )}
                </View>

                {/* Export (Core Only) */}
                {canExportData(userProfile) && (
                    <TouchableOpacity
                        className="flex-row items-center justify-center p-4 rounded-xl bg-gray-200 dark:bg-gray-800 mb-6"
                        onPress={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? <ActivityIndicator size="small" color="#666" /> : <Download size={20} color={isDark ? '#ccc' : '#666'} className="mr-2" />}
                        <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2">Export Data (Excel)</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}
