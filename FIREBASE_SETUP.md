# Firebase Authentication Setup Guide

## Prerequisites
- A Google account
- Node.js and npm installed

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

## Step 2: Enable Authentication Methods

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click on the "Sign-in method" tab
3. Enable the following sign-in providers:
   - **Email/Password**: Click on it and toggle "Enable"
   - **Google**: Click on it, toggle "Enable", and provide a project support email

## Step 3: Register Your Web App

1. In your Firebase project overview, click the web icon (`</>`) to add a web app
2. Give your app a nickname (e.g., "Web Diary")
3. You don't need to set up Firebase Hosting right now
4. Click "Register app"

## Step 4: Get Your Firebase Configuration

After registering your app, you'll see a config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 5: Configure Your Environment Variables

1. Open the `.env` file in the root of your project
2. Replace the placeholder values with your actual Firebase configuration:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 6: Configure Authorized Domains

For Google Sign-In to work, you need to add your domain to authorized domains:

1. In Firebase Console, go to Authentication > Settings > Authorized domains
2. Add `localhost` (should already be there)
3. Add your production domain when you deploy

## Step 7: Run Your Application

```bash
npm install
npm run dev
```

Your app should now be running with Firebase authentication!

## Features Implemented

✅ Email/Password Registration
✅ Email/Password Sign In
✅ Google Sign In
✅ Protected Routes (requires authentication)
✅ Logout functionality
✅ Beautiful UI with tabs for Sign In/Sign Up
✅ Error handling and toast notifications

## Troubleshooting

### "Firebase: Error (auth/popup-blocked)"
- Allow popups in your browser for localhost
- Or use redirect-based authentication instead

### "Firebase: Error (auth/unauthorized-domain)"
- Make sure your domain is added to authorized domains in Firebase Console

### "Firebase: Error (auth/invalid-api-key)"
- Double-check your `.env` file has the correct API key
- Make sure there are no extra spaces or quotes
- Restart your dev server after changing `.env`

## Security Notes

⚠️ **Important**: 
- Never commit your `.env` file to version control
- The `.gitignore` file has been updated to exclude `.env` files
- Use environment variables in production (e.g., Vercel, Netlify environment settings)

## Next Steps

Consider implementing:
- Email verification
- Password reset functionality
- Profile management
- OAuth providers (GitHub, Facebook, etc.)
- Firestore for storing diary entries in the cloud
