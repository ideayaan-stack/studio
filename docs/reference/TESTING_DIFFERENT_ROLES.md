# Testing Different User Roles

This guide shows you how to test the app with different user roles (Core, Semi-core, Head, Volunteer).

## Prerequisites

1. ✅ First Core account created
2. ✅ Firebase Admin SDK configured (for user creation)
3. ✅ App running on http://localhost:9002

## Step-by-Step: Create Test Users

### Method 1: Using the App UI (Recommended)

1. **Log in as Core user**
   - Go to http://localhost:9002/login
   - Log in with your Core account

2. **Create Users:**
   - Navigate to **Teams** page
   - Click **Add User** button
   - Create users with different roles:
     - **Semi-core user**: Role = "Semi-core", Team = (any team or no team)
     - **Head user**: Role = "Head", Team = (select a team)
     - **Volunteer user**: Role = "Volunteer", Team = (select a team)

3. **Create Teams:**
   - On Teams page, click **Create Team**
   - Create teams like "Media Team", "Technical Team", etc.
   - Assign team heads if needed

### Method 2: Manual Creation in Firebase Console

If UI creation isn't working yet, create users manually:

1. **Create Auth User:**
   - Firebase Console → Authentication → Add user
   - Enter email and password
   - Copy the User UID

2. **Create User Profile:**
   - Firestore → `users` collection
   - Add document with User UID as document ID
   - Set fields:
     ```
     uid: [User UID]
     email: [Email]
     displayName: [Name]
     role: [Core | Semi-core | Head | Volunteer]
     teamId: [Team ID or ""]
     ```

## Testing Each Role

### 🔴 Core User

**What to Test:**
- ✅ Can see all teams and users
- ✅ Can create users and teams
- ✅ Can change user roles and assign teams
- ✅ Can see all tasks across all teams
- ✅ Can create tasks for any team
- ✅ Can chat in all team chats + Community
- ✅ Can upload files to any team
- ✅ Can see all files

**Expected Behavior:**
- Dashboard shows data from all teams
- Teams page shows all teams with "Create Team" and "Add User" buttons
- Can manage permissions (change roles, assign teams)
- All navigation tabs visible

### 🟡 Semi-core User

**What to Test:**
- ✅ Can see all teams and users
- ❌ CANNOT create users or teams
- ❌ CANNOT change user roles or manage permissions
- ✅ Can see all tasks
- ✅ Can create tasks for any team
- ✅ Can chat in all team chats + Community
- ✅ Can upload files to any team
- ✅ Can see all files

**Expected Behavior:**
- Dashboard shows data from all teams
- Teams page shows all teams but NO "Create Team" or "Add User" buttons
- Cannot see permission management options
- All navigation tabs visible (except Teams management features)

**To Create:**
- Role: `Semi-core`
- Team: Can be assigned to a team or left empty

### 🟢 Head User

**What to Test:**
- ✅ Can see only their team
- ✅ Can see team members
- ❌ CANNOT create users or teams
- ✅ Can see tasks for their team
- ✅ Can create tasks for their team
- ✅ Can chat in their team chat + Community
- ✅ Can upload files to their team
- ✅ Can see files for their team

**Expected Behavior:**
- Dashboard shows only their team's data
- Teams page shows only their team
- Can create tasks but only for their team
- Navigation: Dashboard, Tasks, Files, Chat (Teams page limited)

**To Create:**
- Role: `Head`
- Team: Must be assigned to a team (set `teamId` to a team ID)

### 🔵 Volunteer User

**What to Test:**
- ❌ CANNOT access Teams page (shows access denied)
- ✅ Can see tasks assigned to them
- ✅ Can update task status
- ✅ Can chat in their team chat + Community
- ✅ Can upload files to their team
- ✅ Can see files for their team

**Expected Behavior:**
- Dashboard shows only their assigned tasks
- Teams page shows "Access Denied" message
- Can only update status of tasks assigned to them
- Navigation: Dashboard, Tasks, Files, Chat (no Teams)

**To Create:**
- Role: `Volunteer`
- Team: Must be assigned to a team (set `teamId` to a team ID)

## Quick Test Scenarios

### Scenario 1: Test Permission Hierarchy

1. **As Core:**
   - Create a Semi-core user
   - Create a Head user
   - Create a Volunteer user
   - Create a team and assign Head to it

2. **Log out and log in as Semi-core:**
   - Verify you can see all teams
   - Try to create a user → Should fail or button hidden
   - Try to change a user's role → Should fail or option hidden

3. **Log out and log in as Head:**
   - Verify you see only your team
   - Verify you can create tasks for your team
   - Verify you cannot access other teams

4. **Log out and log in as Volunteer:**
   - Verify Teams page shows access denied
   - Verify you can only see your assigned tasks
   - Verify you can update task status

### Scenario 2: Test Chat Hierarchy

1. **As Core/Semi-core:**
   - Should see "Community" + all team chats
   - Can send messages in any chat

2. **As Head/Volunteer:**
   - Should see "Community" + only their team chat
   - Can send messages in Community and their team chat

### Scenario 3: Test Task Assignment

1. **As Core/Semi-core:**
   - Create a task
   - Assign to any user in any team

2. **As Head:**
   - Create a task
   - Can only assign to users in your team

3. **As Volunteer:**
   - Cannot create tasks
   - Can only update status of assigned tasks

## Common Issues & Solutions

### "Cannot create user"
- **Check:** Firebase Admin SDK configured (`.env.local` file exists)
- **Check:** You're logged in as Core user
- **Check:** User profile has `role: "Core"` in Firestore

### "Access Denied" on Teams page
- **Expected** for Volunteers
- **Check:** User's role in Firestore
- **Check:** User has `teamId` set if they're Head/Volunteer

### "Cannot see tasks"
- **Check:** User has `teamId` set (for Head/Volunteer)
- **Check:** Tasks have correct `teamId` matching user's team
- **Check:** For Volunteers, tasks must be assigned to them (`assignee.uid`)

### "Cannot chat"
- **Check:** User has `teamId` set (for Head/Volunteer)
- **Check:** Messages collection exists in Firestore
- **Check:** Firestore rules are deployed

## Test Data Setup

### Recommended Test Users

Create these users for comprehensive testing:

1. **Core Admin** (you)
   - Role: Core
   - Team: "" (empty)

2. **Semi-core Manager**
   - Role: Semi-core
   - Team: "" (can see all) or assign to a team

3. **Media Team Head**
   - Role: Head
   - Team: "media-team-id"

4. **Media Team Volunteer**
   - Role: Volunteer
   - Team: "media-team-id"

5. **Technical Team Head**
   - Role: Head
   - Team: "technical-team-id"

6. **Technical Team Volunteer**
   - Role: Volunteer
   - Team: "technical-team-id"

### Recommended Teams

1. **Media Team**
   - Head: Media Team Head
   - Members: Media Team Volunteer

2. **Technical Team**
   - Head: Technical Team Head
   - Members: Technical Team Volunteer

## Verification Checklist

After creating users, verify:

- [ ] Core can create users and teams
- [ ] Semi-core can see all but cannot create users/teams
- [ ] Semi-core cannot change permissions
- [ ] Head sees only their team
- [ ] Head can create tasks for their team
- [ ] Volunteer cannot access Teams page
- [ ] Volunteer can only see assigned tasks
- [ ] Chat shows correct chats per role
- [ ] Files are scoped correctly per role
- [ ] Dashboard shows correct data per role

## Quick Commands

**Switch between users:**
- Just log out and log in with different credentials
- No need to clear cache or restart server

**Check user role in Firestore:**
- Firebase Console → Firestore → `users` collection
- Find user document → Check `role` field

**Check team assignments:**
- Firebase Console → Firestore → `teams` collection
- Check `members` array and `head` field

---

**Tip:** Use browser incognito/private windows to test multiple users simultaneously!

