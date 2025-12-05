import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, CheckSquare, Folder, MessageSquare, Settings, Video } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';

export default function DashboardLayout() {
    return (
        <View className="flex-1 bg-white">
            <SafeAreaView edges={['top']} className="flex-1 bg-white">
                <Tabs screenOptions={{
                    tabBarActiveTintColor: 'orange',
                    headerShown: false,
                    tabBarStyle: { borderTopWidth: 1, borderTopColor: '#e5e7eb' }
                }}>
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: 'Dashboard',
                            tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="teams"
                        options={{
                            title: 'Teams',
                            tabBarIcon: ({ color }) => <Users size={24} color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="tasks"
                        options={{
                            title: 'To-Do',
                            tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="files"
                        options={{
                            title: 'Files',
                            tabBarIcon: ({ color }) => <Folder size={24} color={color} />,
                        }}
                    />

                    <Tabs.Screen
                        name="chat"
                        options={{
                            title: 'Chat',
                            tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="settings"
                        options={{
                            href: null,
                        }}
                    />
                    {/* Explicitly hide meetings, calendar, and directory from tabs */}
                    <Tabs.Screen
                        name="meetings"
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name="calendar"
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name="directory"
                        options={{
                            href: null,
                        }}
                    />
                    {/* Hide chat detail route from tabs */}
                    <Tabs.Screen
                        name="chat/[id]"
                        options={{
                            href: null,
                        }}
                    />
                </Tabs>
            </SafeAreaView>
        </View>
    );
}
