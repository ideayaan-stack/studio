# Quick Start Guide - Ideayaan

## 🚀 Getting Started

### Step 1: Deploy Firestore Rules

**Important:** Firebase Enterprise Edition requires billing to be enabled (even for free tier).

1. **Enable Billing** (Free - No Cost):
   - Visit: https://console.developers.google.com/billing/enable?project=studio-2788856224-eb316
   - Or: Firebase Console → Project Settings → Usage and billing → Enable billing
   - **You won't be charged** as long as you stay within free tier limits

2. **Wait 5-10 minutes** for billing to propagate

3. **Deploy Rules:**
   ```powershell
   firebase deploy --only firestore:rules
   ```

   **OR** manually copy `firestore.rules` content to Firebase Console → Firestore → Rules

### Step 2: Create Your First Core Account

Since only Core users can create accounts, you need to create the first one manually:

**See detailed instructions in:** `CREATE_FIRST_CORE_ACCOUNT.md`

**Quick Method:**
1. Firebase Console → Authentication → Add user (email + password)
2. Copy the User UID
3. Firestore Database → `users` collection → Add document
4. Set Document ID = User UID
5. Add fields:
   - `uid`: [User UID]
   - `email`: [Your email]
   - `displayName`: [Your name]
   - `role`: `Core`
   - `teamId`: `""` (empty string)

### Step 3: Set Up Firebase Admin SDK (For User Creation)

**See detailed instructions in:** `FIREBASE_ADMIN_SETUP.md`

**Quick Method:**
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key → Download JSON
3. Create `.env.local` file:
   ```
   FIREBASE_SERVICE_ACCOUNT_JSON='{paste entire JSON here as single line}'
   ```

### Step 4: Start the App

```powershell
npm run dev
```

Visit: http://localhost:9002

### Step 5: Log In and Create More Users

1. Log in with your Core account
2. Go to **Teams** page
3. Click **Add User** to create more accounts
4. Create teams and assign users

## 📋 Checklist

- [ ] Firestore rules deployed
- [ ] First Core account created
- [ ] Firebase Admin SDK configured (for user creation)
- [ ] App running on localhost:9002
- [ ] Can log in with Core account
- [ ] Can create users and teams

## 🎯 Next Steps

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

4. **Test Chat:**
   - Send messages in team chats
   - Test common chat

5. **Upload Files:**
   - Upload files to teams
   - Test file access

## 📚 Documentation

- `CREATE_FIRST_CORE_ACCOUNT.md` - Detailed Core account creation
- `FIREBASE_ADMIN_SETUP.md` - Admin SDK setup
- `FIREBASE_DEPLOYMENT_GUIDE.md` - Rules deployment guide
- `FIRESTORE_ENTERPRISE_SETUP.md` - Free tier optimization
- `IMPLEMENTATION_SUMMARY.md` - Complete feature list

## ⚠️ Important Notes

- **Billing must be enabled** for Enterprise Edition (but free tier is free)
- **First Core account** must be created manually
- **Firestore rules** must be deployed before app works properly
- **PWA icons** need to be added to `public/` folder (optional)
- **Monitor usage** in Firebase Console to stay within free tier

## 🆘 Troubleshooting

**Can't deploy rules?**
- Enable billing first
- Wait a few minutes after enabling
- Check you're logged in: `firebase login`

**Can't log in?**
- Verify user profile exists in Firestore
- Check `role` field is set to `Core`
- Verify User UID matches between Auth and Firestore

**User creation not working?**
- Check Firebase Admin SDK is configured
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
- Check server logs for errors

