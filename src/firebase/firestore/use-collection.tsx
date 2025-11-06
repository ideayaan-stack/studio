'use client';
import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  type Query,
  type DocumentData,
  type Firestore,
  type Unsubscribe,
  type DocumentReference,
} from 'firebase/firestore';
import { initializeFirebase } from '..';

interface FirestoreContextType {
  db: Firestore | null;
}

const FirestoreContext = createContext<FirestoreContextType>({ db: null });

export function FirestoreProvider({ children }: { children: ReactNode }) {
  const { db } = initializeFirebase();
  return <FirestoreContext.Provider value={{ db }}>{children}</FirestoreContext.Provider>;
}

export const useFirestore = () => {
  return useContext(FirestoreContext);
};

// Hook to fetch a collection
export const useCollection = <T,>(q: Query<DocumentData> | null) => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setData([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching collection: ", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
};

// Hook to fetch a single document
export const useDoc = <T,>(ref: DocumentReference<DocumentData> | null) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    };
    
    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching document: ", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
};
