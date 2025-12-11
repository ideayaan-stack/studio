import { View, Text, TouchableOpacity, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import { useAuth } from '../../firebase/useAuth';
import { useCollection } from '../../firebase/useCollection';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';
import { canChatInAllTeams } from '../../lib/permissions';
import type { Team } from '../../lib/types';
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
            <View className="flex-1 items-center justify-center bg-apple-gray-50 dark:bg-apple-gray-900">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    const renderChatItem = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                className="flex-row items-center px-4 py-3 bg-white dark:bg-apple-gray-800 active:bg-gray-50 dark:active:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
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

                <View className="flex-1 justify-center h-full py-1">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">Today</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-gray-500 dark:text-gray-400 text-sm flex-1 mr-2" numberOfLines={1}>
                            {item.isCommon ? 'Welcome to the community!' : item.description}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-apple-gray-50 dark:bg-apple-gray-900">
            <View className="px-5 pt-4 pb-4 bg-apple-gray-50 dark:bg-apple-gray-900 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-3xl font-bold text-gray-900 dark:text-white">Chats</Text>
            </View>

            <View className="flex-1 w-full">
                <FlashList
                    data={chatList}
                    renderItem={renderChatItem}
                    estimatedItemSize={80}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </SafeAreaView>
    );
}
