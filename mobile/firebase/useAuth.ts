import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { auth, db } from './config';
import { useDoc } from './useCollection';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setAuthLoading(false);
        });

        return unsubscribe;
    }, []);

    // Fetch user profile if user is logged in
    const userProfileRef = useMemo(() => {
        if (!db || !user) return null;
        return doc(db, 'users', user.uid);
    }, [db, user]);

    const { data: userProfile, loading: profileLoading } = useDoc<any>(userProfileRef);

    return {
        user,
        userProfile,
        loading: authLoading || profileLoading,
        db
    };
}
