// This file is intentionally left blank.
// The Firebase configuration will be populated by the backend environment.
// You do not need to edit this file.

export const firebaseConfig = {
  apiKey: "AIzaSyDHF7Z8O0RI17Crz-faOmeQRsMtBecLgGY",
  authDomain: "studio-2788856224-eb316.firebaseapp.com",
  projectId: "studio-2788856224-eb316",
  storageBucket: "studio-2788856224-eb316.appspot.com",
  messagingSenderId: "8193486209",
  appId: "1:8193486209:web:5bc09ed9445a90cb2acc80",
  measurementId: "G-0DQETY0TN5"
};

// Check if all required environment variables are set, but only on the client side
if (typeof window !== 'undefined') {
    if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
        console.warn(
            `[Firebase] Missing configuration. Please update src/firebase/config.ts with your Firebase project details.`
        );
    }
}
