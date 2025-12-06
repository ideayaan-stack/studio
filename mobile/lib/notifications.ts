import * as Notifications from 'expo-notifications';
import { UserProfile } from './types';
import { collection, query, where, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { isCore, isSemiCore, isHead, isVolunteer } from './permissions';
import { Platform } from 'react-native';

// Configure notification handler
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

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        return;
    }

    // Get the token
    try {
        const projectId = '81e77ce6-b7af-48f1-b426-9e65c3bf47ef'; // From app.json
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        const token = tokenData.data;
        console.log("Push Token:", token);

        // Save token to user profile in Firestore
        if (auth.currentUser) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                pushToken: token,
                updatedAt: Timestamp.now()
            });
        }

        return token;
    } catch (error) {
        console.log("Error fetching/saving push token:", error);
        return;
    }
}

export async function schedulePeriodicReminders(userProfile: UserProfile) {
    // Cancel all existing notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Daily Task Reminder (Morning) - For everyone
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Good Morning! ☀️",
            body: "Check your tasks for today and stay productive.",
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: 9,
            minute: 0,
            repeats: true,
        },
    });

    // 2. Deadline Reminders (Check for tasks due soon)
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Upcoming Deadlines ⏰",
            body: "You might have tasks due soon. Tap to check.",
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: 17, // 5 PM
            minute: 0,
            repeats: true,
        },
    });

    // 3. Role-Based Alerts
    if (isCore(userProfile) || isSemiCore(userProfile)) {
        // Core/Semi-Core: Weekly Team Review Reminder
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Weekly Team Review 📊",
                body: "Time to review team progress and task completion rates.",
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                weekday: 2, // Monday (1=Sun, 2=Mon)
                hour: 10,
                minute: 0,
                repeats: true,
            },
        });
    } else if (isHead(userProfile)) {
        // Head: Team Check-in
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Team Check-in 👥",
                body: "Ensure your team is on track with their assigned tasks.",
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                weekday: 2, // Monday
                hour: 10,
                minute: 30,
                repeats: true,
            },
        });
    } else if (isVolunteer(userProfile)) {
        // Volunteer: Task Update Reminder
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Update Your Tasks 📝",
                body: "Don't forget to mark your completed tasks!",
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                weekday: 6, // Friday
                hour: 16,
                minute: 0,
                repeats: true,
            },
        });
    }
}

// Function to trigger immediate notification (e.g., when a new task is assigned)
// This would be called from the UI when an action happens, simulating a push notification
export async function sendLocalNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
        },
        trigger: null, // Immediate
    });
}
