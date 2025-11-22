import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { useAuth } from '../../firebase/useAuth';
import { useCollection } from '../../firebase/useCollection';
import { collection, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Calendar, Video, PlusCircle, Trash2, ExternalLink } from 'lucide-react-native';
import { canSeeAllTeams, isCore, isSemiCore } from '../../lib/permissions';
import type { Team } from '../../lib/types';
import { format } from 'date-fns';
import CreateMeetingModal from '../../components/CreateMeetingModal';

interface Meeting {
    id: string;
    title: string;
    description?: string;
    meetingLink: string;
    scheduledDate: any; // Timestamp
    teamId?: string;
    createdBy: string;
    createdAt: any;
}

export default function MeetingsScreen() {
    const { userProfile, loading: authLoading, db } = useAuth();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const canCreate = isCore(userProfile) || isSemiCore(userProfile);

    // Meetings query
    const meetingsQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        if (canSeeAllTeams(userProfile)) {
            return query(collection(db, 'meetings'), orderBy('scheduledDate', 'asc'));
        }
        if (userProfile?.teamId) {
            return query(
                collection(db, 'meetings'),
                where('teamId', 'in', [userProfile.teamId, null]),
                orderBy('scheduledDate', 'asc')
            );
        }
        return null;
    }, [db, userProfile]);

    const teamsQuery = useMemo(() => db ? collection(db, 'teams') : null, [db]);

    const { data: meetings, loading: meetingsLoading } = useCollection<Meeting>(meetingsQuery);
    const { data: teams } = useCollection<Team>(teamsQuery);

    const isLoading = authLoading || meetingsLoading || !userProfile;

    const filteredMeetings = useMemo(() => {
        if (!meetings) return [];
        const now = new Date();
        if (activeTab === 'upcoming') {
            return meetings.filter(m => m.scheduledDate.toDate() >= now);
        } else {
            return meetings.filter(m => m.scheduledDate.toDate() < now).reverse();
        }
    }, [meetings, activeTab]);

    const handleJoinMeeting = (link: string) => {
        Linking.openURL(link).catch(err => Alert.alert('Error', 'Could not open link'));
    };

    const handleDeleteMeeting = async (id: string) => {
        if (!db) return;
        Alert.alert(
            'Delete Meeting',
            'Are you sure you want to delete this meeting?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'meetings', id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete meeting');
                        }
                    }
                }
            ]
        );
    };

    const renderMeetingItem = ({ item }: { item: Meeting }) => (
        <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-3 border border-gray-100 dark:border-gray-700">
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white flex-1 mr-2">{item.title}</Text>
                {canCreate && (
                    <TouchableOpacity onPress={() => handleDeleteMeeting(item.id)} className="p-1">
                        <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>

            <View className="flex-row items-center mb-3">
                <Calendar size={14} color="#6b7280" />
                <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {format(item.scheduledDate.toDate(), 'MMM dd, yyyy HH:mm')}
                </Text>
            </View>

            {item.description && (
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3" numberOfLines={2}>{item.description}</Text>
            )}

            <TouchableOpacity
                className="bg-orange-50 dark:bg-orange-900/20 py-2 px-4 rounded-lg flex-row items-center justify-center border border-orange-100 dark:border-orange-900/30"
                onPress={() => handleJoinMeeting(item.meetingLink)}
            >
                <Video size={16} color="#f97316" />
                <Text className="text-orange-600 dark:text-orange-400 font-medium ml-2">Join Meeting</Text>
                <ExternalLink size={14} color="#f97316" className="ml-2" />
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            <View className="px-4 pt-4 pb-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Meetings</Text>

                <View className="flex-row border-b border-gray-200 dark:border-gray-700">
                    <TouchableOpacity
                        className={`px-4 py-2 border-b-2 ${activeTab === 'upcoming' ? 'border-orange-500' : 'border-transparent'}`}
                        onPress={() => setActiveTab('upcoming')}
                    >
                        <Text className={`font-medium ${activeTab === 'upcoming' ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>Upcoming</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`px-4 py-2 border-b-2 ${activeTab === 'past' ? 'border-orange-500' : 'border-transparent'}`}
                        onPress={() => setActiveTab('past')}
                    >
                        <Text className={`font-medium ${activeTab === 'past' ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>Past</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredMeetings}
                renderItem={renderMeetingItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-10">
                        <Calendar size={48} color="#e5e7eb" />
                        <Text className="text-gray-500 dark:text-gray-400 mt-4">No {activeTab} meetings found</Text>
                    </View>
                }
            />

            {canCreate && (
                <TouchableOpacity
                    className="absolute bottom-6 right-6 w-14 h-14 bg-orange-500 rounded-full items-center justify-center shadow-lg"
                    onPress={() => setIsCreateModalOpen(true)}
                >
                    <PlusCircle color="white" size={28} />
                </TouchableOpacity>
            )}

            <CreateMeetingModal
                visible={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teams={teams || []}
            />
        </View>
    );
}
