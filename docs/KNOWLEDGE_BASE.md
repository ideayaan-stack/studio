# Ideayaan - Master Knowledge Base

This document consolidates all project documentation, setup guides, and technical references into a single source of truth.

---

## 1. Project Overview

**App Name:** (Internal: Ideayaan)
**Purpose:** A role-based event and team management system for college committees.

### Core Features
- **Role-Based Authentication:** Secure login with roles (Core, Semi-core, Head, Volunteer).
- **Team Management:** Create/edit teams, assign members.
- **Task Management:** Assign tasks, track progress, deadlines.
- **Document Management:** File uploads with role-based access.
- **Communication:** Real-time team chat and notifications.
- **Dashboard:** Modern, mobile-responsive UI with dark mode.

### Design System
- **Colors:** Light Blue (`#ADD8E6`) primary, Soft Orange (`#FFB347`) accent.
- **Typography:** Inter (Body), Poppins (Headlines).
- **Theme:** System/Light/Dark mode support.

---

## 2. Setup & Installation

### Quick Start
1.  **Install Dependencies:** `npm install`
2.  **Env Variables:** Create `.env.local` using the template below.
3.  **Run Dev Server:** `npm run dev`

### Environment Configuration (`.env.local`)
```env
# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Backend Admin (Required for API routes)
FIREBASE_SERVICE_ACCOUNT_JSON=...

# Email Service (Brevo - Preferred)
BREVO_SMTP_USER=your_email@example.com
BREVO_SMTP_KEY=your_smtp_key
NEXT_PUBLIC_SENDER_EMAIL=noreply@ideayaan.com

# Image Storage (Optional - Defaults to Base64)
NEXT_PUBLIC_IMGBB_API_KEY=...
```

### Email Setup (Brevo SMTP)
We migrated from EmailJS to Brevo for higher free limits (300 emails/day).
1.  Sign up at [Brevo.com](https://www.brevo.com/).
2.  Go to **SMTP & API** -> **SMTP**.
3.  Generate a key and add to `.env.local`.

---

## 3. Mobile App Development

The mobile app is located in the `mobile/` directory and is built with **Expo (React Native)**.

### Development Steps
1.  Navigate to mobile folder: `cd mobile`
2.  Install dependencies: `npm install`
3.  Start Expo: `npx expo start`
4.  Scan QR code with **Expo Go** app on your phone.

### Architecture
- **Framework:** Expo Router (File-based routing like Next.js).
- **Styling:** NativeWind (Tailwind CSS for React Native).
- **Storage:** `AsyncStorage` for persistence.
- **Navigation:** Tabs for Dashboard, Stack for specific flows.

---

## 4. Technical Architecture

### Data Models (Firestore)
*Schema definitions referenced from `backend.json`*

*   **Users (`/users/{uid}`)**: `displayName`, `email`, `role`, `teamId`, `photoURL`.
*   **Teams (`/teams/{id}`)**: `name`, `description`, `members` (array of UIDs), `head` (UID).
*   **Tasks (`/tasks/{id}`)**: `title`, `status`, `deadline`, `teamId`, `assignee` (object).
*   **Files (`/files/{id}`)**: `name`, `url`, `type`, `size`, `uploadDate`.

### Storage Strategy
*   **Primary:** Firebase Storage (Recommended for robustness).
*   **Fallback:** Base64 Encoding (Stored in Firestore `photoURL`).
    *   *Limit:* Images resized to max 400x400px, <500KB.
    *   *Usage:* Automatic fallback if external storage isn't configured.

---

## 5. Performance & Recommendations

### Optimizations Implemented
*   **Firestore:** deep equality checks in `useCollection`, limit(50) on chat messages.
*   **Rendering:** Memoized `AuthProvider`, use of `FlashList` on mobile.
*   **Assets:** Automatic image resizing before upload.

### Future Recommendations
1.  **Database:** Create Composite Indexes (console will prompt link).
2.  **Archiving:** Move old tasks to `archived_tasks`.
3.  **Storage:** Migrate fully to Firebase Storage for security rules and performance.
4.  **PWA:** Service Worker is configured via `@ducanh2912/next-pwa`.

---

## 6. Troubleshooting & History

### Common Issues
*   **"Maximum update depth exceeded"**: Caused by un-memoized Firestore queries. -> **Fixed** with `useMemo` / ref tracking.
*   **Email not sending**: Check `BREVO_SMTP_KEY` in `.env.local`.
*   **Images not uploading**: Check file size (<32MB for ImgBB, <500KB for Base64).

### Key Fixes
*   Fixed Theme Toggle (Dark/Light/System).
*   Fixed Appearance Settings tab navigations.
*   Resolved Infinite re-loops in `useCollection`.

---
*Created: December 2025 | Ideayaan Studio*
