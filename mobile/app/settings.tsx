import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useAuth } from '../firebase/useAuth';
import { useCollection } from '../firebase/useCollection';
import { collection, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { LogOut, User, Shield, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
    const { user: authUser } = useAuth();
    const router = useRouter();

    const { data: userProfiles } = useCollection<any>(
        authUser ? query(collection(db!, 'users'), where('uid', '==', authUser.uid)) : null
    );
    const userProfile = userProfiles?.[0];

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-white p-6 items-center border-b border-gray-200">
                <View className="w-24 h-24 rounded-full bg-orange-100 items-center justify-center mb-4">
                    <Text className="text-4xl font-bold text-orange-600">
                        {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                </View>
                <Text className="text-xl font-bold text-gray-900">{userProfile?.displayName || 'User'}</Text>
                <Text className="text-gray-500">{userProfile?.email}</Text>
                <View className="mt-2 px-3 py-1 bg-gray-100 rounded-full">
                    <Text className="text-xs text-gray-600 font-medium">{userProfile?.role || 'Member'}</Text>
                </View>
            </View>

            <View className="mt-6 px-4">
                <Text className="text-sm font-semibold text-gray-500 mb-2 ml-2">ACCOUNT</Text>

                <View className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
                        {/* @ts-ignore */}
                        <User size={20} color="#6b7280" />
                        <Text className="flex-1 ml-3 text-gray-900 text-base">Edit Profile</Text>
                        {/* @ts-ignore */}
                        <ChevronRight size={20} color="#d1d5db" />
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center p-4">
                        {/* @ts-ignore */}
                        <Shield size={20} color="#6b7280" />
                        <Text className="flex-1 ml-3 text-gray-900 text-base">Security</Text>
                        {/* @ts-ignore */}
                        <ChevronRight size={20} color="#d1d5db" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="mt-6 px-4">
                <TouchableOpacity
                    className="bg-white rounded-xl p-4 flex-row items-center shadow-sm"
                    onPress={handleLogout}
                >
                    {/* @ts-ignore */}
                    <LogOut size={20} color="#ef4444" />
                    <Text className="flex-1 ml-3 text-red-500 font-semibold text-base">Log Out</Text>
                </TouchableOpacity>
            </View>

            <View className="mt-auto mb-6 items-center">
                <Text className="text-xs text-gray-400">Version 1.0.0</Text>
            </View>
        </View>
    );
}
