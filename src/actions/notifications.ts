"use server";

import { initializeFirebaseAdmin } from "@/firebase/firebase-admin";
import admin from "firebase-admin";

export type NotificationType = "chat" | "task" | "team" | "update" | "daily";

interface SendNotificationParams {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, string>;
}

export async function sendNotification({
    userId,
    title,
    body,
    type,
    data = {},
}: SendNotificationParams) {
    try {
        const firebaseApp = initializeFirebaseAdmin();
        const db = admin.firestore(firebaseApp);

        // 1. Get user tokens and preferences
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) return { success: false, error: "User not found" };

        const userData = userDoc.data();
        const tokens = userData?.fcmTokens as string[] | undefined;
        const preferences = userData?.notificationPreferences;

        // 2. Check preferences
        if (preferences) {
            if (type === 'chat' && preferences.chat === false) return { success: false, error: "User disabled chat notifications" };
            if (type === 'task' && preferences.task === false) return { success: false, error: "User disabled task notifications" };
            if (type === 'team' && preferences.team === false) return { success: false, error: "User disabled team notifications" };
        }

        if (!tokens || tokens.length === 0) {
            return { success: false, error: "No FCM tokens found for user" };
        }

        // 3. Send to all tokens
        const response = await admin.messaging(firebaseApp).sendEachForMulticast({
            tokens: tokens,
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                type,
                click_action: "/" // Default click action
            },
            android: {
                priority: "high",
                notification: {
                    icon: "stock_ticker_update",
                    color: "#f97316" // Apple Orange
                }
            },
            webpush: {
                fcmOptions: {
                    link: "/"
                }
            }
        });

        // 4. Cleanup invalid tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    // If the error indicates the token is invalid, remove it.
                    const errorCode = resp.error?.code;
                    if (
                        errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered'
                    ) {
                        failedTokens.push(tokens[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                await db.collection("users").doc(userId).update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                });
                console.log(`Removed ${failedTokens.length} invalid tokens for user ${userId}`);
            }
        }

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        };

    } catch (error: any) {
        console.error("Error sending notification:", error);
        return { success: false, error: error.message };
    }
}

interface SendTeamNotificationParams {
    teamId: string;
    excludeUserId?: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, string>;
}

export async function sendTeamNotification({
    teamId,
    excludeUserId,
    title,
    body,
    type,
    data = {}
}: SendTeamNotificationParams) {
    try {
        const firebaseApp = initializeFirebaseAdmin(); // Use firebaseApp from initializeFirebaseAdmin
        const db = admin.firestore(firebaseApp); // Pass firebaseApp to admin.firestore()

        // 1. Get all users in the team
        // Note: This relies on 'teamId' field. If using 'teamIds' array, use array-contains
        // We'll try both to be safe or assuming the primary teamId is what matters for now
        // or improved query:
        const usersRef = db.collection("users");
        // Simple query for now, can be expanded to array-contains if needed
        const querySnapshot = await usersRef.where("teamId", "==", teamId).get();
        // Also check teamIds (optional, but good for completeness if users belong to multiple)
        // const arrayQuery = await usersRef.where("teamIds", "array-contains", teamId).get();

        const tokens: string[] = [];
        const userIdsToCheck: string[] = [];

        querySnapshot.forEach(doc => {
            if (doc.id === excludeUserId) return;
            const userData = doc.data();
            // Check preferences
            if (userData.notificationPreferences) {
                if (type === 'chat' && userData.notificationPreferences.chat === false) return;
                if (type === 'team' && userData.notificationPreferences.team === false) return;
            }

            if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
                tokens.push(...userData.fcmTokens);
                userIdsToCheck.push(doc.id); // Potential opt: track which token belongs to whom for cleanup
            }
        });

        if (tokens.length === 0) {
            return { success: true, count: 0 };
        }

        // 2. Send Multicast
        const response = await admin.messaging(firebaseApp).sendEachForMulticast({ // Pass firebaseApp to admin.messaging()
            tokens,
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                type,
                click_action: `/dashboard/chat?teamId=${teamId}`
            },
            android: {
                priority: "high",
                notification: {
                    icon: "stock_ticker_update",
                    color: "#f97316"
                }
            },
            webpush: {
                fcmOptions: {
                    link: `/dashboard/chat?teamId=${teamId}`
                }
            }
        });

        // 3. Cleanup logic (simplified, ideally needs mapping back to user IDs)
        // Since we flattened tokens, we can't easily map back to specific users to remove invalid ones
        // without a more complex structure. For now, we skip cleanup in this mass-send function
        // or we iterate users one by one (slower but safer)

        return { success: true, successCount: response.successCount, failureCount: response.failureCount };

    } catch (error: any) {
        console.error("Error sending team notification:", error);
        return { success: false, error: error.message };
    }
}
