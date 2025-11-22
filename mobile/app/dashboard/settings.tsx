import { View, Text, TouchableOpacity, Switch, ScrollView, Image, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../firebase/useAuth';
import { useTheme } from '../../lib/theme';
import { LogOut, Moon, Sun, User, Bell, ChevronRight, Shield } from 'lucide-react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useRouter } from 'expo-router';
import AvatarWithRing from '../../components/AvatarWithRing';

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function SettingsScreen() {
    const { user, userProfile } = useAuth();
    const { theme, setTheme, isDark } = useTheme();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.replace('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const toggleNotifications = async () => {
        if (!notificationsEnabled) {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === 'granted') {
                setNotificationsEnabled(true);
                await schedulePushNotification();
                Alert.alert('Notifications Enabled', 'You will now receive periodic updates.');
            } else {
                Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
            }
        } else {
            setNotificationsEnabled(false);
            await Notifications.cancelAllScheduledNotificationsAsync();
            Alert.alert('Notifications Disabled', 'Periodic updates have been cancelled.');
        }
    };

    async function schedulePushNotification() {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Stay Updated! 🚀",
                body: "Check out the latest tasks and team updates.",
            },
            trigger: {
                seconds: 60 * 60, // Every hour (approx) - repeated triggers need specific config, using simple delay for demo
                repeats: true
            } as any, // Type assertion for demo simplicity
        });
    }

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            <View className="px-4 pt-4 pb-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Settings</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Profile Section */}
                <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700 items-center">
                    <AvatarWithRing
                        photoURL={userProfile?.photoURL}
                        displayName={userProfile?.displayName}
                        email={user?.email}
                        role={userProfile?.role}
                        size="xl"
                        className="mb-3"
                    />
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">{userProfile?.displayName || 'User'}</Text>
                    <Text className="text-gray-500 dark:text-gray-400">{user?.email}</Text>
                    <View className="mt-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        <Text className="text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">{userProfile?.role || 'Volunteer'}</Text>
                    </View>
                </View>

                {/* Appearance */}
                <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider ml-1">Appearance</Text>
                <View className="bg-white dark:bg-gray-800 rounded-xl mb-6 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <View className="flex-row items-center justify-between p-4">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mr-3">
                                {isDark ? <Moon size={18} color="#3b82f6" /> : <Sun size={18} color="#3b82f6" />}
                            </View>
                            <Text className="text-base font-medium text-gray-900 dark:text-white">Dark Mode</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#e5e7eb', true: '#f97316' }}
                            thumbColor={isDark ? '#fff' : '#fff'}
                        />
                    </View>
                </View>

                {/* Account Settings */}
                <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider ml-1">Account</Text>
                <View className="bg-white dark:bg-gray-800 rounded-xl mb-6 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
                                <User size={18} color="#6b7280" />
                            </View>
                            <Text className="text-base font-medium text-gray-900 dark:text-white">Edit Profile</Text>
                        </View>
                        <ChevronRight size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <View className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
                                <Bell size={18} color="#6b7280" />
                            </View>
                            <Text className="text-base font-medium text-gray-900 dark:text-white">Notifications</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: '#e5e7eb', true: '#f97316' }}
                            thumbColor={'#fff'}
                        />
                    </View>

                    <TouchableOpacity className="flex-row items-center justify-between p-4">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
                                <Shield size={18} color="#6b7280" />
                            </View>
                            <Text className="text-base font-medium text-gray-900 dark:text-white">Privacy & Security</Text>
                        </View>
                        <ChevronRight size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                {/* Sign Out */}
                <TouchableOpacity
                    className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex-row items-center justify-center mb-8 border border-red-100 dark:border-red-900/30"
                    onPress={handleSignOut}
                >
                    <LogOut size={20} color="#ef4444" />
                    <Text className="text-red-600 dark:text-red-400 font-bold text-lg ml-2">Sign Out</Text>
                </TouchableOpacity>

                <Text className="text-center text-gray-400 text-xs mb-8">Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
}
