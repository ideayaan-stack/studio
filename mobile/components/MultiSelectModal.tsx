import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Check, User } from 'lucide-react-native';
import type { UserProfile } from '../lib/types';

interface MultiSelectModalProps {
    visible: boolean;
    onClose: () => void;
    users: UserProfile[];
    selectedUserIds: string[];
    onConfirm: (selectedIds: string[]) => void;
    title?: string;
}

export default function MultiSelectModal({
    visible,
    onClose,
    users,
    selectedUserIds,
    onConfirm,
    title = "Select Users"
}: MultiSelectModalProps) {
    const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            setLocalSelectedIds(selectedUserIds);
        }
    }, [visible, selectedUserIds]);

    const toggleUser = (uid: string) => {
        setLocalSelectedIds(prev => {
            if (prev.includes(uid)) {
                return prev.filter(id => id !== uid);
            } else {
                return [...prev, uid];
            }
        });
    };

    const handleConfirm = () => {
        onConfirm(localSelectedIds);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-[80%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        {users.map(user => {
                            const isSelected = localSelectedIds.includes(user.uid);
                            return (
                                <TouchableOpacity
                                    key={user.uid}
                                    onPress={() => toggleUser(user.uid)}
                                    className={`flex-row items-center justify-between p-4 mb-2 rounded-xl border ${isSelected
                                            ? 'bg-orange-50 border-orange-500 dark:bg-orange-900/20 dark:border-orange-500'
                                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                        }`}
                                >
                                    <View className="flex-row items-center flex-1">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isSelected ? 'bg-orange-200 dark:bg-orange-800' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                            <User size={20} color={isSelected ? '#c2410c' : '#6b7280'} />
                                        </View>
                                        <View>
                                            <Text className={`font-medium ${isSelected ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-white'}`}>
                                                {user.displayName || user.email}
                                            </Text>
                                            <Text className="text-xs text-gray-500 dark:text-gray-400">
                                                {user.role}
                                            </Text>
                                        </View>
                                    </View>
                                    {isSelected && (
                                        <Check size={20} color="#f97316" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <TouchableOpacity
                            className="bg-orange-500 p-4 rounded-xl items-center"
                            onPress={handleConfirm}
                        >
                            <Text className="text-white font-bold text-lg">
                                Confirm Selection ({localSelectedIds.length})
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
