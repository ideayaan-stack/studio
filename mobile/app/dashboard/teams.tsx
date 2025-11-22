import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useAuth } from '../../firebase/useAuth';
import { useCollection } from '../../firebase/useCollection';
import { collection, query, where } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Users, Search, MoreHorizontal, PlusCircle, UserPlus, Edit2 } from 'lucide-react-native';
import { canSeeAllTeams, isHead, canCreateTeams, canCreateUsers, canManageTeams, canManagePermissions } from '../../lib/permissions';
import type { Team, UserProfile } from '../../lib/types';
import { format } from 'date-fns';
import CreateTeamModal from '../../components/CreateTeamModal';
import AddUserModal from '../../components/AddUserModal';
import EditTeamModal from '../../components/EditTeamModal';
import EditUserModal from '../../components/EditUserModal';
import AvatarWithRing from '../../components/AvatarWithRing';

export default function TeamsScreen() {
    const { user: authUser, userProfile, loading: authLoading, db } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'teams' | 'users'>('teams');

    // Create Modal State
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    // Edit Modal State
    const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    const userIsHead = isHead(userProfile);

    // Teams query
    const teamsQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        if (canSeeAllTeams(userProfile)) return collection(db, 'teams');
        if (userIsHead && userProfile?.teamId) return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
        return null;
    }, [db, userProfile, userIsHead]);

    // Users query
    const usersQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        if (canSeeAllTeams(userProfile)) return collection(db, 'users');
        if (userIsHead && userProfile?.teamId) return query(collection(db, 'users'), where('teamId', '==', userProfile.teamId));
        return null;
    }, [db, userProfile, userIsHead]);

    const { data: teams, loading: teamsLoading, refresh: refreshTeams } = useCollection<Team>(teamsQuery);
    const { data: users, loading: usersLoading, refresh: refreshUsers } = useCollection<UserProfile>(usersQuery);

    const isLoading = authLoading || teamsLoading || usersLoading || !userProfile;
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        refreshTeams();
        refreshUsers();
        setTimeout(() => setRefreshing(false), 1000);
    };

    const filteredTeams = useMemo(() => {
        if (!teams) return [];
        return teams.filter(team =>
            !searchQuery ||
            team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            team.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [teams, searchQuery]);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user =>
            !searchQuery ||
            user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setIsEditTeamModalOpen(true);
    };

    const handleEditUser = (user: UserProfile) => {
        setEditingUser(user);
        setIsEditUserModalOpen(true);
    };

    const renderTeamItem = ({ item }: { item: Team }) => {
        const memberCount = users?.filter(u => u.teamId === item.id).length || 0;
        const headUser = users?.find(u => u.uid === item.head);

        return (
            <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-3 border border-gray-100 dark:border-gray-700">
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-lg font-semibold text-gray-900 dark:text-white flex-1 mr-2">{item.name}</Text>
                    {canManageTeams(userProfile) && (
                        <TouchableOpacity onPress={() => handleEditTeam(item)} className="p-1">
                            <Edit2 size={18} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3" numberOfLines={2}>{item.description}</Text>

                <View className="flex-row items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700">
                    <View className="flex-row items-center">
                        <Users size={14} color="#6b7280" />
                        <Text className="text-xs text-gray-500 ml-1">{memberCount} members</Text>
                    </View>
                    {headUser && (
                        <Text className="text-xs text-gray-500">Head: {headUser.displayName}</Text>
                    )}
                </View>
            </View>
        );
    };

    const renderUserItem = ({ item }: { item: UserProfile }) => {
        const team = teams?.find(t => t.id === item.teamId);

        return (
            <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-3 border border-gray-100 dark:border-gray-700 flex-row items-center">
                <AvatarWithRing
                    photoURL={item.photoURL}
                    displayName={item.displayName}
                    email={item.email}
                    role={item.role}
                    size="md"
                    className="mr-3"
                />
                <View className="flex-1">
                    <Text className="font-semibold text-gray-900 dark:text-white">{item.displayName}</Text>
                    <Text className="text-xs text-gray-500">{item.email}</Text>
                    <View className="flex-row mt-1">
                        <View className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded mr-2">
                            <Text className="text-xs text-gray-600 dark:text-gray-300">{item.role}</Text>
                        </View>
                        {team && (
                            <View className="bg-blue-50 px-2 py-0.5 rounded">
                                <Text className="text-xs text-blue-600">{team.name}</Text>
                            </View>
                        )}
                    </View>
                </View>
                {canManagePermissions(userProfile) && (
                    <TouchableOpacity onPress={() => handleEditUser(item)} className="p-1">
                        <Edit2 size={18} color="#9ca3af" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            <View className="px-4 pt-4 pb-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Teams & Users</Text>

                {/* Search */}
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mb-4">
                    <Search size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-base text-gray-900 dark:text-white"
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Tabs */}
                <View className="flex-row border-b border-gray-200 dark:border-gray-700">
                    <TouchableOpacity
                        className={`px-4 py-2 border-b-2 ${activeTab === 'teams' ? 'border-orange-500' : 'border-transparent'}`}
                        onPress={() => setActiveTab('teams')}
                    >
                        <Text className={`font-medium ${activeTab === 'teams' ? 'text-orange-500' : 'text-gray-500'}`}>Teams</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`px-4 py-2 border-b-2 ${activeTab === 'users' ? 'border-orange-500' : 'border-transparent'}`}
                        onPress={() => setActiveTab('users')}
                    >
                        <Text className={`font-medium ${activeTab === 'users' ? 'text-orange-500' : 'text-gray-500'}`}>Users</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={activeTab === 'teams' ? filteredTeams : filteredUsers}
                renderItem={activeTab === 'teams' ? renderTeamItem : renderUserItem as any}
                keyExtractor={(item: any) => item.id || item.uid}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text className="text-center text-gray-500 mt-10">No results found</Text>
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
            {activeTab === 'teams' && canCreateTeams(userProfile) && (
                <TouchableOpacity
                    className="absolute bottom-24 right-6 w-14 h-14 bg-orange-500 rounded-full items-center justify-center shadow-lg"
                    onPress={() => setIsCreateTeamModalOpen(true)}
                >
                    <PlusCircle color="white" size={28} />
                </TouchableOpacity>
            )}

            {activeTab === 'users' && canCreateUsers(userProfile) && (
                <TouchableOpacity
                    className="absolute bottom-24 right-6 w-14 h-14 bg-orange-500 rounded-full items-center justify-center shadow-lg"
                    onPress={() => setIsAddUserModalOpen(true)}
                >
                    <UserPlus color="white" size={28} />
                </TouchableOpacity>
            )}

            {/* Create Modals */}
            <CreateTeamModal
                visible={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
                users={users || []}
            />
            <AddUserModal
                visible={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                teams={teams || []}
            />

            {/* Edit Modals */}
            <EditTeamModal
                visible={isEditTeamModalOpen}
                onClose={() => {
                    setIsEditTeamModalOpen(false);
                    setEditingTeam(null);
                }}
                team={editingTeam}
                users={users || []}
            />
            <EditUserModal
                visible={isEditUserModalOpen}
                onClose={() => {
                    setIsEditUserModalOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser}
                teams={teams || []}
            />
        </View>
    );
}
