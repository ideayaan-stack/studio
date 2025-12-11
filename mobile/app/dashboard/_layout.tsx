import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, CheckSquare, Folder, MessageSquare, Settings, Video } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useTheme } from '../../lib/theme';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';

export default function DashboardLayout() {
    const { isDark } = useTheme();

    return (
        <View className="flex-1 bg-white dark:bg-black">
            <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
                <SafeAreaView edges={['top']} className="flex-1 bg-white dark:bg-black">
                    <Tabs screenOptions={{
                        tabBarActiveTintColor: '#f97316',
                        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
                        headerShown: false,
                        tabBarStyle: {
                            borderTopWidth: 1,
                            borderTopColor: isDark ? '#374151' : '#e5e7eb', // gray-700 : gray-200
                            backgroundColor: isDark ? '#111827' : '#ffffff', // gray-900 : white
                            height: 60,
                            paddingBottom: 8,
                            paddingTop: 8,
                        },
                        tabBarLabelStyle: {
                            fontSize: 12,
                            fontWeight: '500',
                        }
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
            </ThemeProvider>
        </View>
    );
}
