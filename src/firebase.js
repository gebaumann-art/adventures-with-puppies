// Firebase configuration
// -------------------------------------------------------
// SETUP INSTRUCTIONS:
//  1. Go to https://console.firebase.google.com/
//  2. Create a new project (e.g. "adventures-with-puppies")
//  3. Add a Web App to the project
//  4. Copy your firebaseConfig values below
//  5. Enable Authentication > Email/Password
//  6. Enable Firestore Database (start in test mode)
//  7. Enable Realtime Database (start in test mode)
// -------------------------------------------------------

const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT-default-rtdb.firebaseio.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const FIREBASE_CONFIGURED =
  FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';

let auth = null;
let db = null;
let rtdb = null;

export async function initFirebase() {
  if (!FIREBASE_CONFIGURED) return false;

  try {
    const { initializeApp } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const { getFirestore } = await import('firebase/firestore');
    const { getDatabase } = await import('firebase/database');

    const app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    rtdb = getDatabase(app);
    return true;
  } catch (e) {
    console.warn('Firebase init failed:', e);
    return false;
  }
}

export async function loginWithEmail(email, password) {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password) {
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function saveUserProfile(uid, data) {
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export async function loadUserProfile(uid) {
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveGameState(uid, state) {
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', uid, 'gamestate', 'main'), state, { merge: true });
}

export async function loadGameState(uid) {
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'users', uid, 'gamestate', 'main'));
  return snap.exists() ? snap.data() : null;
}

export function getAuth() { return auth; }
export function getDB() { return db; }
export function getRTDB() { return rtdb; }
