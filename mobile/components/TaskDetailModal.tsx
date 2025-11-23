import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, Calendar, User, Flag, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import type { Task } from '../lib/types';

interface TaskDetailModalProps {
    visible: boolean;
    onClose: () => void;
    task: Task | null;
    onStatusClick: () => void;
}

export default function TaskDetailModal({ visible, onClose, task, onStatusClick }: TaskDetailModalProps) {
    if (!task) return null;

    const deadline = task.deadline ? new Date(task.deadline.seconds * 1000) : null;
    const isOverdue = deadline && deadline < new Date() && task.status !== 'Completed';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white dark:bg-gray-900 w-full rounded-t-3xl h-[85%] shadow-xl">
                    {/* Header */}
                    <View className="flex-row justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                        <View className="flex-1 mr-4">
                            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Task Details</Text>
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white" numberOfLines={2}>{task.title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-6">
                        {/* Status Banner */}
                        <TouchableOpacity
                            onPress={onStatusClick}
                            className={`flex-row items-center justify-between p-4 rounded-xl mb-6 ${task.status === 'Completed' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' :
                                    task.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200' :
                                        'bg-gray-50 dark:bg-gray-800 border border-gray-200'
                                }`}
                        >
                            <View className="flex-row items-center">
                                <View className={`w-2 h-2 rounded-full mr-3 ${task.status === 'Completed' ? 'bg-green-500' :
                                        task.status === 'In Progress' ? 'bg-blue-500' :
                                            'bg-gray-400'
                                    }`} />
                                <Text className="font-semibold text-gray-900 dark:text-white">{task.status}</Text>
                            </View>
                            <Text className="text-xs font-bold text-orange-500">CHANGE</Text>
                        </TouchableOpacity>

                        {/* Description */}
                        <View className="mb-8">
                            <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase">Description</Text>
                            <Text className="text-base text-gray-800 dark:text-gray-200 leading-6">
                                {task.description || 'No description provided.'}
                            </Text>
                        </View>

                        {/* Meta Grid */}
                        <View className="flex-row flex-wrap gap-4 mb-8">
                            <View className="w-[47%] bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                <View className="flex-row items-center mb-2">
                                    <User size={16} color="#9ca3af" />
                                    <Text className="text-xs text-gray-500 ml-2">Assignee</Text>
                                </View>
                                <Text className="font-semibold text-gray-900 dark:text-white">{task.assignee?.name || 'Unassigned'}</Text>
                            </View>

                            <View className="w-[47%] bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                <View className="flex-row items-center mb-2">
                                    <Calendar size={16} color={isOverdue ? "#ef4444" : "#9ca3af"} />
                                    <Text className={`text-xs ml-2 ${isOverdue ? "text-red-500" : "text-gray-500"}`}>Deadline</Text>
                                </View>
                                <Text className={`font-semibold ${isOverdue ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                                    {deadline ? format(deadline, 'MMM dd, yyyy') : 'No deadline'}
                                </Text>
                            </View>

                            <View className="w-[47%] bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                <View className="flex-row items-center mb-2">
                                    <Flag size={16} color="#9ca3af" />
                                    <Text className="text-xs text-gray-500 ml-2">Priority</Text>
                                </View>
                                <Text className="font-semibold text-gray-900 dark:text-white">Normal</Text>
                            </View>

                            <View className="w-[47%] bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                <View className="flex-row items-center mb-2">
                                    <Clock size={16} color="#9ca3af" />
                                    <Text className="text-xs text-gray-500 ml-2">Created</Text>
                                </View>
                                <Text className="font-semibold text-gray-900 dark:text-white">
                                    {task.createdAt ? format(new Date(task.createdAt.seconds * 1000), 'MMM dd') : '-'}
                                </Text>
                            </View>
                        </View>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
