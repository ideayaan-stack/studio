# Complete Setup Guide - Ideayaan

This guide will walk you through setting up Ideayaan from scratch.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Firebase account (free tier works)
- Git (optional, for version control)

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Firebase Client

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **`ideayaan-cd964`**
3. Go to **Project Settings** → **General** tab
4. Scroll to **"Your apps"** section
5. Click the **Web** icon (`</>`) or **"Add app"** if no web app exists
6. Register app (nickname: "Ideayaan Web")
7. Copy the `firebaseConfig` object

8. Open `src/firebase/config.ts` and replace with your config:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ideayaan-cd964.firebaseapp.com",
  projectId: "ideayaan-cd964",
  storageBucket: "ideayaan-cd964.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### Step 3: Enable Firebase Services

#### 3.1 Authentication

1. Firebase Console → **Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click **Save**

#### 3.2 Firestore Database

1. Firebase Console → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll deploy rules next)
4. Choose location (closest to your users)
5. Click **"Enable"**

#### 3.3 Storage (Optional but Recommended)

1. Firebase Console → **Storage**
2. Click **"Get started"**
3. Start in **test mode** (rules will be updated)
4. Choose location (same as Firestore)
5. Click **"Done"**

### Step 4: Deploy Firestore Rules

1. **Login to Firebase CLI:**
   ```bash
   firebase login
   ```

2. **Initialize Firebase (if not done):**
   ```bash
   firebase init
   ```
   - Select: Firestore
   - Use existing project: `ideayaan-cd964`
   - Use existing rules file: `firestore.rules`
   - Use existing indexes: `firestore.indexes.json`

3. **Deploy Rules:**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### Step 5: Set Up Firebase Admin SDK

**This is required for user and team creation.**

1. **Get Service Account:**
   - Firebase Console → **Project Settings** → **Service Accounts**
   - Click **"Generate new private key"**
   - Click **"Generate key"** in popup
   - **Download the JSON file**

2. **Create `.env.local` file:**
   - In project root, create `.env.local`
   - Add this line (paste entire JSON as single line):

   ```env
   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"ideayaan-cd964",...}'
   ```

   **Important:**
   - Use single quotes around JSON
   - Keep JSON on one line
   - Don't modify the JSON structure

3. **See detailed guide:** [`FIREBASE_ADMIN_SETUP.md`](FIREBASE_ADMIN_SETUP.md)

### Step 6: Create First Core Account

Since only Core users can create accounts, create the first one manually:

**See detailed guide:** [`CREATE_FIRST_CORE_ACCOUNT.md`](CREATE_FIRST_CORE_ACCOUNT.md)

**Quick steps:**

1. **Create Auth User:**
   - Firebase Console → **Authentication** → **Users**
   - Click **"Add user"**
   - Enter email and password
   - Click **"Add user"**
   - **Copy the User UID**

2. **Create User Profile:**
   - Firebase Console → **Firestore Database**
   - Click **"Start collection"** (if `users` doesn't exist)
   - Collection ID: `users`
   - Document ID: **[Paste User UID]**
   - Add fields:
     ```
     uid: [User UID]
     email: [Your email]
     displayName: [Your name]
     role: Core
     teamId: "" (empty string)
     ```
   - Click **"Save"**

### Step 7: Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:9002**

### Step 8: Log In and Test

1. Go to http://localhost:9002/login
2. Log in with your Core account credentials
3. You should see the dashboard
4. Test creating a user:
   - Go to **Teams** page
   - Click **"Add User"**
   - Fill in the form
   - Click **"Create User"**
   - Should work if Admin SDK is configured correctly!

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Firebase config updated (`src/firebase/config.ts`)
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Storage enabled (optional)
- [ ] Firestore rules deployed
- [ ] Admin SDK configured (`.env.local` with service account JSON)
- [ ] First Core account created (Auth + Firestore)
- [ ] Dev server running (`npm run dev`)
- [ ] Can log in with Core account
- [ ] Can create users from Teams page
- [ ] Can create teams from Teams page

## 🐛 Common Issues

### Admin SDK Not Working

**Symptoms:**
- Error: "Firebase Admin SDK service account credentials not found"
- User/team creation fails

**Solutions:**
1. Verify `.env.local` exists in project root
2. Check `FIREBASE_SERVICE_ACCOUNT_JSON` is set correctly
3. Ensure JSON is valid and on single line
4. **Restart dev server** after adding env var
5. Check server logs for specific errors

**See:** [`FIREBASE_ADMIN_SETUP.md`](FIREBASE_ADMIN_SETUP.md) for detailed troubleshooting

### Can't Deploy Firestore Rules

**Symptoms:**
- `firebase deploy` fails
- Permission errors

**Solutions:**
1. Run `firebase login` first
2. Verify you have access to project `ideayaan-cd964`
3. Check `firebase.json` exists and is configured
4. Try deploying just rules: `firebase deploy --only firestore:rules`

### Can't Log In

**Symptoms:**
- Login fails
- "User not found" errors

**Solutions:**
1. Verify user exists in Firebase Authentication
2. Check user profile exists in Firestore `users` collection
3. Verify `role` field is set to `Core`
4. Check User UID matches between Auth and Firestore
5. Check browser console for errors

### Permission Errors

**Symptoms:**
- "Missing or insufficient permissions"
- Can't access certain pages

**Solutions:**
1. Verify Firestore rules are deployed
2. Check user role in Firestore `users` collection
3. Ensure user profile exists with correct `role` field
4. Try logging out and back in

## 📚 Next Steps

After setup is complete:

1. **Create Teams:**
   - Go to Teams page
   - Click "Create Team"
   - Assign team heads

2. **Create Users:**
   - Add users with appropriate roles
   - Assign them to teams

3. **Set Up Tasks:**
   - Create tasks for teams
   - Assign to team members

4. **Test Features:**
   - Chat functionality
   - File uploads
   - Task management
   - Role-based access

## 📖 Additional Documentation

- [`QUICK_START_GUIDE.md`](QUICK_START_GUIDE.md) - Quick reference
- [`FIREBASE_ADMIN_SETUP.md`](FIREBASE_ADMIN_SETUP.md) - Admin SDK details
- [`CREATE_FIRST_CORE_ACCOUNT.md`](CREATE_FIRST_CORE_ACCOUNT.md) - Core account setup
- [`MANUAL_TEAM_CREATION.md`](MANUAL_TEAM_CREATION.md) - Manual team setup

## 🆘 Still Having Issues?

1. Check all verification checklist items
2. Review troubleshooting section above
3. Check Firebase Console for errors
4. Review server logs for specific errors
5. Verify all environment variables are set correctly

---

**Once setup is complete, you're ready to use Ideayaan!** 🎉

