import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { X, PlusCircle } from 'lucide-react-native';
import { useAuth } from '../firebase/useAuth';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '../lib/types';

interface CreateTeamModalProps {
    visible: boolean;
    onClose: () => void;
    users: UserProfile[];
}

export default function CreateTeamModal({ visible, onClose, users }: CreateTeamModalProps) {
    const { db } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedHead, setSelectedHead] = useState<string>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Team name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            if (!db) throw new Error('Database not initialized');

            await addDoc(collection(db, 'teams'), {
                name: name.trim(),
                description: description.trim(),
                head: selectedHead === 'none' ? '' : selectedHead,
                members: selectedHead === 'none' ? [] : [selectedHead],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });

            onClose();
            setName('');
            setDescription('');
            setSelectedHead('none');
        } catch (err: any) {
            setError(err.message || 'Failed to create team');
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
                <View className="bg-white rounded-t-3xl p-6 h-[80%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            <PlusCircle size={24} color="#f97316" />
                            <Text className="text-xl font-bold ml-2 text-gray-900">Create New Team</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Team Name *</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-base text-gray-900"
                                placeholder="e.g., Media Committee"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-base text-gray-900 min-h-[100px]"
                                placeholder="What is the purpose of this team?"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Team Head (Optional)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                <TouchableOpacity
                                    onPress={() => setSelectedHead('none')}
                                    className={`mr-3 px-4 py-2 rounded-full border ${selectedHead === 'none' ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={selectedHead === 'none' ? 'text-orange-600 font-medium' : 'text-gray-600'}>No Head</Text>
                                </TouchableOpacity>
                                {users.map(user => (
                                    <TouchableOpacity
                                        key={user.uid}
                                        onPress={() => setSelectedHead(user.uid)}
                                        className={`mr-3 px-4 py-2 rounded-full border ${selectedHead === user.uid ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={selectedHead === user.uid ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                                            {user.displayName || user.email}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
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
                                <Text className="text-white font-bold text-lg">Create Team</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
