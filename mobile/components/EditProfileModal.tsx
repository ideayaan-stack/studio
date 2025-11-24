import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { X, User, Camera } from 'lucide-react-native';
import { useAuth } from '../firebase/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import type { UserProfile } from '../lib/types';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
}

export default function EditProfileModal({ visible, onClose, userProfile }: EditProfileModalProps) {
    const { user, db } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (userProfile && visible) {
            setDisplayName(userProfile.displayName || '');
            setImageUri(userProfile.photoURL || null);
            setError('');
        }
    }, [userProfile, visible]);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
            }
        } catch (e) {
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const uploadImage = async (uri: string): Promise<string> => {
        if (!user) throw new Error("No user");

        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const filename = `avatars/${user.uid}_${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (e) {
            console.error("Upload failed", e);
            throw new Error("Failed to upload image");
        }
    };

    const handleSubmit = async () => {
        if (!user || !db || !userProfile) return;
        if (!displayName.trim()) {
            setError('Display Name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let photoURL = userProfile.photoURL;

            // Upload new image if changed and it's a local URI (starts with file:// or content://)
            if (imageUri && imageUri !== userProfile.photoURL && (imageUri.startsWith('file://') || imageUri.startsWith('content://'))) {
                photoURL = await uploadImage(imageUri);
            } else if (!imageUri) {
                photoURL = null; // Removed image
            }

            // 1. Update Auth Profile
            await updateProfile(user, {
                displayName: displayName.trim(),
                photoURL: photoURL,
            });

            // 2. Update Firestore User Document
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: displayName.trim(),
                photoURL: photoURL,
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
                <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-[60%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View className="items-center mb-8">
                        <TouchableOpacity onPress={pickImage} className="relative">
                            <View className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 items-center justify-center overflow-hidden border-2 border-orange-500">
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} className="w-full h-full" />
                                ) : (
                                    <User size={40} color="#9ca3af" />
                                )}
                            </View>
                            <View className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full border-2 border-white dark:border-gray-900">
                                <Camera size={16} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">Tap to change photo</Text>
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base text-gray-900 dark:text-white"
                            placeholder="Your Name"
                            placeholderTextColor="#9ca3af"
                            value={displayName}
                            onChangeText={setDisplayName}
                        />
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
