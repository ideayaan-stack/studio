# Capacitor Setup Guide for Ideayaan

This guide will help you convert your Next.js web app into a native mobile app using Capacitor.

## Prerequisites

- Node.js 18+ installed
- Android Studio installed (for Android development)
- Xcode installed (for iOS development - Mac only)
- Your Next.js app working locally

## Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

## Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted, enter:
- **App name**: `Ideayaan`
- **App ID**: `com.ideayaan.app` (or your preferred bundle ID like `com.yourcompany.ideayaan`)
- **Web dir**: `.next` (or `out` if using static export)

This will create a `capacitor.config.ts` file.

## Step 3: Build Your Next.js App

First, you need to build your Next.js app:

```bash
npm run build
```

**Important**: For Capacitor to work with Next.js, you have two options:

### Option A: Static Export (Recommended for Capacitor)

1. Update `next.config.ts`:

```typescript
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Add this line
  images: {
    unoptimized: true, // Add this for static export
    remotePatterns: [
      // ... your existing patterns
    ]
  },
  // ... rest of your config
};

export default nextConfig;
```

2. Build:
```bash
npm run build
```

3. Update `capacitor.config.ts`:
```typescript
webDir: 'out'
```

### Option B: Use Next.js Server (More Complex)

Keep your Next.js server running and point Capacitor to it. This requires more setup.

**For this guide, we'll use Option A (Static Export).**

## Step 4: Update Capacitor Config

Edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ideayaan.app',
  appName: 'Ideayaan',
  webDir: 'out', // Change to 'out' if using static export
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#3b82f6'
    }
  }
};

export default config;
```

## Step 5: Add Platforms

### For Android:

```bash
npx cap add android
```

### For iOS (Mac only):

```bash
npx cap add ios
```

## Step 6: Sync Your App

After making changes to your web app, sync them to native:

```bash
npm run build
npx cap sync
```

**Always run `npm run build` before `npx cap sync`!**

## Step 7: Open in Native IDEs

### Android:

```bash
npx cap open android
```

This opens Android Studio. Then:
1. Wait for Gradle sync to complete
2. Connect an Android device or start an emulator
3. Click the "Run" button (green play icon)
4. Your app will build and install on the device

### iOS (Mac only):

```bash
npx cap open ios
```

This opens Xcode. Then:
1. Select a simulator or connected device
2. Click the "Run" button (play icon)
3. Your app will build and run

## Step 8: Configure Firebase for Native

### Android Setup:

1. **Download `google-services.json`**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `ideayaan-cd964`
   - Project Settings → Your apps → Android app
   - If no Android app exists, click "Add app" → Android
   - Package name: `com.ideayaan.app` (must match your app ID)
   - Download `google-services.json`

2. **Place the file**:
   - Copy `google-services.json` to `android/app/`

3. **Update `android/build.gradle`**:
   ```gradle
   buildscript {
       dependencies {
           classpath 'com.google.gms:google-services:4.4.0'
       }
   }
   ```

4. **Update `android/app/build.gradle`**:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

### iOS Setup:

1. **Download `GoogleService-Info.plist`**:
   - Go to Firebase Console
   - Project Settings → Your apps → iOS app
   - If no iOS app exists, click "Add app" → iOS
   - Bundle ID: `com.ideayaan.app` (must match your app ID)
   - Download `GoogleService-Info.plist`

2. **Place the file**:
   - Copy `GoogleService-Info.plist` to `ios/App/App/`
   - In Xcode, right-click the file and select "Add Files to App"

3. **Install Firebase iOS SDK**:
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```

## Step 9: Install Firebase Plugins

```bash
npm install @capacitor-community/firebase-analytics
npm install @capacitor-community/firebase-crashlytics
```

## Step 10: Update Your Code for Native

### Update Firebase Config

Your existing Firebase config should work, but you may need to add native-specific initialization.

### Handle Deep Links

Update your routing to handle deep links properly in native apps.

## Step 11: Build and Test

### Android:

1. Build APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   APK will be in `android/app/build/outputs/apk/debug/`

2. Build AAB (for Play Store):
   ```bash
   ./gradlew bundleRelease
   ```
   AAB will be in `android/app/build/outputs/bundle/release/`

### iOS:

1. In Xcode:
   - Select "Any iOS Device" or a specific device
   - Product → Archive
   - Follow the prompts to upload to App Store Connect

## Step 12: Publishing

### Android (Google Play):

1. Create a Google Play Developer account ($25 one-time fee)
2. Create a new app in Google Play Console
3. Upload the AAB file
4. Fill in store listing, screenshots, etc.
5. Submit for review

### iOS (App Store):

1. Create an Apple Developer account ($99/year)
2. Create an app in App Store Connect
3. Archive and upload from Xcode
4. Fill in app information, screenshots, etc.
5. Submit for review

## Common Issues and Solutions

### Issue: "Web dir not found"

**Solution**: Make sure you've run `npm run build` before `npx cap sync`

### Issue: Firebase not working in native

**Solution**: 
- Make sure you've added `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
- Check that your app ID matches in Firebase Console
- Rebuild the native app after adding Firebase files

### Issue: Images not loading

**Solution**: 
- Make sure `images.unoptimized: true` is set in `next.config.ts` for static export
- Check that image paths are correct (use relative paths)

### Issue: Routing not working

**Solution**: 
- Make sure you're using Next.js static export
- Check that all routes are properly configured
- Test deep linking if needed

## Development Workflow

1. **Make changes to your web app**
2. **Build**: `npm run build`
3. **Sync**: `npx cap sync`
4. **Test**: `npx cap open android` or `npx cap open ios`
5. **Repeat**

## Tips

- Always test on real devices, not just emulators
- Use `npx cap copy` for faster sync (only copies files, doesn't update native code)
- Use `npx cap sync` when you add new plugins or change config
- Keep your Firebase config files updated
- Test offline functionality if you've implemented it

## Next Steps

1. **Add App Icons**: Replace default icons in `android/app/src/main/res/` and `ios/App/App/Assets.xcassets/`
2. **Add Splash Screen**: Customize splash screen images
3. **Configure Permissions**: Add camera, storage permissions if needed
4. **Test on Devices**: Test on real Android and iOS devices
5. **Optimize Performance**: Profile and optimize your app

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Firebase for Mobile](https://firebase.google.com/docs/mobile)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

---

**Ready to start?** Follow the steps above in order, and you'll have your native app running in no time! 🚀

