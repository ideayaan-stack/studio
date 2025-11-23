import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { X, User, Camera } from 'lucide-react-native';
import { useAuth } from '../firebase/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import type { UserProfile } from '../lib/types';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
}

export default function EditProfileModal({ visible, onClose, userProfile }: EditProfileModalProps) {
    const { user, db } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (userProfile && visible) {
            setDisplayName(userProfile.displayName || '');
            setPhotoURL(userProfile.photoURL || '');
            setError('');
        }
    }, [userProfile, visible]);

    const handleSubmit = async () => {
        if (!user || !db || !userProfile) return;
        if (!displayName.trim()) {
            setError('Display Name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // 1. Update Auth Profile
            await updateProfile(user, {
                displayName: displayName.trim(),
                photoURL: photoURL.trim() || null,
            });

            // 2. Update Firestore User Document
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: displayName.trim(),
                photoURL: photoURL.trim() || null,
            });

            onClose();
        } catch (err: any) {
            console.error("Error updating profile:", err);
            setError(err.message || 'Failed to update profile');
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
                <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-[70%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View className="items-center mb-8">
                        <View className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 items-center justify-center overflow-hidden mb-3 border-2 border-orange-500">
                            {photoURL ? (
                                <Image source={{ uri: photoURL }} className="w-full h-full" />
                            ) : (
                                <User size={40} color="#9ca3af" />
                            )}
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">Profile Photo</Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base text-gray-900 dark:text-white"
                            placeholder="Your Name"
                            placeholderTextColor="#9ca3af"
                            value={displayName}
                            onChangeText={setDisplayName}
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo URL (Optional)</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base text-gray-900 dark:text-white"
                            placeholder="https://example.com/avatar.jpg"
                            placeholderTextColor="#9ca3af"
                            value={photoURL}
                            onChangeText={setPhotoURL}
                            autoCapitalize="none"
                        />
                        <Text className="text-xs text-gray-400 mt-1">Paste a direct link to an image.</Text>
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
                            <Text className="text-white font-bold text-lg">Save Profile</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
