# How to Create Your First Core Account

Since only Core users can create other accounts, you need to create the first Core account manually in Firebase Console.

## Method 1: Using Firebase Console (Recommended)

### Step 1: Create User in Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `studio-2788856224-eb316`
3. Navigate to **Authentication** → **Users** tab
4. Click **Add user**
5. Enter:
   - **Email**: Your email (e.g., `your-email@example.com`)
   - **Password**: A secure password (minimum 6 characters)
6. Click **Add user**
7. **Copy the User UID** that appears (you'll need this in the next step)

### Step 2: Create User Profile in Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click on the **users** collection (create it if it doesn't exist)
3. Click **Add document**
4. Set the **Document ID** to the **User UID** you copied in Step 1
5. Add the following fields:

```
Field Name          Type      Value
─────────────────────────────────────────────────────
uid                 string    [The User UID from Step 1]
email               string    [Your email address]
displayName         string    [Your name]
role                string    Core
teamId              string    [Leave empty or ""]
photoURL            string    [Leave empty or null]
```

6. Click **Save**

### Step 3: Verify

1. Go to your app: `http://localhost:9002/login`
2. Log in with the email and password you created
3. You should now have Core access and can create other users!

## Method 2: Using Firebase CLI (Alternative)

If you prefer command line:

```bash
# Install Firebase Tools if not already installed
npm install -g firebase-tools

# Create user via CLI (requires Admin SDK setup)
firebase auth:import users.json
```

## Method 3: Temporary Script (One-time use)

Create a temporary script `scripts/create-core-user.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../path-to-your-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createCoreUser() {
  const email = 'your-email@example.com';
  const password = 'YourSecurePassword123!';
  const displayName = 'Your Name';

  // Create auth user
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName,
  });

  // Create user profile
  await admin.firestore().collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: userRecord.email,
    displayName: userRecord.displayName,
    role: 'Core',
    teamId: '',
    photoURL: null,
  });

  console.log('Core user created successfully!');
  console.log('UID:', userRecord.uid);
  console.log('Email:', email);
}

createCoreUser().then(() => process.exit(0)).catch(console.error);
```

Run: `node scripts/create-core-user.js`

## Important Notes

- **After creating the first Core account**, you can use the app's UI to create all other accounts
- **Never share Core account credentials** - Core users have full system access
- **Create Semi-core accounts** for trusted team members who need to manage teams/tasks but not permissions
- **The first Core account** should be your main admin account

## Troubleshooting

If you can't log in:
1. Check that the user profile exists in Firestore with `role: 'Core'`
2. Verify the User UID matches between Auth and Firestore
3. Check browser console for errors
4. Ensure Firestore rules are deployed correctly

