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
  createUserWithEmailAndPassword as firebaseCreateUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '..';
import { UserProfile, Role } from '@/lib/types';
import { useDoc } from '../firestore/use-collection';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  db: ReturnType<typeof initializeFirebase>['db'];
  createUser: (email: string, password: string, displayName: string, role: Role, teamId?: string) => Promise<any>;
  signIn: typeof signInWithEmailAndPassword;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, db } = initializeFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const userProfileRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const createUser = async (email: string, password: string, displayName: string, role: Role, teamId?: string) => {
    const userCredential = await firebaseCreateUser(auth, email, password);
    const user = userCredential.user;
    
    const userDocRef = doc(db, 'users', user.uid);
    const newUserProfile: Omit<UserProfile, 'id'> = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.email?.split('@')[0] || 'New User',
      photoURL: user.photoURL,
      role: role,
      teamId: teamId || '',
    };
    await setDoc(userDocRef, newUserProfile);

    return userCredential;
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
    createUser,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signOut,
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
