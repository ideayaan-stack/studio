// This file is intentionally left blank.
// The Firebase configuration will be populated by the backend environment.
// You do not need to edit this file.

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Check if all required environment variables are set, but only on the client side
if (typeof window !== 'undefined') {
    if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
        console.warn(
            `[Firebase] Missing configuration. Please update src/firebase/config.ts with your Firebase project details.`
        );
    }
}
