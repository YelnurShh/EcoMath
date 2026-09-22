import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb, TEACHER_INVITE_CODE } from "@/lib/firebase";

export type UserRole = "student" | "teacher";

export type UserStats = {
  quizCount: number;
  bestPercent: number;
  avgPercent: number;
  lastPercent: number;
  totalCorrect: number;
  totalQuestions: number;
  xp: number;
  streak: number;
  lastQuizAt: number;
  assignmentsSubmitted: number;
  assignmentsGraded: number;
  gradeSum: number;
};

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  className: string;
  school: string;
  bio: string;
  createdAt: number;
  lastActiveAt: number;
  stats: UserStats;
};

export const EMPTY_STATS: UserStats = {
  quizCount: 0,
  bestPercent: 0,
  avgPercent: 0,
  lastPercent: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  xp: 0,
  streak: 0,
  lastQuizAt: 0,
  assignmentsSubmitted: 0,
  assignmentsGraded: 0,
  gradeSum: 0,
};

export type PendingSignupMeta = {
  role: UserRole;
  className?: string;
  school?: string;
  teacherCode?: string;
  displayName?: string;
};

const PENDING_KEY = "ecoMathPendingSignup";

export function storePendingSignup(meta: PendingSignupMeta) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(meta));
}

export function readPendingSignup(): PendingSignupMeta | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingSignupMeta;
    return parsed && (parsed.role === "teacher" || parsed.role === "student") ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingSignup() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_KEY);
}

export function isValidTeacherCode(code: string | undefined | null): boolean {
  if (!code) return false;
  return code.trim().toUpperCase() === TEACHER_INVITE_CODE.trim().toUpperCase();
}

export function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function millis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function readStats(data: Record<string, unknown> | undefined): UserStats {
  const raw = (data?.stats ?? {}) as Record<string, unknown>;
  return {
    quizCount: num(raw.quizCount),
    bestPercent: num(raw.bestPercent),
    avgPercent: num(raw.avgPercent),
    lastPercent: num(raw.lastPercent),
    totalCorrect: num(raw.totalCorrect),
    totalQuestions: num(raw.totalQuestions),
    xp: num(raw.xp),
    streak: num(raw.streak),
    lastQuizAt: millis(raw.lastQuizAt),
    assignmentsSubmitted: num(raw.assignmentsSubmitted),
    assignmentsGraded: num(raw.assignmentsGraded),
    gradeSum: num(raw.gradeSum),
  };
}

export function mapProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    displayName: String(data.displayName || "EcoMath қолданушысы"),
    email: String(data.email || ""),
    photoURL: String(data.photoURL || ""),
    role: data.role === "teacher" ? "teacher" : "student",
    className: String(data.className || ""),
    school: String(data.school || ""),
    bio: String(data.bio || ""),
    createdAt: millis(data.createdAt),
    lastActiveAt: millis(data.lastActiveAt),
    stats: readStats(data),
  };
}

/**
 * Профильді жасайды немесе оқиды.
 * Мұғалім рөлі тек дұрыс шақыру коды енгізілгенде ғана беріледі.
 */
export async function ensureUserProfile(
  user: User,
  pending?: PendingSignupMeta | null,
): Promise<UserProfile> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase конфигурациясы толтырылмаған.");

  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  const fallbackName = user.displayName ?? user.email?.split("@")[0] ?? "EcoMath қолданушысы";
  const email = user.email ?? "";
  const photoURL = user.photoURL ?? "";

  // Жаңа қолданушы: рөл тек шақыру коды дұрыс болғанда мұғалім болады.
  if (!snapshot.exists()) {
    const wantsTeacher = pending?.role === "teacher" && isValidTeacherCode(pending?.teacherCode);
    const role: UserRole = wantsTeacher ? "teacher" : "student";
    const displayName = (pending?.displayName || fallbackName).trim();

    const payload = {
      displayName,
      email,
      photoURL,
      role,
      roleLocked: true,
      className: (pending?.className ?? "").trim(),
      school: (pending?.school ?? "").trim(),
      bio: "",
      stats: EMPTY_STATS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };

    await setDoc(ref, payload);
    return {
      uid: user.uid,
      displayName,
      email,
      photoURL,
      role,
      className: payload.className,
      school: payload.school,
      bio: "",
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      stats: EMPTY_STATS,
    };
  }

  const data = snapshot.data() as Record<string, unknown>;
  const currentRole: UserRole = data.role === "teacher" ? "teacher" : "student";

  // Ескі (roleLocked жоқ) профильді тек дұрыс кодпен мұғалімге көтеруге болады.
  const canPromote =
    currentRole === "student" &&
    pending?.role === "teacher" &&
    isValidTeacherCode(pending?.teacherCode) &&
    data.roleLocked !== true;

  const patch: Record<string, unknown> = {
    email,
    lastActiveAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (photoURL && photoURL !== data.photoURL) patch.photoURL = photoURL;
  if (!data.displayName) patch.displayName = fallbackName;
  if (!data.stats) patch.stats = EMPTY_STATS;
  if (canPromote) {
    patch.role = "teacher";
    patch.roleLocked = true;
  }

  await setDoc(ref, patch, { merge: true });

  return mapProfile(user.uid, {
    ...data,
    ...(canPromote ? { role: "teacher" } : {}),
    displayName: data.displayName || fallbackName,
    email,
    photoURL: photoURL || data.photoURL,
  });
}

export async function updateProfileFields(
  uid: string,
  fields: { displayName?: string; className?: string; school?: string; bio?: string },
) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase конфигурациясы толтырылмаған.");
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (fields.displayName !== undefined) patch.displayName = fields.displayName.trim().slice(0, 60);
  if (fields.className !== undefined) patch.className = fields.className.trim().slice(0, 20);
  if (fields.school !== undefined) patch.school = fields.school.trim().slice(0, 80);
  if (fields.bio !== undefined) patch.bio = fields.bio.trim().slice(0, 240);
  await updateDoc(doc(db, "users", uid), patch);
}

export async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return mapProfile(uid, snapshot.data() as Record<string, unknown>);
}

export function levelFromXp(xp: number) {
  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const currentFloor = (level - 1) * 250;
  const nextFloor = level * 250;
  const progress = Math.min(100, Math.round(((xp - currentFloor) / (nextFloor - currentFloor)) * 100));
  const titles = [
    "Бастаушы",
    "Бақылаушы",
    "Тәжірибеші",
    "Зерттеуші",
    "Аналитик",
    "Эко-сарапшы",
    "Эко-шебер",
  ];
  const title = titles[Math.min(level - 1, titles.length - 1)];
  return { level, title, progress, xp, nextLevelXp: nextFloor };
}
