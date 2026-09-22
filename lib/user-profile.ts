import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase";

export type UserRole = "student" | "teacher";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
};

export async function ensureUserProfile(user: User, selectedRole: UserRole = "student"): Promise<UserProfile> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase конфигурациясы толтырылмаған.");

  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  const displayName = user.displayName ?? user.email?.split("@")[0] ?? "EcoMath қолданушысы";
  const email = user.email ?? "";

  // Жаңадан тіркелген қолданушы
  if (!snapshot.exists()) {
    await setDoc(ref, {
      displayName,
      email,
      role: selectedRole,
      roleLocked: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { uid: user.uid, displayName, email, role: selectedRole };
  }

  // Бұрыннан бар қолданушы
  const data = snapshot.data();
  const currentRole: UserRole = data.role === "teacher" ? "teacher" : "student";
  
  // Егер legacy/ерте тіркелген student профилі болса және бұғатталмаған болса, мұғалімге ауыстыруға рұқсат
  const canPromoteLegacyProfile = currentRole === "student"
    && selectedRole === "teacher"
    && data.roleLocked !== true;

  const finalRole = canPromoteLegacyProfile ? "teacher" : currentRole;

  await setDoc(ref, {
    displayName,
    email,
    ...(canPromoteLegacyProfile ? { role: finalRole, roleLocked: true } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return {
    uid: user.uid,
    displayName: String(data.displayName || displayName),
    email: String(data.email || email),
    role: finalRole,
  };
}