import admin from 'firebase-admin';

// IMPORTANT: This file should only be used in server-side code (e.g., Server Actions, API routes).
// Do not import it into client components.

const getServiceAccount = () => {
    // Check for environment variable (primary method)
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (envVar) {
        try {
            // Handle both quoted and unquoted JSON strings
            let jsonString = envVar.trim();
            
            // Remove surrounding quotes if present
            if ((jsonString.startsWith('"') && jsonString.endsWith('"')) ||
                (jsonString.startsWith("'") && jsonString.endsWith("'"))) {
                jsonString = jsonString.slice(1, -1);
            }
            
            // Parse the JSON
            const parsed = JSON.parse(jsonString);
            
            // Validate it has required fields
            if (!parsed.type || !parsed.project_id || !parsed.private_key) {
                throw new Error('Service account JSON is missing required fields (type, project_id, or private_key)');
            }
            
            return parsed;
        } catch (error: any) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
            throw new Error(
                `Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${error.message}. ` +
                'Please ensure it is valid JSON. Check .env.local file format.'
            );
        }
    }
    
    // Check for GOOGLE_APPLICATION_CREDENTIALS (alternative method)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // This would point to a file path, but we're using inline JSON
        // So we'll skip this for now
    }
    
    throw new Error(
        'Firebase Admin SDK service account credentials not found.\n\n' +
        'Please set the FIREBASE_SERVICE_ACCOUNT_JSON environment variable in .env.local:\n' +
        '1. Get service account key from: https://console.firebase.google.com/project/ideayaan-cd964/settings/serviceaccounts/adminsdk\n' +
        '2. Download the JSON file\n' +
        '3. In .env.local, add: FIREBASE_SERVICE_ACCOUNT_JSON=\'{"type":"service_account",...}\'\n' +
        '4. Paste the entire JSON content (as a single line, with escaped quotes)\n' +
        '5. Restart your dev server\n\n' +
        'Current env var status: ' + (envVar ? 'Found but failed to parse' : 'Not found')
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
