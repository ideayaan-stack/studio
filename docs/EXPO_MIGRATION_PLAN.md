# Expo Migration Plan

This guide details the steps to migrate the existing Next.js application to a native mobile application using **Expo**.

## Prerequisites

- Node.js (LTS)
- Git
- Expo Go app installed on your physical device (iOS/Android)
- VS Code (recommended)

## Phase 1: Project Initialization

1.  **Create a new Expo project**:
    Run this command in a parent directory (not inside the Next.js project):
    ```bash
    npx create-expo-app@latest ideayaan-native
    cd ideayaan-native
    ```

2.  **Install dependencies**:
    We need to match the libraries used in the web app, but their React Native equivalents.
    ```bash
    npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
    npx expo install firebase
    npx expo install @react-native-async-storage/async-storage
    ```

3.  **Install NativeWind (Tailwind for React Native)**:
    Since the web app uses Tailwind CSS, NativeWind is the best choice to reuse styles.
    ```bash
    npm install nativewind tailwindcss
    ```
    *Follow the [NativeWind setup guide](https://www.nativewind.dev/quick-starts/expo) to configure `babel.config.js` and `tailwind.config.js`.*

## Phase 2: Navigation Structure (Expo Router)

Expo Router works similarly to Next.js App Router. We will map the structure:

| Next.js Path | Expo Router Path |
| :--- | :--- |
| `src/app/layout.tsx` | `app/_layout.tsx` |
| `src/app/page.tsx` | `app/index.tsx` |
| `src/app/dashboard/layout.tsx` | `app/dashboard/_layout.tsx` |
| `src/app/dashboard/page.tsx` | `app/dashboard/index.tsx` |
| `src/app/dashboard/teams/page.tsx` | `app/dashboard/teams.tsx` |

### Action Items:
1.  Create the `app` directory structure in the Expo project.
2.  In `app/dashboard/_layout.tsx`, use `<Tabs>` from `expo-router` to implement the bottom navigation. This replaces our custom `MobileNav` component.

```tsx
// app/dashboard/_layout.tsx
import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, CheckSquare, Folder, MessageSquare } from 'lucide-react-native';

export default function DashboardLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'orange' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      {/* Add other screens here */}
    </Tabs>
  );
}
```

## Phase 3: Component Migration

Most logic in `src/lib` can be copied directly. However, UI components need translation.

### Rules:
- **HTML Tags**: Replace `<div>` with `<View>`, `<span>`/`<p>` with `<Text>`, `<button>` with `<TouchableOpacity>` or `<Pressable>`.
- **Styling**: Use `className` with NativeWind.
  - *Note*: Not all CSS properties work in React Native (e.g., `grid`, complex `shadows`, `z-index` behaves differently).
- **Icons**: Use `lucide-react-native` instead of `lucide-react`.

### Migration Checklist:
- [ ] **Authentication**: Port `useAuth` hook.
  - *Critical*: Update Firebase config to use `AsyncStorage` for persistence.
  - See [Firebase Auth with React Native](https://firebase.google.com/docs/auth/web/react-native).
- [ ] **UI Components**: Port `Button`, `Input`, `Card` from `shadcn/ui` (or use a RN library like `rn-primitives` or `gluestack-ui`).
- [ ] **Forms**: `react-hook-form` works in RN! Just change the `Controller` render to use RN inputs.

## Phase 4: Firebase Integration

1.  Copy `src/firebase` folder to the Expo project.
2.  Update `firebase/config.ts`:
    ```ts
    import { initializeApp } from 'firebase/app';
    import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
    import AsyncStorage from '@react-native-async-storage/async-storage';

    const app = initializeApp(firebaseConfig);
    const auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    ```

## Phase 5: Testing & Polish

1.  Run `npx expo start`.
2.  Scan the QR code with your phone.
3.  Test the "Mobile First" feel.
4.  Adjust safe area insets using `SafeAreaView` from `react-native-safe-area-context`.

## Summary

This plan allows you to maintain the business logic while swapping the "View" layer for native components. The "Mobile Transformation" we did on the web app serves as a perfect prototype for the Expo app's structure.
