import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
// @ts-ignore
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Firebase config from src/firebase/config.ts
// For now, I'll use a placeholder or try to read it from the web project if possible.
// Since I can't read the .env.local from here easily in runtime without expo-constants,
// I will ask the user to provide it or copy it from the web source.
// For this step, I will create the structure.

const firebaseConfig = {
    apiKey: "AIzaSyCq31RhKn5vFUhqM53lSf3zm0xp8oJSLQk",
    authDomain: "ideayaan-cd964.firebaseapp.com",
    projectId: "ideayaan-cd964",
    storageBucket: "ideayaan-cd964.firebasestorage.app",
    messagingSenderId: "686662832453",
    appId: "1:686662832453:web:cceaafd8dd508de564ee2c",
    measurementId: "G-JJVGWKP9FV"
};

import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let app;
let auth;
let db;

import { Platform } from 'react-native';
import { browserLocalPersistence } from 'firebase/auth';

if (!getApps().length) {
    app = initializeApp(firebaseConfig);

    let persistence;
    if (Platform.OS === 'web') {
        persistence = browserLocalPersistence;
    } else {
        persistence = getReactNativePersistence(ReactNativeAsyncStorage);
    }

    auth = initializeAuth(app, {
        persistence
    });
    db = getFirestore(app);
} else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, db, storage };
