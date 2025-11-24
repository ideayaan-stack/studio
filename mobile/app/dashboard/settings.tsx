import { View, Text, TouchableOpacity, Switch, ScrollView, Alert, Platform } from 'react-native';
import { useAuth } from '../../firebase/useAuth';
import { useRouter } from 'expo-router';
import { User, Bell, Moon, LogOut, ChevronRight, Download } from 'lucide-react-native';
import AvatarWithRing from '../../components/AvatarWithRing';
import { useState, useEffect } from 'react';
import { registerForPushNotificationsAsync, schedulePeriodicReminders } from '../../lib/notifications';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../lib/theme';
import { auth } from '../../firebase/config';
import { exportDataToCSV } from '../../lib/export';
import { isCore, isSemiCore } from '../../lib/permissions';
import EditProfileModal from '../../components/EditProfileModal';

export default function SettingsScreen() {
    const { user, userProfile, loading } = useAuth();
    const { theme, setTheme, isDark } = useTheme();
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

    useEffect(() => {
        checkNotificationStatus();
    }, []);

    const checkNotificationStatus = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
    };

    const toggleNotifications = async (value: boolean) => {
        if (value) {
            const permission = await registerForPushNotificationsAsync();
            if (permission === undefined) {
                setNotificationsEnabled(false);
                Alert.alert("Permission Required", "Please enable notifications in your device settings.");
                return;
            }
            setNotificationsEnabled(true);
            if (userProfile) {
                await schedulePeriodicReminders(userProfile);
                Alert.alert("Notifications Enabled", "You will now receive role-based reminders.");
            }
        } else {
            setNotificationsEnabled(false);
            await Notifications.cancelAllScheduledNotificationsAsync();
            Alert.alert("Notifications Disabled", "Periodic reminders have been cancelled.");
        }
    };

    const handleExportData = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            await exportDataToCSV();
            Alert.alert("Success", "Data exported successfully!");
        } catch (error) {
            Alert.alert("Error", "Failed to export data.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            router.replace('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
                <Text className="text-gray-900 dark:text-white">Loading...</Text>
            </View>
        );
    }

    const canExport = isCore(userProfile) || isSemiCore(userProfile);

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <View className="bg-white dark:bg-gray-800 px-6 pt-12 pb-6 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</Text>

                <View className="flex-row items-center">
                    <AvatarWithRing
                        photoURL={userProfile?.photoURL}
                        displayName={userProfile?.displayName}
                        email={userProfile?.email}
                        role={userProfile?.role}
                        size="lg"
                        className="mr-4"
                    />
                    <View>
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">{userProfile?.displayName || 'User'}</Text>
                        <Text className="text-gray-500 dark:text-gray-400">{userProfile?.email}</Text>
                        <View className="bg-orange-100 dark:bg-orange-900/30 self-start px-2 py-0.5 rounded mt-1">
                            <Text className="text-xs text-orange-600 dark:text-orange-400 font-medium">{userProfile?.role || 'Volunteer'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Settings Sections */}
            <View className="p-4 space-y-4">

                {/* Preferences */}
                <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                    <Text className="px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">Preferences</Text>

                    <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mr-3">
                                <Bell size={18} color="#3b82f6" />
                            </View>
                            <Text className="text-base font-medium text-gray-900 dark:text-white">Push Notifications</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: '#d1d5db', true: '#f97316' }}
                            thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
                        />
                    </View>

                    <View className="flex-row items-center justify-between px-4 py-4">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 items-center justify-center mr-3">
                                <Moon size={18} color="#a855f7" />
                            </View>
                            <Text className="text-base font-medium text-gray-900 dark:text-white">Dark Mode</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#d1d5db', true: '#f97316' }}
                            thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
                        />
                    </View>
                </View>

                {/* Data Management (Core/Semi-Core Only) */}
                {canExport && (
                    <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                        <Text className="px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">Data Management</Text>
                        <TouchableOpacity
                            className="flex-row items-center justify-between px-4 py-4"
                            onPress={handleExportData}
                            disabled={isExporting}
                        >
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center mr-3">
                                    <Download size={18} color="#22c55e" />
                                </View>
                                <Text className="text-base font-medium text-gray-900 dark:text-white">
                                    {isExporting ? 'Exporting...' : 'Export Data (CSV)'}
                                </Text>
                            </View>
                            <ChevronRight size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Account */}
                <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm mb-6">
                    <Text className="px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">Account</Text>

                    <TouchableOpacity
                        className="flex-row items-center justify-between px-4 py-4"
                        onPress={() => setIsEditProfileModalOpen(true)}
                    >
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center mr-3">
                                <User size={18} color="#22c55e" />
                            </View>
                            <Text className="text-base font-medium text-gray-900 dark:text-white">Edit Profile</Text>
                        </View>
                        <ChevronRight size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex-row items-center justify-center mt-4 mb-8 border border-red-100 dark:border-red-900/30"
                    onPress={handleSignOut}
                >
                    <LogOut size={20} color="#ef4444" className="mr-2" />
                    <Text className="text-red-500 dark:text-red-400 font-bold text-lg">Sign Out</Text>
                </TouchableOpacity>
                <Text className="text-center text-gray-400 text-xs mb-8">Version 1.0.0</Text>
            </View>

            <EditProfileModal
                visible={isEditProfileModalOpen}
                onClose={() => setIsEditProfileModalOpen(false)}
                userProfile={userProfile}
            />
        </ScrollView>
    );
}
