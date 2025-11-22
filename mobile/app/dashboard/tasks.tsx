import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useAuth } from '../../firebase/useAuth';
import { useCollection } from '../../firebase/useCollection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { CheckSquare, Clock, Search, PlusCircle, Filter, Edit2 } from 'lucide-react-native';
import { canSeeAllTasks, isVolunteer, canCreateTasks, canAssignTasks } from '../../lib/permissions';
import type { Task, Team, UserProfile } from '../../lib/types';
import { format } from 'date-fns';
import CreateTaskModal from '../../components/CreateTaskModal';
import EditTaskModal from '../../components/EditTaskModal';

export default function TasksScreen() {
    const { user: authUser, userProfile, loading: authLoading, db } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeStatus, setActiveStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');

    // Create Modal State
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

    // Edit Modal State
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const userIsVolunteer = isVolunteer(userProfile);

    // Tasks query
    const tasksQuery = useMemo(() => {
        if (!db || !userProfile) return null;

        // Core/Semi-core admins see all tasks
        if (canSeeAllTasks(userProfile)) {
            return collection(db, 'tasks');
        }
        // Team members see tasks associated with their team
        if (userProfile?.teamId) {
            return query(collection(db, 'tasks'), where('teamId', '==', userProfile.teamId));
        }
        // Volunteers see only tasks directly assigned to them
        if (userIsVolunteer && userProfile?.uid) {
            return query(collection(db, 'tasks'), where('assignee.uid', '==', userProfile.uid));
        }
        return null;
    }, [db, userProfile, userIsVolunteer]);

    // Fetch teams and users for the modal
    const teamsQuery = useMemo(() => db ? collection(db, 'teams') : null, [db]);
    const usersQuery = useMemo(() => db ? collection(db, 'users') : null, [db]);

    const { data: tasks, loading: tasksLoading, refresh: refreshTasks } = useCollection<Task>(tasksQuery);
    const { data: teams } = useCollection<Team>(teamsQuery);
    const { data: users } = useCollection<UserProfile>(usersQuery);

    const isLoading = authLoading || tasksLoading || !userProfile;
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        refreshTasks();
        setTimeout(() => setRefreshing(false), 1000);
    };

    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        return tasks.filter(task => {
            const matchesSearch = !searchQuery ||
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = task.status === activeStatus;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => a.deadline.seconds - b.deadline.seconds);
    }, [tasks, searchQuery, activeStatus]);

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsEditTaskModalOpen(true);
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    const renderTaskItem = ({ item }: { item: Task }) => {
        const deadline = item.deadline ? new Date(item.deadline.seconds * 1000) : new Date();
        const isOverdue = deadline < new Date() && item.status !== 'Completed';

        return (
            <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-3 border border-gray-100 dark:border-gray-700">
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-lg font-semibold text-gray-900 dark:text-white flex-1 mr-2">{item.title}</Text>
                    <View className="flex-row items-center">
                        <View className="px-2 py-1 rounded bg-blue-100 mr-2">
                            <Text className="text-xs font-medium text-blue-700">Normal</Text>
                        </View>
                        {canAssignTasks(userProfile) && (
                            <TouchableOpacity onPress={() => handleEditTask(item)} className="p-1">
                                <Edit2 size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3" numberOfLines={2}>{item.description}</Text>

                <View className="flex-row items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700">
                    <View className="flex-row items-center">
                        <Clock size={14} color={isOverdue ? "#ef4444" : "#6b7280"} />
                        <Text className={`text-xs ml-1 ${isOverdue ? "text-red-500 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                            {format(deadline, 'MMM dd, yyyy')}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mr-1">
                            <Text className="text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                {item.assignee?.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{item.assignee?.name || 'Unassigned'}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            <View className="px-4 pt-4 pb-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</Text>
                    <TouchableOpacity>
                        <Filter size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mb-4">
                    <Search size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-base text-gray-900 dark:text-white"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Status Tabs */}
                <View className="flex-row border-b border-gray-200 dark:border-gray-700 justify-between">
                    {(['Pending', 'In Progress', 'Completed'] as const).map((status) => (
                        <TouchableOpacity
                            key={status}
                            className={`px-2 py-2 border-b-2 ${activeStatus === status ? 'border-orange-500' : 'border-transparent'}`}
                            onPress={() => setActiveStatus(status)}
                        >
                            <Text className={`font-medium text-sm ${activeStatus === status ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <FlatList
                data={filteredTasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-10">
                        <CheckSquare size={48} color="#e5e7eb" />
                        <Text className="text-gray-500 mt-4">No {activeStatus.toLowerCase()} tasks found</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#f97316']}
                    />
                }
            />

            {/* FAB for Create */}
            {
                canCreateTasks(userProfile) && (
                    <TouchableOpacity
                        className="absolute bottom-24 right-6 w-14 h-14 bg-orange-500 rounded-full items-center justify-center shadow-lg"
                        onPress={() => setIsCreateTaskModalOpen(true)}
                    >
                        <PlusCircle color="white" size={28} />
                    </TouchableOpacity>
                )
            }

            <CreateTaskModal
                visible={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                teams={teams || []}
                users={users || []}
            />

            <EditTaskModal
                visible={isEditTaskModalOpen}
                onClose={() => {
                    setIsEditTaskModalOpen(false);
                    setEditingTask(null);
                }}
                task={editingTask}
                teams={teams || []}
                users={users || []}
            />
        </View >
    );
}
