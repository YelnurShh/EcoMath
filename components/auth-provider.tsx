"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { ensureUserProfile, type UserProfile } from "@/lib/user-profile";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
};

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, profile: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        const pendingRole = typeof window !== "undefined" ? window.localStorage.getItem("ecoMathPendingRole") : null;
        const selectedRole = pendingRole === "teacher" ? "teacher" : "student";

        try {
          const userProfile = await ensureUserProfile(nextUser, selectedRole);
          setProfile(userProfile);
        } catch (error) {
          console.error("Профильді жүктеу кезінде қате шықты:", error);
          setProfile(null);
        } finally {
          if (pendingRole) {
            window.localStorage.removeItem("ecoMathPendingRole");
          }
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });
  }, []);

  return <AuthContext.Provider value={{ user, loading, profile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}