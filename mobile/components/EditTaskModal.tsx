import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { X, Edit2 } from 'lucide-react-native';
import { useAuth } from '../firebase/useAuth';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Task, Team, UserProfile } from '../lib/types';

interface EditTaskModalProps {
    visible: boolean;
    onClose: () => void;
    task: Task | null;
    teams: Team[];
    users: UserProfile[];
}

export default function EditTaskModal({ visible, onClose, task, teams, users }: EditTaskModalProps) {
    const { db } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
    const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
    const [deadline, setDeadline] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (task && visible) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setSelectedTeamId(task.teamId || '');
            setSelectedAssigneeId(task.assignee?.uid || '');
            setStatus(task.status || 'Pending');
            setDeadline(task.deadline ? new Date(task.deadline.seconds * 1000) : new Date());
            setError('');
        }
    }, [task, visible]);

    const teamUsers = selectedTeamId ? users.filter(u => u.teamId === selectedTeamId) : [];

    const handleSubmit = async () => {
        if (!task || !db) return;
        if (!title.trim() || !description.trim() || !selectedTeamId) {
            setError('Title, description, and team are required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let assigneeData = {
                uid: '',
                name: 'Unassigned',
                avatarUrl: null,
                avatarHint: '',
            };

            if (selectedAssigneeId) {
                const assignee = users.find(u => u.uid === selectedAssigneeId);
                if (assignee) {
                    assigneeData = {
                        uid: assignee.uid,
                        name: assignee.displayName || 'Unknown',
                        avatarUrl: assignee.photoURL || null,
                        avatarHint: assignee.displayName || '',
                    };
                }
            }

            const taskDocRef = doc(db, 'tasks', task.id);
            await updateDoc(taskDocRef, {
                title: title.trim(),
                description: description.trim(),
                status,
                teamId: selectedTeamId,
                assignee: assigneeData,
                deadline: Timestamp.fromDate(deadline),
                updatedAt: Timestamp.now(),
            });

            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update task');
        } finally {
            setIsLoading(false);
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
                <View className="bg-white rounded-t-3xl p-6 h-[90%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            <Edit2 size={24} color="#f97316" />
                            <Text className="text-xl font-bold ml-2 text-gray-900">Edit Task</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Title *</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-base text-gray-900"
                                placeholder="e.g., Design event poster"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Description *</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-base text-gray-900 min-h-[100px]"
                                placeholder="Describe the task..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Team *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {teams.map(team => (
                                    <TouchableOpacity
                                        key={team.id}
                                        onPress={() => {
                                            setSelectedTeamId(team.id);
                                            setSelectedAssigneeId('');
                                        }}
                                        className={`mr-3 px-4 py-2 rounded-full border ${selectedTeamId === team.id ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={selectedTeamId === team.id ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                                            {team.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Assign To (Optional)</Text>
                            {selectedTeamId ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    <TouchableOpacity
                                        onPress={() => setSelectedAssigneeId('')}
                                        className={`mr-3 px-4 py-2 rounded-full border ${!selectedAssigneeId ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={!selectedAssigneeId ? 'text-orange-600 font-medium' : 'text-gray-600'}>Unassigned</Text>
                                    </TouchableOpacity>
                                    {teamUsers.map(user => (
                                        <TouchableOpacity
                                            key={user.uid}
                                            onPress={() => setSelectedAssigneeId(user.uid)}
                                            className={`mr-3 px-4 py-2 rounded-full border ${selectedAssigneeId === user.uid ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}
                                        >
                                            <Text className={selectedAssigneeId === user.uid ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                                                {user.displayName || user.email}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <Text className="text-gray-500 italic">Select a team first</Text>
                            )}
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {['Pending', 'In Progress', 'Completed'].map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        onPress={() => setStatus(s as any)}
                                        className={`mr-3 px-4 py-2 rounded-full border ${status === s ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={status === s ? 'text-orange-600 font-medium' : 'text-gray-600'}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Note: Date picker implementation is simplified here. In a real app, use a library like @react-native-community/datetimepicker */}
                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Deadline (Simplified)</Text>
                            <Text className="text-gray-500 text-xs mb-2">Current: {deadline.toDateString()}</Text>
                            <View className="flex-row">
                                <TouchableOpacity
                                    className="bg-gray-100 px-3 py-2 rounded-lg mr-2"
                                    onPress={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() + 7);
                                        setDeadline(d);
                                    }}
                                >
                                    <Text>1 Week</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="bg-gray-100 px-3 py-2 rounded-lg"
                                    onPress={() => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() + 1);
                                        setDeadline(d);
                                    }}
                                >
                                    <Text>1 Month</Text>
                                </TouchableOpacity>
                            </View>
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
                                <Text className="text-white font-bold text-lg">Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
