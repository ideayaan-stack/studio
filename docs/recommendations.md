# Recommendations for Ideayaan Studio App

## 1. Database Optimization (Firestore)

To ensure the application remains fast and responsive as data grows, we recommend the following optimizations:

### Composite Indexes
Firestore requires composite indexes for complex queries involving multiple fields (e.g., filtering by `teamId` and sorting by `deadline`).

**Recommended Indexes:**

1.  **Tasks Collection:**
    *   Fields: `teamId` (Ascending) + `deadline` (Ascending)
    *   Fields: `teamId` (Ascending) + `status` (Ascending)
    *   Fields: `assignee.uid` (Ascending) + `deadline` (Ascending)

2.  **Meetings Collection:**
    *   Fields: `teamId` (Ascending) + `scheduledDate` (Ascending)

**How to Create:**
*   When you run the app and a query fails due to a missing index, the console will log a link. Click that link to automatically create the index in the Firebase Console.
*   Alternatively, go to Firebase Console > Firestore Database > Indexes and create them manually.

### Data Structure
*   **Archiving:** Consider moving completed tasks older than 30 days to a separate `archived_tasks` collection to keep the main `tasks` collection small and queries fast.

## 2. Storage Solution (Images & Files)

### Current State
*   The app currently supports **ImgBB** for some image uploads and **Firebase Storage** for others (e.g., mobile profile pictures).

### Recommendation: Migrate Fully to Firebase Storage
We strongly recommend consolidating all file and image storage to **Firebase Storage**.

**Why?**
1.  **Security:** Firebase Storage integrates directly with Firebase Authentication. You can write security rules (e.g., "only team members can view team files"). ImgBB links are public.
2.  **Performance:** Firebase Storage is backed by Google Cloud Storage and is highly performant.
3.  **Cost:** Firebase Storage has a generous free tier (5GB) which is sufficient for thousands of optimized images. ImgBB has limits and is a third-party dependency.
4.  **Integration:** Easier to manage in one console.

**Action Plan:**
1.  Update the Web App to use Firebase Storage for profile pictures and team icons (similar to the Mobile App implementation).
2.  Update the File Upload feature to use Firebase Storage instead of any other service.
3.  (Optional) Write a script to migrate existing ImgBB URLs to Firebase Storage if needed.

## 3. Email Notifications

### Issue
Email notifications were failing because the `EmailJS` configuration keys were missing from the environment variables.

### Fix
1.  Create a `.env.local` file in the `studio` directory (root of web app).
2.  Add the following keys (get them from your EmailJS dashboard):
    ```env
    NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
    ```
3.  Use the new **Test Email Page** at `/dashboard/test-email` to verify the configuration.

## 4. General Performance

*   **Code Splitting:** The app uses Next.js, which handles code splitting automatically. Ensure large libraries (like `recharts` or `xlsx`) are only imported where needed.
*   **Image Optimization:** Use `next/image` for all images to automatically resize and optimize them.
*   **Memoization:** We have optimized `useCollection` hooks to prevent unnecessary re-renders. Continue using `useMemo` for expensive calculations in components.
