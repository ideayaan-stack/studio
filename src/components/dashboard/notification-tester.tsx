"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendNotification, NotificationType } from "@/actions/notifications";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function NotificationTester() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState<NotificationType | null>(null);

    const handleTest = async (type: NotificationType, title: string, body: string) => {
        if (!user) return;
        setLoading(type);
        try {
            const result = await sendNotification({
                userId: user.uid,
                title,
                body,
                type,
            });

            if (result.success) {
                toast({
                    title: "Notification Sent",
                    description: `Sent "${title}" to your devices.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Failed to Send",
                    description: result.error || "Unknown error",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setLoading(null);
        }
    };

    if (!user) return null;

    return (
        <Card className="border-orange-200 bg-orange-50/30 dark:border-orange-900/50 dark:bg-orange-900/10">
            <CardHeader>
                <CardTitle className="text-orange-700 dark:text-orange-400">Test Notifications</CardTitle>
                <CardDescription>
                    Trigger real push notifications to verify your setup.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                    variant="outline"
                    onClick={() => handleTest("chat", "New Message", "Alex sent you a message: 'Hey, are we still on for the meeting?'")}
                    disabled={!!loading}
                >
                    {loading === "chat" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test Chat
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleTest("task", "New Task Assigned", "You have been assigned to 'Redesign Homepage'.")}
                    disabled={!!loading}
                >
                    {loading === "task" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test Task Assign
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleTest("team", "Team Announcement", "Design Team: Weekly sync is moved to 3 PM.")}
                    disabled={!!loading}
                >
                    {loading === "team" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test Team Update
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleTest("daily", "Daily Update", "Here is your daily summary: 3 pending tasks, 2 meetings.")}
                    disabled={!!loading}
                >
                    {loading === "daily" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test Daily Update
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleTest("update", "System Update", "Ideayaan has been updated to v2.0! Check out the new features.")}
                    disabled={!!loading}
                >
                    {loading === "update" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test System Update
                </Button>
            </CardContent>
        </Card>
    );
}
