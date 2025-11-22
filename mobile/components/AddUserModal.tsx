import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { X, UserPlus } from 'lucide-react-native';
import { useAuth } from '../firebase/useAuth';
import type { Team, Role } from '../lib/types';

interface AddUserModalProps {
    visible: boolean;
    onClose: () => void;
    teams: Team[];
}

const roles: Role[] = ['Core', 'Semi-core', 'Head', 'Volunteer'];

export default function AddUserModal({ visible, onClose, teams }: AddUserModalProps) {
    const { createUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<Role>('Volunteer');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!email || !password || !displayName) {
            setError('All fields are required');
            return;
        }

        if ((role === 'Head' || role === 'Volunteer') && !selectedTeamId) {
            setError('Team is required for Head and Volunteer roles');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await createUser(email, password, displayName, role, selectedTeamId);
            if (result?.error) {
                throw new Error(result.error);
            }

            onClose();
            setEmail('');
            setPassword('');
            setDisplayName('');
            setRole('Volunteer');
            setSelectedTeamId('');
        } catch (err: any) {
            setError(err.message || 'Failed to create user');
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
                <View className="bg-white rounded-t-3xl p-6 h-[85%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            <UserPlus size={24} color="#f97316" />
                            <Text className="text-xl font-bold ml-2 text-gray-900">Add New User</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Display Name *</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-base text-gray-900"
                                placeholder="e.g., John Doe"
                                value={displayName}
                                onChangeText={setDisplayName}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Email *</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-base text-gray-900"
                                placeholder="e.g., john@example.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Password *</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-base text-gray-900"
                                placeholder="Min 6 characters"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Role *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {roles.map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        onPress={() => setRole(r)}
                                        className={`mr-3 px-4 py-2 rounded-full border ${role === r ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={role === r ? 'text-orange-600 font-medium' : 'text-gray-600'}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Team {role === 'Head' || role === 'Volunteer' ? '*' : '(Optional)'}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                <TouchableOpacity
                                    onPress={() => setSelectedTeamId('')}
                                    className={`mr-3 px-4 py-2 rounded-full border ${!selectedTeamId ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={!selectedTeamId ? 'text-orange-600 font-medium' : 'text-gray-600'}>No Team</Text>
                                </TouchableOpacity>
                                {teams.map(team => (
                                    <TouchableOpacity
                                        key={team.id}
                                        onPress={() => setSelectedTeamId(team.id)}
                                        className={`mr-3 px-4 py-2 rounded-full border ${selectedTeamId === team.id ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={selectedTeamId === team.id ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                                            {team.name}
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
                                <Text className="text-white font-bold text-lg">Create User</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
