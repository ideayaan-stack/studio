import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from "@/firebase/firebase-admin";
import admin from "firebase-admin";

// Vercel Cron Header Verification could be added here
// For now, it will be a public endpoint (protect in production!)
export async function GET(request: Request) {
    try {
        const firebaseApp = initializeFirebaseAdmin();
        const db = admin.firestore(firebaseApp);
        const messaging = admin.messaging(firebaseApp);

        // 1. Get users with daily updates enabled or generic preference
        // For simplicity, we just grab all users and filter in memory or send to all
        // In production, optimize this query: where('notificationPreferences.daily', '==', true)

        // Limit to 500 for scalability (request for 200+)
        const usersSnapshot = await db.collection("users").limit(500).get();

        if (usersSnapshot.empty) {
            return NextResponse.json({ message: "No users found" });
        }

        let successCount = 0;
        let failureCount = 0;

        const promises = usersSnapshot.docs.map(async (doc) => {
            const userData = doc.data();
            const tokens = userData.fcmTokens as string[] | undefined;
            // Check if daily notification is disabled (defaulting to true if undefined)
            if (userData.notificationPreferences?.daily === false) {
                return;
            }

            if (!tokens || tokens.length === 0) return;

            // Customize message per user if needed (e.g. "Good morning Sarvesh!")
            const name = userData.displayName || "there";

            // Count pending tasks
            const tasksQuery = await db.collection("tasks")
                .where("assignee.uid", "==", doc.id)
                .where("status", "!=", "Completed")
                .get();

            const pendingCount = tasksQuery.size;
            let bodyText = `Ready for the day, ${name}? Check your updates.`;

            if (pendingCount > 0) {
                bodyText = `You have ${pendingCount} pending tasks waiting for you! 🚀`;
            }

            try {
                const resp = await messaging.sendEachForMulticast({
                    tokens: tokens,
                    notification: {
                        title: "Good Morning! ☀️",
                        body: bodyText,
                    },
                    data: {
                        type: "daily",
                        click_action: "/dashboard"
                    },
                    android: {
                        priority: "high",
                        notification: {
                            icon: "stock_ticker_update",
                            color: "#f97316"
                        }
                    }
                });
                successCount += resp.successCount;
                failureCount += resp.failureCount;

                // Remove invalid tokens logic (duplicate from server action, could be shared util)
                if (resp.failureCount > 0) {
                    const failedTokens: string[] = [];
                    resp.responses.forEach((r, idx) => {
                        if (!r.success && (r.error?.code === 'messaging/invalid-registration-token' || r.error?.code === 'messaging/registration-token-not-registered')) {
                            failedTokens.push(tokens[idx]);
                        }
                    });
                    if (failedTokens.length > 0) {
                        await doc.ref.update({
                            fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                        });
                    }
                }

            } catch (e) {
                console.error(`Failed to send to user ${doc.id}`, e);
            }
        });

        await Promise.all(promises);

        return NextResponse.json({
            success: true,
            message: `Sent daily briefing to ${successCount} devices. Failed: ${failureCount}.`
        });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
