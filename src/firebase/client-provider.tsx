'use client';

import { AuthProvider } from './auth/use-user';
import { FirestoreProvider } from './firestore/use-collection';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <FirestoreProvider>
                {children}
            </FirestoreProvider>
        </AuthProvider>
    )
}
