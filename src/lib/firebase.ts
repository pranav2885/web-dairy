import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration
// Replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyDQa2-CWAnVbUieKNTTj5Rajbaia0VxVbE",
  authDomain: "web-dairy.firebaseapp.com",
  projectId: "web-dairy",
  storageBucket: "web-dairy.firebasestorage.app",
  messagingSenderId: "179162774400",
  appId: "1:179162774400:web:f92ed4ddb9bfb66e685f65",
  measurementId: "G-Q9GPK9ZRPB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
