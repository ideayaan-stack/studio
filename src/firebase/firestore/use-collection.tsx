'use client';
import { createContext, useContext, useEffect, useState, useMemo, useRef, ReactNode } from 'react';
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
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const queryRef = useRef<Query<DocumentData> | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Only update if query actually changed (by reference)
    const queryChanged = queryRef.current !== q;
    
    if (!queryChanged && isSubscribedRef.current) {
      return; // Query hasn't changed, don't re-subscribe
    }

    // Unsubscribe from previous query
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      isSubscribedRef.current = false;
    }

    queryRef.current = q;

    if (!q) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    let isMounted = true;
    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (!isMounted) return;
        
        const newData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        
        setData(newData);
        setLoading(false);
      },
      (err) => {
        if (!isMounted) return;
        console.error("Error fetching collection: ", err);
        setError(err);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
    isSubscribedRef.current = true;

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
      }
    };
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
