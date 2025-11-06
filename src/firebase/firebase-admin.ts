import admin from 'firebase-admin';

// IMPORTANT: This file should only be used in server-side code (e.g., Server Actions, API routes).
// Do not import it into client components.

// This is a placeholder for your service account key.
// In a real production environment, you would use environment variables
// to securely load this configuration.
const serviceAccount = {
  // This is intentionally left blank. The backend environment will populate this.
  // You can also manually paste your service account JSON here for local development.
};

const getServiceAccount = () => {
    // In a real app, you'd use GOOGLE_APPLICATION_CREDENTIALS or another env var.
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }
    // Fallback for local dev or if the env var isn't a stringified JSON
    if (Object.keys(serviceAccount).length > 0) {
        return serviceAccount;
    }
    throw new Error(
        'Firebase Admin SDK service account credentials not found. ' +
        'Please set the FIREBASE_SERVICE_ACCOUNT_JSON environment variable.'
    );
}

export function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  
  const creds = getServiceAccount();

  return admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
}
