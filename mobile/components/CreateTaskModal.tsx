import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { X, Calendar, User, Flag, Plus } from 'lucide-react-native';
import { useAuth } from '../firebase/useAuth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import type { Team, UserProfile } from '../lib/types';
import { sendTaskAssignmentEmail } from '../lib/email';

interface CreateTaskModalProps {
    visible: boolean;
    onClose: () => void;
    teams: Team[];
    users: UserProfile[];
}

export default function CreateTaskModal({ visible, onClose, teams, users }: CreateTaskModalProps) {
    const { db, userProfile } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
    const [deadline, setDeadline] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!db || !userProfile) return;
        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (!selectedTeamId) {
            setError('Team is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const assignee = users.find(u => u.uid === selectedAssigneeId);

            const newTask = {
                title: title.trim(),
                description: description.trim(),
                status: 'Pending',
                priority: 'Normal',
                teamId: selectedTeamId,
                assignee: assignee ? {
                    uid: assignee.uid,
                    name: assignee.displayName || assignee.email || 'Unknown',
                    avatarUrl: assignee.photoURL || null,
                } : null,
                deadline: Timestamp.fromDate(deadline),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                createdBy: userProfile.uid,
            };

            await addDoc(collection(db, 'tasks'), newTask);

            // Send Email Notification
            if (assignee && assignee.email) {
                await sendTaskAssignmentEmail(
                    assignee.email,
                    assignee.displayName || 'User',
                    newTask.title,
                    format(deadline, 'MMM dd, yyyy')
                );
            }

            // Reset form
            setTitle('');
            setDescription('');
            setSelectedTeamId('');
            setSelectedAssigneeId('');
            setDeadline(new Date());
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create task');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = selectedTeamId
        ? users.filter(u => u.teamId === selectedTeamId)
        : users;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-[90%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">Create New Task</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title *</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base text-gray-900 dark:text-white"
                                placeholder="e.g., Update Homepage Design"
                                placeholderTextColor="#9ca3af"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base text-gray-900 dark:text-white min-h-[100px]"
                                placeholder="Add details about the task..."
                                placeholderTextColor="#9ca3af"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign Team *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {teams.map(team => (
                                    <TouchableOpacity
                                        key={team.id}
                                        onPress={() => {
                                            setSelectedTeamId(team.id);
                                            setSelectedAssigneeId(''); // Reset assignee when team changes
                                        }}
                                        className={`mr-3 px-4 py-2 rounded-full border ${selectedTeamId === team.id ? 'bg-orange-50 border-orange-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                                    >
                                        <Text className={selectedTeamId === team.id ? 'text-orange-600 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                                            {team.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assignee</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {filteredUsers.map(user => (
                                    <TouchableOpacity
                                        key={user.uid}
                                        onPress={() => setSelectedAssigneeId(user.uid)}
                                        className={`mr-3 px-4 py-2 rounded-full border flex-row items-center ${selectedAssigneeId === user.uid ? 'bg-orange-50 border-orange-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                                    >
                                        <User size={14} color={selectedAssigneeId === user.uid ? '#ea580c' : '#6b7280'} />
                                        <Text className={`ml-2 ${selectedAssigneeId === user.uid ? 'text-orange-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {user.displayName || user.email?.split('@')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <Text className="text-gray-400 italic ml-2">Select a team to see members</Text>
                                )}
                            </ScrollView>
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="flex-row items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3"
                            >
                                <Calendar size={20} color="#6b7280" />
                                <Text className="ml-2 text-gray-900 dark:text-white">
                                    {format(deadline, 'MMM dd, yyyy')}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={deadline}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) setDeadline(selectedDate);
                                    }}
                                />
                            )}
                        </View>

                        {error ? (
                            <Text className="text-red-500 text-sm mb-4">{error}</Text>
                        ) : null}

                        <TouchableOpacity
                            className={`bg-orange-500 p-4 rounded-xl items-center ${isLoading ? 'opacity-70' : ''}`}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Create Task</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
