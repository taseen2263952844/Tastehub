import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import rawConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

const firebaseConfig = {
  apiKey: rawConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: rawConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: rawConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: rawConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId:
    rawConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: rawConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const hasValidConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'remixed-project-id'
);

if (hasValidConfig) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase Auth initialization error:', error);
    app = null;
    auth = null;
  }
}

export const firebaseAuthStatus = {
  isConfigured: Boolean(auth),
  projectId: firebaseConfig.projectId || undefined,
};

export function formatFirebaseAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'Authentication error');
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
    return 'Incorrect email or password. Please verify your credentials or reset your password.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters long.';
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in popup was closed before completion.';
  }
  if (raw.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  return raw;
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<User | null> {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (cred.user && name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return cred.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentUserIdToken(forceRefresh = false): Promise<string | null> {
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
}

export { auth };
