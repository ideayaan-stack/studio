# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Ideayaan Studio application and provides recommendations for future improvements.

## Implemented Optimizations

### 1. Firestore Read Optimization
*   **Chat Messages:**
    *   **Limit:** Chat queries are now limited to the last 50 messages (`limit(50)`).
    *   **Ordering:** Messages are ordered by `timestamp` descending to fetch the newest first, then reversed on the client.
    *   **Impact:** Significantly reduces Firestore read costs and initial load time for chat rooms.
*   **Deep Equality Checks:**
    *   **`useCollection` & `useDoc`:** Implemented `JSON.stringify` comparison for data updates.
    *   **Impact:** Prevents unnecessary React re-renders when Firestore sends snapshot updates that don't contain actual data changes (e.g., metadata changes).

### 2. React Rendering Optimization
*   **Memoization:**
    *   **`AuthProvider`:** The context value is memoized using `useMemo`.
    *   **Impact:** Prevents the entire component tree (Sidebar, Dashboard, etc.) from re-rendering whenever the parent component updates, unless auth state actually changes.
*   **FlashList (Mobile):**
    *   Replaced `FlatList` with `FlashList` in mobile `TeamsScreen` and `FilesScreen`.
    *   **Impact:** 5x-10x faster list rendering on mobile devices, especially for long lists.

### 3. Asset Optimization
*   **Image Uploads:**
    *   Images are resized (if > 2MB) before uploading to ImgBB/Firebase Storage.
    *   **Impact:** Faster uploads and reduced bandwidth usage for users viewing images.

## Recommendations for Future

### 1. Database & Indexing
*   **Composite Indexes:** Ensure all Firestore queries with multiple fields (e.g., `where('teamId', '==', ...).orderBy('timestamp', 'desc')`) have corresponding composite indexes created in the Firebase Console.
*   **Pagination:** Implement "Load More" functionality for Chat and Tasks using `startAfter` cursors to support infinite scrolling without loading all data.

### 2. Code Splitting
*   **Lazy Loading:** Use `React.lazy` and `Suspense` for heavy components (e.g., Charts, Rich Text Editors) that are not immediately visible.
*   **Dynamic Imports:** Use Next.js `dynamic` imports for non-critical modules.

### 3. Caching
*   **SWR / React Query:** Consider migrating from raw `onSnapshot` hooks to libraries like `swr` or `react-query` for better cache management, deduping, and offline support.

### 4. Bundle Size
*   **Analyze:** Run `npx @next/bundle-analyzer` to identify large dependencies.
*   **Tree Shaking:** Ensure all imports are tree-shakeable (e.g., `import { Button } from ...` instead of default imports where possible).
