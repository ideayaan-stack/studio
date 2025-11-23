import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Task } from '../lib/types';

interface ChangeTaskStatusModalProps {
    visible: boolean;
    onClose: () => void;
    task: Task | null;
}

export default function ChangeTaskStatusModal({ visible, onClose, task }: ChangeTaskStatusModalProps) {
    const [loading, setLoading] = useState(false);

    if (!task) return null;

    const handleStatusChange = async (newStatus: Task['status']) => {
        if (!db || !task.id) return;
        setLoading(true);
        try {
            const taskRef = doc(db, 'tasks', task.id);
            await updateDoc(taskRef, {
                status: newStatus,
                updatedAt: Timestamp.now(),
            });
            onClose();
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatusOption = ({ status, icon: Icon, color, bg }: { status: Task['status'], icon: any, color: string, bg: string }) => (
        <TouchableOpacity
            className={`flex-row items-center p-4 rounded-xl mb-3 border ${task.status === status ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
            onPress={() => handleStatusChange(status)}
            disabled={loading}
        >
            <View className={`w-10 h-10 rounded-full ${bg} items-center justify-center mr-4`}>
                <Icon size={20} color={color} />
            </View>
            <View className="flex-1">
                <Text className={`text-lg font-semibold ${task.status === status ? 'text-orange-700 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                    {status}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {status === 'Pending' ? 'Task is waiting to be started' :
                        status === 'In Progress' ? 'Task is currently being worked on' :
                            'Task has been completed'}
                </Text>
            </View>
            {task.status === status && <CheckCircle size={20} color="#f97316" />}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center p-4">
                <View className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-xl">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">Update Status</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <StatusOption
                        status="Pending"
                        icon={AlertCircle}
                        color="#ef4444"
                        bg="bg-red-100 dark:bg-red-900/30"
                    />
                    <StatusOption
                        status="In Progress"
                        icon={Clock}
                        color="#3b82f6"
                        bg="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <StatusOption
                        status="Completed"
                        icon={CheckCircle}
                        color="#22c55e"
                        bg="bg-green-100 dark:bg-green-900/30"
                    />

                    {loading && (
                        <View className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 items-center justify-center rounded-2xl">
                            <ActivityIndicator size="large" color="#f97316" />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
