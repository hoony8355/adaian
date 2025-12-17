import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

// --- DAILY LIMIT LOGIC (KST 00:00 Reset) ---
const DAILY_LIMIT = 2; // Changed limit to 2

const getKstDate = () => {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now); // Output example: "2024-05-21"
};

// 1. Get Remaining Count (Read-Only)
export const getRemainingDailyLimit = async (userId: string): Promise<number> => {
  try {
    const kstDate = getKstDate();
    const userUsageRef = doc(db, "daily_usage", userId);
    const snapshot = await getDoc(userUsageRef);

    let currentCount = 0;

    if (snapshot.exists()) {
      const data = snapshot.data();
      // If dates match, use stored count. If not (new day), count is 0.
      if (data.date === kstDate) {
        currentCount = data.count;
      }
    }

    return Math.max(0, DAILY_LIMIT - currentCount);
  } catch (error) {
    console.error("Error getting daily limit:", error);
    return 0; // Fail safe
  }
};

// 2. Increment Count (Call ONLY after success)
export const incrementDailyLimit = async (userId: string): Promise<void> => {
  try {
    const kstDate = getKstDate();
    const userUsageRef = doc(db, "daily_usage", userId);
    const snapshot = await getDoc(userUsageRef);

    let currentCount = 0;

    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.date === kstDate) {
        currentCount = data.count;
      }
    }

    // Increment and Save
    await setDoc(userUsageRef, {
      date: kstDate,
      count: currentCount + 1,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error incrementing daily limit:", error);
  }
};
