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
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '..';
import { UserProfile, Role, Team } from '@/lib/types';
import { useDoc } from '../firestore/use-collection';
import { useRouter } from 'next/navigation';

// --- Hardcoded Admin Email ---
const ADMIN_EMAIL = 'sarvy2503@gmail.com';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  db: ReturnType<typeof initializeFirebase>['db'];
  createUser: (email: string, password: string, displayName: string, role: Role, teamId?: string) => Promise<any>;
  signIn: typeof signInWithEmailAndPassword;
  signOut: () => Promise<void>;
  isCoreAdmin: boolean;
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

  const { data: userProfileFromDb, loading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  // --- DERIVED ADMIN STATE ---
  const isCoreAdmin = user?.email === ADMIN_EMAIL;

  // Combine DB profile with immediate admin override
  const userProfile = useMemo(() => {
    if (isCoreAdmin) {
      // If user is the hardcoded admin, immediately give them a Core profile
      return {
        uid: user?.uid || 'admin',
        email: user?.email,
        displayName: userProfileFromDb?.displayName || user?.displayName || 'Admin',
        photoURL: userProfileFromDb?.photoURL || user?.photoURL,
        role: 'Core' as Role,
      };
    }
    return userProfileFromDb;
  }, [user, userProfileFromDb, isCoreAdmin]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const createUser = async (email: string, password: string, displayName: string, role: Role, teamId?: string) => {
    // Check if the user already exists
    const userDocRef = doc(db, 'users'); // This seems wrong, should query by email
    
    const userCredential = await firebaseCreateUser(auth, email, password);
    const newUser = userCredential.user;
    
    const newUserDocRef = doc(db, 'users', newUser.uid);
    const newUserProfile: Omit<UserProfile, 'id'> = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: displayName || newUser.email?.split('@')[0] || 'New User',
      photoURL: newUser.photoURL,
      role: role,
      teamId: role === 'Core' ? '' : teamId || '',
    };
    await setDoc(newUserDocRef, newUserProfile);

    return userCredential;
  }

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const value = {
    user,
    userProfile: userProfile || null,
    loading: loading || (profileLoading && !isCoreAdmin), // Don't show loading for admin if we already have the user object
    db,
    createUser,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signOut,
    isCoreAdmin, // Expose this for quick checks
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
