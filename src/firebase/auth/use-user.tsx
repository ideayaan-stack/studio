'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { initializeFirebase } from '..';
import { UserProfile, Role, Team } from '@/lib/types';
import { useDoc } from '../firestore/use-collection';
import { useRouter } from 'next/navigation';
import { createUserAction } from '../actions/user-actions';
import { isCore } from '@/lib/permissions';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  db: ReturnType<typeof initializeFirebase>['db'];
  storage: ReturnType<typeof initializeFirebase>['storage'];
  createUser: (email: string, password: string, displayName: string, role: Role, teamId?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  isCoreAdmin: boolean; // Kept for backward compatibility, now uses role-based check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, db, storage } = initializeFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const userProfileRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userProfileFromDb, loading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  // Use role-based check instead of hardcoded email
  const isCoreAdmin = useMemo(() => {
    return isCore(userProfileFromDb);
  }, [userProfileFromDb]);

  const userProfile = useMemo(() => {
    return userProfileFromDb;
  }, [userProfileFromDb]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);
  
  const createUser = async (email: string, password: string, displayName: string, role: Role, teamId?: string) => {
    // This is now a server action, so it doesn't affect client-side auth state
    return createUserAction({ email, password, displayName, role, teamId });
  }

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const value = {
    user,
    userProfile: userProfile || null,
    loading: loading || profileLoading,
    db,
    storage,
    createUser,
    signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    signOut,
    isCoreAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
