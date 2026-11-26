import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './config';

export interface FirebaseUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
}

/**
 * Initiates Google Sign-In with Firebase popup.
 * Synchronizes with WooCommerce customer and sets HTTP-only session cookie.
 */
export async function signInWithGoogleFirebase(): Promise<{ success: boolean; user?: FirebaseUserProfile; error?: string }> {
  try {
    if (!auth) {
      throw new Error('Google Sign-In is not configured.');
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userProfile: FirebaseUserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
      photoURL: user.photoURL,
      provider: 'google',
    };

    // Synchronize with WooCommerce backend using cryptographically verified Firebase ID token
    const idToken = await user.getIdToken();
    const syncRes = await fetch('/api/auth/firebase-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
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
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
}
