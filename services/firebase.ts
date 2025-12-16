import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Your web app's Firebase configuration
// These must be set in your .env (local) or Vercel Environment Variables
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
export const db = getFirestore(app); // Export Firestore instance
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
export const checkAndIncrementDailyLimit = async (userId: string): Promise<boolean> => {
  try {
    // 1. Get Current Date in KST (Korea Standard Time) format "YYYY-MM-DD"
    // This ensures reset happens at 00:00 Korea time regardless of user's local device time.
    const now = new Date();
    const kstDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now); // Output example: "2024-05-21"

    const userUsageRef = doc(db, "daily_usage", userId);
    const snapshot = await getDoc(userUsageRef);

    let currentCount = 0;

    if (snapshot.exists()) {
      const data = snapshot.data();
      // If the stored date matches today (KST), use the stored count.
      // If dates differ, it means it's a new day, so count remains 0.
      if (data.date === kstDate) {
        currentCount = data.count;
      }
    }

    // 2. Check Limit
    if (currentCount >= 3) {
      return false; // Limit exceeded
    }

    // 3. Increment and Save
    await setDoc(userUsageRef, {
      date: kstDate,
      count: currentCount + 1,
      lastUpdated: new Date().toISOString()
    });

    return true; // Allowed
  } catch (error) {
    console.error("Error checking daily limit:", error);
    // In case of database error, you might want to allow or block. 
    // Allowing for UX continuity, or blocking for safety. 
    // Here we assume open but log error.
    return true; 
  }
};