# Ideayaan - Team Management Platform

A comprehensive, role-based team management and collaboration platform built with Next.js, Firebase, and TypeScript. Perfect for organizations, committees, and teams that need secure, hierarchical access control and real-time collaboration.

## 🚀 Features

- **Role-Based Access Control**: Core, Semi-core, Head, and Volunteer roles with hierarchical permissions
- **Team Management**: Create and manage teams with member assignment and team heads
- **Task Management**: Create, assign, and track tasks with status updates
- **Real-Time Chat**: Team-based chatrooms with real-time messaging
- **File Management**: Secure file uploads and storage per team
- **Dashboard Analytics**: Role-specific dashboards with team and task overviews
- **Mobile Responsive**: Fully responsive design for mobile and desktop
- **PWA Support**: Progressive Web App with offline capabilities

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Admin SDK**: Firebase Admin SDK for server-side operations
- **AI Integration**: Google Genkit for task suggestions

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase account (free tier works)
- Git

## 🛠️ Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd studio
npm install
```

### 2. Configure Firebase

1. **Get Firebase Config:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create or select project: `ideayaan-cd964`
   - Project Settings → General → Your apps → Web app
   - Copy the config object

2. **Update Firebase Config:**
   - Open `src/firebase/config.ts`
   - Replace with your Firebase config

### 3. Set Up Environment Variables

Create `.env.local` in the project root:

```env
# Firebase Admin SDK Service Account JSON
# Get from: https://console.firebase.google.com/project/ideayaan-cd964/settings/serviceaccounts/adminsdk
# Download JSON and paste entire content as single line
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"ideayaan-cd964",...}'
```

**See `.env.example` for format reference.**

### 4. Deploy Firestore Rules

```bash
# Login to Firebase
firebase login

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Create First Core Account

Since only Core users can create accounts, create the first one manually:

**See detailed guide:** [`docs/setup/CREATE_FIRST_CORE_ACCOUNT.md`](docs/setup/CREATE_FIRST_CORE_ACCOUNT.md)

**Quick steps:**
1. Firebase Console → Authentication → Add user (email + password)
2. Copy the User UID
3. Firestore Database → `users` collection → Add document
4. Set Document ID = User UID
5. Add fields:
   - `uid`: [User UID]
   - `email`: [Your email]
   - `displayName`: [Your name]
   - `role`: `Core`
   - `teamId`: `""` (empty string)

### 6. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:9002

## 📚 Documentation

### Setup Guides
- [`docs/setup/QUICK_START_GUIDE.md`](docs/setup/QUICK_START_GUIDE.md) - Complete setup walkthrough
- [`docs/setup/FIREBASE_ADMIN_SETUP.md`](docs/setup/FIREBASE_ADMIN_SETUP.md) - Admin SDK configuration
- [`docs/setup/CREATE_FIRST_CORE_ACCOUNT.md`](docs/setup/CREATE_FIRST_CORE_ACCOUNT.md) - First admin account
- [`docs/setup/MANUAL_TEAM_CREATION.md`](docs/setup/MANUAL_TEAM_CREATION.md) - Manual team setup

### Reference
- [`docs/reference/IMPLEMENTATION_SUMMARY.md`](docs/reference/IMPLEMENTATION_SUMMARY.md) - Feature documentation
- [`docs/reference/TESTING_DIFFERENT_ROLES.md`](docs/reference/TESTING_DIFFERENT_ROLES.md) - Role testing guide
- [`docs/reference/FIREBASE_DEPLOYMENT_GUIDE.md`](docs/reference/FIREBASE_DEPLOYMENT_GUIDE.md) - Deployment guide

### Fixes & Issues
- [`docs/fixes/FIXES_AND_ENHANCEMENTS.md`](docs/fixes/FIXES_AND_ENHANCEMENTS.md) - Recent fixes and improvements

## 🎯 Role Hierarchy

| Role | Permissions |
|------|-------------|
| **Core** | Full access: Create users/teams, manage permissions, view all data |
| **Semi-core** | Manage teams and tasks, view all data, cannot manage permissions |
| **Head** | Manage own team, create tasks for team, view team data only |
| **Volunteer** | View assigned tasks, update task status, upload files, team chat |

## 🏗️ Project Structure

```
studio/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── dashboard/    # Dashboard pages (teams, tasks, files, chat)
│   │   └── login/       # Authentication
│   ├── components/       # React components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   └── ui/          # Shadcn/UI components
│   ├── firebase/         # Firebase configuration and hooks
│   │   ├── actions/     # Server actions (Admin SDK)
│   │   └── auth/        # Authentication hooks
│   └── lib/              # Utilities and types
├── docs/                  # Documentation
│   ├── setup/            # Setup guides
│   ├── fixes/            # Fix documentation
│   └── reference/        # Reference docs
├── public/               # Static assets
├── firestore.rules       # Firestore security rules
└── firestore.indexes.json # Firestore indexes
```

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin SDK service account JSON | Yes (for user/team creation) |

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `FIREBASE_SERVICE_ACCOUNT_JSON`
4. Deploy

### Firebase Hosting

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Environment Variables in Production

Add `FIREBASE_SERVICE_ACCOUNT_JSON` to your hosting platform's environment variables.

## 🔒 Security

- **Firestore Rules**: Role-based access control enforced at database level
- **Authentication**:** Firebase Auth with email/password
- **Admin SDK**: Server-side operations bypass client-side rules
- **Environment Variables**: Never commit `.env.local` to git

## 📊 Firebase Free Tier Limits

- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Authentication**: 10K active users/month
- **Storage**: 5 GB storage, 1 GB/day downloads
- **Hosting**: 10 GB storage, 360 MB/day transfer

**For 200 concurrent users**, the free tier should be sufficient with proper optimization.

## 🐛 Troubleshooting

### Admin SDK Not Working

1. Check `.env.local` exists and has `FIREBASE_SERVICE_ACCOUNT_JSON`
2. Verify JSON is valid (no syntax errors)
3. Restart dev server after adding env var
4. Check server logs for specific error messages

### Can't Create Users/Teams

1. Verify Admin SDK is configured (see above)
2. Check you're logged in as Core user
3. Verify Firestore rules are deployed
4. Check browser console and server logs

### Permission Errors

1. Verify user role in Firestore `users` collection
2. Check Firestore rules are deployed
3. Ensure user profile exists with correct `role` field

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues and questions:
1. Check documentation in `docs/` folder
2. Review troubleshooting section above
3. Check Firebase Console for errors

## 🎉 Getting Started Checklist

- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Configure Firebase (`src/firebase/config.ts`)
- [ ] Set up Admin SDK (`.env.local`)
- [ ] Deploy Firestore rules
- [ ] Create first Core account
- [ ] Start dev server (`npm run dev`)
- [ ] Log in and test user/team creation

---

**Built with ❤️ for efficient team collaboration**
