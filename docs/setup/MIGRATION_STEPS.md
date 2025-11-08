# Migration Steps - New Firebase Project

## ✅ What I've Updated

1. ✅ Updated `src/firebase/config.ts` with new Firebase credentials
2. ✅ Updated `.firebaserc` to point to new project: `ideayaan-cd964`

## 📋 Steps You Need to Complete

### Step 1: Initialize Firebase in New Project

1. **Link Firebase CLI to new project:**
   ```powershell
   firebase use ideayaan-cd964
   ```

2. **Initialize Firestore (if not already done):**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: `ideayaan-cd964`
   - Go to **Firestore Database**
   - If database doesn't exist, click **Create database**
   - Choose **Start in test mode** (we'll deploy proper rules)
   - Select location (e.g., `us-central1`)
   - Click **Enable**

### Step 2: Enable Authentication

1. In Firebase Console → **Authentication**
2. Click **Get started**
3. Enable **Email/Password** provider
4. Click **Save**

### Step 3: Enable Storage (Optional but Recommended)

1. In Firebase Console → **Storage**
2. Click **Get started**
3. Start in **test mode** (rules will be updated)
4. Choose location (same as Firestore)
5. Click **Done**

### Step 4: Deploy Firestore Rules

Now that you're on the free tier, rules should deploy without billing:

```powershell
firebase deploy --only firestore:rules
```

**If it still asks for billing:**
- The free tier should work without billing
- Try deploying via Firebase Console instead:
  1. Go to Firestore Database → Rules tab
  2. Copy contents of `firestore.rules` file
  3. Paste into the editor
  4. Click **Publish**

### Step 5: Create Your First Core Account

**Method 1: Firebase Console (Easiest)**

1. **Create Auth User:**
   - Firebase Console → Authentication → Users
   - Click **Add user**
   - Enter your email and password
   - Click **Add user**
   - **Copy the User UID** (you'll need this)

2. **Create User Profile:**
   - Firebase Console → Firestore Database
   - Click **Start collection**
   - Collection ID: `users`
   - Document ID: [Paste the User UID from step 1]
   - Add fields:
     ```
     Field Name    Type    Value
     ──────────────────────────────────────
     uid           string  [The User UID]
     email         string  [Your email]
     displayName   string  [Your name]
     role          string  Core
     teamId        string  [Leave empty - ""]
     ```
   - Click **Save**

**Method 2: Using Firebase Console UI**

1. Go to Firestore Database
2. Create collection: `users`
3. Add document with your User UID as document ID
4. Add the fields listed above

### Step 6: Set Up Firebase Admin SDK (For User Creation)

1. **Get Service Account:**
   - Firebase Console → Project Settings → Service Accounts
   - Click **Generate new private key**
   - Download the JSON file

2. **Set Environment Variable:**
   - Create `.env.local` file in project root
   - Add this line (paste entire JSON as single line):
     ```
     FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"ideayaan-cd964",...}'
     ```
   - Replace `...` with the rest of the JSON content

3. **Restart your dev server:**
   ```powershell
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### Step 7: Test the App

1. **Start the app:**
   ```powershell
   npm run dev
   ```

2. **Visit:** http://localhost:9002

3. **Log in** with your Core account credentials

4. **Verify:**
   - ✅ Can see dashboard
   - ✅ Can access Teams page
   - ✅ Can create users
   - ✅ Can create teams

## 🎯 Quick Checklist

- [ ] Firestore database created
- [ ] Authentication enabled (Email/Password)
- [ ] Storage enabled (optional)
- [ ] Firestore rules deployed
- [ ] First Core account created in Firestore
- [ ] Firebase Admin SDK configured (`.env.local`)
- [ ] App running and can log in
- [ ] Can create users from Teams page

## 🔧 Troubleshooting

### "Billing required" error
- Free tier should NOT require billing
- If you see this, try deploying rules via Firebase Console instead
- Make sure you're using the new project (`ideayaan-cd964`)

### Can't log in
- Verify user profile exists in Firestore
- Check `role` field is set to `Core`
- Verify User UID matches between Auth and Firestore

### User creation not working
- Check `.env.local` file exists
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set correctly
- Restart dev server after adding env variable

### Rules not deploying
- Try manual deployment via Firebase Console
- Check you're logged in: `firebase login`
- Verify project is linked: `firebase use ideayaan-cd964`

## 📝 Next Steps After Setup

1. Create your first team
2. Add more users with different roles
3. Test all features:
   - Dashboard
   - Teams management
   - Tasks
   - Chat
   - File uploads

## 🎉 You're All Set!

Once you complete these steps, your app will be fully functional on the free tier with no billing required!

