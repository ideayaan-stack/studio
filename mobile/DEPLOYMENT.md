# Deployment Guide

This guide outlines the steps to build and deploy the Ideayaan mobile application for Android and iOS.

## Prerequisites

-   **EAS CLI**: Install the Expo Application Services CLI globally:
    ```bash
    npm install -g eas-cli
    ```
-   **Expo Account**: Log in to your Expo account:
    ```bash
    eas login
    ```
-   **Configuration**: Ensure `eas.json` is configured correctly (already set up in the project).

## Android Build (APK)

To generate an APK file for testing or manual distribution:

1.  Run the build command:
    ```bash
    eas build -p android --profile preview
    ```
2.  Wait for the build to complete. EAS will provide a download link for the `.apk` file.
3.  Install the APK on your Android device.

## Android Build (Play Store - AAB)

To generate an Android App Bundle (AAB) for the Google Play Store:

1.  Run the build command:
    ```bash
    eas build -p android --profile production
    ```
2.  Once the build is complete, download the `.aab` file.
3.  Upload the `.aab` file to the Google Play Console.

## iOS Build (TestFlight / App Store)

*Note: You need an Apple Developer Account ($99/year).*

1.  Run the build command:
    ```bash
    eas build -p ios --profile production
    ```
2.  EAS will handle signing and certificate generation.
3.  Once built, you can submit the app to TestFlight or the App Store via App Store Connect.

## Over-the-Air (OTA) Updates

For minor JavaScript/asset changes, you can publish an update without a full store rebuild:

1.  Publish update:
    ```bash
    eas update --branch preview --message "Fixing bug X"
    ```
2.  Users will receive the update the next time they open the app.

## Troubleshooting

-   **Build Fails**: Check the logs provided by the EAS dashboard link. Common issues include missing dependencies or configuration errors.
-   **Permissions**: Ensure `app.json` includes all necessary permissions (Camera, Storage, etc.).
-   **Environment Variables**: Verify that your secrets are set in EAS Secrets if they are not included in the bundle.
