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
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '..';
import { UserProfile, Role } from '@/lib/types';
import { useDoc } from '../firestore/use-collection';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  db: ReturnType<typeof initializeFirebase>['db'];
  createUser: (email: string, password: string, role: Role, teamId?: string, displayName?: string) => Promise<any>;
  signIn: typeof signInWithEmailAndPassword;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, db } = initializeFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const createUser = async (email: string, password: string, role: Role, teamId?: string, displayName?: string) => {
    // This function is intended to be called by an admin. It creates a new user and their profile.
    // Note: Creating users this way requires special privileges. For client-side, you'd typically
    // use a Cloud Function that internally uses the Firebase Admin SDK to create users.
    // This is a simplified version for demonstration.
    const userCredential = await firebaseCreateUser(auth, email, password);
    const user = userCredential.user;
    
    const userDocRef = doc(db, 'users', user.uid);
    const newUserProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.email?.split('@')[0],
      photoURL: user.photoURL,
      role: role,
      teamId: teamId,
    };
    await setDoc(userDocRef, newUserProfile);
    return userCredential;
  }

  const signOut = async () => {
    await firebaseSignOut(auth);
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
