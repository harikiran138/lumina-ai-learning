# Firebase Migration Guide

## Quick Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `lumina-ai-learning` (or your preferred name)
4. Disable Google Analytics (optional for development)
5. Click "Create project"

### 2. Enable Firebase Services

#### Enable Firestore Database
1. In Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose a location (e.g., us-central)
5. Click "Enable"

#### Enable Authentication
1. In Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save

### 3. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register your app with nickname: `lumina-web`
5. Copy the `firebaseConfig` object values

### 4. Configure Environment Variables

1. Copy the template file:
   ```bash
   cp .env.firebase.template .env.local
   ```

2. Edit `.env.local` and fill in your Firebase credentials:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456:web:abcdef"
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
   ```

### 5. Update Firestore Security Rules (Production)

For production, update Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Courses collection
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
    
    // Progress collection
    match /progress/{progressId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Community channels and messages
    match /community_channels/{channelId} {
      allow read: if request.auth != null;
    }
    
    match /community_messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

### 6. Create Firestore Indexes

For optimal query performance, create these composite indexes:

1. Collection: `progress`
   - Fields: `userId` (Ascending), `courseId` (Ascending)
   
2. Collection: `progress`
   - Fields: `courseId` (Ascending), `userId` (Ascending)

3. Collection: `community_messages`
   - Fields: `channelId` (Ascending), `createdAt` (Ascending)

### 7. Seed Initial Data (Optional)

Create initial users and courses in Firestore Console or use the registration flow.

Example user document in `users` collection:
```json
{
  "email": "admin@lumina.ai",
  "name": "Admin User",
  "role": "admin",
  "status": "active",
  "avatar": "https://ui-avatars.com/api/?name=Admin+User&background=random",
  "createdAt": "2025-12-06T12:00:00.000Z",
  "bio": "",
  "skills": [],
  "location": ""
}
```

### 8. Run the Application

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and test the registration and login flow.

## Migration from MongoDB

If you have existing MongoDB data, you'll need to:

1. Export data from MongoDB collections
2. Transform IDs (MongoDB ObjectId → Firebase document IDs)
3. Import into Firestore using Firebase Admin SDK

## Troubleshooting

### Error: "Firebase: Error (auth/configuration-not-found)"
- Make sure all environment variables are set in `.env.local`
- Restart the development server after changing `.env.local`

### Error: "Missing or insufficient permissions"  
- Update Firestore security rules in Firebase Console
- Make sure you're signed in with a valid user

### Build Errors
- Make sure all Firebase packages are installed: `npm install`
- Clear Next.js cache: `rm -rf .next` and rebuild

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Get Started](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
