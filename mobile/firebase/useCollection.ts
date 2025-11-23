import { useEffect, useState, useRef } from 'react';
import {
    onSnapshot,
    type Query,
    type DocumentData,
    type Unsubscribe,
    type DocumentReference,
} from 'firebase/firestore';

// Hook to fetch a collection
export const useCollection = <T,>(q: Query<DocumentData> | null) => {
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const unsubscribeRef = useRef<Unsubscribe | null>(null);
    const queryRef = useRef<Query<DocumentData> | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        // Compare query by reference - if same query object, don't re-subscribe
        if (queryRef.current === q && unsubscribeRef.current) {
            return;
        }

        // Unsubscribe from previous query
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        // Store current query reference
        queryRef.current = q;

        if (!q) {
            setData([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        isMountedRef.current = true;
        const unsubscribe: Unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                if (!isMountedRef.current) return;

                const newData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as T[];

                // Only update state if data actually changed
                setData(prevData => {
                    if (JSON.stringify(prevData) === JSON.stringify(newData)) {
                        return prevData;
                    }
                    return newData;
                });
                setLoading(false);
            },
            (err) => {
                if (!isMountedRef.current) return;
                console.error("Error fetching collection: ", err);
                setError(err);
                setLoading(false); // Ensure loading stops on error
            }
        );

        unsubscribeRef.current = unsubscribe;

        return () => {
            isMountedRef.current = false;
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [q]);

    const refresh = () => {
        // Force re-subscription by toggling a dummy state or similar if needed
        // For onSnapshot, it's auto-updating, but we can expose this for UI consistency
        if (queryRef.current && unsubscribeRef.current) {
            // Optional: could unsubscribe and re-subscribe
        }
    };

    return { data, loading, error, refresh };
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
