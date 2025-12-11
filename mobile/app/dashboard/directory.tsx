import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useMemo, useState } from 'react';
import { useAuth } from '../../firebase/useAuth';
import { useCollection } from '../../firebase/useCollection';
import { collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FlashList } from '@shopify/flash-list';
import { Search, Mail, Phone, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';

export default function Directory() {
    const { userProfile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Fetch Teams
    const teamsQuery = useMemo(() => {
        if (!db) return null;
        return collection(db, 'teams');
    }, [db]);
    const { data: teams } = useCollection<any>(teamsQuery);

    // Fetch Users
    const usersQuery = useMemo(() => {
        if (!db) return null;
        return collection(db, 'users');
    }, [db]);
    const { data: users, loading } = useCollection<any>(usersQuery);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        const lowerQuery = searchQuery.toLowerCase();
        return users.filter((user: any) => {
            const name = user.displayName?.toLowerCase() || '';
            const email = user.email?.toLowerCase() || '';
            const role = user.role?.toLowerCase() || '';
            return name.includes(lowerQuery) || email.includes(lowerQuery) || role.includes(lowerQuery);
        });
    }, [users, searchQuery]);

    const getTeamName = (teamId?: string) => {
        if (!teamId || !teams) return 'Unassigned';
        const team = teams.find((t: any) => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        // Ideally show a toast here
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white dark:bg-apple-gray-800 p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 dark:border-gray-700 mx-1">
            <View className="flex-row items-center">
                <Image
                    source={item.photoURL ? { uri: item.photoURL } : require('../../assets/adaptive-icon.png')}
                    style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#e5e7eb' }}
                    contentFit="cover"
                />
                <View className="ml-3 flex-1">
                    <Text className="font-bold text-gray-900 dark:text-white text-lg">{item.displayName || 'Unknown User'}</Text>
                    <View className="flex-row items-center mt-1">
                        <View className="bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded mr-2">
                            <Text className="text-orange-700 dark:text-orange-300 text-xs font-medium capitalize">{item.role || 'Member'}</Text>
                        </View>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs">{getTeamName(item.teamId)}</Text>
                    </View>
                </View>
            </View>

            <View className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex-row justify-around">
                {item.email && (
                    <TouchableOpacity
                        className="flex-row items-center"
                        onPress={() => copyToClipboard(item.email)}
                    >
                        <Mail size={16} color="#6b7280" />
                        <Text className="ml-2 text-gray-600 dark:text-gray-300 text-sm" numberOfLines={1} style={{ maxWidth: 120 }}>{item.email}</Text>
                    </TouchableOpacity>
                )}
                {item.phoneNumber && (
                    <TouchableOpacity
                        className="flex-row items-center"
                        onPress={() => copyToClipboard(item.phoneNumber)}
                    >
                        <Phone size={16} color="#6b7280" />
                        <Text className="ml-2 text-gray-600 dark:text-gray-300 text-sm">{item.phoneNumber}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-apple-gray-50 dark:bg-apple-gray-900">
            <Stack.Screen options={{
                title: 'Directory',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#F9FAFB' }, // match apple-gray-50
            }} />

            <View className="p-4 bg-apple-gray-50 dark:bg-apple-gray-900 border-b border-gray-200 dark:border-gray-800">
                <View className="flex-row items-center bg-white dark:bg-apple-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                    <Search size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-900 dark:text-white h-full text-base"
                        placeholder="Search directory..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#f97316" />
                </View>
            ) : (
                <View className="flex-1 w-full pl-4">
                    {/* @ts-ignore */}
                    <FlashList
                        data={filteredUsers}
                        renderItem={renderItem}
                        estimatedItemSize={120}
                        contentContainerStyle={{ paddingRight: 16, paddingBottom: 40 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-10">
                                <Text className="text-gray-500 dark:text-gray-400">No users found</Text>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    );
}
