import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { X, Calendar, Link as LinkIcon, Users } from 'lucide-react-native';
import { useAuth } from '../firebase/useAuth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { canSeeAllTeams } from '../lib/permissions';
import type { Team } from '../lib/types';

interface CreateMeetingModalProps {
    visible: boolean;
    onClose: () => void;
    teams: Team[];
}

export default function CreateMeetingModal({ visible, onClose, teams }: CreateMeetingModalProps) {
    const { userProfile, db } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<string>(
        canSeeAllTeams(userProfile) ? 'all' : (userProfile?.teamId || '')
    );
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!db || !userProfile) return;

        if (!title.trim() || !meetingLink.trim() || !scheduledDate || !scheduledTime) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            // Combine date and time (simple string parsing for prototype)
            // In production, use a proper DatePicker
            const dateTimeString = `${scheduledDate}T${scheduledTime}`;
            const date = new Date(dateTimeString);

            if (isNaN(date.getTime())) {
                throw new Error('Invalid date/time format. Use YYYY-MM-DD and HH:MM');
            }

            await addDoc(collection(db, 'meetings'), {
                title: title.trim(),
                description: description.trim() || null,
                meetingLink: meetingLink.trim(),
                scheduledDate: Timestamp.fromDate(date),
                teamId: selectedTeamId === 'all' ? null : selectedTeamId,
                createdBy: userProfile.uid,
                createdAt: Timestamp.now(),
            });

            Alert.alert('Success', 'Meeting scheduled successfully');
            resetForm();
            onClose();
        } catch (error: any) {
            console.error('Error creating meeting:', error);
            Alert.alert('Error', error.message || 'Failed to create meeting');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setMeetingLink('');
        setScheduledDate('');
        setScheduledTime('');
        setSelectedTeamId('all');
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white dark:bg-gray-800 rounded-t-3xl p-6 h-[85%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">Schedule Meeting</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                                placeholder="Weekly Sync"
                                placeholderTextColor="#9ca3af"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link *</Text>
                            <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 px-3">
                                <LinkIcon size={20} color="#9ca3af" />
                                <TextInput
                                    className="flex-1 p-3 text-gray-900 dark:text-white"
                                    placeholder="https://meet.google.com/..."
                                    placeholderTextColor="#9ca3af"
                                    value={meetingLink}
                                    onChangeText={setMeetingLink}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View className="flex-row mb-4 space-x-4">
                            <View className="flex-1 mr-2">
                                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date (YYYY-MM-DD) *</Text>
                                <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 px-3">
                                    <Calendar size={20} color="#9ca3af" />
                                    <TextInput
                                        className="flex-1 p-3 text-gray-900 dark:text-white"
                                        placeholder="2024-12-31"
                                        placeholderTextColor="#9ca3af"
                                        value={scheduledDate}
                                        onChangeText={setScheduledDate}
                                    />
                                </View>
                            </View>
                            <View className="flex-1 ml-2">
                                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time (HH:MM) *</Text>
                                <TextInput
                                    className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                                    placeholder="14:00"
                                    placeholderTextColor="#9ca3af"
                                    value={scheduledTime}
                                    onChangeText={setScheduledTime}
                                />
                            </View>
                        </View>

                        {canSeeAllTeams(userProfile) ? (
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    <TouchableOpacity
                                        className={`px-4 py-2 rounded-full mr-2 border ${selectedTeamId === 'all' ? 'bg-orange-500 border-orange-500' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
                                        onPress={() => setSelectedTeamId('all')}
                                    >
                                        <Text className={selectedTeamId === 'all' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>All Teams</Text>
                                    </TouchableOpacity>
                                    {teams.map(team => (
                                        <TouchableOpacity
                                            key={team.id}
                                            className={`px-4 py-2 rounded-full mr-2 border ${selectedTeamId === team.id ? 'bg-orange-500 border-orange-500' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
                                            onPress={() => setSelectedTeamId(team.id)}
                                        >
                                            <Text className={selectedTeamId === team.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>{team.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : (
                            // For Heads, show their team name but don't allow changing
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team</Text>
                                <View className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                                    <Text className="text-gray-500 dark:text-gray-400">
                                        {teams.find(t => t.id === userProfile?.teamId)?.name || 'Your Team'}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white h-24"
                                placeholder="Meeting agenda..."
                                placeholderTextColor="#9ca3af"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            className={`bg-orange-500 p-4 rounded-xl items-center mb-6 ${loading ? 'opacity-70' : ''}`}
                            onPress={handleCreate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Schedule Meeting</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
