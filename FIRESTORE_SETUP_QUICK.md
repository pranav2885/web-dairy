# 🔥 Firestore Setup - Quick Start

## Problem Identified
Your diary entries were only being saved to **local browser storage (IndexedDB)**, not to Firestore cloud database.

## ✅ What Has Been Fixed

### 1. **Firestore Initialization** ([src/lib/firebase.ts](src/lib/firebase.ts))
   - Added `getFirestore()` import and initialization
   - Exported `firestore` instance for use throughout the app

### 2. **Automatic Sync to Firestore** ([src/lib/db.ts](src/lib/db.ts))
   - ✅ **Creating entries**: Now syncs to Firestore automatically
   - ✅ **Updating entries**: Changes sync to Firestore
   - ✅ **Deleting entries**: Removes from Firestore
   - Entries are stored under: `users/{userId}/entries/{entryId}`

### 3. **Error Handling**
   - If sync fails, entries stay marked as 'pending' for retry
   - App continues working offline, syncs when connection is restored
   - Console logs help debug any sync issues

## 🚨 REQUIRED: Enable Firestore in Firebase Console

**Your entries won't sync until you do this:**

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `web-dairy`
3. **Click "Firestore Database"** in left sidebar
4. **Click "Create database"**
5. **Choose location** (closest to your users)
6. **Select starting mode**: 
   - Choose **"Production mode"** (recommended)
7. **Click "Enable"**

### Set Up Security Rules

After creating the database:

1. Go to **Firestore Database > Rules** tab
2. Paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own diary entries
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

## 🧪 Test It

1. **Login to your app**
2. **Create a new diary entry**
3. **Check Firebase Console > Firestore Database**
4. You should see:
   ```
   users/
     └── {your-user-id}/
          └── entries/
               └── {entry-id}/
   ```

## 📊 How Data is Stored

### In Firestore:
- Entry ID
- Encrypted content (when encryption is enabled)
- Tags
- Mood data
- Timestamps
- Sync status
- **NOTE**: Plaintext content is NOT synced to Firestore for security

### In Local Browser (IndexedDB):
- Everything including plaintext content
- Used for offline access
- Syncs with Firestore when online

## 🔍 Debugging

### Check Browser Console
Look for messages like:
- ✅ `"Entry synced to Firestore: {id}"`
- ❌ `"Failed to sync entry to Firestore:"`

### Common Issues

**"No authenticated user"**
- Make sure you're logged in
- Check that `auth.currentUser` exists

**"Permission denied"**
- Verify Firestore rules are published
- Ensure you're logged in with the correct account

**"Missing or insufficient permissions"**
- Double-check your Firestore security rules
- Make sure the rules match the code structure

## 📝 Data Flow

```
User creates entry
    ↓
Saved to IndexedDB (local)
    ↓
Synced to Firestore (cloud)
    ↓
Marked as 'synced'
```

If sync fails:
```
Entry marked as 'pending'
    ↓
Will retry on next save/update
    ↓
Or manually sync later
```

## 🎉 Benefits

- ✅ **Cross-device sync**: Access entries from any device
- ✅ **Cloud backup**: Never lose your entries
- ✅ **Offline support**: Works without internet, syncs when back online
- ✅ **Secure**: Firestore rules protect your data
- ✅ **Scalable**: Firestore handles growth automatically

## Need Help?

Check the full setup guide: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
