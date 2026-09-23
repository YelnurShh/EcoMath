"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { listenWithRetry } from "@/lib/firestore-retry";
import {
  clearPendingSignup,
  ensureUserProfile,
  mapProfile,
  readPendingSignup,
  type UserProfile,
} from "@/lib/user-profile";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  profileError: string;
  configured: boolean;
  refreshProfile: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  profile: null,
  profileError: "",
  configured: false,
  refreshProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState("");
  const [nonce, setNonce] = useState(0);

  const refreshProfile = useCallback(() => setNonce((value) => value + 1), []);

  // Firebase Auth күйін бақылау + профильді құру/жаңарту
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setProfileError("");

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const pending = readPendingSignup();
      try {
        const userProfile = await ensureUserProfile(nextUser, pending);
        setProfile(userProfile);
      } catch (error) {
        console.error("Профильді жүктеу кезінде қате шықты:", error);
        setProfileError("Профильді жүктеу мүмкін болмады. Интернет байланысы мен Firestore ережелерін тексеріңіз.");
        setProfile(null);
      } finally {
        clearPendingSignup();
        setLoading(false);
      }
    });
  }, [nonce]);

  // Профиль құжатын нақты уақытта тыңдау (статистика, рөл өзгерісі бірден көрінеді)
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db || !user) return;

    return listenWithRetry(
      (onData, onFail) =>
        onSnapshot(
          doc(db, "users", user.uid),
          (snapshot) => {
            onData();
            if (snapshot.exists()) {
              setProfile(mapProfile(user.uid, snapshot.data() as Record<string, unknown>));
            }
          },
          onFail,
        ),
      () => undefined,
    );
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, profile, profileError, configured: isFirebaseConfigured(), refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
