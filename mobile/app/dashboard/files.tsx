import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, Linking, RefreshControl } from 'react-native';
import { useAuth } from '../../firebase/useAuth';
import { useCollection } from '../../firebase/useCollection';
import { collection, query, where } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { FileText, Search, Filter, Download, PlusCircle } from 'lucide-react-native';
import { canSeeAllFiles, canSeeAllTeams } from '../../lib/permissions';
import type { FileItem, Team } from '../../lib/types';
import { format } from 'date-fns';
import { FlashList } from '@shopify/flash-list';

export default function FilesScreen() {
    const { user: authUser, userProfile, loading: authLoading, db } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');

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

    const { data: teams } = useCollection<Team>(teamsQuery);

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

    const { data: files, loading: filesLoading, refresh: refreshFiles } = useCollection<FileItem>(filesQuery);
    const isLoading = authLoading || filesLoading || !userProfile;
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        refreshFiles();
        setTimeout(() => setRefreshing(false), 1000);
    };

    const filteredFiles = useMemo(() => {
        if (!files) return [];
        return files.filter(file => {
            const matchesSearch = !searchQuery ||
                file.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTeam = selectedTeamFilter === 'all' || file.teamId === selectedTeamFilter;
            return matchesSearch && matchesTeam;
        }).sort((a, b) => b.uploadDate.seconds - a.uploadDate.seconds);
    }, [files, searchQuery, selectedTeamFilter]);

    const handleDownload = (url: string) => {
        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    const renderFileItem = ({ item }: { item: FileItem }) => {
        return (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-100 flex-row items-center mx-4">
                <View className="w-10 h-10 rounded-lg bg-blue-50 items-center justify-center mr-3">
                    <FileText size={20} color="#3b82f6" />
                </View>
                <View className="flex-1 mr-2">
                    <Text className="font-semibold text-gray-900 mb-1" numberOfLines={1}>{item.name}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-xs text-gray-500 mr-2">
                            {format(new Date(item.uploadDate.seconds * 1000), 'MMM dd, yyyy')}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    className="p-2"
                    onPress={() => handleDownload(item.url)}
                >
                    <Download size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-900">Files</Text>
                    <TouchableOpacity>
                        <Filter size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
                    <Search size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-base text-gray-900"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View className="flex-1 w-full">
                <FlashList
                    data={filteredFiles}
                    renderItem={renderFileItem}
                    estimatedItemSize={80}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-10">
                            <FileText size={48} color="#e5e7eb" />
                            <Text className="text-gray-500 mt-4">No files found</Text>
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
            </View>

            {/* FAB for Upload (Placeholder) */}
            <TouchableOpacity
                className="absolute bottom-24 right-6 w-14 h-14 bg-orange-500 rounded-full items-center justify-center shadow-lg"
                onPress={() => {/* TODO: Open upload dialog */ }}
            >
                <PlusCircle color="white" size={28} />
            </TouchableOpacity>
        </View>
    );
}
