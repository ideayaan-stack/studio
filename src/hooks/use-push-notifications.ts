"use default";

import { useEffect, useState } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { initializeFirebase } from "@/firebase";
import { useAuth } from "@/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export function usePushNotifications() {
    const { user, db } = useAuth();
    const { toast } = useToast();
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission);
            if (Notification.permission === "granted") {
                const fetchToken = async () => {
                    const { firebaseApp } = initializeFirebase();
                    const messaging = getMessaging(firebaseApp);
                    try {
                        const token = await getToken(messaging, {
                            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                        });
                        if (token) setFcmToken(token);
                    } catch (error) {
                        console.error("Failed to fetch token:", error);
                    }
                };
                fetchToken();
            }
        }
    }, []);

    const requestPermission = async () => {
        if (typeof window === "undefined" || !("Notification" in window)) return;

        setLoading(true);
        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult === "granted") {
                const { firebaseApp } = initializeFirebase();
                const messaging = getMessaging(firebaseApp);
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });

                if (token) {
                    setFcmToken(token);
                    console.log("FCM Token:", token);

                    if (user && db) {
                        const userRef = doc(db, "users", user.uid);
                        await updateDoc(userRef, {
                            fcmTokens: arrayUnion(token)
                        });
                    }

                    toast({
                        title: "Notifications Enabled",
                        description: "You will now receive push notifications.",
                    });
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Permission Denied",
                    description: "Please enable notifications in your browser settings to receive updates.",
                });
            }
        } catch (error) {
            console.error("Error requesting permission:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to enable notifications.",
            });
        } finally {
            setLoading(false);
        }
    };

    // Foreground message handling
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            const { firebaseApp } = initializeFirebase();
            const messaging = getMessaging(firebaseApp);
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log("Foreground message received:", payload);
                toast({
                    title: payload.notification?.title || "New Notification",
                    description: payload.notification?.body,
                });
            });
            return () => unsubscribe();
        }
    }, [toast]);

    return { permission, requestPermission, loading, fcmToken };
}
