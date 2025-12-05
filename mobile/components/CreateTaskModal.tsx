import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Alert } from 'react-native';
import { X, Calendar, User, Flag, Plus, Users, Check } from 'lucide-react-native';
import { useAuth } from '../firebase/useAuth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import type { Team, UserProfile } from '../lib/types';
import { sendTaskAssignmentEmail } from '../lib/email';
import MultiSelectModal from './MultiSelectModal';

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
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [deadline, setDeadline] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showMultiSelect, setShowMultiSelect] = useState(false);

    const filteredUsers = selectedTeamId
        ? users.filter(u => u.teamId === selectedTeamId)
        : users;

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
            // If no assignee selected, create one unassigned task
            const assignees = selectedAssigneeIds.length > 0 ? selectedAssigneeIds : [null];

            const promises = assignees.map(async (assigneeId) => {
                const assignee = assigneeId ? users.find(u => u.uid === assigneeId) : null;

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
            });

            await Promise.all(promises);

            // Reset form
            setTitle('');
            setDescription('');
            setSelectedTeamId('');
            setSelectedAssigneeIds([]);
            setDeadline(new Date());
            onClose();

            if (assignees.length > 1) {
                Alert.alert("Success", `${assignees.length} tasks created successfully.`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create task');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssigneeSelect = (id: string) => {
        if (id === 'all') {
            const allIds = filteredUsers.map(u => u.uid);
            setSelectedAssigneeIds(allIds);
        } else if (id === 'custom') {
            setShowMultiSelect(true);
        } else {
            // Single select behavior for the horizontal list, but stored as array
            setSelectedAssigneeIds([id]);
        }
    };

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
                                            setSelectedAssigneeIds([]); // Reset assignee when team changes
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
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assignee ({selectedAssigneeIds.length})</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {selectedTeamId && (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => handleAssigneeSelect('all')}
                                            className="mr-3 px-4 py-2 rounded-full border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-row items-center"
                                        >
                                            <Users size={14} color="#6b7280" />
                                            <Text className="ml-2 text-gray-600 dark:text-gray-400">All Members</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleAssigneeSelect('custom')}
                                            className="mr-3 px-4 py-2 rounded-full border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-row items-center"
                                        >
                                            <Plus size={14} color="#6b7280" />
                                            <Text className="ml-2 text-gray-600 dark:text-gray-400">Custom</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {filteredUsers.map(user => {
                                    const isSelected = selectedAssigneeIds.includes(user.uid) && selectedAssigneeIds.length === 1;
                                    return (
                                        <TouchableOpacity
                                            key={user.uid}
                                            onPress={() => handleAssigneeSelect(user.uid)}
                                            className={`mr-3 px-4 py-2 rounded-full border flex-row items-center ${isSelected ? 'bg-orange-50 border-orange-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                                        >
                                            <User size={14} color={isSelected ? '#ea580c' : '#6b7280'} />
                                            <Text className={`ml-2 ${isSelected ? 'text-orange-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {user.displayName || user.email?.split('@')[0]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
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

            <MultiSelectModal
                visible={showMultiSelect}
                onClose={() => setShowMultiSelect(false)}
                users={filteredUsers}
                selectedUserIds={selectedAssigneeIds}
                onConfirm={setSelectedAssigneeIds}
            />
        </Modal>
    );
}
