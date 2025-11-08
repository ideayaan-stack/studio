# How to Create Teams Manually in Firebase

Since you need teams to test the app, here's how to create them manually in Firebase Console.

## Method 1: Firebase Console (Easiest)

### Step 1: Go to Firestore Database

1. Open [Firebase Console](https://console.firebase.google.com/project/ideayaan-cd964/firestore)
2. Select project: `ideayaan-cd964`
3. Click on **Firestore Database** tab

### Step 2: Create Teams Collection

1. If `teams` collection doesn't exist:
   - Click **Start collection**
   - Collection ID: `teams`
   - Click **Next**

2. If `teams` collection exists:
   - Click on `teams` collection
   - Click **Add document**

### Step 3: Add Team Document

**Document ID:** Leave empty (Firestore will auto-generate) OR use a custom ID like `media-team`

**Add Fields:**

| Field Name | Type   | Value                    |
|------------|--------|--------------------------|
| name       | string | Media Team               |
| description| string | Handles all media content|
| members    | array  | [] (empty array)        |
| head       | string | (optional - leave empty)|

**Example Teams to Create:**

**Team 1: Media Team**
```
name: "Media Team"
description: "Handles social media, graphics, and content creation"
members: [] (empty array)
head: "" (empty - can add later)
```

**Team 2: Technical Team**
```
name: "Technical Team"
description: "Manages technical infrastructure and development"
members: [] (empty array)
head: "" (empty)
```

**Team 3: Events Team**
```
name: "Events Team"
description: "Organizes and manages events"
members: [] (empty array)
head: "" (empty)
```

### Step 4: Save

Click **Save** after adding all fields.

## Method 2: Using Firebase CLI (Advanced)

If you prefer command line:

```powershell
# This requires Firebase Admin SDK setup
# Not recommended for manual testing
```

## Method 3: Copy-Paste JSON (Quick)

1. Go to Firestore Database
2. Click **Start collection** → `teams`
3. Click **Add document**
4. Click the **</>** icon (JSON view)
5. Paste this JSON:

```json
{
  "name": "Media Team",
  "description": "Handles all media content",
  "members": [],
  "head": ""
}
```

6. Click **Save**

## After Creating Teams

### Assign Users to Teams

1. Go to `users` collection
2. Find a user document
3. Edit the `teamId` field:
   - Value: The team document ID (e.g., `media-team` or the auto-generated ID)
4. Save

### Assign Team Head

1. Go to `teams` collection
2. Find the team document
3. Edit the `head` field:
   - Value: User UID of the team head
4. Also add the head to `members` array:
   - Click on `members` field
   - Click **Add item**
   - Enter the same User UID

## Quick Test Setup

**Create these teams for testing:**

1. **Media Team**
   - name: "Media Team"
   - description: "Media and content"
   - members: []
   - head: ""

2. **Technical Team**
   - name: "Technical Team"
   - description: "Technical operations"
   - members: []
   - head: ""

3. **Events Team**
   - name: "Events Team"
   - description: "Event management"
   - members: []
   - head: ""

## Verify Teams Created

1. Go to your app: http://localhost:9002
2. Log in as Core user
3. Go to Teams page
4. You should see the teams you created

## Troubleshooting

**Teams not showing:**
- Check Firestore rules are deployed
- Verify you're logged in as Core or Semi-core
- Check browser console for errors

**Cannot see teams:**
- Verify user profile has correct `role` in Firestore
- Check `teamId` is set correctly if you're Head/Volunteer

---

**Tip:** After creating teams manually, you can use the app UI to create more teams and assign users!

