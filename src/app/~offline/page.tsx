"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-4 text-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-secondary/30 backdrop-blur-xl mb-8">
                <WifiOff className="h-16 w-16 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-headline font-bold tracking-tight mb-2">
                You're Offline
            </h1>
            <p className="text-muted-foreground mb-8 max-w-sm">
                It seems you've lost your internet connection. Check your network and try again.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => window.location.reload()}>
                    Try Again
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            </div>
        </div>
    );
}
