import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../lib/theme";
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from "react";
import { registerForPushNotificationsAsync } from "../lib/notifications";
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

function AppContent() {
    const { isDark } = useTheme();
    const router = useRouter();
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    useEffect(() => {
        if (Platform.OS === 'web') return;

        // Register for push notifications
        registerForPushNotificationsAsync();

        // Listen for incoming notifications while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log("Notification Received:", notification);
        });

        // Listen for user interaction with notification (tapping it)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log("Notification Tapped:", data);

            if (data?.url) {
                // Handle deep link
                try {
                    router.push(data.url);
                } catch (e) {
                    console.error("Deep link failed:", e);
                }
            } else if (data?.screen) {
                // Handle screen name
                if (data.screen === 'Chat') {
                    router.push(`/dashboard/chat/${data.id}`);
                } else if (data.screen === 'Tasks') {
                    router.push('/dashboard/tasks');
                }
            }
        });

        return () => {
            notificationListener.current && notificationListener.current.remove();
            responseListener.current && responseListener.current.remove();
        };
    }, []);

    return (
        <SafeAreaProvider>
            <Slot />
            <StatusBar style={isDark ? "light" : "dark"} />
        </SafeAreaProvider>
    );
}

export default function Layout() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
