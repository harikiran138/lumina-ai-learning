# Firebase Deployment Guide

## Important: Deployment Strategy

Since Lumina AI Learning uses **Next.js Server Actions** (for Firebase Auth and Firestore operations), we have two deployment options:

### Option 1: Firebase Hosting + Cloud Functions (Recommended)
Deploy Next.js with full server-side support using Firebase Functions

### Option 2: Vercel (Simpler, Better Next.js Support)
Deploy to Vercel which natively supports Next.js server actions

**Recommendation**: Use **Vercel** for this project as it provides better Next.js integration and automatic scaling.

---

## Quick Deploy to Vercel (Recommended)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Configure Firebase Environment Variables

First, create your Firebase project and get credentials, then create `.env.local`:

```bash
cp .env.firebase.template .env.local
# Edit .env.local with your Firebase credentials
```

### Step 3: Deploy to Vercel

```bash
cd /Users/chepuriharikiran/Desktop/github/lumina-ai-learning
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No**
- What's your project's name? **lumina-ai-learning**
- In which directory is your code located? **.**
- Want to override settings? **No**

### Step 4: Add Environment Variables to Vercel

After deployment, add your Firebase environment variables:

```bash
# Add each Firebase env variable
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

Then redeploy:
```bash
vercel --prod
```

Your app will be live at: `https://lumina-ai-learning.vercel.app`

---

## Alternative: Firebase Hosting + Functions (Advanced)

If you prefer Firebase Hosting, follow these steps:

### Prerequisites

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com/
   - Create new project
   - Enable Firestore Database
   - Enable Authentication

2. **Install Firebase CLI**

```bash
npm install -g firebase-tools
```

### Step 1: Login to Firebase

```bash
firebase login
```

### Step 2: Initialize Firebase

```bash
cd /Users/chepuriharikiran/Desktop/github/lumina-ai-learning
firebase init
```

Select:
- **Hosting**: Configure files for Firebase Hosting
- **Functions**: Configure Cloud Functions (for Next.js backend)

Configuration:
- Use an existing project: Select your project
- Language for Functions: **TypeScript** or **JavaScript**
- Use ESLint: **Yes**
- Install dependencies: **Yes**
- Public directory: **out**
- Single-page app: **Yes**
- Set up automatic builds: **No**

### Step 3: Configure Next.js for Firebase

The `firebase.json` has been created. Now update `.firebaserc`:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### Step 4: Add Environment Variables

Create `.env.local` from the template:

```bash
cp .env.firebase.template .env.local
```

Edit `.env.local` with your Firebase credentials from the console.

### Step 5: Build and Deploy

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

---

## Post-Deployment Steps

### 1. Test Your Deployment

Visit your deployed URL and test:
- ✅ User registration
- ✅ User login
- ✅ Student dashboard
- ✅ Teacher dashboard
- ✅ Admin dashboard
- ✅ Course enrollment

### 2. Configure Firestore Security Rules

In Firebase Console, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
    
    match /progress/{progressId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
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

### 3. Set up Custom Domain (Optional)

#### For Vercel:
```bash
vercel domains add yourdomain.com
```

#### For Firebase:
- Go to Firebase Console → Hosting
- Click "Add custom domain"
- Follow DNS configuration steps

---

## Troubleshooting

### Build Errors

**Error: Firebase env variables not found**
- Make sure `.env.local` is created with Firebase credentials
- Redeploy after adding environment variables

**Error: Module not found**
- Run `npm install` to ensure all dependencies are installed

### Deployment Issues

**Vercel deployment fails**
- Check build logs: `vercel logs`
- Ensure all environment variables are set

**Firebase Functions timeout**
- Increase function timeout in `firebase.json`
- Check Cloud Functions logs in Firebase Console

---

## Quick Command Reference

### Vercel Commands
```bash
vercel                    # Deploy to preview
vercel --prod            # Deploy to production
vercel env ls            # List environment variables
vercel logs              # View deployment logs
vercel domains           # Manage domains
```

### Firebase Commands
```bash
firebase login           # Login to Firebase
firebase init            # Initialize project
firebase deploy          # Deploy everything
firebase deploy --only hosting    # Deploy hosting only
firebase serve           # Test locally
```

---

## Next Steps After Deployment

1. **Seed Initial Data**
   - Create admin user via registration
   - Add sample courses
   - Test all features

2. **Monitor Performance**
   - Check analytics in Vercel/Firebase dashboard
   - Monitor Firestore read/write usage
   - Set up error tracking (Sentry)

3. **Set up CI/CD** (Optional)
   - GitHub Actions for automatic deployment
   - Preview deployments for pull requests

---

## Recommended: Deploy Now with Vercel

Ready to deploy? Run these commands:

```bash
# Install Vercel CLI
npm install -g vercel

# Create .env.local with Firebase credentials
cp .env.firebase.template .env.local
# Edit .env.local with your Firebase project credentials

# Deploy
cd /Users/chepuriharikiran/Desktop/github/lumina-ai-learning
vercel
```

That's it! Your app will be live in minutes.
