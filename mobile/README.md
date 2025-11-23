# Ideayaan Mobile App

Ideayaan is a comprehensive project management and collaboration tool designed for student clubs and organizations. This mobile application extends the functionality of the Ideayaan web platform to iOS and Android devices.

## Features

-   **Dashboard**: Overview of tasks, meetings, and recent activity.
-   **Tasks**: Create, assign, and manage tasks with deadlines and priorities.
-   **Teams**: View team members, roles, and contact information.
-   **Chat**: Real-time messaging with teams and individuals.
-   **Files**: Access and manage shared documents.
-   **Role-Based Access**: Tailored experience for Core, Semi-Core, Heads, and Volunteers.

## Tech Stack

-   **Framework**: React Native with Expo (Expo Router)
-   **Language**: TypeScript
-   **Styling**: NativeWind (Tailwind CSS)
-   **Backend**: Firebase (Firestore, Auth, Storage)
-   **Performance**: FlashList, Expo Image

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   npm or yarn
-   Expo Go app on your mobile device (or Android Studio/Xcode for simulation)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/ideayaan-mobile.git
    cd ideayaan-mobile
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    Create a `.env` file in the root directory and add your Firebase configuration:
    ```env
    EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  Start the development server:
    ```bash
    npx expo start
    ```

5.  Scan the QR code with Expo Go or press `a` for Android Emulator / `i` for iOS Simulator.

## Project Structure

-   `app/`: Expo Router pages and layouts.
-   `components/`: Reusable UI components.
-   `lib/`: Utilities, types, and helper functions.
-   `firebase/`: Firebase configuration and hooks.
-   `assets/`: Images and fonts.

## Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License.
