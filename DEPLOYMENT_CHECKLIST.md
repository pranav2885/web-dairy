# Deployment Checklist for Vercel

## Issues Fixed

### 1. ✅ Deprecated Meta Tag
- Added `<meta name="mobile-web-app-capable" content="yes">` to [index.html](index.html)
- Kept `apple-mobile-web-app-capable` for iOS compatibility

### 2. ✅ Auth Persistence
- Configured Firebase Auth to use `browserLocalPersistence` in [firebase.ts](src/lib/firebase.ts)
- Auth state now persists across browser sessions

### 3. ✅ Enhanced Error Logging
- Added detailed logging with `[Sync]` and `[Auth]` prefixes
- Tracks sync statistics (added, updated, conflicts, skipped)
- Better error messages for debugging

### 4. ✅ Retry Mechanism
- Added automatic retry for failed syncs
- 500ms delay before initial sync (ensures Firebase is ready)
- 2-second delay before retry attempt

## Firebase Configuration Required

### 1. Authorized Domains (CRITICAL for Google Sign-In)

To fix the CORS errors with Google Sign-In, you MUST add your Vercel domain to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `web-dairy`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domains:
   - `your-app.vercel.app`
   - `your-custom-domain.com` (if you have one)
   - Keep `localhost` for local development

### 2. Firestore Security Rules

Ensure your Firestore rules allow authenticated users to read/write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own entries
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Firestore Indexes

If you experience slow queries, create these indexes:

1. Collection: `entries`
   - Fields: `createdAt` (Descending), `syncStatus` (Ascending)
   - Query scope: Collection

2. Collection: `entries`
   - Fields: `userMood.category` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

### 4. Environment Variables (Optional)

For better security, consider moving Firebase config to environment variables:

Create `.env.local`:
```
VITE_FIREBASE_API_KEY=AIzaSyDQa2-CWAnVbUieKNTTj5Rajbaia0VxVbE
VITE_FIREBASE_AUTH_DOMAIN=web-dairy.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=web-dairy
VITE_FIREBASE_STORAGE_BUCKET=web-dairy.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=179162774400
VITE_FIREBASE_APP_ID=1:179162774400:web:f92ed4ddb9bfb66e685f65
VITE_FIREBASE_MEASUREMENT_ID=G-Q9GPK9ZRPB
```

Then update [firebase.ts](src/lib/firebase.ts) to use these variables.

## Vercel Configuration

### vercel.json (Optional)

Create this file if you need custom headers:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "unsafe-none"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin-allow-popups"
        }
      ]
    }
  ]
}
```

## Testing the Deployment

### 1. Check Browser Console

After deployment, open DevTools Console and look for:
- `[Auth] Auth state changed, user: <uid>` - confirms authentication
- `[Sync] Starting sync from Firestore for user: <uid>` - confirms sync started
- `[Sync] Completed: X added, Y updated...` - confirms sync completed

### 2. Test Auth Flow

1. Clear browser cache and local storage
2. Sign in with Google or email
3. Check console for sync messages
4. Close and reopen browser
5. Entries should load automatically

### 3. Common Issues

**Issue**: Entries not loading after deployment
- **Check**: Browser console for error messages
- **Check**: Firebase Auth authorized domains includes your Vercel domain
- **Check**: Network tab shows successful requests to Firestore

**Issue**: Google Sign-In popup closes immediately
- **Fix**: Add your Vercel domain to Firebase authorized domains
- **Fix**: Ensure popup blockers are disabled

**Issue**: "Cross-Origin-Opener-Policy would block the window.close"
- **Info**: This is a warning, not an error. The auth still works.
- **Fix**: Add the `vercel.json` configuration above

## Monitoring

### Enable Firebase Console

1. Go to Firebase Console → Analytics
2. Check for:
   - Active users
   - Authentication success rate
   - Firestore read/write operations

### Check Vercel Logs

```bash
vercel logs <your-deployment-url>
```

Look for any server-side errors or warnings.

## Next Steps

1. ✅ Deploy the updated code to Vercel
2. ✅ Add your Vercel domain to Firebase authorized domains
3. ✅ Test authentication and data sync
4. ✅ Monitor console logs for any issues
5. Consider adding error reporting (e.g., Sentry)
6. Consider adding analytics for user behavior

## Support

If issues persist after following this checklist:
1. Check browser console for detailed error messages
2. Check Firebase Console → Firestore → Errors tab
3. Check Network tab in DevTools for failed requests
4. Share the specific error messages for further debugging
