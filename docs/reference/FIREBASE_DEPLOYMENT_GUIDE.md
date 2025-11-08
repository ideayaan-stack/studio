# Firebase Deployment Guide

## Current Status

Your Firestore rules are ready to deploy, but Firebase requires billing to be enabled even for the free tier when using Enterprise Edition.

## Deploying Firestore Rules

### Option 1: Enable Billing (Free Tier - No Cost)

Even though you're on the free tier, Firebase Enterprise Edition requires billing to be enabled:

1. **Enable Billing:**
   - Go to: https://console.developers.google.com/billing/enable?project=studio-2788856224-eb316
   - Or: Firebase Console → Project Settings → Usage and billing → Enable billing
   - **Note:** You won't be charged as long as you stay within free tier limits

2. **Wait a few minutes** for billing to propagate

3. **Deploy Rules:**
   ```powershell
   firebase deploy --only firestore:rules
   ```

### Option 2: Deploy via Firebase Console (Manual)

If you prefer not to enable billing right now:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `studio-2788856224-eb316`
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

## Verify Deployment

After deploying, verify the rules are active:

1. Go to Firestore Database → Rules tab
2. Check that your rules are displayed (not the default open rules)
3. Test by trying to access data with different user roles

## Firestore Indexes

If you see index errors in the console, create the required indexes:

1. Click the error link in the browser console
2. It will take you to Firebase Console with pre-filled index creation
3. Click **Create Index**

Or deploy indexes via CLI:
```powershell
firebase deploy --only firestore:indexes
```

## Important Notes

- **Billing is required** for Enterprise Edition, but you won't be charged if you stay within free tier
- **Free tier limits** are generous enough for 200 concurrent users
- **Monitor usage** in Firebase Console → Usage and billing
- **Set up budget alerts** to get notified if you approach limits

## Troubleshooting

### Error: "Billing required"
- Enable billing in Google Cloud Console
- Wait 5-10 minutes for propagation
- Retry deployment

### Error: "Permission denied"
- Ensure you're logged in: `firebase login`
- Check you have Owner/Editor role on the project

### Rules not working
- Verify rules are deployed (check Firebase Console)
- Check browser console for specific rule errors
- Ensure user profiles have correct `role` field

