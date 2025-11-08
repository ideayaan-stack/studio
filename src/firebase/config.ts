// This file is intentionally left blank.
// The Firebase configuration will be populated by the backend environment.
// You do not need to edit this file.

export const firebaseConfig = {
  apiKey: "AIzaSyCq31RhKn5vFUhqM53lSf3zm0xp8oJSLQk",
  authDomain: "ideayaan-cd964.firebaseapp.com",
  projectId: "ideayaan-cd964",
  storageBucket: "ideayaan-cd964.firebasestorage.app",
  messagingSenderId: "686662832453",
  appId: "1:686662832453:web:cceaafd8dd508de564ee2c",
  measurementId: "G-JJVGWKP9FV"
};

// Check if all required environment variables are set, but only on the client side
if (typeof window !== 'undefined') {
    if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
        console.warn(
            `[Firebase] Missing configuration. Please update src/firebase/config.ts with your Firebase project details.`
        );
    }
}
