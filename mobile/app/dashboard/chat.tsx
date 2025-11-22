import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../firebase/useAuth';
import { useCollection } from '../../firebase/useCollection';
import { collection, query, where } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { MessageSquare, Users, Settings } from 'lucide-react-native';
import { canChatInAllTeams } from '../../lib/permissions';
import type { Team } from '../../lib/types';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import AvatarWithRing from '../../components/AvatarWithRing';

const COMMON_CHAT_ID = 'common';

export default function ChatScreen() {
    const { user: authUser, userProfile, loading: authLoading, db } = useAuth();
    const router = useRouter();

    // Teams query
    const teamsQuery = useMemo(() => {
        if (!db || !userProfile) return null;
        if (canChatInAllTeams(userProfile)) {
            return collection(db, 'teams');
        }
        if (userProfile?.teamId) {
            return query(collection(db, 'teams'), where('__name__', '==', userProfile.teamId));
        }
        return null;
    }, [db, userProfile]);

    const { data: teams, loading: teamsLoading } = useCollection<Team>(teamsQuery);
    const isLoading = authLoading || teamsLoading || !userProfile;

    const chatList = useMemo(() => {
        const list = [
            { id: COMMON_CHAT_ID, name: 'Community', isCommon: true, icon: null, description: 'Community chat with all members' }
        ];

        if (teams) {
            teams.forEach(team => {
                list.push({
                    id: team.id,
                    name: team.name,
                    isCommon: false,
                    icon: team.iconURL,
                    description: team.description || `Chat with ${team.name}`
                });
            });
        }
        return list;
    }, [teams]);

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#25D366" />
            </View>
        );
    }

    const renderChatItem = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                className="flex-row items-center px-4 py-3 bg-white active:bg-gray-50"
                onPress={() => {
                    router.push(`/dashboard/chat/${item.id}`);
                }}
            >
                <View className="mr-3">
                    <AvatarWithRing
                        photoURL={item.icon}
                        displayName={item.name}
                        email=""
                        role={item.isCommon ? 'Core' : 'Volunteer'} // Dummy role for color
                        size="lg"
                    />
                </View>

                <View className="flex-1 border-b border-gray-100 pb-3 justify-center h-full">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                            {item.name}
                        </Text>
                        {/* Placeholder for last message time - would need real data */}
                        <Text className="text-xs text-gray-500 dark:text-gray-400">Yesterday</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-gray-500 dark:text-gray-400 text-sm flex-1 mr-2" numberOfLines={1}>
                            {item.isCommon ? 'Welcome to the community!' : item.description}
                        </Text>
                        {/* Unread badge placeholder */}
                        {/* <View className="bg-green-500 w-5 h-5 rounded-full items-center justify-center">
                            <Text className="text-white text-[10px] font-bold">2</Text>
                        </View> */}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-900">
            <View className="px-4 pt-4 pb-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chats</Text>
            </View>

            <FlatList
                data={chatList}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}
