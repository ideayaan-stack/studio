# Firebase Admin SDK Setup Instructions

To enable server-side operations (user creation, team creation, etc.), you need to set up Firebase Admin SDK credentials.

## Why Admin SDK?

The Admin SDK bypasses Firestore security rules, allowing server-side operations like:
- Creating users in Firebase Authentication
- Creating teams and managing data
- Performing operations that require elevated permissions

## Steps

### 1. Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **`ideayaan-cd964`**
3. Go to **Project Settings** (gear icon) → **Service Accounts** tab
4. Click **"Generate new private key"**
5. Click **"Generate key"** in the confirmation dialog
6. **Download the JSON file** (save it securely, you'll need it)

### 2. Set Environment Variable

**For Local Development:**

1. Create `.env.local` file in the project root (if it doesn't exist)
2. Add the following line:

```env
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"ideayaan-cd964",...}'
```

3. **Important**: Paste the **entire JSON content** from the downloaded file as a **single line**
4. Make sure to:
   - Use single quotes around the JSON
   - Escape any single quotes inside the JSON (or use double quotes)
   - Keep it all on one line

**Example format:**

```env
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"ideayaan-cd964","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@ideayaan-cd964.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40ideayaan-cd964.iam.gserviceaccount.com"}'
```

### 3. Restart Development Server

**Important**: After adding the environment variable, you **must restart** your dev server:

```powershell
# Stop the server (Ctrl+C)
# Then start it again:
npm run dev
```

### 4. Verify Setup

1. Start the app: `npm run dev`
2. Log in as a Core user
3. Try creating a user or team
4. If it works, Admin SDK is configured correctly!

## For Production (Vercel/Other Platforms)

1. Go to your hosting platform's environment variables settings
2. Add the same variable: `FIREBASE_SERVICE_ACCOUNT_JSON`
3. Paste the entire JSON as a single line (same format as `.env.local`)
4. Redeploy your application

## Troubleshooting

### Error: "Firebase Admin SDK service account credentials not found"

**Possible causes:**
1. `.env.local` file doesn't exist
2. Environment variable not set correctly
3. JSON format is invalid
4. Server wasn't restarted after adding env var

**Solutions:**
1. Verify `.env.local` exists in project root
2. Check the JSON is valid (no syntax errors)
3. Ensure JSON is on a single line
4. Restart dev server completely
5. Check server logs for specific parsing errors

### Error: "Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON"

**Possible causes:**
1. JSON has syntax errors
2. Quotes not properly escaped
3. JSON is multi-line

**Solutions:**
1. Validate JSON using an online JSON validator
2. Ensure all quotes inside JSON are escaped
3. Make sure JSON is on a single line
4. Try copying the JSON again from the downloaded file

### Error: "Service account JSON is missing required fields"

**Possible causes:**
1. Incomplete JSON copied
2. JSON was modified incorrectly

**Solutions:**
1. Re-download the service account JSON from Firebase Console
2. Copy the entire file content
3. Don't modify the JSON structure

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

- **Never commit** `.env.local` to git (it's in `.gitignore`)
- **Never share** your service account key publicly
- **Never commit** service account JSON to version control
- The service account has **admin privileges** - keep it secure
- **Rotate keys** if you suspect they've been compromised
- Use environment variables in production, not hardcoded values

## Alternative: File-Based Setup (Not Recommended)

If environment variables don't work, you can temporarily use file-based setup:

1. Save the downloaded JSON file as `service-account.json` in project root
2. Add to `.gitignore`: `service-account.json`
3. Modify `src/firebase/firebase-admin.ts` to read from file

**⚠️ This is less secure and not recommended for production.**

## Quick Checklist

- [ ] Downloaded service account JSON from Firebase Console
- [ ] Created `.env.local` file in project root
- [ ] Added `FIREBASE_SERVICE_ACCOUNT_JSON` with full JSON content
- [ ] Verified JSON is valid and on single line
- [ ] Restarted dev server
- [ ] Tested user/team creation (should work now!)

## Need Help?

If you're still having issues:
1. Check server logs for specific error messages
2. Verify the JSON format matches the example above
3. Ensure you're using the correct project ID (`ideayaan-cd964`)
4. Try re-downloading the service account key

---

**Once configured, you can create users and teams through the app UI!** 🎉
