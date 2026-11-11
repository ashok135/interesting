import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './config';

export interface FirebaseUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  createdAt?: unknown;
  lastLoginAt?: unknown;
}

/**
 * Initiates Google Sign-In with Firebase popup.
 * Automatically saves user details in the Firestore 'users' collection/table.
 * Synchronizes with WooCommerce customer and sets session cookie.
 */
export async function signInWithGoogleFirebase(): Promise<{ success: boolean; user?: FirebaseUserProfile; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userProfile: FirebaseUserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
      photoURL: user.photoURL,
      provider: 'google',
      lastLoginAt: serverTimestamp(),
    };

    // 1. Save user details in the Firestore 'users' table / collection
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          ...userProfile,
          createdAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, userProfile, { merge: true });
      }
    } catch (firestoreErr) {
      console.warn('Firestore write warning (check Firebase rules):', firestoreErr);
    }

    // 2. Synchronize with WooCommerce backend and set session cookie
    const syncRes = await fetch('/api/auth/firebase-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || 'Customer',
        photoURL: user.photoURL,
      }),
    });

    if (!syncRes.ok) {
      const errData = await syncRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to sync customer profile.');
    }

    return { success: true, user: userProfile };
  } catch (err: unknown) {
    console.error('Firebase Google sign-in error:', err);
    let message = 'Google sign-in failed. Please try again.';
    if (err && typeof err === 'object') {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        message = `Unauthorized Domain: Please add "${currentDomain}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
      } else if (fbErr.code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in popup was closed before completing.';
      } else if (fbErr.code === 'auth/cancelled-popup-request') {
        message = 'Only one sign-in window can be open at a time.';
      } else if (fbErr.message) {
        message = fbErr.message;
      }
    }
    return { success: false, error: message };
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
}
